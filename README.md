<p align="center">
  <img src="./reconcile-logo.png" alt="Reconcile Logo" width="120">
</p>

<h1 align="center">Reconcile</h1>

An accounting workspace that helps you manage invoices, track expenses, and ask questions about your financial data using AI.

## What it does

- **Invoice Management** — Upload PDF or CSV invoices. The system extracts key details automatically.
- **AI Assistant** — Ask questions about your invoices (e.g., "How much did I spend on AWS last month?")
- **Dashboard** — See your expenses, revenue, and outstanding payments in one place.
- **Secure** — Your data is isolated. Each user only sees their own invoices.

## Tech Stack

**Backend:** FastAPI (Python) + Supabase + Auth0  
**Frontend:** React + TypeScript + Tailwind CSS + Vite  
**AI:** OpenRouter (for invoice extraction and Q&A)

## Project Structure

```
reconcile/
├── backend/           # FastAPI backend
│   ├── app/           # Routes, auth, config
│   ├── requirements.txt
│   └── tests/
├── frontend/          # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── package.json
├── supabase_seed.sql  # Database setup
└── REQUIREMENT.md     # Detailed specs
```

## Getting Started

### What you need
- Python 3.10+
- Node.js 18+
- Auth0 account (for login)
- Supabase project
- OpenRouter API key

### Step 1: Database
Run the `supabase_seed.sql` file in Supabase SQL editor. Create a storage bucket called `invoices`.

### Step 2: Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys
uvicorn app.main:app --reload --port 8000
```

### Step 3: Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your keys
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Environment Variables

Backend `.env`:
```
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
OPENROUTER_API_KEY=your-key
```

Frontend `.env`:
```
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_API_URL=http://localhost:8000
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/invoices/upload` | Upload invoice file |
| GET | `/api/invoices` | List your invoices |
| GET | `/api/invoices/{id}` | Get invoice details |
| GET | `/api/dashboard/summary` | Dashboard stats |
| POST | `/api/llm/query` | Ask AI about invoices |

## Security

- JWT validation on all protected routes
- Service role key stays on the server only
- User data is isolated — you only see your own invoices
- AI responses are checked to prevent off-topic answers
