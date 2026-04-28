from fastapi import APIRouter, Depends, HTTPException
from ..dependencies import get_current_user
from ..db import get_supabase_client

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(user=Depends(get_current_user)):
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not found")

    sb = get_supabase_client()

    # fetch all invoices for user
    inv_resp = (
        sb.table("invoices")
        .select("id, vendor, total, currency, invoice_date, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    invoices = inv_resp.data or []

    # total expenses
    total_expenses = sum(float(inv.get("total") or 0) for inv in invoices)

    # expenses by vendor
    expenses_by_vendor: dict[str, float] = {}
    for inv in invoices:
        v = inv.get("vendor") or "Unknown"
        expenses_by_vendor[v] = expenses_by_vendor.get(v, 0) + float(inv.get("total") or 0)

    # fetch ledger entries for P&L
    ledger_resp = (
        sb.table("ledger_entries")
        .select("debit, credit, account_id, accounts(type)")
        .eq("accounts.type", "expense")
        .execute()
    )
    # We need to join through invoice_id -> invoices.user_id
    # Supabase client doesn't support deep joins easily, so compute from invoices
    expense_total = total_expenses
    revenue_total = 0.0  # no revenue invoices in MVP; placeholder

    # recent invoices (last 5)
    recent = invoices[:5]

    return {
        "total_expenses": total_expenses,
        "expenses_by_vendor": expenses_by_vendor,
        "pl": {
            "revenue": revenue_total,
            "expense": expense_total,
            "net": revenue_total - expense_total,
        },
        "recent_invoices": recent,
    }
