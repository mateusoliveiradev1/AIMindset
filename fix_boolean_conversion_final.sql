-- 🚨 SOLUÇÃO DEFINITIVA - CONVERSÃO BOOLEAN CORRETA
-- Problema: O Supabase está tentando comparar TEXT com BOOLEAN
-- Solução: Função que usa apenas tipos nativos do PostgreSQL

-- Dropar função existente
DROP FUNCTION IF EXISTS emergency_update_published(UUID, TEXT);

-- Criar função com parâmetro BOOLEAN direto
CREATE OR REPLACE FUNCTION emergency_update_published(
  article_id UUID,
  published_value BOOLEAN  -- MUDANÇA: usar BOOLEAN direto
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_affected INTEGER;
  article_exists BOOLEAN;
BEGIN
  RAISE NOTICE 'INÍCIO: emergency_update_published - ID: %, Valor: %', article_id, published_value;
  
  -- Verificar se o artigo existe primeiro
  SELECT EXISTS(SELECT 1 FROM articles WHERE id = article_id) INTO article_exists;
  
  IF NOT article_exists THEN
    RAISE NOTICE 'ERRO: Artigo % não encontrado', article_id;
    RETURN FALSE;
  END IF;
  
  RAISE NOTICE 'ARTIGO ENCONTRADO: %', article_id;
  
  -- Atualizar diretamente com BOOLEAN
  UPDATE articles 
  SET 
    published = published_value,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = article_id;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RAISE NOTICE 'LINHAS AFETADAS: %', rows_affected;
  
  IF rows_affected > 0 THEN
    RAISE NOTICE 'SUCCESS: Artigo % atualizado com sucesso para %', article_id, published_value;
    RETURN TRUE;
  ELSE
    RAISE NOTICE 'FALHA: Nenhuma linha foi afetada para artigo %', article_id;
    RETURN FALSE;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'EXCEPTION: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Criar função auxiliar para conversão de TEXT para BOOLEAN
CREATE OR REPLACE FUNCTION emergency_update_published_text(
  article_id UUID,
  published_value TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  boolean_value BOOLEAN;
BEGIN
  -- Converter TEXT para BOOLEAN
  CASE 
    WHEN LOWER(TRIM(published_value)) IN ('true', '1', 'yes', 'on', 't') THEN
      boolean_value := TRUE;
    WHEN LOWER(TRIM(published_value)) IN ('false', '0', 'no', 'off', 'f') THEN
      boolean_value := FALSE;
    ELSE
      boolean_value := FALSE;
  END CASE;
  
  -- Chamar a função principal com BOOLEAN
  RETURN emergency_update_published(article_id, boolean_value);
END;
$$;

-- Garantir todas as permissões para ambas as funções
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, BOOLEAN) TO postgres;

GRANT EXECUTE ON FUNCTION emergency_update_published_text(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_update_published_text(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION emergency_update_published_text(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION emergency_update_published_text(UUID, TEXT) TO postgres;

-- Comentários
COMMENT ON FUNCTION emergency_update_published(UUID, BOOLEAN) IS 'Função DEFINITIVA para atualizar published - BOOLEAN NATIVO';
COMMENT ON FUNCTION emergency_update_published_text(UUID, TEXT) IS 'Função auxiliar para converter TEXT para BOOLEAN';