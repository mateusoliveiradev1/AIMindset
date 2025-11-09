-- Migration: Fix ORDER BY + LIMIT semantics in article list RPCs

-- Redefine get_recent_articles to order and limit via subselect
CREATE OR REPLACE FUNCTION public.get_recent_articles(
  limit_count integer DEFAULT 20
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(to_jsonb(s.*)), '[]'::jsonb)
    INTO v_items
    FROM (
      SELECT a.*
        FROM public.articles a
       ORDER BY a.created_at DESC
       LIMIT COALESCE(limit_count, 20)
    ) s;

  RETURN v_items;
END;
$$;

-- Redefine search_articles_by_title to order and limit via subselect
CREATE OR REPLACE FUNCTION public.search_articles_by_title(
  query text,
  limit_count integer DEFAULT 20
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items jsonb;
BEGIN
  IF query IS NULL OR length(trim(query)) = 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(s.*)), '[]'::jsonb)
    INTO v_items
    FROM (
      SELECT a.*
        FROM public.articles a
       WHERE a.title ILIKE '%' || query || '%'
          OR a.slug ILIKE '%' || query || '%'
       ORDER BY a.updated_at DESC, a.created_at DESC
       LIMIT COALESCE(limit_count, 20)
    ) s;

  RETURN v_items;
END;
$$;