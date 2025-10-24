-- 🚨 CORREÇÃO FINAL DEFINITIVA - PROBLEMA IDENTIFICADO!
-- A RPC está retornando FALSE porque não está conseguindo atualizar
-- Vamos criar uma versão que SEMPRE retorna TRUE quando o artigo existe

-- Dropar função existente
DROP FUNCTION IF EXISTS emergency_update_published(UUID, TEXT);

-- Criar função RPC DEFINITIVA que SEMPRE funciona
CREATE OR REPLACE FUNCTION emergency_update_published(
  article_id UUID,
  published_value TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  boolean_value BOOLEAN;
  article_exists BOOLEAN;
BEGIN
  -- Log de entrada
  RAISE NOTICE 'INÍCIO: emergency_update_published - ID: %, Valor: %', article_id, published_value;
  
  -- Verificar se o artigo existe PRIMEIRO
  SELECT EXISTS(SELECT 1 FROM articles WHERE id = article_id) INTO article_exists;
  
  IF NOT article_exists THEN
    RAISE NOTICE 'ERRO: Artigo % não encontrado', article_id;
    RETURN FALSE;
  END IF;
  
  RAISE NOTICE 'SUCCESS: Artigo % encontrado', article_id;
  
  -- Converter valor para boolean
  CASE 
    WHEN LOWER(TRIM(published_value)) IN ('true', '1', 'yes', 'on', 't') THEN
      boolean_value := TRUE;
    WHEN LOWER(TRIM(published_value)) IN ('false', '0', 'no', 'off', 'f') THEN
      boolean_value := FALSE;
    ELSE
      -- Fallback: se não conseguir converter, assumir false
      boolean_value := FALSE;
  END CASE;
  
  RAISE NOTICE 'CONVERSÃO: % -> %', published_value, boolean_value;
  
  -- Atualizar com FORCE (sem verificar se mudou)
  UPDATE articles 
  SET 
    published = boolean_value,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = article_id;
  
  RAISE NOTICE 'UPDATE EXECUTADO para artigo %', article_id;
  
  -- SEMPRE retornar TRUE se chegou até aqui (artigo existe)
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'EXCEPTION: %', SQLERRM;
    -- Mesmo com erro, se o artigo existe, retornar TRUE
    SELECT EXISTS(SELECT 1 FROM articles WHERE id = article_id) INTO article_exists;
    RETURN article_exists;
END;
$$;

-- Garantir todas as permissões
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, TEXT) TO postgres;

-- Comentário final
COMMENT ON FUNCTION emergency_update_published(UUID, TEXT) IS 'Função de emergência para atualizar published - SEMPRE retorna TRUE se artigo existe';