# Reconcile

AI-native collaborative accounting workspace focused on secure invoice ingestion, a constrained natural-language query surface, and a simple dashboard. This file is a concise product and engineering spec for the MVP you asked for: Google SSO (Auth0), invoice upload + structured extraction, a Perplexity-like query box constrained to the user's invoices (OpenRouter), and a dashboard (expenses, P&L, ledger).

Contents
- Overview
- Goals (MVP)
- Tech stack
- Architecture and request flow (SSO → ingestion → dashboard → constrained LLM)
- Minimal data model (Supabase Postgres)
- Minimal API contract
- Frontend layout and components (21st dev)
- LLM integration and strict guardrails (OpenRouter)
- Implementation plan (step-by-step to finish the MVP tonight)
- Environment variables and minimal run notes

Overview
Reconcile is a focused app: users sign in with Google (Auth0), upload invoices, the system extracts structured invoice data and stores it in Supabase, the app provides a dashboard (expenses, profit & loss, recent invoices) and a single natural-language box that answers questions only about the user's invoices. The model backend is OpenRouter; the server ensures the model only sees user-owned invoice data.

Goals (MVP)
- Sign in using Auth0 (Google social connection).
- Upload invoice (PDF or CSV), automatically extract structured fields and line items, save to Supabase storage + table rows.
- Create simple ledger entries for each invoice (basic debit/credit mapping to a small chart of accounts).
- Dashboard page with: total expenses, expenses by vendor/category, simple P&L, recent invoices list.
- One query box (Perplexity-like) that answers questions only about invoices belonging to the authenticated user. The server must refuse out-of-scope questions.

Tech stack (required for this MVP)
- Frontend: React + TypeScript; UI components: 21st dev (use their component library for inputs, buttons, layout).
- Backend: FastAPI (Python 3.10+)
- Database & storage: Supabase (Postgres + Storage)
- Auth: Auth0 (Google social connection)
- LLM provider: OpenRouter (use a free/light model — set via OPENROUTER_MODEL)

Architecture and request flow (high level)
1. Authentication
   - Frontend uses Auth0 SDK to redirect users to Auth0 (Google). On success Auth0 returns ID/Access tokens to the SPA.
   - Frontend attaches the Auth0 access token as Authorization: Bearer <token> to API requests. Backend validates the JWT against Auth0 JWKS and maps `sub` to `users.id` in Supabase.

2. Invoice upload
   - Frontend: POST /api/invoices/upload (multipart/form-data) with file.
   - Backend stores file in Supabase Storage and calls the invoice-extraction step.
   - Extraction: Backend calls OpenRouter with a structured-extraction prompt (instructions to output JSON). Validate the response shape on the server; if invalid, return parsing error.
   - Persist structured invoice + items into Supabase tables and create minimal ledger entries.

3. Dashboard
   - Frontend: GET /api/dashboard/summary
   - Backend aggregates invoices/ledger entries for the authenticated user and returns metrics.

4. Invoice-scoped Q&A
   - Frontend: POST /api/llm/query { question }
   - Backend workflow:
     a) Pre-check: run a simple heuristic/filter to detect out-of-scope topics (politics, world events, open-ended chat). If detected, return a standard refusal.
     b) Retrieval: query Supabase for the user's invoices that match date ranges, vendor keywords, etc. Limit to a configurable number of invoices and size to control tokens.
     c) Prompt construction: build a system prompt that strictly instructs the model to use only the provided invoice records and to refuse any question not answerable from them.
     d) Call OpenRouter with OPENROUTER_API_KEY and OPENROUTER_MODEL; stream or return the answer.
     e) Post-check: simple validation to detect hallucinations (e.g., the model inventing vendors or dates not in provided records). If violations are found, return a refusal message.

Key design constraints (do not skip these)
- Never send the model any global web content. Only send structured invoice data or redacted text snippets extracted from the user's invoices.
- Server enforces scope: do not rely solely on prompt instructions. Implement pre-check and post-check on the server.
- Use Auth0 for authentication and only accept tokens signed by your Auth0 tenant.
- Keep Supabase service role key only on the backend; never expose it to the browser.

Minimal data model (Supabase SQL suggestions)
Use Supabase SQL editor to create the following tables.

users
```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  auth0_sub text unique not null,
  email text not null,
  name text,
  created_at timestamptz default now()
);
```

invoices
```sql
create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  invoice_number text,
  vendor text,
  invoice_date date,
  due_date date,
  currency text,
  subtotal numeric,
  tax numeric,
  total numeric,
  metadata jsonb,
  created_at timestamptz default now()
);
```

invoice_items
```sql
create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  description text,
  quantity numeric,
  unit_price numeric,
  total numeric
);
```

accounts (small default COA)
```sql
create table accounts (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text,
  type text -- expense,revenue,asset,liability,equity
);
```

ledger_entries (simple mapping from invoices)
```sql
create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id),
  account_id uuid references accounts(id),
  entry_date date,
  debit numeric,
  credit numeric,
  created_at timestamptz default now()
);
```

Minimal API contract (backend endpoints)
- POST /api/invoices/upload
  - multipart/form-data: file
  - returns: { invoice_id, status: parsing|done|error, errors?: [] }
