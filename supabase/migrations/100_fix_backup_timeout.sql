-- Ajuste de timeouts e performance para a função de backup
-- Não cria novas funções serverless; altera parâmetros no Postgres

DO $$
BEGIN
  -- Garantir que a função exista antes de alterar
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'backup_all_data'
  ) THEN
    -- Aumentar tempo máximo de execução para operações de backup
    EXECUTE 'ALTER FUNCTION public.backup_all_data() SET statement_timeout TO ''10min''';
    -- Acelerar escrita de logs/tabelas de backup (seguro para dados de backup)
    EXECUTE 'ALTER FUNCTION public.backup_all_data() SET synchronous_commit TO off';
    -- Evitar espera excessiva por locks
    EXECUTE 'ALTER FUNCTION public.backup_all_data() SET lock_timeout TO ''30s''';
    -- Evitar sessões em transação ociosa por muito tempo
    EXECUTE 'ALTER FUNCTION public.backup_all_data() SET idle_in_transaction_session_timeout TO ''5min''';
  END IF;
END $$;

-- Comentário
COMMENT ON FUNCTION public.backup_all_data() IS 'Função de backup com parâmetros ajustados: statement_timeout=10min, synchronous_commit=off, lock_timeout=30s, idle_in_transaction_session_timeout=5min';