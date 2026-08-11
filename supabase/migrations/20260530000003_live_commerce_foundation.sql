-- 20260530000003_live_commerce_foundation.sql
-- COMPREHENSIVE LIVE STREAMING & REAL-TIME COMMERCE ECOSYSTEM

-- 1. Create Live Sessions Table (Step 1)
CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) >= 3),
    description TEXT,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    peak_viewers INT DEFAULT 0 NOT NULL,
    total_viewers INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Live Sessions
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Create Live Viewers Tracking (Step 3)
CREATE TABLE IF NOT EXISTS public.live_viewers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(session_id, user_id, joined_at)
);

-- Enable RLS for Live Viewers
ALTER TABLE public.live_viewers ENABLE ROW LEVEL SECURITY;

-- 3. Create Live Chat System (Step 4)
CREATE TABLE IF NOT EXISTS public.live_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL CHECK (char_length(message) >= 1),
    is_moderated BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Live Messages
ALTER TABLE public.live_messages ENABLE ROW LEVEL SECURITY;

-- 4. Create Live Reactions System (Step 5)
CREATE TABLE IF NOT EXISTS public.live_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT CHECK (reaction_type IN ('like', 'fire', 'clap', 'heart')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Live Reactions
ALTER TABLE public.live_reactions ENABLE ROW LEVEL SECURITY;

-- 5. Create Pinned Commerce Items (Step 6)
CREATE TABLE IF NOT EXISTS public.live_pinned_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
    listing_id UUID NOT NULL, -- Flexible ID for Gig, Product, Service, Training
    listing_type TEXT CHECK (listing_type IN ('gig', 'product', 'service', 'training')) NOT NULL,
    pinned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, listing_id)
);

-- Enable RLS for Pinned Items
ALTER TABLE public.live_pinned_items ENABLE ROW LEVEL SECURITY;

-- 6. Create Live Commerce Clicks Analytics (Step 7)
CREATE TABLE IF NOT EXISTS public.live_commerce_clicks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    listing_id UUID NOT NULL,
    listing_type TEXT NOT NULL,
    click_type TEXT DEFAULT 'view' CHECK (click_type IN ('view', 'purchase_intent')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Analytics
ALTER TABLE public.live_commerce_clicks ENABLE ROW LEVEL SECURITY;


-- 7. LOGIC: AUTOMATED VIEWER COUNTS & SESSION LIFECYCLE (Step 2 & 3)

-- Function to handle starting/ending sessions
CREATE OR REPLACE FUNCTION public.handle_live_session_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
    -- Only Hustlers or Agents can host
    IF NEW.status = 'live' AND OLD.status = 'scheduled' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = NEW.host_id 
            AND (role = 'hustler' OR is_verified = true OR is_agent = true)
        ) THEN
            RAISE EXCEPTION 'Only verified Hustlers or verified Agents can initiate live sessions.';
        END IF;

        -- Prevent multiple active lives
        IF EXISTS (SELECT 1 FROM public.live_sessions WHERE host_id = NEW.host_id AND status = 'live' AND id <> NEW.id) THEN
            RAISE EXCEPTION 'Host already has an active live session.';
        END IF;

        NEW.started_at = now();
        
        -- Trigger notifications for followers (Step 8)
        PERFORM public.create_notification(
            p.follower_id,
            NEW.host_id,
            'live_started',
            NEW.id,
            'live_session',
            'Creator you follow is now LIVE: ' || NEW.title
        )
        FROM public.follows p
        WHERE p.following_id = NEW.host_id;

    ELSIF NEW.status = 'ended' AND OLD.status = 'live' THEN
        NEW.ended_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_live_session_lifecycle ON public.live_sessions;
CREATE TRIGGER trg_live_session_lifecycle
    BEFORE UPDATE OF status ON public.live_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_live_session_lifecycle();


-- Function to update viewer metrics on join/leave
CREATE OR REPLACE FUNCTION public.update_live_viewer_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Increment total viewers
        UPDATE public.live_sessions
        SET total_viewers = total_viewers + 1
        WHERE id = NEW.session_id;
    END IF;

    -- Recalculate peak concurrent viewers (efficiently for small/mid scale)
    UPDATE public.live_sessions
    SET peak_viewers = GREATEST(peak_viewers, (
        SELECT count(*) FROM public.live_viewers 
        WHERE session_id = NEW.session_id AND left_at IS NULL
    ))
    WHERE id = NEW.session_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_live_viewer_metrics ON public.live_viewers;
CREATE TRIGGER trg_update_live_viewer_metrics
    AFTER INSERT OR UPDATE OF left_at ON public.live_viewers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_live_viewer_metrics();


-- 8. SECURITY POLICIES (RLS)

-- Live Sessions
DROP POLICY IF EXISTS "Anyone can view live sessions" ON public.live_sessions;
CREATE POLICY "Anyone can view live sessions" ON public.live_sessions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hustlers can manage their own sessions" ON public.live_sessions;
CREATE POLICY "Hustlers can manage their own sessions" ON public.live_sessions
    FOR ALL USING (auth.uid() = host_id);

-- Live Viewers
DROP POLICY IF EXISTS "Viewers can see concurrent load" ON public.live_viewers;
CREATE POLICY "Viewers can see concurrent load" ON public.live_viewers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can track their own presence" ON public.live_viewers;
CREATE POLICY "Users can track their own presence" ON public.live_viewers
    FOR ALL USING (auth.uid() = user_id);

-- Live Messages
DROP POLICY IF EXISTS "Anyone can read live chat" ON public.live_messages;
CREATE POLICY "Anyone can read live chat" ON public.live_messages
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can chat" ON public.live_messages;
CREATE POLICY "Authenticated users can chat" ON public.live_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (SELECT 1 FROM public.live_sessions WHERE id = session_id AND status = 'live')
        AND NOT public.is_user_suspended(auth.uid())
    );

-- Live Reactions
DROP POLICY IF EXISTS "Anyone can see reaction bursts" ON public.live_reactions;
CREATE POLICY "Anyone can see reaction bursts" ON public.live_reactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can react" ON public.live_reactions;
CREATE POLICY "Users can react" ON public.live_reactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (SELECT 1 FROM public.live_sessions WHERE id = session_id AND status = 'live')
    );

-- Pinned Items
DROP POLICY IF EXISTS "Anyone can see pinned listings" ON public.live_pinned_items;
CREATE POLICY "Anyone can see pinned listings" ON public.live_pinned_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hosts can pin items" ON public.live_pinned_items;
CREATE POLICY "Hosts can pin items" ON public.live_pinned_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.live_sessions WHERE id = session_id AND host_id = auth.uid())
    );

-- Analytics
DROP POLICY IF EXISTS "Hosts can view their session analytics" ON public.live_commerce_clicks;
CREATE POLICY "Hosts can view their session analytics" ON public.live_commerce_clicks
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.live_sessions WHERE id = session_id AND host_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can contribute to analytics" ON public.live_commerce_clicks;
CREATE POLICY "Users can contribute to analytics" ON public.live_commerce_clicks
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);


-- 9. Realtime Service Configuration (Step 9)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'live_sessions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'live_viewers') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_viewers;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'live_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'live_reactions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_reactions;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'live_pinned_items') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_pinned_items;
    END IF;
END $$;
