-- Função otimizada para buscar o próximo artigo agendado
-- Mobile-first: retorna apenas 1 registro, performance máxima
CREATE OR REPLACE FUNCTION get_next_scheduled_article()
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  excerpt text,
  featured_image text,
  scheduled_for timestamp with time zone,
  category_name text,
  author_name text,
  reading_time integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.featured_image,
    a.scheduled_for,
    c.name as category_name,
    u.name as author_name,
    a.reading_time
  FROM articles a
  JOIN categories c ON a.category_id = c.id
  JOIN users u ON a.author_id = u.id
  WHERE a.status = 'scheduled'
    AND a.scheduled_for > NOW()
  ORDER BY a.scheduled_for ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions para acesso mobile (anon e authenticated)
GRANT EXECUTE ON FUNCTION get_next_scheduled_article TO anon;
GRANT EXECUTE ON FUNCTION get_next_scheduled_article TO authenticated;