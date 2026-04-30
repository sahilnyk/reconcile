-- Reconcile: Supabase seed SQL
-- Run this in the Supabase SQL editor after creating the project.

-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth0_sub text unique not null,
  email text not null,
  name text,
  created_at timestamptz default now()
);

-- Invoices table
create table if not exists invoices (
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
  status text default 'Pending',
  metadata jsonb,
  created_at timestamptz default now()
);

-- Invoice items table
create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  description text,
  quantity numeric,
  unit_price numeric,
  total numeric
);

-- Accounts (small default chart of accounts)
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text,
  type text -- expense, revenue, asset, liability, equity
);

-- Ledger entries
create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id),
  account_id uuid references accounts(id),
  entry_date date,
  debit numeric,
  credit numeric,
  created_at timestamptz default now()
);

-- Seed default accounts
insert into accounts (code, name, type) values
  ('5000', 'Operating Expenses', 'expense'),
  ('2000', 'Accounts Payable', 'liability'),
  ('4000', 'Revenue', 'revenue'),
  ('1000', 'Cash', 'asset'),
  ('3000', 'Retained Earnings', 'equity');

-- Enable Storage bucket for invoices
-- Run via Supabase dashboard: Storage > New Bucket > "invoices"
