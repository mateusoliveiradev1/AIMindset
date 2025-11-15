-- Fase 2: Autenticação e Engajamento para comentários
-- 1) Adicionar user_id aos comentários
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_comments_user_created ON public.comments(user_id, created_at DESC);

-- 2) Tabela de likes por usuário para comentários
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON public.comment_likes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes(comment_id);

-- 3) Políticas RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read comments" ON public.comments;
CREATE POLICY "Allow public read comments" ON public.comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert own comment" ON public.comments;
CREATE POLICY "Allow insert own comment" ON public.comments
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Allow update own comment" ON public.comments;
CREATE POLICY "Allow update own comment" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete own comment" ON public.comments;
CREATE POLICY "Allow delete own comment" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public read comment_likes" ON public.comment_likes;
CREATE POLICY "Allow public read comment_likes" ON public.comment_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert own like" ON public.comment_likes;
CREATE POLICY "Allow insert own like" ON public.comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete own like" ON public.comment_likes;
CREATE POLICY "Allow delete own like" ON public.comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 4) Função RPC de curtidas compatível com usuário autenticado
CREATE OR REPLACE FUNCTION public.increment_comment_likes(comment_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_user boolean;
  did_insert boolean := false;
  new_likes integer := 0;
BEGIN
  has_user := auth.uid() IS NOT NULL;

  IF has_user THEN
    BEGIN
      INSERT INTO public.comment_likes(comment_id, user_id)
      VALUES (comment_id, auth.uid());
      did_insert := true;
    EXCEPTION WHEN unique_violation THEN
      did_insert := false;
    END;

    IF did_insert THEN
      UPDATE public.comments
      SET likes = likes + 1
      WHERE id = comment_id
      RETURNING likes INTO new_likes;
    ELSE
      SELECT likes INTO new_likes FROM public.comments WHERE id = comment_id;
    END IF;

    RETURN COALESCE(new_likes, 0);
  ELSE
    UPDATE public.comments
    SET likes = likes + 1
    WHERE id = comment_id
    RETURNING likes INTO new_likes;
    RETURN COALESCE(new_likes, 0);
  END IF;
END;
$$;

