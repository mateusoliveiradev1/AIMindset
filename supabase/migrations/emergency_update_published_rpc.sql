-- FUNÇÃO RPC DE EMERGÊNCIA PARA ATUALIZAR PUBLISHED SEM ERRO 42883
-- Esta função força o tipo boolean e evita problemas de conversão

CREATE OR REPLACE FUNCTION update_article_published(
  article_id UUID,
  published_status BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar o campo published com tipo forçado
  UPDATE articles 
  SET 
    published = published_status,
    updated_at = NOW()
  WHERE id = article_id;
  
  -- Verificar se alguma linha foi afetada
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Garantir que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION update_article_published(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION update_article_published(UUID, BOOLEAN) TO service_role;