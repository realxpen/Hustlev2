-- =========================================================================
-- Hustle Messaging System Schema Migration
-- Designed for real-time delivery, millions of messages, and booking integrations.
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150),
    avatar_url TEXT,
    booking_id UUID, -- References booking table
    is_group BOOLEAN DEFAULT false NOT NULL,
    disappearing_messages_duration INTERVAL, -- e.g. '24 hours' or '7 days'
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. CONVERSATION_PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(30) DEFAULT 'member' NOT NULL CONSTRAINT participant_role_check CHECK (role IN ('owner', 'admin', 'member', 'observer')),
    last_read_message_id UUID,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_conversation_participant UNIQUE (conversation_id, profile_id)
);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT,
    message_type VARCHAR(30) DEFAULT 'text' NOT NULL CONSTRAINT msg_type_check CHECK (message_type IN ('text', 'image', 'video', 'file', 'voice', 'system')),
    is_system_message BOOLEAN DEFAULT false NOT NULL,
    reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 4. MESSAGE_MEDIA TABLE
CREATE TABLE IF NOT EXISTS public.message_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL CONSTRAINT file_size_positive CHECK (file_size > 0),
    mime_type VARCHAR(100),
    thumbnail_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. MESSAGE_READS TABLE
CREATE TABLE IF NOT EXISTS public.message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_message_recipient_read UNIQUE (message_id, profile_id)
);

-- HIGH PERFORMANCE REAL-TIME QUERY INDEXES
CREATE INDEX IF NOT EXISTS idx_messages_conversation_chronological
ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_participants_profile_search
ON public.conversation_participants (profile_id);

CREATE INDEX IF NOT EXISTS idx_messages_expiration_cleansing
ON public.messages (expires_at)
WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_message_reads_lookup
ON public.message_reads (message_id, profile_id);

CREATE INDEX IF NOT EXISTS idx_conversations_booking_routing
ON public.conversations (booking_id)
WHERE booking_id IS NOT NULL;
