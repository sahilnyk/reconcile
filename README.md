# Reconcile — AI-native Accounting Workspace

AI-native collaborative accounting workspace: Google SSO (Auth0), invoice upload + structured extraction, a Perplexity-like query box constrained to user invoices (OpenRouter), and a dashboard (expenses, P&L, ledger).

## Project Structure

```
reconcile/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── main.py        # FastAPI app + CORS + routers
│   │   ├── config.py      # pydantic-settings config
│   │   ├── auth.py        # Auth0 JWT verification
│   │   ├── db.py          # Supabase client
│   │   ├── dependencies.py # Auth dependency + user upsert
│   │   └── routers/
│   │       ├── invoices.py  # Upload, list, get invoices + ledger entries
│   │       ├── llm.py       # Constrained Q&A with guardrails
│   │       └── dashboard.py # Dashboard summary aggregation
│   ├── requirements.txt
│   └── tests/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/  # AppShell, UI primitives (Button, Card, Input)
│   │   ├── pages/       # LoginPage, DashboardPage, InvoicesPage, QueryPage
│   │   └── lib/         # API client, utils
│   └── package.json
├── supabase_seed.sql  # SQL to create tables + seed accounts
├── REQUIREMENT.md     # Full product & engineering spec
└── main.py            # Legacy placeholder entrypoint
```

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Auth0 tenant (Google social connection enabled)
- Supabase project
- OpenRouter API key

### 1. Supabase Setup
Run `supabase_seed.sql` in the Supabase SQL editor. Create a Storage bucket named `invoices`.

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your values
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env   # fill in your values
npm run dev
```

### 4. Open `http://localhost:5173`

## Environment Variables

### Backend (`backend/.env`)
- `AUTH0_DOMAIN` — Auth0 tenant domain
- `AUTH0_AUDIENCE` — API audience identifier
- `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`
- `FRONTEND_URL` (default: `http://localhost:5173`)

### Frontend (`frontend/.env`)
- `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`
- `VITE_API_URL` (default: `http://localhost:8000`)

## API Endpoints
- `POST /api/invoices/upload` — Upload invoice (PDF/CSV), auto-extract
- `GET /api/invoices` — List user's invoices
- `GET /api/invoices/{id}` — Get invoice + items
- `GET /api/dashboard/summary` — Expenses, P&L, recent invoices
- `POST /api/llm/query` — Constrained Q&A over invoices

## Security Notes
- Validate Auth0 JWT on every protected endpoint
- Store `SUPABASE_SERVICE_ROLE_KEY` only on server
- LLM guardrails: pre-check (regex), system prompt, post-check (hallucination detection)
- All DB queries scoped to `WHERE user_id = current_user.id`

## License
MIT
