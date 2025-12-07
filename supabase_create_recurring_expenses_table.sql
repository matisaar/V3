-- Supabase / Postgres DDL to create a recurring_expenses table

create table if not exists public.recurring_expenses (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  name text,
  representative_description text,
  category text,
  average_amount numeric,
  transaction_count integer,
  created_at timestamptz default now()
);

-- Optional index for user queries
create index if not exists idx_recurring_expenses_user_id on public.recurring_expenses (user_id);
