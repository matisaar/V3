-- Fix permissions for recurring_expenses table

-- 1. Enable Row Level Security (RLS)
alter table public.recurring_expenses enable row level security;

-- 2. Create a policy to allow users to manage their own data
-- This covers SELECT, INSERT, UPDATE, DELETE
create policy "Users can manage their own recurring expenses"
on public.recurring_expenses
for all
using (auth.uid()::text = user_id or user_id = 'anonymous')
with check (auth.uid()::text = user_id or user_id = 'anonymous');

-- Note: If you are not using Supabase Auth and just want it to work for everyone (insecure),
-- you can run this instead:
-- alter table public.recurring_expenses disable row level security;
