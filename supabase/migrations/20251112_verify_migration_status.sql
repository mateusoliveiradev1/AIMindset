-- Verificar status das migrações aplicadas
SELECT 
  table_name,
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'newsletter_logs'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.constraint_name;

-- Verificar triggers da tabela newsletter_subscribers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'newsletter_subscribers'
ORDER BY trigger_name;

-- Verificar dados atuais
SELECT 
  COUNT(*) as total_inscritos,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos,
  COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inativos
FROM newsletter_subscribers;

SELECT COUNT(*) as total_logs FROM newsletter_logs;

-- Verificar últimos logs
SELECT event_type, status, COUNT(*) as quantidade
FROM newsletter_logs
GROUP BY event_type, status
ORDER BY quantidade DESC;