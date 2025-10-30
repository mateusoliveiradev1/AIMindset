-- SOLUÇÃO DEFINITIVA PARA ERRO 42883 - PUBLISHED É BOOLEAN NO BANCO!
-- O problema é que o JavaScript está enviando string/text para uma coluna boolean

-- Dropar função existente se houver
DROP FUNCTION IF EXISTS emergency_update_published(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS update_article_published(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS emergency_update_published(UUID, TEXT);

-- Criar função RPC ULTRA ROBUSTA que aceita QUALQUER TIPO e converte para boolean
CREATE OR REPLACE FUNCTION emergency_update_published(
  article_id UUID,
  published_value TEXT  -- Recebe como TEXT para aceitar qualquer coisa
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  boolean_value BOOLEAN;
  rows_affected INTEGER;
BEGIN
  -- Log de entrada para debug
  RAISE NOTICE 'emergency_update_published chamada com article_id: %, published_value: %', article_id, published_value;
  
  -- Verificar se o artigo existe
  IF NOT EXISTS (SELECT 1 FROM articles WHERE id = article_id) THEN
    RAISE NOTICE 'Artigo com ID % não encontrado', article_id;
    RETURN FALSE;
  END IF;
  
  -- Converter o valor recebido para boolean de forma robusta
  CASE 
    WHEN LOWER(published_value) IN ('true', '1', 'yes', 'on', 't') THEN
      boolean_value := TRUE;
    WHEN LOWER(published_value) IN ('false', '0', 'no', 'off', 'f') THEN
      boolean_value := FALSE;
    ELSE
      -- Se não conseguir converter, usar o valor como está (cast direto)
      boolean_value := published_value::BOOLEAN;
  END CASE;
  
  RAISE NOTICE 'Valor convertido para boolean: %', boolean_value;
  
  -- Atualizar o campo published com conversão garantida
  UPDATE articles 
  SET 
    published = boolean_value,
    updated_at = NOW()
  WHERE id = article_id;
  
  -- Verificar quantas linhas foram afetadas
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RAISE NOTICE 'Linhas afetadas: %', rows_affected;
  
  -- Retornar TRUE se pelo menos uma linha foi afetada
  IF rows_affected > 0 THEN
    RAISE NOTICE 'Atualização bem-sucedida para artigo %', article_id;
    RETURN TRUE;
  ELSE
    RAISE NOTICE 'Nenhuma linha foi afetada para artigo %', article_id;
    RETURN FALSE;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro na função emergency_update_published: %', SQLERRM;
    -- Em caso de erro, tentar conversão alternativa
    BEGIN
      boolean_value := (published_value = 'true' OR published_value = '1');
      
      UPDATE articles 
      SET 
        published = boolean_value,
        updated_at = NOW()
      WHERE id = article_id;
      
      GET DIAGNOSTICS rows_affected = ROW_COUNT;
      RAISE NOTICE 'Tentativa alternativa - Linhas afetadas: %', rows_affected;
      
      RETURN rows_affected > 0;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Erro na tentativa alternativa: %', SQLERRM;
        RETURN FALSE;
    END;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION emergency_update_published(UUID, TEXT) TO anon;