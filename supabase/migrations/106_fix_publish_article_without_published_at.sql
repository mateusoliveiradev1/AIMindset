-- Migration: Update publish_article_by_id to avoid non-existent published_at column

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
  v_now timestamptz := (now() at time zone 'utc');
BEGIN
  UPDATE public.articles a
     SET published = true,
         scheduling_status = 'published',
         updated_at = v_now,
         original_publish_date = COALESCE(a.original_publish_date, v_now)
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