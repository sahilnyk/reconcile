from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from ..dependencies import get_current_user
from ..db import get_supabase_client
from ..config import settings
import uuid
import json
import httpx
import re

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.post("/upload")
async def upload_invoice(file: UploadFile = File(...), user=Depends(get_current_user)):
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not found in database")

    sb = get_supabase_client()
    bucket = "Invoices"
    file_id = f"{uuid.uuid4()}-{file.filename}"
    content = await file.read()
    try:
        sb.storage.from_(bucket).upload(file_id, content)
    except Exception as e:
        # Log error but continue - storage is optional, metadata is stored in DB
        print(f"Storage upload warning (non-critical): {e}")

    # call extraction (Gemini)
    parsed = await _extract_invoice(content)
    if "error" in parsed:
        raise HTTPException(status_code=500, detail=parsed["error"])

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
        "status": parsed.get("status", "Pending"),
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
    resp = sb.table("invoices").select("id, invoice_number, vendor, invoice_date, total, currency, status, created_at").eq("user_id", user_id).order("created_at", desc=True).execute()
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


def _parse_text_invoice(text: str) -> dict:
    """Parse simple text invoice format without needing Gemini API."""
    result = {
        "invoice_number": None,
        "vendor": None,
        "invoice_date": None,
        "due_date": None,
        "currency": "INR",
        "subtotal": None,
        "tax": None,
        "total": None,
        "items": []
    }
    
    # Extract fields using regex
    inv_match = re.search(r'Invoice Number:\s*(\S+)', text)
    if inv_match:
        result["invoice_number"] = inv_match.group(1)
    
    vendor_match = re.search(r'Vendor:\s*(.+)', text)
    if vendor_match:
        result["vendor"] = vendor_match.group(1).strip()
    
    date_match = re.search(r'Invoice Date:\s*(\d{2})-(\d{2})-(\d{4})', text)
    if date_match:
        # Convert DD-MM-YYYY to YYYY-MM-DD
        result["invoice_date"] = f"{date_match.group(3)}-{date_match.group(2)}-{date_match.group(1)}"
    
    due_match = re.search(r'Due Date:\s*(\d{2})-(\d{2})-(\d{4})', text)
    if due_match:
        # Convert DD-MM-YYYY to YYYY-MM-DD
        result["due_date"] = f"{due_match.group(3)}-{due_match.group(2)}-{due_match.group(1)}"
    
    currency_match = re.search(r'Currency:\s*(\w+)', text)
    if currency_match:
        result["currency"] = currency_match.group(1)
    
    # Parse items
    item_pattern = r'-\s*(.+?)\s*\(Qty:\s*(\d+)\s*\w+,?\s*Unit Price:\s*Rs?\.?(\d+),?\s*Total:\s*Rs?\.?(\d+)\)'
    for match in re.finditer(item_pattern, text):
        result["items"].append({
            "description": match.group(1).strip(),
            "quantity": int(match.group(2)),
            "unit_price": int(match.group(3)),
            "total": int(match.group(4))
        })
    
    # Parse totals
    subtotal_match = re.search(r'Subtotal:\s*Rs?\.?(\d[\d,]*)', text)
    if subtotal_match:
        result["subtotal"] = int(subtotal_match.group(1).replace(',', ''))
    
    tax_match = re.search(r'GST\s*\(\d+%\):\s*Rs?\.?(\d[\d,]*)', text)
    if tax_match:
        result["tax"] = int(tax_match.group(1).replace(',', ''))
    
    total_match = re.search(r'Total:\s*Rs?\.?(\d[\d,]*)', text)
    if total_match:
        result["total"] = int(total_match.group(1).replace(',', ''))
    
    return result


async def _extract_invoice(content: bytes) -> dict:
    text_content = content.decode(errors="ignore")[:8000]
    
    # Try to parse as text invoice first (no API needed)
    if "Invoice Number:" in text_content and "Vendor:" in text_content:
        parsed = _parse_text_invoice(text_content)
        if parsed["invoice_number"] and parsed["total"]:
            return parsed
    
    # Fall back to Gemini API if available
    if not settings.GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY not set in .env and could not parse as text invoice"}

    prompt = (
        "Extract invoice fields as JSON with keys: invoice_number, vendor, invoice_date, due_date, currency, subtotal, tax, total, items (array of {description, quantity, unit_price, total}). "
        "Return ONLY valid JSON, no markdown fences."
    )
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": f"{prompt}\n\n{text_content}"}]}],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048},
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        text = data.get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "")
        return _parse_json_response(text)


def _parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    try:
        return json.loads(text.strip())
    except Exception:
        return {"error": "could not parse model output", "raw": text[:500]}
