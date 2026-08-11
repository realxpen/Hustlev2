-- 20260528000004_fix_notification_triggers.sql

-- 1. Ensure the trigger exists for app_events to process downstream effects
DROP TRIGGER IF EXISTS tr_process_app_event_downstream ON public.app_events;
CREATE TRIGGER tr_process_app_event_downstream
AFTER INSERT ON public.app_events
FOR EACH ROW EXECUTE PROCEDURE public.process_app_event_downstream();

-- 2. Relax deduplication for wallet notifications specifically
-- We want a notification for EVERY transaction, even if they happen quickly.
CREATE OR REPLACE FUNCTION public.create_notification(
    p_recipient_id UUID,
    p_actor_id UUID,
    p_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_entity_type TEXT DEFAULT NULL,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
    v_recent_exists BOOLEAN;
BEGIN
    -- Don't notify yourself
    IF p_recipient_id = p_actor_id THEN
        RETURN NULL;
    END IF;

    -- Basic deduplication: avoid exact same notification in the last 1 minute
    -- EXCEPT for 'wallet' notifications which should always go through
    IF p_type != 'wallet' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.notifications
            WHERE recipient_id = p_recipient_id
              AND actor_id IS NOT DISTINCT FROM p_actor_id
              AND type = p_type
              AND entity_id IS NOT DISTINCT FROM p_entity_id
              AND created_at > now() - interval '1 minute'
        ) INTO v_recent_exists;

        IF v_recent_exists THEN
            RETURN NULL;
        END IF;
    END IF;

    INSERT INTO public.notifications (recipient_id, actor_id, type, entity_id, entity_type, message)
    VALUES (p_recipient_id, p_actor_id, p_type, p_entity_id, p_entity_type, p_message)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;
