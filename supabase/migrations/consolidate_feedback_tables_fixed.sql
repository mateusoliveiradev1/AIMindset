-- =====================================================
-- MIGRAÇÃO: CONSOLIDAÇÃO DAS TABELAS DE FEEDBACK (CORRIGIDA)
-- =====================================================
-- Objetivo: Migrar dados da tabela 'feedback' para 'feedbacks' 
-- e implementar estrutura otimizada conforme arquitetura técnica

-- 1. BACKUP DA TABELA FEEDBACK ORIGINAL
CREATE TABLE IF NOT EXISTS feedback_backup AS 
SELECT * FROM feedback;

-- 2. MIGRAR DADOS DA TABELA 'feedback' PARA 'feedbacks'
-- Converter feedbacks simples (useful: true/false) para novo formato
INSERT INTO feedbacks (article_id, type, user_id, content, created_at)
SELECT 
    article_id,
    CASE 
        WHEN useful = true THEN 'positive'::varchar
        WHEN useful = false THEN 'negative'::varchar
    END as type,
    NULL as user_id, -- feedbacks antigos não tinham user_id
    NULL as content, -- feedbacks antigos não tinham conteúdo
    created_at
FROM feedback
WHERE article_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. RECALCULAR CONTADORES DOS ARTIGOS
-- Atualizar contadores baseados na tabela feedbacks unificada
UPDATE articles SET 
    positive_feedbacks = (
        SELECT COUNT(*) 
        FROM feedbacks 
        WHERE feedbacks.article_id = articles.id 
        AND feedbacks.type = 'positive'
    ),
    negative_feedbacks = (
        SELECT COUNT(*) 
        FROM feedbacks 
        WHERE feedbacks.article_id = articles.id 
        AND feedbacks.type = 'negative'
    ),
    likes_count = (
        SELECT COUNT(*) 
        FROM feedbacks 
        WHERE feedbacks.article_id = articles.id 
        AND feedbacks.type = 'like'
    ),
    comments_count = (
        SELECT COUNT(*) 
        FROM comments 
        WHERE comments.article_id = articles.id
    );

-- 4. RECALCULAR TAXA DE APROVAÇÃO
UPDATE articles SET 
    approval_rate = CASE 
        WHEN (positive_feedbacks + negative_feedbacks) > 0 THEN
            ROUND((positive_feedbacks::numeric / (positive_feedbacks + negative_feedbacks)) * 100, 2)
        ELSE 0.0
    END;

-- 5. CRIAR ÍNDICES ESTRATÉGICOS PARA PERFORMANCE
-- Índice composto para consultas de feedback por artigo e tipo
CREATE INDEX IF NOT EXISTS idx_feedbacks_article_type 
ON feedbacks(article_id, type);

-- Índice para consultas por usuário
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id 
ON feedbacks(user_id) WHERE user_id IS NOT NULL;

-- Índice para consultas temporais
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at 
ON feedbacks(created_at DESC);

-- Índice composto para métricas de artigos
CREATE INDEX IF NOT EXISTS idx_articles_metrics 
ON articles(published, approval_rate DESC, positive_feedbacks DESC);

-- Índice para comentários por artigo
CREATE INDEX IF NOT EXISTS idx_comments_article_created 
ON comments(article_id, created_at DESC);

-- 6. REMOVER FUNÇÃO EXISTENTE E CRIAR NOVA VERSÃO OTIMIZADA
DROP FUNCTION IF EXISTS get_article_metrics(UUID);

CREATE OR REPLACE FUNCTION get_article_metrics(article_uuid UUID)
RETURNS TABLE(
    positive_count BIGINT,
    negative_count BIGINT,
    likes_count BIGINT,
    comments_count BIGINT,
    approval_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN f.type = 'positive' THEN 1 ELSE 0 END), 0) as positive_count,
        COALESCE(SUM(CASE WHEN f.type = 'negative' THEN 1 ELSE 0 END), 0) as negative_count,
        COALESCE(SUM(CASE WHEN f.type = 'like' THEN 1 ELSE 0 END), 0) as likes_count,
        COALESCE((SELECT COUNT(*) FROM comments WHERE article_id = article_uuid), 0) as comments_count,
        CASE 
            WHEN COALESCE(SUM(CASE WHEN f.type IN ('positive', 'negative') THEN 1 ELSE 0 END), 0) > 0 THEN
                ROUND((COALESCE(SUM(CASE WHEN f.type = 'positive' THEN 1 ELSE 0 END), 0)::numeric / 
                       COALESCE(SUM(CASE WHEN f.type IN ('positive', 'negative') THEN 1 ELSE 0 END), 1)) * 100, 2)
            ELSE 0.0
        END as approval_rate
    FROM feedbacks f
    WHERE f.article_id = article_uuid;
END;
$$ LANGUAGE plpgsql;

-- 7. REMOVER TRIGGERS EXISTENTES E CRIAR NOVOS
DROP TRIGGER IF EXISTS trigger_update_article_counters ON feedbacks;
DROP FUNCTION IF EXISTS update_article_counters();

