-- Verificar quantidade de logs e inscritos
SELECT 
  'Total inscritos' as tipo,
  COUNT(*) as quantidade
FROM newsletter_subscribers
WHERE status = 'active'

UNION ALL

SELECT 
  'Total logs' as tipo,
  COUNT(*) as quantidade
FROM newsletter_logs;

-- Ver distribuição de logs por tipo de evento
SELECT 
  event_type,
  COUNT(*) as quantidade,
  MIN(created_at) as primeiro_evento,
  MAX(created_at) as ultimo_evento
FROM newsletter_logs
GROUP BY event_type
ORDER BY quantidade DESC;

-- Ver inscritos por mês
SELECT 
  DATE_TRUNC('month', created_at) as mes,
  COUNT(*) as novos_inscritos
FROM newsletter_subscribers
WHERE status = 'active'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;