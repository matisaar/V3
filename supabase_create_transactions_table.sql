-- Supabase / Postgres DDL to create a transactions table suitable for the app

create table if not exists public.transactions (
  id text primary key,
  user_id text not null,
  date timestamptz not null,
  description text,
  amount numeric,
  category text,
  type text,
  bucket_of_life text,
  raw jsonb,
  created_at timestamptz default now()
);

-- Optional index for user queries
create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_transactions_date on public.transactions (date);
