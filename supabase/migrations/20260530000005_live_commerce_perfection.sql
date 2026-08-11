-- 20260530000005_live_commerce_perfection.sql
-- FINAL POLISH FOR LIVE STREAMING & REAL-TIME COMMERCE

-- 1. Add reaction count to sessions for efficient aggregation
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS total_reactions INT DEFAULT 0 NOT NULL;

-- 2. Function to update reaction count
CREATE OR REPLACE FUNCTION public.update_live_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.live_sessions
    SET total_reactions = total_reactions + 1
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_live_reaction_count ON public.live_reactions;
CREATE TRIGGER trg_update_live_reaction_count
    AFTER INSERT ON public.live_reactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_live_reaction_count();

-- 3. Enhance Security Policies for Suspended Users
-- (Missed in previous foundation for reactions)
DROP POLICY IF EXISTS "Users can react" ON public.live_reactions;
CREATE POLICY "Users can react" ON public.live_reactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (SELECT 1 FROM public.live_sessions WHERE id = session_id AND status = 'live')
        AND NOT public.is_user_suspended(auth.uid())
    );

-- 4. Cleanup Logic for Ghost Viewers
-- If a session ends, mark all viewers who didn't 'leave' as left
CREATE OR REPLACE FUNCTION public.cleanup_live_viewers()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ended' AND OLD.status = 'live' THEN
        UPDATE public.live_viewers
        SET left_at = now()
        WHERE session_id = NEW.id AND left_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cleanup_live_viewers ON public.live_sessions;
CREATE TRIGGER trg_cleanup_live_viewers
    AFTER UPDATE OF status ON public.live_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_live_viewers();

-- 5. Realtime for Clicks Analytics (Optional but nice for visual feedback)
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_commerce_clicks;
