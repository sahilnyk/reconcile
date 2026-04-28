const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export interface InvoiceSummary {
  id: string;
  invoice_number: string | null;
  vendor: string | null;
  invoice_date: string | null;
  total: number | null;
  currency: string | null;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
}

export interface InvoiceDetail extends InvoiceSummary {
  due_date: string | null;
  subtotal: number | null;
  tax: number | null;
  metadata: Record<string, unknown>;
  items: InvoiceItem[];
}

export interface DashboardSummary {
  total_expenses: number;
  expenses_by_vendor: Record<string, number>;
  pl: { revenue: number; expense: number; net: number };
  recent_invoices: InvoiceSummary[];
}

export interface LlmQueryResponse {
  answer: string;
  source_ids: string[];
  refused: boolean;
}

export const api = {
  uploadInvoice: async (file: File, token: string) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<{ invoice_id: string; status: string; parsed: unknown }>(
      "/api/invoices/upload",
      { method: "POST", body: form },
      token
    );
  },

  listInvoices: (token: string) =>
    apiFetch<InvoiceSummary[]>("/api/invoices", {}, token),

  getInvoice: (id: string, token: string) =>
    apiFetch<InvoiceDetail>(`/api/invoices/${id}`, {}, token),

  getDashboard: (token: string) =>
    apiFetch<DashboardSummary>("/api/dashboard/summary", {}, token),

  queryLlm: (
    question: string,
    token: string,
    filters?: { from?: string; to?: string; vendor?: string }
  ) =>
    apiFetch<LlmQueryResponse>("/api/llm/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, filters }),
    }, token),
};
