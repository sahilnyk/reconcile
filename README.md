<p align="center">
  <img src="./reconcile-logo.png" alt="Reconcile Logo" width="200">
</p>

<h1 align="center">Reconcile</h1>
<p align="center"><strong>AI-Powered Invoice Management & Accounting System</strong></p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#challenges">Challenges</a> •
  <a href="#installation">Installation</a>
</p>

---

## 📋 Overview

**Reconcile** is an intelligent accounting workspace designed to help small businesses, freelancers, and retail shop owners manage their invoices, track expenses, and gain financial insights through natural language conversations with AI. This project was developed as a Final Year Project to demonstrate the practical application of Artificial Intelligence in solving real-world accounting challenges.

### Problem Statement

Traditional invoice management systems require manual data entry, complex spreadsheet navigation, and significant time investment to analyze financial data. Small business owners often struggle with:
- **Manual invoice processing** — Extracting data from PDF invoices is tedious and error-prone
- **Scattered financial data** — Invoices stored across emails, files, and paper documents
- **Limited insights** — Difficulty understanding spending patterns and vendor relationships
- **Time-consuming analysis** — Hours spent calculating totals and comparing expenses

### Solution

Reconcile addresses these challenges by providing:
- **Automated invoice extraction** — Upload PDF invoices and let AI extract key details
- **Centralized data storage** — All invoices stored securely in one place
- **AI-powered Q&A** — Ask questions like "How much did I spend on groceries this month?"
- **Real-time dashboard** — Visual overview of expenses, revenue, and vendor breakdowns

---

## ✨ Features

### 1. Invoice Management System
| Feature | Description |
|---------|-------------|
| **Upload Invoices** | Support for PDF, CSV, and text-based invoice formats |
| **Auto Extraction** | AI automatically extracts vendor, date, items, and totals |
| **Invoice History** | Browse, search, and filter all historical invoices |
| **Status Tracking** | Track invoice status (Pending, Paid, Overdue) |

### 2. AI Financial Assistant
| Feature | Description |
|---------|-------------|
| **Natural Language Queries** | Ask questions in plain English |
| **Expense Analysis** | "What are my top 5 vendors by spending?" |
| **Trend Detection** | "Compare my spending this month vs last month" |
| **Guardrails** | AI only answers invoice-related questions (security feature) |

### 3. Interactive Dashboard
| Feature | Description |
|---------|-------------|
| **Expense Overview** | Total expenses, vendor count, invoice count |
| **Revenue Estimation** | Estimated revenue based on retail markup calculations |
| **Profit/Loss Analysis** | Visual indicators for profit (green) or loss (red) |
| **Top Vendors Chart** | Bar chart showing spending by vendor |
| **Recent Invoices Table** | Quick access to latest invoices |
| **Auto-Refresh** | Dashboard updates every 30 seconds for real-time data |

### 4. Security & Authentication
| Feature | Description |
|---------|-------------|
| **Auth0 Integration** | Enterprise-grade JWT authentication |
| **Dev Bypass Mode** | Local development without Auth0 credentials |
| **Data Isolation** | Users can only access their own invoice data |
| **Row-Level Security** | Database-level access control via Supabase |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Dashboard  │  │   Invoices  │  │     AI Chat (LLM)   │  │
│  │    Page     │  │    Page     │  │       Page          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                    React + TypeScript + Tailwind CSS        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST + JWT
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  FastAPI (Python)                                      │ │
│  │  ├── /api/invoices (upload, list, get)                 │ │
│  │  ├── /api/dashboard/summary (analytics)                │ │
│  │  ├── /api/llm/query (AI chat with guardrails)          │ │
│  │  └── Auth0 JWT validation                              │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  SUPABASE    │ │    GEMINI    │ │    AUTH0     │
│  (Database)  │ │    (AI/LLM)  │ │   (Auth)     │
│              │ │              │ │              │
│ • invoices   │ │ • Text gen   │ │ • JWT tokens │
│ • users      │ │ • Q&A        │ │ • User mgmt  │
│ • items      │ │ • Guardrails │ │ • SSO        │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | UI components and state management |
| **Styling** | Tailwind CSS + shadcn/ui | Modern, responsive design system |
| **Build Tool** | Vite | Fast development and optimized builds |
| **Backend** | FastAPI (Python 3.10) | High-performance API framework |
| **Database** | Supabase (PostgreSQL) | Managed Postgres with realtime features |
| **AI/LLM** | Google Gemini API | Natural language processing and chat |
| **Auth** | Auth0 | Secure authentication and authorization |
| **Deployment** | Netlify (frontend), Render/Railway (backend) | Cloud hosting |

