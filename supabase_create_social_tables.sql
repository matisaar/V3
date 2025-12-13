-- Social Feed Tables for Personal Finance Tracker
-- Run this in your Supabase SQL Editor to enable social features

-- Table to store likes/dislikes on transaction posts
-- Each user can like OR dislike a post (not both)
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  post_key text NOT NULL, -- Format: "date_userId" to identify unique posts
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_key)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_key ON public.post_likes (post_key);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes (user_id);

-- Table to store comments on transaction posts
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_key text NOT NULL, -- Format: "date_userId" to identify unique posts
  user_id text NOT NULL,
  user_name text,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_key ON public.post_comments (post_key);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON public.post_comments (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Policies for post_likes
-- Anyone can read likes (for displaying counts)
CREATE POLICY "Anyone can view likes" 
  ON public.post_likes 
  FOR SELECT 
  USING (true);

-- Authenticated users can insert their own likes
CREATE POLICY "Authenticated users can like posts" 
  ON public.post_likes 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id OR user_id = 'anonymous');

-- Users can delete their own likes
CREATE POLICY "Users can remove their likes" 
  ON public.post_likes 
  FOR DELETE 
  USING (auth.uid()::text = user_id OR user_id = 'anonymous');

-- Users can update their own likes (to change between like/dislike)
CREATE POLICY "Users can update their likes" 
  ON public.post_likes 
  FOR UPDATE 
  USING (auth.uid()::text = user_id OR user_id = 'anonymous')
  WITH CHECK (auth.uid()::text = user_id OR user_id = 'anonymous');

-- Policies for post_comments
-- Anyone can read comments
CREATE POLICY "Anyone can view comments" 
  ON public.post_comments 
  FOR SELECT 
  USING (true);

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can comment" 
  ON public.post_comments 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id OR user_id = 'anonymous');

-- Users can delete their own comments
CREATE POLICY "Users can delete their comments" 
  ON public.post_comments 
  FOR DELETE 
  USING (auth.uid()::text = user_id OR user_id = 'anonymous');

-- Update the transactions table to allow public read access for social feed
-- WARNING: This makes transactions visible to all users. Only do this if you want a public social feed.
-- If this policy already exists, this will error - that's okay.
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view all transactions for social feed" ON public.transactions;
  
  -- Create new policy for public read access
  CREATE POLICY "Users can view all transactions for social feed" 
    ON public.transactions 
    FOR SELECT 
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Policy already exists, ignore
END $$;
