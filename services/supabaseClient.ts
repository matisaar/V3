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
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        // Reduce auto-refresh frequency to avoid 429 errors
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'x-client-info': 'finance-tracker',
        },
      },
    });
  }
  return supabase;
}

// Helper function to retry API calls with exponential backoff on 429 errors
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Check if it's a rate limit error
      if (error?.status === 429 || error?.message?.includes('429') || error?.code === '429') {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Non-rate-limit error, throw immediately
      }
    }
  }
  throw lastError;
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
    
    // Use select() to return the inserted data, which helps confirm success
    const { data, error } = await sb.from('transactions').upsert(payload, { onConflict: 'id' }).select();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Failed to upsert transactions to Supabase', e);
    throw e;
  }
}

export default getSupabaseClient;

// Upload avatar to Supabase Storage
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const sb = getSupabaseClient();
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;
    
    // Upload the file (will overwrite existing)
    const { error: uploadError } = await sb.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data } = sb.storage.from('avatars').getPublicUrl(fileName);
    return data?.publicUrl || null;
  } catch (e) {
    console.error('Failed to upload avatar:', e);
    return null;
  }
}

// Update user profile with avatar URL
export async function updateProfileAvatar(userId: string, avatarUrl: string): Promise<boolean> {
  const sb = getSupabaseClient();
  try {
    const { error } = await sb.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Failed to update profile avatar:', e);
    return false;
  }
}

// Get user profile including avatar
export async function getProfile(userId: string): Promise<{ first_name?: string; avatar_url?: string } | null> {
  const sb = getSupabaseClient();
  try {
    const { data, error } = await sb.from('profiles').select('first_name, avatar_url').eq('id', userId).single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Failed to get profile:', e);
    return null;
  }
}

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
    if (!recurringExpenses || recurringExpenses.length === 0) {
        console.log('No recurring expenses to save.');
        return [];
    }

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

// Social Feed Functions

/**
 * Fetch all public transactions from all users for the social feed
 * Also fetches profile names and avatars to display the latest user info
 */
export async function fetchAllPublicTransactions() {
  const sb = getSupabaseClient();
  try {
    // Fetch transactions
    const { data: transactionsData, error: txError } = await sb
      .from('transactions')
      .select('id, user_id, user_name, date, description, amount, category, type, bucket_of_life, raw')
      .order('date', { ascending: false })
      .limit(500); // Limit to recent 500 transactions for performance
      
    if (txError) throw txError;
    
    // Get unique user IDs
    const userIds = [...new Set((transactionsData || []).map((t: any) => t.user_id).filter(Boolean))];
    
    // Fetch profiles for all users (to get latest names and avatars)
    let profilesMap: { [userId: string]: { name: string; avatarUrl?: string } } = {};
    if (userIds.length > 0) {
      try {
        const { data: profilesData } = await sb
          .from('profiles')
          .select('id, first_name, full_name, email, avatar_url')
          .in('id', userIds);
        
        if (profilesData) {
          profilesData.forEach((p: any) => {
            profilesMap[p.id] = {
              name: p.first_name || p.full_name || p.email || 'Anonymous User',
              avatarUrl: p.avatar_url || undefined
            };
          });
        }
      } catch (e) {
        // Profiles table might not exist, continue with transaction user_name
        console.debug('Could not fetch profiles:', e);
      }
    }
    
    // Map to Transaction objects, preferring profile names over transaction user_name
    return (transactionsData || []).map((row: any) => {
      const raw = row.raw || {};
      const profile = profilesMap[row.user_id];
      const userName = profile?.name || row.user_name || 'Anonymous User';
      const avatarUrl = profile?.avatarUrl;
      return {
        id: row.id,
        userId: row.user_id,
        userName,
        avatarUrl,
        date: new Date(row.date),
        description: row.description || raw.description || '',
        amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount) || 0,
        category: row.category || raw.category || '',
        type: row.type || raw.type || 'Expense',
        bucketOfLife: row.bucket_of_life || raw.bucketOfLife || '',
      };
    });
  } catch (e) {
    console.error('Failed to fetch public transactions:', e);
    throw e;
  }
}

/**
 * Get like/dislike counts and user's reaction for a post
 */
export async function getPostReactions(postKey: string, currentUserId?: string) {
  const sb = getSupabaseClient();
  try {
    const { data, error } = await sb
      .from('post_likes')
      .select('user_id, reaction_type')
      .eq('post_key', postKey);
      
    if (error) throw error;
    
    const likes = (data || []).filter((r: any) => r.reaction_type === 'like').length;
    const dislikes = (data || []).filter((r: any) => r.reaction_type === 'dislike').length;
    
    let userReaction: 'like' | 'dislike' | null = null;
    if (currentUserId) {
      const userLike = (data || []).find((r: any) => r.user_id === currentUserId);
      if (userLike) {
        userReaction = userLike.reaction_type as 'like' | 'dislike';
      }
    }
    
    return { likes, dislikes, userReaction };
  } catch (e) {
    console.error('Failed to fetch post reactions:', e);
    return { likes: 0, dislikes: 0, userReaction: null };
  }
}