- GET /api/invoices
  - returns list of invoice headers for the authenticated user
- GET /api/invoices/{id}
  - returns invoice + items
- GET /api/dashboard/summary
  - returns { total_expenses, expenses_by_category, pl: { revenue, expense, net }, recent_invoices }
- POST /api/llm/query
  - body: { question: string, filters?: { from?:date, to?:date, vendor?:string } }
  - returns: { answer: string, source_ids: [invoice_id], refused?: boolean }

Frontend layout (pages & key components)
- Login page (Auth0): use Auth0 React SDK; on success redirect to /app
- App shell: header (user menu), left nav (Dashboard, Invoices), main area
- Dashboard page (uses /api/dashboard/summary)
- Invoice upload page / modal: file input + preview of parsed invoice
- QueryBox component (Perplexity-like): large input, submit button, streaming answer area, and source links to invoices used

UI library & components
- Use 21st dev component primitives for inputs, buttons, modals, and layout. Keep interactions accessible and responsive.

LLM integration and guardrails (OpenRouter)
Server-side enforcement steps (mandatory):
1. Pre-check: run a keyword/regex classifier against the question for clearly out-of-scope topics (politics, world events, generic chat). If matched, respond with: "I can only answer questions about your invoices and extracted invoice data."
2. Retrieval: fetch only user-owned invoice rows matching filters. Limit total token-sized context (e.g., <= 6 invoices or 8k tokens). Convert each invoice into a compact JSON object for the prompt.
3. System prompt: include explicit instructions such as "You are an assistant that MUST ONLY use the following invoice records. If the question cannot be answered from the records, reply: 'I cannot answer that from the provided invoice data.' Do not invent information or browse the web."
4. Call OpenRouter: send system prompt + user question + invoice records. Use OPENROUTER_API_KEY and OPENROUTER_MODEL environment variables.
5. Post-check: validate that the model's answer references only data present in the provided invoices. If hallucinated claims are detected, return the refusal message.

Security notes
- Validate Auth0 JWT on every protected endpoint using Auth0's JWKS.
- Store SUPABASE_SERVICE_ROLE_KEY only on server; use service key for writes and use anon/public key for read-only client access if necessary.
- Enforce row-level ownership checks: every DB query must include WHERE user_id = current_user.id.

Implementation plan — prioritized, actionable (finish tonight)
Estimate: 4–6 hours depending on familiarity. Follow the numbered tasks sequentially.

1) Create Auth0 tenant & enable Google social connection (20–30m)
   - Create application, set allowed callback URL to http://localhost:5173/callback
   - Save domain, client id, client secret

2) Create Supabase project (15–30m)
   - Create project, enable Storage, get SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
   - Run the SQL snippets above in SQL editor to create tables

3) Bootstrap FastAPI backend (30–60m)
   - Create a new virtualenv, install: fastapi, uvicorn, python-jose, httpx, python-dotenv, supabase
   - Implement minimal middleware to validate Auth0 JWT and attach user_id to requests
   - Implement routes: /api/invoices/upload, /api/invoices, /api/invoices/{id}, /api/dashboard/summary, /api/llm/query

4) Implement invoice upload + storage (30–60m)
   - Endpoint saves file to Supabase Storage, then calls a synchronous extraction function that calls OpenRouter with a structured prompt
   - Validate extraction and persist invoices

5) Implement simple dashboard queries (30m)
   - Aggregate expenses and P&L, return JSON for frontend

6) Implement LLM query endpoint with guardrails (30–60m)
   - Implement pre-check, retrieval, system prompt, call OpenRouter, post-check

7) Frontend skeleton (30–90m)
   - Create React app if not present; install Auth0 React SDK and 21st dev components
   - Implement login flow and App shell
   - Implement Upload page + QueryBox + Dashboard page connecting to backend

Environment variables (MVP)
- AUTH0_DOMAIN
- AUTH0_CLIENT_ID
- AUTH0_CLIENT_SECRET
- AUTH0_CALLBACK_URL (http://localhost:5173/callback)
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- OPENROUTER_API_KEY
- OPENROUTER_MODEL
- FRONTEND_URL (http://localhost:5173)

Minimal run notes (current repository state)
- This repository is currently a placeholder with a runnable `main.py`. The spec above is the plan you asked for. Implementations of backend routes and frontend code are not present yet in this repo — follow the Implementation plan to add them.

Appendix — recommended system prompt (server-side)
"You are a strict invoice assistant. You must only use the invoice records supplied in the `INVOICES` section below. If the user asks a question that cannot be answered using those records, respond exactly: 'I cannot answer that from the provided invoice data.' Do not provide unrelated commentary, do not browse the web, and do not invent facts. Use only the fields: invoice_number, vendor, invoice_date, items (description, quantity, unit_price, total), subtotal, tax, total. Provide brief, actionable answers and cite invoice ids when referencing specific rows."

This requirement file is intentionally focused and actionable — it removes speculative features and centers on the single-use case you specified. Implement the backend guardrails first; the frontend is a thin wrapper that calls the server endpoints.
