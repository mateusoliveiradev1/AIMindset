-- Migration: Fix trigger log_article_scheduling_change to ensure non-null user_id

-- Recreate trigger function to COALESCE user_id from auth.uid(), NEW.scheduled_by, or a default UUID
CREATE OR REPLACE FUNCTION public.log_article_scheduling_change()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Determine user_id with safe fallback
    v_user_id := COALESCE(auth.uid(), NEW.scheduled_by, '00000000-0000-0000-0000-000000000000'::uuid);

    -- Register log when schedule or status changes
    IF (OLD.scheduled_for IS DISTINCT FROM NEW.scheduled_for) OR 
       (OLD.scheduling_status IS DISTINCT FROM NEW.scheduling_status) THEN
        
        INSERT INTO public.article_scheduling_logs (
            article_id,
            user_id,
            action,
            old_scheduled_for,
            new_scheduled_for,
            old_status,
            new_status,
            reason,
            metadata,
            ip_address,
            user_agent
        ) VALUES (
            NEW.id,
            v_user_id,
            CASE 
                WHEN OLD.scheduling_status = 'draft' AND NEW.scheduling_status = 'scheduled' THEN 'schedule'
                WHEN NEW.scheduling_status = 'cancelled' THEN 'cancel'
                WHEN NEW.scheduling_status = 'published' THEN 'publish'
                WHEN NEW.scheduling_status = 'draft' THEN 'draft'
                ELSE 'unknown'
            END,
            OLD.scheduled_for,
            NEW.scheduled_for,
            OLD.scheduling_status,
            NEW.scheduling_status,
            NEW.scheduling_reason,
            jsonb_build_object(
                'session_id', current_setting('app.session_id', true),
                'user_email', (SELECT email FROM auth.users WHERE id = v_user_id)
            ),
            current_setting('app.ip_address', true)::INET,
            current_setting('app.user_agent', true)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is attached (idempotent re-create)
DROP TRIGGER IF EXISTS trigger_log_article_scheduling ON public.articles;
CREATE TRIGGER trigger_log_article_scheduling
    AFTER UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_article_scheduling_change();