/**
 * Toggle a like or dislike on a post
 * If user already has the same reaction, remove it
 * If user has the opposite reaction, switch to the new one
 */
export async function togglePostReaction(postKey: string, userId: string, reactionType: 'like' | 'dislike') {
  const sb = getSupabaseClient();
  try {
    // Check if user already has a reaction on this post
    const { data: existing, error: fetchError } = await sb
      .from('post_likes')
      .select('id, reaction_type')
      .eq('post_key', postKey)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (fetchError) throw fetchError;
    
    if (existing) {
      if (existing.reaction_type === reactionType) {
        // User is toggling off their reaction - delete it
        const { error: deleteError } = await sb
          .from('post_likes')
          .delete()
          .eq('id', existing.id);
          
        if (deleteError) throw deleteError;
        return { action: 'removed', reactionType };
      } else {
        // User is switching their reaction - update it
        const { error: updateError } = await sb
          .from('post_likes')
          .update({ reaction_type: reactionType })
          .eq('id', existing.id);
          
        if (updateError) throw updateError;
        return { action: 'updated', reactionType };
      }
    } else {
      // User has no reaction yet - insert new one
      const { error: insertError } = await sb
        .from('post_likes')
        .insert({ user_id: userId, post_key: postKey, reaction_type: reactionType });
        
      if (insertError) throw insertError;
      return { action: 'added', reactionType };
    }
  } catch (e) {
    console.error('Failed to toggle post reaction:', e);
    throw e;
  }
}

/**
 * Get comments for a post
 */
export async function getPostComments(postKey: string) {
  const sb = getSupabaseClient();
  try {
    const { data, error } = await sb
      .from('post_comments')
      .select('id, user_id, user_name, comment_text, created_at')
      .eq('post_key', postKey)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    
    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name || 'Anonymous User',
      text: row.comment_text,
      createdAt: new Date(row.created_at),
    }));
  } catch (e) {
    console.error('Failed to fetch post comments:', e);
    return [];
  }
}

/**
 * Add a comment to a post
 */
export async function addPostComment(postKey: string, userId: string, userName: string, commentText: string) {
  const sb = getSupabaseClient();
  try {
    const { data, error } = await sb
      .from('post_comments')
      .insert({
        post_key: postKey,
        user_id: userId,
        user_name: userName,
        comment_text: commentText,
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      userName: data.user_name,
      text: data.comment_text,
      createdAt: new Date(data.created_at),
    };
  } catch (e) {
    console.error('Failed to add comment:', e);
    throw e;
  }
}

/**
 * Get social stats (likes, dislikes, comment counts) for multiple posts in batch
 * This is more efficient than calling getPostReactions for each post
 */
export async function getBatchPostStats(postKeys: string[], currentUserId?: string) {
  const sb = getSupabaseClient();
  
  const result: { [postKey: string]: { likes: number; dislikes: number; commentsCount: number; userReaction: 'like' | 'dislike' | null } } = {};
  
  // Initialize all posts with zeros
  postKeys.forEach(key => {
    result[key] = { likes: 0, dislikes: 0, commentsCount: 0, userReaction: null };
  });
  
  if (postKeys.length === 0) return result;
  
  try {
    // Fetch all likes for these posts in one query
    const { data: likesData, error: likesError } = await sb
      .from('post_likes')
      .select('post_key, user_id, reaction_type')
      .in('post_key', postKeys);
      
    if (!likesError && likesData) {
      likesData.forEach((row: any) => {
        if (result[row.post_key]) {
          if (row.reaction_type === 'like') {
            result[row.post_key].likes++;
          } else if (row.reaction_type === 'dislike') {
            result[row.post_key].dislikes++;
          }
          // Check if this is the current user's reaction
          if (currentUserId && row.user_id === currentUserId) {
            result[row.post_key].userReaction = row.reaction_type as 'like' | 'dislike';
          }
        }
      });
    }
    
    // Fetch comment counts for these posts in one query
    const { data: commentsData, error: commentsError } = await sb
      .from('post_comments')
      .select('post_key')
      .in('post_key', postKeys);
      
    if (!commentsError && commentsData) {
      commentsData.forEach((row: any) => {
        if (result[row.post_key]) {
          result[row.post_key].commentsCount++;
        }
      });
    }
    
  } catch (e) {
    console.error('Failed to fetch batch post stats:', e);
  }
  
  return result;
}