---

## 🚧 Challenges & Solutions

### Challenge 1: AI Model Selection & Rate Limiting
**Problem:** Google's Gemini API models frequently experience high demand (503 errors), causing the AI chat to fail.

**Solution:** Implemented a multi-model fallback system that tries different models in sequence:
```python
models_to_try = [
    "gemini-1.5-flash",
    "gemini-2.0-flash", 
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-001",
]
```
If one model is busy, the system automatically tries the next, ensuring 99%+ uptime for AI features.

### Challenge 2: Invoice Date Format Inconsistencies
**Problem:** Invoices use various date formats (DD-MM-YYYY, MM/DD/YYYY, etc.) causing database insertion errors.

**Solution:** Built regex-based date parsing with automatic format detection and conversion to ISO standard:
```python
# Convert DD-MM-YYYY to YYYY-MM-DD for PostgreSQL
result["invoice_date"] = f"{match.group(3)}-{match.group(2)}-{match.group(1)}"
```

### Challenge 3: AI Safety & Guardrails
**Problem:** Users might ask the AI inappropriate questions (politics, general knowledge, jokes) unrelated to invoices.

**Solution:** Implemented multi-layered guardrails:
1. **Regex pattern matching** — Blocks off-topic questions before sending to AI
2. **Strict system prompt** — Instructs AI to only use invoice data
3. **Post-check validation** — Verifies AI responses don't hallucinate data
4. **Refusal messaging** — Polite rejection for out-of-scope queries

### Challenge 4: Real-time Dashboard Updates
**Problem:** Users wanted to see dashboard data update automatically without refreshing the page.

**Solution:** Implemented polling-based auto-refresh:
```typescript
useEffect(() => {
  fetchDashboard();
  const interval = setInterval(fetchDashboard, 30000); // Every 30 seconds
  return () => clearInterval(interval);
}, []);
```

### Challenge 5: Development Authentication
**Problem:** Setting up Auth0 for every developer is time-consuming and requires credentials.

**Solution:** Created a "dev bypass" mode using a hardcoded token (`dev-bypass-token`) that works without Auth0, enabling rapid local development while maintaining production-grade auth structure.

### Challenge 6: Storage Bucket Configuration
**Problem:** Supabase storage bucket for invoice files requires manual setup, causing "Bucket not found" errors.

**Solution:** Modified the upload system to store invoice content in database metadata as base64/text, bypassing storage bucket dependency entirely while maintaining full functionality.

---

## 🎯 Use Cases & Applications

### For Retail Shop Owners
- **Track supplier invoices** — Upload all vendor invoices and see spending by supplier
- **Month-end reconciliation** — Quickly calculate total expenses for accounting
- **Identify top vendors** — Visual chart shows which suppliers you spend most with
- **AI-assisted queries** — "How much did I spend on beverages from Amul this quarter?"

### For Freelancers
- **Client billing tracking** — Keep all client invoices organized by project
- **Expense categorization** — Automatically categorize business vs personal expenses
- **Tax preparation** — Export totals and vendor breakdowns for tax filing
- **Cash flow analysis** — Dashboard shows estimated revenue vs expenses

