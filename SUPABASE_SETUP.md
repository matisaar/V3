How to create the `transactions` table in Supabase (SQL editor or supabase CLI)

Option 1 — Supabase SQL Editor (recommended)
1. Open your Supabase project.
2. Go to "SQL" → "New query".
3. Paste the contents of `supabase_create_transactions_table.sql` (or the SQL below) and run it.

SQL to run:

```sql
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

create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_transactions_date on public.transactions (date);
```

Option 2 — Supabase CLI
1. Install the supabase CLI (https://supabase.com/docs/guides/cli).
2. Authenticate and select your project.
3. Run the SQL file (from your project root):

```powershell
supabase db query supabase_create_transactions_table.sql
```

Notes
- The app uses `upsert` with `onConflict: 'id'` so `id` must be a primary key.
- The `raw` column stores the original transaction JSON.
- The app will upsert transactions automatically after categorization if `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured.
