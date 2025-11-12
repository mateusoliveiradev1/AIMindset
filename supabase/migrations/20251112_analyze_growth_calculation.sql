-- Verificar dados do inscrito warface01031999@gmail.com e calcular crescimento real
SELECT 
  email,
  status,
  subscribed_at,
  created_at,
  updated_at,
  DATE_TRUNC('month', subscribed_at) as mes_inscricao,
  DATE_TRUNC('month', CURRENT_DATE) as mes_atual,
  CASE 
    WHEN subscribed_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' THEN 'Este Mês'
    WHEN subscribed_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 months' THEN 'Mês Passado'
    ELSE 'Mais Antigo'
  END as periodo_inscricao
FROM newsletter_subscribers 
WHERE email = 'warface01031999@gmail.com';

-- Calcular crescimento mensal corretamente
WITH inscricoes_por_mes AS (
  SELECT 
    DATE_TRUNC('month', subscribed_at) as mes,
    COUNT(*) as novos_inscritos
  FROM newsletter_subscribers 
  WHERE status = 'active'
  GROUP BY DATE_TRUNC('month', subscribed_at)
),
meses AS (
  SELECT 
    mes,
    novos_inscritos,
    SUM(novos_inscritos) OVER (ORDER BY mes) as total_acumulado
  FROM inscricoes_por_mes
)
SELECT 
  mes,
  novos_inscritos,
  total_acumulado,
  LAG(total_acumulado) OVER (ORDER BY mes) as total_mes_anterior,
  CASE 
    WHEN LAG(total_acumulado) OVER (ORDER BY mes) > 0 THEN
      ROUND(((total_acumulado - LAG(total_acumulado) OVER (ORDER BY mes)) / LAG(total_acumulado) OVER (ORDER BY mes) * 100)::numeric, 2)
    ELSE 0
  END as crescimento_percentual
FROM meses
ORDER BY mes DESC;