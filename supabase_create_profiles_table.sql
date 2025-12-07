-- 1. Create a profiles table
-- This table mirrors the built-in auth.users table but holds public/app-specific data
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  currency text default 'USD',
  monthly_budget_goal numeric,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Create Policies
-- Anyone can read their own profile
create policy "Users can view own profile" 
on public.profiles for select 
using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile" 
on public.profiles for update 
using (auth.uid() = id);

-- Users can insert their own profile (needed for manual creation if trigger fails or for existing users)
create policy "Users can insert own profile" 
on public.profiles for insert 
with check (auth.uid() = id);

-- 4. Create a Trigger to auto-create profile on signup
-- This is a standard Supabase pattern. When a user signs up via Auth, 
-- this function runs and inserts a row into public.profiles.
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
