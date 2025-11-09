-- Disparar NOTIFY em canal 'article_published' quando artigos forem publicados

-- Criar função auxiliar para notificar publicação (sem bloco DO)
CREATE OR REPLACE FUNCTION public.notify_article_published()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
DECLARE
  payload jsonb;
BEGIN
  IF (NEW.published = TRUE OR NEW.scheduling_status = 'published') THEN
    payload := jsonb_build_object(
      'id', NEW.id,
      'title', NEW.title,
      'slug', NEW.slug,
      'published', NEW.published,
      'scheduling_status', NEW.scheduling_status,
      'updated_at', NEW.updated_at
    );
    PERFORM pg_notify('article_published', payload::text);
  END IF;
  RETURN NEW;
END;
$func$;

-- Remover trigger se existir e criar novamente
DROP TRIGGER IF EXISTS trg_notify_article_published ON public.articles;
CREATE TRIGGER trg_notify_article_published
  AFTER UPDATE ON public.articles
  FOR EACH ROW
  WHEN (OLD.published IS DISTINCT FROM NEW.published OR OLD.scheduling_status IS DISTINCT FROM NEW.scheduling_status)
  EXECUTE PROCEDURE public.notify_article_published();