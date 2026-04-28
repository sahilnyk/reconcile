import re
import json
from fastapi import APIRouter, Depends, HTTPException
from ..dependencies import get_current_user
from ..db import get_supabase_client
from ..config import settings
import httpx

router = APIRouter(prefix="/api/llm", tags=["llm"])

OUT_OF_SCOPE_PATTERNS = [
    r"\b(politic|president|election|government|war|military)\b",
    r"\b(weathe|climate|forecast|temperature)\b",
    r"\b(recipe|cook|bake|food)\b",
    r"\b(sport|football|basketball|cricket|tennis)\b",
    r"\b(movie|film|music|song|celebrity|actor)\b",
    r"\b(hack|exploit|malware|virus)\b",
    r"\b(tell me about|explain|what is|who is|how does)\s+(?!invoice|bill|payment|expense|vendor|ledger|tax|account)",
    r"\b(chat|joke|story|poem)\b",
]

SYSTEM_PROMPT = (
    "You are a strict invoice assistant. You must only use the invoice records supplied in the INVOICES section below. "
    "If the user asks a question that cannot be answered using those records, respond exactly: "
    "'I cannot answer that from the provided invoice data.' "
    "Do not provide unrelated commentary, do not browse the web, and do not invent facts. "
    "Use only the fields: invoice_number, vendor, invoice_date, items (description, quantity, unit_price, total), subtotal, tax, total. "
    "Provide brief, actionable answers and cite invoice ids when referencing specific rows."
)


def _is_out_of_scope(question: str) -> bool:
    q = question.lower()
    for pattern in OUT_OF_SCOPE_PATTERNS:
        if re.search(pattern, q):
            return True
    return False


def _fetch_user_invoices(user_id: str, filters: dict | None = None) -> list[dict]:
    sb = get_supabase_client()
    query = sb.table("invoices").select("id, invoice_number, vendor, invoice_date, due_date, currency, subtotal, tax, total, metadata").eq("user_id", user_id)
    if filters:
        if filters.get("from"):
            query = query.gte("invoice_date", filters["from"])
        if filters.get("to"):
            query = query.lte("invoice_date", filters["to"])
        if filters.get("vendor"):
            query = query.ilike("vendor", f"%{filters['vendor']}%")
    query = query.limit(6)
    resp = query.execute()
    return resp.data or []


def _post_check(answer: str, invoices: list[dict]) -> bool:
    """Return True if answer appears to hallucinate data not in the provided invoices."""
    # Extract vendor names and invoice numbers from provided invoices
    known_vendors = {inv.get("vendor", "").lower() for inv in invoices if inv.get("vendor")}
    known_numbers = {inv.get("invoice_number", "").lower() for inv in invoices if inv.get("invoice_number")}

    # Check if answer mentions a vendor not in the provided set
    # This is a simple heuristic; a production system would be more thorough
    words = re.findall(r"[A-Z][a-zA-Z]+", answer)
    for w in words:
        wl = w.lower()
        if wl not in known_vendors and wl not in known_numbers:
            # Could be hallucinated, but also could be a common word
            # Only flag if it looks like a proper noun near dollar amounts or "invoice"
            if re.search(rf"{re.escape(w)}\s.*\$|\b{re.escape(w)}\s+invoice", answer, re.IGNORECASE):
                return True
    return False


@router.post("/query")
async def query_llm(payload: dict, user=Depends(get_current_user)):
    question = payload.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="Missing question")

    if _is_out_of_scope(question):
        return {
            "answer": "I can only answer questions about your invoices and extracted invoice data.",
            "source_ids": [],
            "refused": True,
        }

    user_id = user.get("id")
    filters = payload.get("filters")
    invoices = []
    if user_id:
        invoices = _fetch_user_invoices(user_id, filters)

    if not invoices:
        return {
            "answer": "You have no invoices on file. Please upload invoices first.",
            "source_ids": [],
            "refused": False,
        }

    invoices_json = json.dumps(invoices, default=str)
    user_msg = f"Question: {question}\n\nINVOICES:\n{invoices_json}"

    if not settings.GEMINI_API_KEY:
        return {
            "answer": "LLM not configured. Set GEMINI_API_KEY in .env file.",
            "source_ids": [],
            "refused": False,
        }

    answer = await _query_gemini(SYSTEM_PROMPT, user_msg)

    # post-check for hallucinations
    if _post_check(answer, invoices):
        return {
            "answer": "I cannot answer that from the provided invoice data.",
            "source_ids": [],
            "refused": True,
        }

    return {
        "answer": answer,
        "source_ids": [inv["id"] for inv in invoices],
        "refused": False,
    }


async def _query_gemini(system_prompt: str, user_msg: str) -> str:
    """Query Google Gemini API using key from .env."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": f"{system_prompt}\n\n{user_msg}"}]}],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048},
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "")
