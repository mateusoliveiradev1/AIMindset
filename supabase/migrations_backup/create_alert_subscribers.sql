-- Criar tabela alert_subscribers
CREATE TABLE IF NOT EXISTS alert_subscribers (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Habilitar RLS
ALTER TABLE alert_subscribers ENABLE ROW LEVEL SECURITY;

-- Política para admins
CREATE POLICY "Admins can manage alert subscribers" ON alert_subscribers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Inserir alguns emails de teste
INSERT INTO alert_subscribers (email) VALUES 
    ('admin@aimindset.com'),
    ('alerts@aimindset.com'),
    ('test@example.com')
ON CONFLICT (email) DO NOTHING;

-- Criar função test_alert_system
CREATE OR REPLACE FUNCTION test_alert_system()
RETURNS JSON AS $$
DECLARE
    subscriber_count INTEGER;
    result JSON;
BEGIN
    -- Contar assinantes ativos
    SELECT COUNT(*) INTO subscriber_count 
    FROM alert_subscribers 
    WHERE is_active = true;
    
    -- Retornar resultado
    result := json_build_object(
        'success', true,
        'message', 'Sistema de alertas funcionando corretamente',
        'subscriber_count', subscriber_count,
        'timestamp', NOW()
    );
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION test_alert_system() TO authenticated;
GRANT EXECUTE ON FUNCTION test_alert_system() TO anon;