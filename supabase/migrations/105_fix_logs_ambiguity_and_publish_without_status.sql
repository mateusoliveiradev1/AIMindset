-- Migration: Fix ambiguity in get_system_logs and remove 'status' from publish_article_by_id

-- Redefine get_system_logs to qualify parameter references to avoid ambiguity
DROP FUNCTION IF EXISTS public.get_system_logs(text, integer, text);
CREATE OR REPLACE FUNCTION public.get_system_logs(
  type text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  search text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_logs jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(to_jsonb(s.*)), '[]'::jsonb) INTO v_logs
    FROM (
      SELECT sl.*
        FROM public.system_logs sl
       WHERE (get_system_logs.type IS NULL OR sl.type = get_system_logs.type)
         AND (
           get_system_logs.search IS NULL OR length(trim(get_system_logs.search)) = 0 OR
           sl.message ILIKE '%' || get_system_logs.search || '%' OR
           sl.type ILIKE '%' || get_system_logs.search || '%' OR
           sl.context::text ILIKE '%' || get_system_logs.search || '%'
         )
       ORDER BY sl.created_at DESC
       LIMIT COALESCE(get_system_logs.limit_count, 50)
    ) s;

  RETURN v_logs;
END;
$$;

REVOKE ALL ON FUNCTION public.get_system_logs(text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_system_logs(text, integer, text) TO authenticated, service_role, postgres;

-- Redefine publish_article_by_id to avoid non-existent 'status' column
DROP FUNCTION IF EXISTS public.publish_article_by_id(uuid);
CREATE OR REPLACE FUNCTION public.publish_article_by_id(article_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer := 0;
  v_article jsonb;
  v_msg text;
BEGIN
  UPDATE public.articles a
     SET published = true,
         scheduling_status = 'published',
         published_at = (now() at time zone 'utc'),
         updated_at = (now() at time zone 'utc')
   WHERE a.id = publish_article_by_id.article_id
     AND COALESCE(a.published, false) = false;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  SELECT to_jsonb(a) INTO v_article
    FROM public.articles a
   WHERE a.id = publish_article_by_id.article_id;

  v_msg := CASE WHEN v_updated > 0 THEN 'Article published manually' ELSE 'Article publish attempted but unchanged' END;

  -- Audit log
  INSERT INTO public.system_logs(type, message, context)
  VALUES ('publish', v_msg, jsonb_build_object('article_id', article_id, 'updated', v_updated, 'timestamp', now()));

  RETURN jsonb_build_object('success', (v_updated > 0), 'updated', v_updated, 'article', v_article);
END;
$$;

REVOKE ALL ON FUNCTION public.publish_article_by_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_article_by_id(uuid) TO authenticated, service_role, postgres;