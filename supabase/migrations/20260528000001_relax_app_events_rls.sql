-- 20260528000001_relax_app_events_rls.sql
DROP POLICY IF EXISTS "Users can create events if they are the actor" ON public.app_events;
DROP POLICY IF EXISTS "Users can create events if they are the actor or unauthenticated" ON public.app_events;
DROP POLICY IF EXISTS "Users can insert app_events" ON public.app_events;

CREATE POLICY "Users can insert app_events"
    ON public.app_events FOR INSERT
    WITH CHECK (true); -- Allow all inserts, we trust the client for these analytics/event emits, or rely on downstream validation.
