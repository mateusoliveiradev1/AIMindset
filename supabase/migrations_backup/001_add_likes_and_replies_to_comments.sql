-- Migration: Adicionar sistema de curtidas e respostas aos comentários
-- Adiciona campos parent_id e likes à tabela comments existente

-- Adicionar novas colunas à tabela comments existente
ALTER TABLE public.comments 
ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
ADD COLUMN likes INTEGER DEFAULT 0 NOT NULL;

-- Índices para performance
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_likes ON public.comments(likes DESC);
CREATE INDEX idx_comments_article_parent ON public.comments(article_id, parent_id);

-- Constraint para evitar auto-referência
ALTER TABLE public.comments 
ADD CONSTRAINT check_no_self_reference 
CHECK (id != parent_id);

-- Constraint para limitar profundidade será implementada via trigger
-- (PostgreSQL não permite subqueries em CHECK constraints)

-- Função para incrementar curtidas (evita race conditions)
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_likes INTEGER;
BEGIN
  UPDATE comments 
  SET likes = likes + 1 
  WHERE id = comment_id
  RETURNING likes INTO new_likes;
  
  RETURN COALESCE(new_likes, 0);
END;
$$ LANGUAGE plpgsql;

-- Função para decrementar curtidas (para futuro uso)
CREATE OR REPLACE FUNCTION decrement_comment_likes(comment_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_likes INTEGER;
BEGIN
  UPDATE comments 
  SET likes = GREATEST(likes - 1, 0)
  WHERE id = comment_id
  RETURNING likes INTO new_likes;
  
  RETURN COALESCE(new_likes, 0);
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS para curtidas (manter as existentes + novas)
CREATE POLICY "Allow public read comment likes" ON public.comments 
    FOR SELECT USING (true);

CREATE POLICY "Allow public increment likes" ON public.comments 
    FOR UPDATE USING (true);

-- Habilitar real-time para a tabela comments (se não estiver habilitado)
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- Comentários para documentação
COMMENT ON COLUMN public.comments.parent_id IS 'ID do comentário pai para respostas (NULL para comentários principais)';
COMMENT ON COLUMN public.comments.likes IS 'Número de curtidas do comentário';
COMMENT ON FUNCTION increment_comment_likes(UUID) IS 'Incrementa o contador de curtidas de um comentário de forma segura';
COMMENT ON FUNCTION decrement_comment_likes(UUID) IS 'Decrementa o contador de curtidas de um comentário de forma segura';