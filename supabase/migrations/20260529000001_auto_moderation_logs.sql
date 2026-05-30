-- 20260529000001_auto_moderation_logs.sql
-- AUTOMATIC AUDIT LOGGING TRIGGERS FOR THE TRUST AND SAFETY ENGINE

-- 1. Helper function to log events to moderation_logs
CREATE OR REPLACE FUNCTION public.log_moderation_event(
    p_moderator_id UUID,
    p_action_type TEXT,
    p_target_id UUID,
    p_target_type TEXT,
    p_reason TEXT,
    p_old_state JSONB,
    p_new_state JSONB
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.moderation_logs (
        moderator_id,
        action_type,
        target_id,
        target_type,
        reason,
        old_state,
        new_state
    ) VALUES (
        p_moderator_id,
        p_action_type,
        p_target_id,
        p_target_type,
        p_reason,
        p_old_state,
        p_new_state
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on report creation
CREATE OR REPLACE FUNCTION public.trigger_on_report_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Log report incident
    PERFORM public.log_moderation_event(
        NEW.reporter_id,
        'incident_reported',
        NEW.target_id,
        NEW.target_type,
        COALESCE(NEW.reason, 'No reason specified') || ': ' || COALESCE(NEW.details, ''),
        NULL,
        json_build_object('report_id', NEW.id, 'status', NEW.status)::jsonb
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_report_created_log ON public.reports;
CREATE TRIGGER trg_report_created_log
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE PROCEDURE public.trigger_on_report_created();

-- 3. Trigger on booking escrow changes and status changes
CREATE OR REPLACE FUNCTION public.trigger_on_booking_changed()
RETURNS TRIGGER AS $$
DECLARE
    v_action TEXT;
    v_reason TEXT;
BEGIN
    IF OLD.escrow_status IS DISTINCT FROM NEW.escrow_status THEN
        v_action := 'escrow_status_change';
        v_reason := 'Escrow status moved from ' || COALESCE(OLD.escrow_status, 'none') || ' to ' || COALESCE(NEW.escrow_status, 'none');
        
        PERFORM public.log_moderation_event(
            auth.uid(),
            v_action,
            NEW.id,
            'booking',
            v_reason,
            json_build_object('escrow_status', OLD.escrow_status, 'status', OLD.status)::jsonb,
            json_build_object('escrow_status', NEW.escrow_status, 'status', NEW.status)::jsonb
        );
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
        v_action := 'booking_status_change';
        v_reason := 'Booking transitioned from ' || COALESCE(OLD.status, 'pending') || ' to ' || COALESCE(NEW.status, 'pending');
        
        PERFORM public.log_moderation_event(
            auth.uid(),
            v_action,
            NEW.id,
            'booking',
            v_reason,
            json_build_object('status', OLD.status)::jsonb,
            json_build_object('status', NEW.status)::jsonb
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_booking_changed_log ON public.bookings;
CREATE TRIGGER trg_booking_changed_log
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE PROCEDURE public.trigger_on_booking_changed();

-- 4. Trigger on dispute status changes (where report targets a booking)
CREATE OR REPLACE FUNCTION public.trigger_on_dispute_changed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.target_type = 'booking' AND OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM public.log_moderation_event(
            auth.uid(),
            'dispute_resolved',
            NEW.target_id,
            'booking',
            'Dispute status set to ' || NEW.status || ' (Report ' || NEW.id || ')',
            json_build_object('dispute_status', OLD.status)::jsonb,
            json_build_object('dispute_status', NEW.status)::jsonb
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_dispute_changed_log ON public.reports;
CREATE TRIGGER trg_dispute_changed_log
AFTER UPDATE ON public.reports
FOR EACH ROW EXECUTE PROCEDURE public.trigger_on_dispute_changed();
