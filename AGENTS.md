**Reality**
- The repository now has a working FastAPI backend (`backend/`) and React+TypeScript frontend (`frontend/`) implementing the MVP described in REQUIREMENT.md.
- Key directories: `backend/app/` (FastAPI routes, auth, config), `frontend/src/` (React pages, components, API client), `supabase_seed.sql`.

**Run — Backend**
```bash
cd backend
python3.10 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in values
uvicorn app.main:app --reload --port 8000
```

**Run — Frontend**
```bash
cd frontend
npm install
cp .env.example .env   # fill in values
npm run dev
```

**Packaging / install**
- `pyproject.toml` has a `[build-system]` table (setuptools).
- Backend deps: `backend/requirements.txt` — install via `pip install -r requirements.txt` inside the venv.
- Frontend deps: `frontend/package.json` — install via `npm install`.

**Docs vs code**
- `REQUIREMENT.md` and `.github/copilot-instructions.md` are design/spec documents. The code now implements the spec; treat docs as reference.

**Tests & CI**
- Backend tests: `backend/tests/` — run via `pytest` inside the backend venv.
- Frontend: no test runner configured yet.

**Conventions**
- Commit messages: follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- Keep changes small and self-contained; update AGENTS.md when project layout changes.

**Quick file checklist**
- `backend/app/main.py` — FastAPI app entrypoint
- `backend/app/config.py` — pydantic-settings config (env vars)
- `backend/app/routers/invoices.py` — invoice upload, list, get
- `backend/app/routers/llm.py` — constrained Q&A with guardrails
- `backend/app/routers/dashboard.py` — dashboard summary
- `frontend/src/App.tsx` — React app with routing
- `frontend/src/pages/` — DashboardPage, InvoicesPage, QueryPage, LoginPage
- `frontend/src/lib/api.ts` — API client
- `supabase_seed.sql` — SQL to create tables + seed accounts
- `REQUIREMENT.md` — full spec / design doc

**Common mistakes to avoid**
- Running backend without the venv activated — deps won't be found.
- Running `pip install -e .` from root — use `pip install -r backend/requirements.txt` inside the backend venv instead.
- Forgetting to set env vars in `backend/.env` and `frontend/.env` before running.
