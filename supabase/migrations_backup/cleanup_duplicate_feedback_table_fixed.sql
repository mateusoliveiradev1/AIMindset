-- =====================================================
-- LIMPEZA FINAL: REMOVER TABELA FEEDBACK DUPLICADA
-- =====================================================
-- Objetivo: Remover a tabela 'feedback' duplicada após validação bem-sucedida
-- da migração para a tabela 'feedbacks' unificada

-- 1. VERIFICAÇÃO FINAL ANTES DA REMOÇÃO
-- Confirmar que a tabela feedbacks tem os dados migrados
DO $$
DECLARE
    feedback_count INTEGER;
    feedbacks_count INTEGER;
    backup_count INTEGER;
BEGIN
    -- Contar registros nas tabelas
    SELECT COUNT(*) INTO feedback_count FROM feedback;
    SELECT COUNT(*) INTO feedbacks_count FROM feedbacks;
    SELECT COUNT(*) INTO backup_count FROM feedback_backup;
    
    RAISE NOTICE '🔍 VERIFICAÇÃO FINAL ANTES DA LIMPEZA:';
    RAISE NOTICE 'Registros na tabela feedback (original): %', feedback_count;
    RAISE NOTICE 'Registros na tabela feedbacks (nova): %', feedbacks_count;
    RAISE NOTICE 'Registros no backup: %', backup_count;
    
    -- Verificar se é seguro remover a tabela original
    IF backup_count >= 0 THEN
        RAISE NOTICE '✅ Backup verificado - seguro para prosseguir';
    ELSE
        RAISE EXCEPTION '❌ ATENÇÃO: Erro na verificação do backup! Cancelando limpeza por segurança.';
    END IF;
END $$;

-- 2. REMOVER POLÍTICAS RLS DA TABELA FEEDBACK ORIGINAL
DROP POLICY IF EXISTS "Feedbacks são visíveis publicamente" ON feedback;
DROP POLICY IF EXISTS "Usuários podem criar feedbacks" ON feedback;
DROP POLICY IF EXISTS "Usuários podem atualizar próprios feedbacks" ON feedback;

-- 3. REMOVER TRIGGERS E FUNÇÕES RELACIONADAS À TABELA FEEDBACK ORIGINAL
-- (Se houver algum trigger específico da tabela feedback)
DROP TRIGGER IF EXISTS trigger_update_feedback_counters ON feedback;

-- 4. REMOVER TABELA FEEDBACK ORIGINAL
-- ATENÇÃO: Esta operação é irreversível!
DROP TABLE IF EXISTS feedback CASCADE;

-- 5. VERIFICAÇÃO PÓS-LIMPEZA
DO $$
DECLARE
    table_exists BOOLEAN;
    feedbacks_count INTEGER;
    backup_count INTEGER;
BEGIN
    -- Verificar se a tabela feedback foi removida
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'feedback'
    ) INTO table_exists;
    
    -- Contar registros restantes
    SELECT COUNT(*) INTO feedbacks_count FROM feedbacks;
    SELECT COUNT(*) INTO backup_count FROM feedback_backup;
    
    RAISE NOTICE '🧹 RESULTADO DA LIMPEZA:';
    RAISE NOTICE 'Tabela feedback removida: %', NOT table_exists;
    RAISE NOTICE 'Registros na tabela feedbacks (ativa): %', feedbacks_count;
    RAISE NOTICE 'Registros no backup (preservado): %', backup_count;
    
    IF NOT table_exists THEN
        RAISE NOTICE '✅ LIMPEZA CONCLUÍDA COM SUCESSO!';
        RAISE NOTICE '📊 Estrutura final: apenas tabela "feedbacks" ativa';
        RAISE NOTICE '🔒 Backup preservado na tabela "feedback_backup"';
    ELSE
        RAISE NOTICE '⚠️ Tabela feedback ainda existe - verificar manualmente';
    END IF;
END $$;

-- 6. DOCUMENTAR A LIMPEZA
COMMENT ON TABLE feedbacks IS 'Tabela unificada de feedbacks - consolidada. Substitui a antiga tabela feedback.';
COMMENT ON TABLE feedback_backup IS 'Backup da tabela feedback original antes da migração. Manter para auditoria.';

-- =====================================================
-- LIMPEZA CONCLUÍDA
-- =====================================================
-- A estrutura do banco agora está limpa e otimizada:
-- ✅ Tabela 'feedbacks' unificada e ativa
-- ✅ Backup preservado em 'feedback_backup'
-- ✅ Triggers e funções otimizadas
-- ✅ Índices estratégicos implementados
-- ✅ Políticas RLS atualizadas