-- 20260523000001_app_events_insert_policy.sql
DROP POLICY IF EXISTS "Users can create events if they are the actor" ON public.app_events;

CREATE POLICY "Users can create events if they are the actor or unauthenticated"
    ON public.app_events FOR INSERT
    WITH CHECK (auth.uid() = actor_id OR auth.uid() IS NULL);
