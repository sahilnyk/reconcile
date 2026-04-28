# Setup Guide — Getting Your Keys

This guide walks you through getting all the required API keys and configuring them in Reconcile.

## Overview

You need keys from 3 services:
1. **Auth0** — Authentication (Google SSO)
2. **Supabase** — Database & Storage
3. **OpenRouter** — LLM for invoice extraction and Q&A

---

## 1. Auth0 Setup

### Step 1: Create an Auth0 Tenant
1. Go to [auth0.com](https://auth0.com) and sign up / log in
2. Create a new tenant (e.g., `reconcile-app`)
3. Choose the "Regular Web Application" application type

### Step 2: Enable Google Social Connection
1. In Auth0 Dashboard, go to **Authentication** → **Social**
2. Click **Google** and enable it
3. Follow the Google OAuth setup (you'll need a Google Cloud project)
4. Save the connection

### Step 3: Create an Application
1. Go to **Applications** → **Applications**
2. Click **Create Application**
3. Choose **Single Page Web Applications**
4. Name it (e.g., "Reconcile Frontend")
5. Add these **Allowed Callback URLs**:
   - `http://localhost:5173/app`
   - `http://localhost:5173/callback`
6. Add these **Allowed Logout URLs**:
   - `http://localhost:5173`
7. Add these **Allowed Web Origins**:
   - `http://localhost:5173`
8. Save

### Step 4: Get Your Auth0 Keys
From the application's **Settings** tab, copy:
- **Domain** (e.g., `your-tenant.us.auth0.com`)
- **Client ID** (starts with `...`)
- **Client Secret** (backend only)

### Step 5: Set Your Auth0 Audience (Optional but Recommended)
1. Go to **Applications** → **APIs**
2. Click **Create API**
3. Name it (e.g., "Reconcile API")
4. Identifier: `https://api.reconcile.app` (or your own)
5. Save
6. Copy the **Identifier** — this is your `AUTH0_AUDIENCE`

### Where to Put Auth0 Keys

**Frontend** (`frontend/.env`):
```bash
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://api.reconcile.app
```

**Backend** (`backend/.env`):
```bash
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://api.reconcile.app
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_CALLBACK_URL=http://localhost:5173/callback
```

---

## 2. Supabase Setup

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **New Project**
3. Choose a name (e.g., "reconcile")
4. Choose a database password (save it somewhere safe)
5. Choose a region close to you
6. Wait for the project to be provisioned (~2 minutes)

### Step 2: Run the Seed SQL
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase_seed.sql` from this repo
4. Paste and click **Run**
5. This creates: `users`, `invoices`, `invoice_items`, `accounts`, `ledger_entries` tables

### Step 3: Create Storage Bucket
1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Name it `invoices`
4. Make it **Public** (or keep private — the backend uses service role key)
5. Save

### Step 4: Get Your Supabase Keys
From the project's **Settings** → **API**:
- **Project URL** (e.g., `https://your-project.supabase.co`)
- **service_role** key (backend only — has full access)
- **anon** key (public — not used in this MVP, backend uses service role)

### Where to Put Supabase Keys

**Backend** (`backend/.env`):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 3. OpenRouter Setup

### Step 1: Get an OpenRouter API Key
1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up / log in
3. Go to **API Keys**
4. Click **Create Key**
5. Copy the key

### Step 2: Choose a Model
OpenRouter supports many models. For this MVP, use a free/cheap one:
- `openai/gpt-3.5-turbo` (recommended)
- `meta-llama/llama-3-8b-instruct:free` (free tier)
- Any other model from OpenRouter's model list

### Where to Put OpenRouter Keys

**Backend** (`backend/.env`):
```bash
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openai/gpt-3.5-turbo
```

---

## Summary: All Keys Required

### Frontend (`frontend/.env`)
```bash
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://api.reconcile.app
VITE_API_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```bash
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://api.reconcile.app
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_CALLBACK_URL=http://localhost:5173/callback
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openai/gpt-3.5-turbo
FRONTEND_URL=http://localhost:5173
```

---

## After Setting Keys

1. **Restart the frontend** (it reads `.env` on startup):
   ```bash
   cd frontend
   # Stop the dev server (Ctrl+C), then:
   npm run dev
   ```

2. **Start the backend**:
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

3. **Open** `http://localhost:5173` in your browser
4. Click **Sign in with Google** — it should redirect to Auth0, then back to your app

---

## Troubleshooting

### Auth0 Login Fails
- Check that `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` are correct
- Verify the callback URL `http://localhost:5173/app` is in Auth0's **Allowed Callback URLs**
- Check browser console for errors

### Backend 401 Unauthorized
- Verify `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_SECRET` are set in `backend/.env`
- Check that the backend venv is activated and deps are installed

### Supabase Connection Errors
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Ensure the tables were created via `supabase_seed.sql`
- Check that the `invoices` storage bucket exists

### LLM Not Working
- Verify `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` are set
- Check that the model name is valid (see OpenRouter's model list)
- The app will show a stub message if keys are missing
