-- 1. Ensure table exists (idempotent)
create table if not exists public.recurring_expenses (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  name text null,
  representative_description text null,
  category text null,
  average_amount numeric null,
  transaction_count integer null,
  created_at timestamp with time zone null default now(),
  constraint recurring_expenses_pkey primary key (id)
);

-- 2. Create index
create index if not exists idx_recurring_expenses_user_id on public.recurring_expenses using btree (user_id);

-- 3. ENABLE RLS
alter table public.recurring_expenses enable row level security;

-- 4. DROP EXISTING POLICIES (to avoid conflicts/stale policies)
drop policy if exists "Enable all access for users" on public.recurring_expenses;
drop policy if exists "Users can manage their own recurring expenses" on public.recurring_expenses;

-- 5. CREATE PERMISSIVE POLICY (Matches what likely exists on transactions if it works for anonymous)
-- This allows SELECT, INSERT, UPDATE, DELETE for everyone.
-- If you want to restrict it, change 'using (true)' to 'using (auth.uid()::text = user_id)'
create policy "Enable all access for users"
on public.recurring_expenses
for all
using (true)
with check (true);
