import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use Vite env vars in the browser: import.meta.env.VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
// Fallback to process.env on server
// @ts-ignore
const SUPABASE_URL: string | undefined = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// @ts-ignore
const SUPABASE_KEY: string | undefined = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

function createStubClient(): SupabaseClient {
  // Minimal stub that mirrors the methods used by the app to avoid throwing at import time.
  // Each method returns neutral values or an error object so callers can handle failures gracefully.
  const stub: any = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
      signUp: async () => ({ error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ }),
    },
    from: (_table: string) => ({
      select: async () => ({ data: null }),
      upsert: async () => ({ error: new Error('Supabase not configured') }),
    }),
  };
  return stub as SupabaseClient;
}

export function getSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Return a stub client instead of throwing so the UI can load and show a helpful message.
    return createStubClient();
  }
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabase;
}

export async function upsertTransactions(userId: string, transactions: any[], userName?: string | null) {
  const sb = getSupabaseClient();
  try {
    // If caller provided a userName prefer that; otherwise try to derive from authenticated user metadata
    let derivedUserName: string | null = null;
    if (userName) {
      derivedUserName = userName;
    } else {
      try {
        const userRes = await sb.auth.getUser();
        const current = userRes?.data?.user;
        if (current && current.id === userId) {
          const meta = (current.user_metadata && typeof current.user_metadata === 'object' ? current.user_metadata : {}) as Record<string, any>;
          // Look for common display name fields in metadata
          derivedUserName = meta.name || meta.full_name || meta.fullName || meta.first_name || meta.firstName || meta.given_name || meta.givenName || meta.preferred_username || null;
          // If still not found, fall back to email
          if (!derivedUserName) derivedUserName = current.email || null;
        }
      } catch (e) {
        // ignore — not critical
        console.warn('Could not read auth user metadata when upserting transactions:', e);
      }

      // If we still don't have a display name, try a `profiles` table (if present)
      if (!derivedUserName && userId !== 'anonymous') {
        try {
          // We use maybeSingle() which returns null if no rows, but might throw if table missing?
          // Actually, if table is missing, it returns an error.
          const { data: profile, error: profileErr } = await sb.from('profiles').select('full_name,first_name,name').eq('id', userId).maybeSingle();
          
          if (profile) {
            derivedUserName = profile.full_name || profile.first_name || profile.name || derivedUserName;
          }
          // We intentionally ignore profileErr here to avoid log noise if the table doesn't exist.
        } catch (e) {
          // ignore — profiles table may not exist
        }
      }
    }

    // Expect a table `transactions` with a primary key `id` and a `user_id` column
    // Map JS transaction shape to snake_case DB columns and include a raw jsonb column for full fidelity
    const payload = transactions.map(tx => ({
      id: tx.id,
      user_id: userId,
      user_name: derivedUserName,
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

export async function fetchTransactionsByUser(userId: string) {
  const sb = getSupabaseClient();
  try {
    const { data, error } = await sb.from('transactions').select('raw').eq('user_id', userId);
    if (error) throw error;
    if (!data) return [];
    // Each row should have a `raw` column containing the original transaction object
    return data.map((r: any) => r.raw || r);
  } catch (e) {
    console.error('Failed to fetch transactions from Supabase', e);
    throw e;
  }
}

export async function upsertRecurringExpenses(userId: string, recurringExpenses: any[]) {
  const sb = getSupabaseClient();
  try {
    // First delete existing recurring expenses for this user to avoid duplicates
    // since we don't have stable IDs for them from the analysis service
    const { error: deleteError } = await sb.from('recurring_expenses').delete().eq('user_id', userId);
    if (deleteError) {
        console.warn('Error clearing old recurring expenses:', deleteError);
        // Continue anyway, though this might result in duplicates if delete failed but insert succeeds
    }

    const payload = recurringExpenses.map(re => ({
      user_id: userId,
      name: re.name,
      representative_description: re.representativeDescription,
      category: re.category,
      average_amount: re.averageAmount,
      transaction_count: re.transactionCount,
    }));
    
    const { data, error } = await sb.from('recurring_expenses').insert(payload).select();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Supabase upsertRecurringExpenses failed:', e);
    throw e;
  }
}

export async function fetchRecurringExpensesByUser(userId: string) {
  const sb = getSupabaseClient();
  try {
    const { data, error } = await sb
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Map back to camelCase for the app
    return (data || []).map((row: any) => ({
      name: row.name,
      representativeDescription: row.representative_description,
      category: row.category,
      averageAmount: row.average_amount,
      transactionCount: row.transaction_count
    }));
  } catch (e) {
    console.error('Supabase fetchRecurringExpensesByUser failed:', e);
    throw e;
  }
}

