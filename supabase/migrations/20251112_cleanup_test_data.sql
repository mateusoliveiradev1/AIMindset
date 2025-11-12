-- Limpar logs de newsletter (exceto do email warface01031999@gmail.com)
DELETE FROM newsletter_logs 
WHERE subscriber_id NOT IN (
  SELECT id FROM newsletter_subscribers 
  WHERE email = 'warface01031999@gmail.com'
);

-- Remover inscritos de teste (exceto warface01031999@gmail.com)
DELETE FROM newsletter_subscribers 
WHERE email != 'warface01031999@gmail.com';

-- Verificar dados restantes
SELECT 
  s.email,
  s.status as subscriber_status,
  s.created_at as subscriber_created,
  COUNT(l.id) as total_logs
FROM newsletter_subscribers s
LEFT JOIN newsletter_logs l ON s.id = l.subscriber_id
WHERE s.email = 'warface01031999@gmail.com'
GROUP BY s.email, s.status, s.created_at;