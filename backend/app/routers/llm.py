import re
import json
from fastapi import APIRouter, Depends, HTTPException
from ..dependencies import get_current_user
from ..db import get_supabase_client
from ..config import settings
import httpx

router = APIRouter(prefix="/api/llm", tags=["llm"])

OUT_OF_SCOPE_PATTERNS = [
    # Politics and government
    r"\b(politic|president|election|government|war|military|prime minister|pm of|parliament)\b",
    # General knowledge and facts
    r"\b(who is|what is|tell me about|explain|describe)\s+(?!my|invoice|bill|payment|expense|vendor|ledger|tax|account|spending|purchase|supplier|deal|transaction)",
    r"\b(capital of|population of|history of|founder of|ceo of)\b",
    r"\b(india|usa|china|japan|france|germany|uk)\b",
    # Science and tech unrelated to invoices
    r"\b(physics|chemistry|biology|space|planet|star|galaxy)\b",
    r"\b(programming|coding|python|javascript|react|angular)\b",
    # Weather and news
    r"\b(weather|climate|forecast|temperature|news|headline)\b",
    # Entertainment
    r"\b(movie|film|music|song|celebrity|actor|netflix|youtube)\b",
    r"\b(recipe|cook|bake|food|restaurant)\b",
    r"\b(sport|football|basketball|cricket|tennis|ipl)\b",
    # Security and hacking
    r"\b(hack|exploit|malware|virus|crack|bypass)\b",
    # General chat
    r"\b(chat|joke|story|poem|hello|hi|hey|how are you|what can you do)\b",
    # Time and date queries
    r"\b(current time|what time|what day|what date|today is)\b",
]

SYSTEM_PROMPT = (
    "You are STRICTLY an invoice assistant for Reconcile. You ONLY answer questions about invoice data, expenses, vendors, and financial records.\n\n"
    "STRICT RULES - VIOLATION IS NOT ALLOWED:\n"
    "1. ONLY answer questions about: invoices, expenses, vendors, spending, purchases, suppliers, tax, ledger, accounts\n"
    "2. If asked ANYTHING else (history, science, politics, sports, general knowledge, jokes, etc.), respond: 'I can only answer questions about your invoice data.'\n"
    "3. NEVER use external knowledge - only use the INVOICES data provided below\n"
    "4. NEVER make up, guess, or hallucinate information\n"
    "5. NEVER answer 'who is PM of India', 'what is capital of', 'tell me a joke', etc.\n"
    "6. Keep answers factual based ONLY on the provided invoice records\n\n"
    "WHAT YOU CAN ANSWER:\n"
    "- 'What are my expenses this month?'\n"
    "- 'How many vendors do I have?'\n"
    "- 'From which vendor have I done the most dealing?'\n"
    "- 'What is my total spending?'\n"
    "- 'Show me invoices from Amul'\n"
    "- 'How much did I spend on beverages?'\n"
    "- 'Compare spending between HUL and Britannia'\n\n"
    "WHAT YOU MUST REFUSE:\n"
    "- 'Who is the PM of India?' → Refuse\n"
    "- 'What is the weather?' → Refuse\n"
    "- 'Tell me a joke' → Refuse\n"
    "- 'What is React?' → Refuse\n"
    "- 'Capital of France?' → Refuse\n\n"
    "RESPONSE FORMAT:\n"
    "- Direct answer using only invoice data\n"
    "- Cite invoice numbers\n"
    "- If data insufficient, say 'I cannot answer that from the provided invoice data.'\n\n"
    "CURRENT INVOICE DATA:\n"
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
            "answer": "I can only answer questions about your invoices, expenses, vendors, and financial data. Please ask about your spending, invoices, suppliers, or related financial topics.",
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
    # Use stable model name
    model = "gemini-2.0-flash-exp"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}",
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
