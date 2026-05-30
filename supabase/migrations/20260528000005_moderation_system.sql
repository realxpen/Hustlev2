-- 20260528000005_moderation_system.sql
-- TRUST & SAFETY: MODERATION, REPORTING, AND VERIFICATION ENGINE

-- 1. Add roles to user_roles
INSERT INTO public.user_roles (id, description) VALUES
  ('moderator', 'Moderator'),
  ('super_admin', 'Super Administrator')
ON CONFLICT (id) DO NOTHING;

-- 2. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_id UUID NOT NULL, -- ID of the content or user being reported
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'profile', 'message', 'service', 'product', 'training', 'story', 'booking')),
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Prevent duplicate spam reports (one per user per target)
    CONSTRAINT one_report_per_target UNIQUE (reporter_id, target_id, target_type)
);

-- 3. Moderation Management Tables
CREATE TABLE IF NOT EXISTS public.moderation_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL,
    severity_score NUMERIC DEFAULT 1.0,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    automated_flags JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Content Visibility & Status (Central Moderation States)
CREATE TABLE IF NOT EXISTS public.content_moderation_states (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    target_id UUID NOT NULL UNIQUE,
    target_type TEXT NOT NULL,
    moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'flagged', 'hidden', 'removed')),
    restriction_level INT DEFAULT 0, -- 0: none, 1: shadow_hide, 2: discovery_removal, 3: full_block
    is_monetization_eligible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Creator Verification System
CREATE TABLE IF NOT EXISTS public.creator_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('id', 'business', 'skill')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submission_metadata JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 6. Immutable Moderation & Audit Logs
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- e.g., 'remove_content', 'suspend_user', 'ban_user', 'verify_creator'
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL,
    reason TEXT,
    old_state JSONB,
    new_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS CONFIGURATION
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation_states ENABLE ROW LEVEL SECURITY;

-- Reports: Users can create and see their OWN reports
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can see their own reports" ON public.reports;
CREATE POLICY "Users can see their own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- Admin/Moderator Policies
DROP POLICY IF EXISTS "Moderators/Admins can see all reports" ON public.reports;
CREATE POLICY "Moderators/Admins can see all reports" ON public.reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Moderators/Admins can manage queue" ON public.moderation_queue;
CREATE POLICY "Moderators/Admins can manage queue" ON public.moderation_queue FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Moderators/Admins can see logs" ON public.moderation_logs;
CREATE POLICY "Moderators/Admins can see logs" ON public.moderation_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Moderators/Admins can manage verification" ON public.creator_verifications;
CREATE POLICY "Moderators/Admins can manage verification" ON public.creator_verifications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'super_admin'))
);

-- 7. Trigger to automatically add to moderation queue on report
CREATE OR REPLACE FUNCTION public.add_to_moderation_queue()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.moderation_queue (report_id, target_id, target_type, priority)
    VALUES (NEW.id, NEW.target_id, NEW.target_type, 'medium')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_report_created ON public.reports;
CREATE TRIGGER on_report_created
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE PROCEDURE public.add_to_moderation_queue();
