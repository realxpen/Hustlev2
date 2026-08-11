-- =========================================================================
-- Hustle Notification Database System Migration
-- Designed for real-time delivery, high throughput, and granular preference gating
-- =========================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. NOTIFICATION_PREFERENCES TABLE
-- Allows each user profile to configure customized channels and delivery bounds
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Channel specific preferences (Intent-based granular controls)
    messaging_enabled BOOLEAN DEFAULT true NOT NULL,
    booking_enabled BOOLEAN DEFAULT true NOT NULL,
    marketing_enabled BOOLEAN DEFAULT true NOT NULL,
    payment_enabled BOOLEAN DEFAULT true NOT NULL,
    trust_enabled BOOLEAN DEFAULT true NOT NULL,
    engagement_enabled BOOLEAN DEFAULT true NOT NULL,
    agent_enabled BOOLEAN DEFAULT true NOT NULL,
    
    -- Delivery transport pathways
    email_enabled BOOLEAN DEFAULT true NOT NULL,
    push_enabled BOOLEAN DEFAULT true NOT NULL,
    sms_enabled BOOLEAN DEFAULT false NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT unique_profile_preferences UNIQUE (profile_id)
);

-- 2. NOTIFICATION_EVENTS TABLE
-- Scalable log partition for tracking all triggering actions before processing
CREATE TABLE IF NOT EXISTS public.notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- e.g., 'booking.updated', 'message.sent', 'payment.released'
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    entity_id UUID, -- References booking_id, message_id, comment_id, etc.
    entity_type VARCHAR(50), -- e.g., 'booking', 'message', 'payment', 'comment', 'review'
    
    -- Extensible payload to support multiple data structures and auditing logs
    payload JSONB DEFAULT '{}'::jsonb NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. NOTIFICATIONS TABLE (Enhanced / Augmented schema)
-- We will add preferences and event linkage checks while preserving current operations safely.
CREATE TABLE IF NOT EXISTS public.notifications_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.notification_events(id) ON DELETE SET NULL, -- Link notification to source event trace
    
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- matching 'booking_new', 'message', 'booking_accepted', etc.
    entity_id UUID,
    entity_type VARCHAR(50),
    
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' NOT NULL CONSTRAINT notification_priority_check CHECK (priority IN ('high', 'normal', 'low')),
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Tracking statuses per channel delivery
    delivery_channels JSONB DEFAULT '{"push": "pending", "email": "pending"}'::jsonb NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- INDEXES FOR HIGH-THROUGHPUT REAL-TIME ACCESS
-- =========================================================================

-- 1. Faster queries for user's notification list sorted chronologically
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_chronological
ON public.notifications_v2 (recipient_id, created_at DESC);

-- 2. Fast retrieval of unread alerts for badging logic
CREATE INDEX IF NOT EXISTS idx_notifications_unread_lookup
ON public.notifications_v2 (recipient_id)
WHERE is_read = false;

-- 3. Accelerates search of events by type and date
CREATE INDEX IF NOT EXISTS idx_notification_events_routing
ON public.notification_events (event_type, created_at DESC);

-- 4. Fast preference checks for user profile routing
CREATE INDEX IF NOT EXISTS idx_notification_preferences_profile
ON public.notification_preferences (profile_id);

-- =========================================================================
-- DATABASE FUNCTIONS & TRIGGERS FOR THE NOTIFICATION ENGINE
-- =========================================================================

