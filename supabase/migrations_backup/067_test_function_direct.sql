-- Teste direto da função test_alert_system

-- Primeiro, garantir que há um assinante ativo
INSERT INTO alert_subscriptions (email, is_active) 
VALUES ('test@example.com', true)
ON CONFLICT (email) DO UPDATE SET is_active = true;

-- Testar a função
SELECT test_alert_system('test_direct', 'Teste direto da função via SQL') as test_result;