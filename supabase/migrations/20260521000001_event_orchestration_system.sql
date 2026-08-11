-- 20260521000001_event_orchestration_system.sql
-- SYSTEM INTEGRATION & EVENT ORCHESTRATION LAYER

-- 1. Create app_events table (The Source of Truth for everything that happens)
CREATE TABLE IF NOT EXISTS public.app_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type TEXT NOT NULL, -- e.g., 'post_liked', 'booking_completed'
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- optional, if there is a recipient
    entity_id UUID, -- ID of the related object (post, booking, etc.)
    entity_type TEXT, -- 'post', 'booking', 'listing', etc.
    payload JSONB DEFAULT '{}'::jsonb, -- dynamic data
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create activity_log table (Flattened, unified social proof feed)
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.app_events(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create analytics_signals table (For scoring and discovery)
CREATE TABLE IF NOT EXISTS public.analytics_signals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    signal_type TEXT NOT NULL, -- 'view', 'engagement', 'conversion'
    weight NUMERIC DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Events are system-level mostly, but actors/targets can view them
DROP POLICY IF EXISTS "Users can create events if they are the actor" ON public.app_events;
CREATE POLICY "Users can create events if they are the actor"
    ON public.app_events FOR INSERT
    WITH CHECK (auth.uid() = actor_id);

DROP POLICY IF EXISTS "Users can view events they are part of" ON public.app_events;
CREATE POLICY "Users can view events they are part of"
    ON public.app_events FOR SELECT
    USING (auth.uid() = actor_id OR auth.uid() = target_id);

DROP POLICY IF EXISTS "Activity log is visible to followers/involved" ON public.activity_log;
CREATE POLICY "Activity log is visible to followers/involved"
    ON public.activity_log FOR SELECT
    USING (true); -- Public acts of social proof

-- Realtime Configuration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'app_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_events;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'activity_log'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
    END IF;
END $$;

-- 4. Unified Event Processor (Trigger on Event Creation)
-- This function can be expanded for server-side side-effects
CREATE OR REPLACE FUNCTION public.process_app_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically log certain events to notifications
    IF (TG_OP = 'INSERT') THEN
        -- Logic for notifications can live here or in an Edge Function
        -- For now, we allow the client-side orchestrator to handle UI sync
        
        -- Update processed status
        NEW.is_processed := true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_event_created ON public.app_events;
CREATE TRIGGER on_event_created
BEFORE INSERT ON public.app_events
FOR EACH ROW EXECUTE PROCEDURE public.process_app_event();
