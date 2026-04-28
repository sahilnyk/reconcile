from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from ..dependencies import get_current_user
from ..db import get_supabase_client
from ..config import settings
import uuid
import json
import httpx

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.post("/upload")
async def upload_invoice(file: UploadFile = File(...), user=Depends(get_current_user)):
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not found in database")

    sb = get_supabase_client()
    bucket = "invoices"
    file_id = f"{uuid.uuid4()}-{file.filename}"
    content = await file.read()
    try:
        sb.storage.from_(bucket).upload(file_id, content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"storage error: {e}")

    # call extraction (OpenRouter or mock)
    parsed = await _extract_invoice(content)
    if "error" in parsed:
        return JSONResponse({"status": "error", "errors": [parsed["error"]]})

    # insert invoice row
    invoice_payload = {
        "user_id": user_id,
        "invoice_number": parsed.get("invoice_number"),
        "vendor": parsed.get("vendor"),
        "invoice_date": parsed.get("invoice_date"),
        "due_date": parsed.get("due_date"),
        "currency": parsed.get("currency", "USD"),
        "subtotal": parsed.get("subtotal"),
        "tax": parsed.get("tax"),
        "total": parsed.get("total"),
        "metadata": parsed,
    }
    inv_resp = sb.table("invoices").insert(invoice_payload).execute()
    invoice_id = inv_resp.data[0]["id"] if inv_resp.data else None

    # insert invoice items
    items = parsed.get("items", [])
    if items and invoice_id:
        item_rows = []
        for it in items:
            item_rows.append({
                "invoice_id": invoice_id,
                "description": it.get("description"),
                "quantity": it.get("quantity"),
                "unit_price": it.get("unit_price"),
                "total": it.get("total"),
            })
        sb.table("invoice_items").insert(item_rows).execute()

    # create ledger entries (debit expense, credit accounts payable)
    if invoice_id and parsed.get("total"):
        expense_account = _get_account_by_type(sb, "expense")
        liability_account = _get_account_by_type(sb, "liability")
        if expense_account and liability_account:
            entry_date = parsed.get("invoice_date") or "2026-01-01"
            sb.table("ledger_entries").insert([
                {"invoice_id": invoice_id, "account_id": expense_account, "entry_date": entry_date, "debit": parsed["total"], "credit": 0},
                {"invoice_id": invoice_id, "account_id": liability_account, "entry_date": entry_date, "debit": 0, "credit": parsed["total"]},
            ]).execute()

    return JSONResponse({"invoice_id": invoice_id, "status": "done", "parsed": parsed})


def _get_account_by_type(sb, account_type: str) -> str | None:
    resp = sb.table("accounts").select("id").eq("type", account_type).limit(1).execute()
    if resp.data:
        return resp.data[0]["id"]
    return None


@router.get("")
async def list_invoices(user=Depends(get_current_user)):
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not found")
    sb = get_supabase_client()
    resp = sb.table("invoices").select("id, invoice_number, vendor, invoice_date, total, currency, created_at").eq("user_id", user_id).order("created_at", desc=True).execute()
    return resp.data


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str, user=Depends(get_current_user)):
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not found")
    sb = get_supabase_client()
    inv_resp = sb.table("invoices").select("*").eq("id", invoice_id).eq("user_id", user_id).execute()
    if not inv_resp.data:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice = inv_resp.data[0]
    items_resp = sb.table("invoice_items").select("*").eq("invoice_id", invoice_id).execute()
    invoice["items"] = items_resp.data
    return invoice


async def _extract_invoice(content: bytes) -> dict:
    if settings.OPENROUTER_API_KEY and settings.OPENROUTER_MODEL:
        prompt = (
            "Extract invoice fields as JSON with keys: invoice_number, vendor, invoice_date, due_date, currency, subtotal, tax, total, items (array of {description, quantity, unit_price, total}). "
            "Return ONLY valid JSON, no markdown fences."
        )
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.openrouter.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.OPENROUTER_MODEL,
                    "messages": [
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": content.decode(errors="ignore")[:8000]},
                    ],
                },
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            text = data.get("choices", [])[0].get("message", {}).get("content", "")
            # strip markdown fences if present
            text = text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[-1]
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0]
            try:
                return json.loads(text.strip())
            except Exception:
                return {"error": "could not parse model output", "raw": text[:500]}
    # fallback mock
    return {
        "invoice_number": "INV-123",
        "vendor": "ACME Supplies",
        "invoice_date": "2026-04-01",
        "due_date": "2026-04-30",
        "currency": "USD",
        "subtotal": 1000,
        "tax": 180,
        "total": 1180,
        "items": [{"description": "Widgets", "quantity": 10, "unit_price": 100, "total": 1000}],
    }
