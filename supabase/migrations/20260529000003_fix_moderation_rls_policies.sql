-- 20260529000003_fix_moderation_rls_policies.sql
-- COMPLETE SAFETY & TRUST ENGINE RLS FIXES FOR USERS AND MODERATORS

-- 1. Reports UPDATE policy for moderators/admins
DROP POLICY IF EXISTS "Moderators/Admins can update reports" ON public.reports;
CREATE POLICY "Moderators/Admins can update reports" ON public.reports FOR UPDATE USING (
    public.is_caller_admin_or_moderator()
) WITH CHECK (
    public.is_caller_admin_or_moderator()
);

-- 2. Moderation Logs INSERT policy for moderators/admins
DROP POLICY IF EXISTS "Moderators/Admins can insert logs" ON public.moderation_logs;
CREATE POLICY "Moderators/Admins can insert logs" ON public.moderation_logs FOR INSERT WITH CHECK (
    public.is_caller_admin_or_moderator()
);

-- 3. Content Moderation States policies
-- Read-access is open to everyone so that safe views (like active_safe_posts) and RLS checks don't blank out content for normal viewers
DROP POLICY IF EXISTS "Anyone can select content moderation states" ON public.content_moderation_states;
CREATE POLICY "Anyone can select content moderation states" ON public.content_moderation_states FOR SELECT USING (true);

-- Manage-access is restricted to moderators and admins
DROP POLICY IF EXISTS "Moderators/Admins can manage content moderation states" ON public.content_moderation_states;
CREATE POLICY "Moderators/Admins can manage content moderation states" ON public.content_moderation_states FOR ALL USING (
    public.is_caller_admin_or_moderator()
) WITH CHECK (
    public.is_caller_admin_or_moderator()
);

-- 4. Creator Verifications policies for ordinary users
-- Users must be allowed to submit/insert their own requests
DROP POLICY IF EXISTS "Users can insert own verification" ON public.creator_verifications;
CREATE POLICY "Users can insert own verification" ON public.creator_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users must be allowed to view/track the status of their own request
DROP POLICY IF EXISTS "Users can see own verification" ON public.creator_verifications;
CREATE POLICY "Users can see own verification" ON public.creator_verifications FOR SELECT USING (auth.uid() = user_id);
