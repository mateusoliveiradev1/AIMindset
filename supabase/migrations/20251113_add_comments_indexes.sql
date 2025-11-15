CREATE INDEX IF NOT EXISTS idx_comments_article_created_at ON public.comments (article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_article_likes ON public.comments (article_id, likes DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_created_at ON public.comments (parent_id, created_at DESC);
ANALYZE public.comments;