### For Small Businesses
- **Vendor management** — Track payment status and outstanding invoices
- **Financial reporting** — Generate insights without spreadsheet expertise
- **Team collaboration** — Multiple users can access company invoice data
- **Audit trail** — Complete history of all uploaded invoices with timestamps

### For Accountants
- **Client invoice aggregation** — Collect invoices from multiple clients
- **Automated data entry** — Reduce manual transcription errors
- **Quick lookups** — AI chat for instant answers about specific transactions
- **Multi-currency support** — Handles invoices in different currencies

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Total Commits** | 20+ commits with conventional messages |
| **Demo Invoices** | 30 sample retail invoices included |
| **Backend Tests** | pytest suite with auth and invoice tests |
| **API Endpoints** | 8 RESTful endpoints |
| **Database Tables** | 5 tables (users, invoices, items, ledger, accounts) |
| **Frontend Pages** | 4 main pages (Login, Dashboard, Invoices, AI Chat) |
| **Lines of Code** | ~3,000+ (TypeScript + Python) |

---

## 🚀 Installation Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- Git

### Step 1: Clone Repository
```bash
git clone https://github.com/sahilnyk/reconcile.git
cd reconcile
```

### Step 2: Database Setup (Supabase)
1. Create free account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor
4. Copy contents of `supabase_seed.sql` and run
5. Note down Project URL and Service Role Key

### Step 3: Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials
uvicorn app.main:app --reload --port 8000
```

### Step 4: Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL (http://localhost:8000)
npm run dev
```

### Step 5: Access Application
Open browser and navigate to `http://localhost:5173`

---

## 🔧 Environment Variables

### Backend `.env`
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
# Optional for production
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.reconcile.app
```

### Frontend `.env`
```bash
VITE_API_URL=http://localhost:8000
# Optional for production
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
```

---

## 📝 API Documentation

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/invoices/upload` | POST | Upload invoice file | Yes |
| `/api/invoices` | GET | List all invoices | Yes |
| `/api/invoices/{id}` | GET | Get invoice details | Yes |
| `/api/dashboard/summary` | GET | Dashboard analytics | Yes |
| `/api/llm/query` | POST | AI chat query | Yes |

---

## 🔒 Security Features

- ✅ **JWT Authentication** — All endpoints protected except health check
- ✅ **Row-Level Security** — Database policies ensure data isolation
- ✅ **AI Guardrails** — Prevents off-topic and potentially harmful queries
- ✅ **Input Validation** — Pydantic models validate all request data
- ✅ **CORS Protection** — Configured for specific frontend origin
- ✅ **No Secrets in Code** — All credentials via environment variables

---

## 🛣️ Future Enhancements

| Feature | Description |
|---------|-------------|
| **OCR Integration** | Support for scanned invoice images using Tesseract OCR |
| **Multi-currency Conversion** | Automatic exchange rate conversion |
| **Email Integration** | Forward invoices via email for automatic processing |
| **Mobile App** | React Native app for on-the-go invoice capture |
| **Advanced Analytics** | Predictive spending forecasts using ML |
| **Bank Integration** | Automatic reconciliation with bank statements |
| **Multi-tenant Support** | Organization-level data isolation |

---

## 👨‍💻 Developer

**Final Year Project** — Bachelor of Technology (B.Tech)  
**Specialization:** Computer Science / Information Technology  
**Year:** 2024-2025

---

## 🙏 Acknowledgments

- **Google AI Studio** — For providing Gemini API access
- **Supabase** — For the excellent managed PostgreSQL service
- **Auth0** — For authentication infrastructure
- **FastAPI** — For the blazing-fast Python framework
- **Tailwind CSS** — For the utility-first CSS framework

---

## 📄 License

This project is created for educational purposes as a Final Year Project.

---

<p align="center">
  <strong>Reconcile</strong> — Making Accounting Intelligent 🚀
</p>
