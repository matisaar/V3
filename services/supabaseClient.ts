import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use Vite env vars in the browser: import.meta.env.VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
// Fallback to process.env on server
// @ts-ignore
const SUPABASE_URL: string | undefined = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// @ts-ignore
const SUPABASE_KEY: string | undefined = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase URL or Key not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
  }
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabase;
}

export async function upsertTransactions(userId: string, transactions: any[]) {
  const sb = getSupabaseClient();
  try {
    // Expect a table `transactions` with a primary key `id` and a `user_id` column
    // Map JS transaction shape to snake_case DB columns and include a raw jsonb column for full fidelity
    const payload = transactions.map(tx => ({
      id: tx.id,
      user_id: userId,
      date: tx.date, // should be ISO string or Date
      description: tx.description,
      amount: tx.amount,
      category: tx.category,
      type: tx.type,
      bucket_of_life: tx.bucketOfLife || null,
      raw: tx, // jsonb column
    }));
    const { data, error } = await sb.from('transactions').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Failed to upsert transactions to Supabase', e);
    throw e;
  }
}

export default getSupabaseClient;