CREATE OR REPLACE FUNCTION update_article_counters()
RETURNS TRIGGER AS $$
DECLARE
    target_article_id UUID;
BEGIN
    -- Determinar qual article_id usar (NEW para INSERT/UPDATE, OLD para DELETE)
    IF TG_OP = 'DELETE' THEN
        target_article_id := OLD.article_id;
    ELSE
        target_article_id := NEW.article_id;
    END IF;

    -- Atualizar contadores do artigo
    UPDATE articles SET 
        positive_feedbacks = (
            SELECT COUNT(*) 
            FROM feedbacks 
            WHERE article_id = target_article_id 
            AND type = 'positive'
        ),
        negative_feedbacks = (
            SELECT COUNT(*) 
            FROM feedbacks 
            WHERE article_id = target_article_id 
            AND type = 'negative'
        ),
        likes_count = (
            SELECT COUNT(*) 
            FROM feedbacks 
            WHERE article_id = target_article_id 
            AND type = 'like'
        ),
        approval_rate = CASE 
            WHEN (
                SELECT COUNT(*) 
                FROM feedbacks 
                WHERE article_id = target_article_id 
                AND type IN ('positive', 'negative')
            ) > 0 THEN
                ROUND((
                    SELECT COUNT(*)::numeric 
                    FROM feedbacks 
                    WHERE article_id = target_article_id 
                    AND type = 'positive'
                ) / (
                    SELECT COUNT(*) 
                    FROM feedbacks 
                    WHERE article_id = target_article_id 
                    AND type IN ('positive', 'negative')
                ) * 100, 2)
            ELSE 0.0
        END
    WHERE id = target_article_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar trigger na tabela feedbacks
CREATE TRIGGER trigger_update_article_counters
    AFTER INSERT OR UPDATE OR DELETE ON feedbacks
    FOR EACH ROW EXECUTE FUNCTION update_article_counters();

-- 8. TRIGGER PARA COMENTÁRIOS
DROP TRIGGER IF EXISTS trigger_update_comments_counter ON comments;
DROP FUNCTION IF EXISTS update_comments_counter();

CREATE OR REPLACE FUNCTION update_comments_counter()
RETURNS TRIGGER AS $$
DECLARE
    target_article_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_article_id := OLD.article_id;
    ELSE
        target_article_id := NEW.article_id;
    END IF;

    UPDATE articles SET 
        comments_count = (
            SELECT COUNT(*) 
            FROM comments 
            WHERE article_id = target_article_id
        )
    WHERE id = target_article_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comments_counter
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comments_counter();

-- 9. IMPLEMENTAR POLÍTICAS RLS ATUALIZADAS
-- Habilitar RLS na tabela feedbacks se não estiver habilitado
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Feedbacks são visíveis publicamente" ON feedbacks;
DROP POLICY IF EXISTS "Usuários podem criar feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Usuários podem atualizar próprios feedbacks" ON feedbacks;

-- Política para leitura pública de feedbacks
CREATE POLICY "Feedbacks são visíveis publicamente" ON feedbacks
    FOR SELECT USING (true);

-- Política para inserção de feedbacks (usuários autenticados e anônimos)
CREATE POLICY "Usuários podem criar feedbacks" ON feedbacks
    FOR INSERT WITH CHECK (true);

-- Política para atualização (apenas próprios feedbacks se tiver user_id)
CREATE POLICY "Usuários podem atualizar próprios feedbacks" ON feedbacks
    FOR UPDATE USING (
        user_id IS NULL OR 
        user_id = auth.uid()
    );

-- 10. CONCEDER PERMISSÕES NECESSÁRIAS
-- Garantir que as roles anon e authenticated tenham acesso
GRANT SELECT ON feedbacks TO anon, authenticated;
GRANT INSERT ON feedbacks TO anon, authenticated;
GRANT UPDATE ON feedbacks TO authenticated;
GRANT DELETE ON feedbacks TO authenticated;

-- Permissões para a função de métricas
GRANT EXECUTE ON FUNCTION get_article_metrics(UUID) TO anon, authenticated;

-- 11. VALIDAÇÃO DOS DADOS MIGRADOS
-- Verificar se a migração foi bem-sucedida
DO $$
DECLARE
    feedback_count INTEGER;
    feedbacks_count INTEGER;
    articles_with_counters INTEGER;
BEGIN
    SELECT COUNT(*) INTO feedback_count FROM feedback;
    SELECT COUNT(*) INTO feedbacks_count FROM feedbacks;
    SELECT COUNT(*) INTO articles_with_counters FROM articles WHERE positive_feedbacks > 0 OR negative_feedbacks > 0;
    
    RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA:';
    RAISE NOTICE 'Registros na tabela feedback original: %', feedback_count;
    RAISE NOTICE 'Registros na tabela feedbacks após migração: %', feedbacks_count;
    RAISE NOTICE 'Artigos com contadores atualizados: %', articles_with_counters;
END $$;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================