-- Automatically create default notification preferences for newly created/registered profiles
CREATE OR REPLACE FUNCTION public.handle_new_profile_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_preferences (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_create_profile_preferences ON public.profiles;
CREATE TRIGGER tr_create_profile_preferences
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_profile_preferences();

-- Smart routing function: Resolves user preferences before creating high-volume notifications
CREATE OR REPLACE FUNCTION public.dispatch_notification_with_preferences(
    p_recipient_id UUID,
    p_actor_id UUID,
    p_type VARCHAR(50),
    p_message TEXT,
    p_entity_id UUID,
    p_entity_type VARCHAR(50),
    p_priority VARCHAR(20) DEFAULT 'normal',
    p_event_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pref_messaging BOOLEAN;
    v_pref_booking BOOLEAN;
    v_pref_marketing BOOLEAN;
    v_pref_payment BOOLEAN;
    v_pref_trust BOOLEAN;
    v_pref_engagement BOOLEAN;
    v_pref_agent BOOLEAN;
    v_id UUID;
BEGIN
    -- Avoid self-notification
    IF p_recipient_id = p_actor_id THEN
        RETURN NULL;
    END IF;

    -- Fetch recipient configuration
    SELECT 
        messaging_enabled, booking_enabled, marketing_enabled, payment_enabled, trust_enabled, engagement_enabled, agent_enabled
    INTO 
        v_pref_messaging, v_pref_booking, v_pref_marketing, v_pref_payment, v_pref_trust, v_pref_engagement, v_pref_agent
    FROM public.notification_preferences
    WHERE profile_id = p_recipient_id;

    -- Fallback default values if preferences are missing
    IF v_pref_messaging IS NULL THEN v_pref_messaging := true; END IF;
    IF v_pref_booking IS NULL THEN v_pref_booking := true; END IF;
    IF v_pref_marketing IS NULL THEN v_pref_marketing := true; END IF;
    IF v_pref_payment IS NULL THEN v_pref_payment := true; END IF;
    IF v_pref_trust IS NULL THEN v_pref_trust := true; END IF;
    IF v_pref_engagement IS NULL THEN v_pref_engagement := true; END IF;
    IF v_pref_agent IS NULL THEN v_pref_agent := true; END IF;

    -- Gate based on user preferences
    IF p_type IN ('message', 'reply', 'mention') AND NOT v_pref_messaging THEN
        RETURN NULL;
    END IF;
    IF p_type IN ('booking_new', 'booking_accepted', 'booking_completed') AND NOT v_pref_booking THEN
        RETURN NULL;
    END IF;
    IF p_type IN ('milestone_released', 'milestone_delivered', 'wallet') AND NOT v_pref_payment THEN
        RETURN NULL;
    END IF;
    IF p_type IN ('like', 'comment', 'repost', 'follow') AND NOT v_pref_engagement THEN
        RETURN NULL;
    END IF;
    IF p_type IN ('agent_approved', 'agent_rejected', 'agent_request') AND NOT v_pref_agent THEN
        RETURN NULL;
    END IF;

    -- Insert into notifications table
    INSERT INTO public.notifications_v2 (
        recipient_id, event_id, actor_id, type, entity_id, entity_type, message, priority
    )
    VALUES (
        p_recipient_id, p_event_id, p_actor_id, p_type, p_entity_id, p_entity_type, p_message, p_priority
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Enable Row Level Security (RLS) policies for secure multi-tenant access
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_v2 ENABLE ROW LEVEL SECURITY;

-- Preference Policies
CREATE POLICY "Users can manage their own notification preferences"
ON public.notification_preferences FOR ALL
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- Event Policies
CREATE POLICY "Users can view relevant events"
ON public.notification_events FOR SELECT
USING (auth.uid() = actor_id OR auth.uid() IN (
    -- Allow users related to the entity to view the events (e.g., booking owners)
    SELECT recipient_id FROM public.notifications_v2 WHERE event_id = notification_events.id
));

-- Notifications V2 Policies
CREATE POLICY "Users can select their own V2 notifications"
ON public.notifications_v2 FOR SELECT
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own V2 read markers"
ON public.notifications_v2 FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "System can append V2 notifications"
ON public.notifications_v2 FOR INSERT
WITH CHECK (true);

-- Enable Supabase Realtime publication sync for Notifications V2
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications_v2;
            ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_preferences;
        EXCEPTION WHEN OTHERS THEN 
            RAISE NOTICE 'Could not add notification tables to publication: %', SQLERRM;
        END;
    END IF;
END;
$$;
