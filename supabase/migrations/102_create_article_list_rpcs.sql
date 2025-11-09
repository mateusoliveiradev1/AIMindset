-- Migration: Create simple listing/search RPCs for articles

-- get_recent_articles: returns recent articles as jsonb array
DROP FUNCTION IF EXISTS public.get_recent_articles(integer);
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
  SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC), '[]'::jsonb)
    INTO v_items
    FROM public.articles a
   LIMIT COALESCE(limit_count, 20);

  RETURN v_items;
END;
$$;

REVOKE ALL ON FUNCTION public.get_recent_articles(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_recent_articles(integer) TO authenticated, service_role, postgres;

-- search_articles_by_title: case-insensitive title/slug search
DROP FUNCTION IF EXISTS public.search_articles_by_title(text, integer);
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

  SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.updated_at DESC, a.created_at DESC), '[]'::jsonb)
    INTO v_items
    FROM public.articles a
   WHERE a.title ILIKE '%' || query || '%'
      OR a.slug ILIKE '%' || query || '%'
   LIMIT COALESCE(limit_count, 20);

  RETURN v_items;
END;
$$;

REVOKE ALL ON FUNCTION public.search_articles_by_title(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_articles_by_title(text, integer) TO authenticated, service_role, postgres;