-- 20260530000004_live_viewer_count_fix.sql
-- IMPROVED VIEWER COUNT TRACKING

-- Add current_viewers column
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS current_viewers INT DEFAULT 0 NOT NULL;

-- Update the viewer metrics function to be more robust
CREATE OR REPLACE FUNCTION public.update_live_viewer_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_session_id UUID;
    v_current_count INT;
BEGIN
    v_session_id := COALESCE(NEW.session_id, OLD.session_id);

    -- Calculate current concurrent count
    SELECT count(*) INTO v_current_count 
    FROM public.live_viewers 
    WHERE session_id = v_session_id AND left_at IS NULL;

    -- Update session metrics
    UPDATE public.live_sessions
    SET 
        current_viewers = v_current_count,
        peak_viewers = GREATEST(peak_viewers, v_current_count),
        total_viewers = CASE 
            WHEN TG_OP = 'INSERT' THEN total_viewers + 1 
            ELSE total_viewers 
        END
    WHERE id = v_session_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is correctly hooked
DROP TRIGGER IF EXISTS trg_update_live_viewer_metrics ON public.live_viewers;
CREATE TRIGGER trg_update_live_viewer_metrics
    AFTER INSERT OR UPDATE OF left_at ON public.live_viewers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_live_viewer_metrics();
