-- 🚨 CORREÇÃO DEFINITIVA - PROBLEMA DE TIPO DE DADOS
-- Problema identificado: Supabase está tentando comparar TEXT com BOOLEAN
-- Solução: Função que força a conversão correta de tipos

-- Dropar função existente
DROP FUNCTION IF EXISTS emergency_update_published(UUID, TEXT);

-- Criar função com conversão de tipo EXPLÍCITA
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
  
  -- Converter valor para boolean de forma EXPLÍCITA
  CASE 
    WHEN LOWER(TRIM(published_value)) IN ('true', '1', 'yes', 'on', 't') THEN
      boolean_value := TRUE;
    WHEN LOWER(TRIM(published_value)) IN ('false', '0', 'no', 'off', 'f') THEN
      boolean_value := FALSE;
    ELSE
      -- Tentar conversão direta como fallback
      BEGIN
        boolean_value := published_value::BOOLEAN;
      EXCEPTION
        WHEN OTHERS THEN
          boolean_value := FALSE;
      END;
  END CASE;
  
  RAISE NOTICE 'CONVERSÃO: % -> %', published_value, boolean_value;
  
  -- Atualizar usando CAST explícito para evitar problemas de tipo
  UPDATE articles 
  SET 
    published = boolean_value::BOOLEAN,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = article_id::UUID;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RAISE NOTICE 'LINHAS AFETADAS: %', rows_affected;
  
  IF rows_affected > 0 THEN
    RAISE NOTICE 'SUCCESS: Artigo % atualizado com sucesso para %', article_id, boolean_value;
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

-- Garantir todas as permissões
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, TEXT) TO postgres;

-- Comentário final
COMMENT ON FUNCTION emergency_update_published(UUID, TEXT) IS 'Função DEFINITIVA para atualizar published - COM CONVERSÃO EXPLÍCITA DE TIPOS';