-- 20260530000000_secure_discovery_content_filtering.sql
-- CONSISTENT SECURE DISCOVERY WITH DUAL-LAYER SECURITY OVERRIDES (BACKEND RLS + DB CONTROLS + AUTOMATED AUDIT TRIGGERS)

-- 1. Helper function to check if a specific content is hidden or removed
CREATE OR REPLACE FUNCTION public.is_content_hidden(p_target_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.content_moderation_states
        WHERE target_id = p_target_id AND moderation_status IN ('hidden', 'removed')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1b. Helper function to check if the caller is an administrator or moderator (RECURSION SAFE)
CREATE OR REPLACE FUNCTION public.is_caller_admin_or_moderator()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Use SECURITY DEFINER and a direct query with session override to bypass RLS recursion
    -- In Supabase, search_path must be set to public for security
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    RETURN v_role IN ('moderator', 'admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1c. Helper function to check if the caller is an admin or super_admin (RECURSION SAFE)
CREATE OR REPLACE FUNCTION public.is_caller_admin_or_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    RETURN v_role IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1d. Helper function to check if the caller is an agent (RECURSION SAFE)
CREATE OR REPLACE FUNCTION public.is_caller_agent()
RETURNS BOOLEAN AS $$
DECLARE
    v_is_agent BOOLEAN;
BEGIN
    SELECT is_agent INTO v_is_agent FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(v_is_agent, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_caller_admin_or_moderator() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_caller_admin_or_superadmin() TO authenticated, anon;

-- 2. Secure Public Profiles Select & Update Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (
    -- Administrators or moderators can select any profile (secured via SECURITY DEFINER to prevent recursion)
    public.is_caller_admin_or_moderator()
    OR
    -- Owners can view their own profile
    auth.uid() = id
    OR
    -- Public users can only see profiles that are not suspended
    NOT public.is_user_suspended(id)
);

DROP POLICY IF EXISTS "Admins and super admins can update any profile" ON public.profiles;
CREATE POLICY "Admins and super admins can update any profile" ON public.profiles FOR UPDATE USING (
    public.is_caller_admin_or_superadmin()
) WITH CHECK (
    public.is_caller_admin_or_superadmin()
);

-- 3. Secure Posts Select Policy
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (
    -- Administrators or moderators can see any post
    public.is_caller_admin_or_moderator()
    OR
    -- Owners can view their own posts
    auth.uid() = user_id
    OR
    -- Public users can only view posts that are not from a suspended user and not hidden/moderated
    (
        NOT public.is_user_suspended(user_id)
        AND NOT public.is_content_hidden(id)
    )
);

-- 4. Secure Comments Select Policy
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (
    -- Administrators or moderators can see any comment
    public.is_caller_admin_or_moderator()
    OR
    -- Owners can view their own comments
    auth.uid() = user_id
    OR
    -- Public users can only view comments that are not from a suspended user and not hidden/moderated
    (
        NOT public.is_user_suspended(user_id)
        AND NOT public.is_content_hidden(id)
    )
);

-- 5. Secure Services Select Policy
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (
    -- Administrators or moderators can see any service
    public.is_caller_admin_or_moderator()
    OR
    -- Owners can view their own services
    owner_id = auth.uid()
    OR
    -- Public users can only view services that are active, not owned by a suspended user, and not hidden/moderated
    (
        is_active = true 
        AND NOT public.is_user_suspended(owner_id)
        AND NOT public.is_content_hidden(id)
    )
);

-- 6. Secure Products Select Policy
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (
    -- Administrators or moderators can see any product
    public.is_caller_admin_or_moderator()
    OR
    -- Owners can view their own products
    owner_id = auth.uid()
    OR
    -- Public users can only view products that are active, not owned by a suspended user, and not hidden/moderated
    (
        is_active = true 
        AND NOT public.is_user_suspended(owner_id)
        AND NOT public.is_content_hidden(id)
    )
);

-- 7. Secure Training Programs Select Policy
DROP POLICY IF EXISTS "Anyone can view active training" ON public.training;
CREATE POLICY "Anyone can view active training" ON public.training FOR SELECT USING (
    -- Administrators or moderators can see any training item
    public.is_caller_admin_or_moderator()
    OR
    -- Owners can view their own training items
    owner_id = auth.uid()
    OR
    -- Public users can only view training items that are active, not owned by a suspended user, and not hidden/moderated
    (
        is_active = true 
        AND NOT public.is_user_suspended(owner_id)
        AND NOT public.is_content_hidden(id)
    )
);

-- 8. Automated Audit Logging Trigger for Content Moderation States
CREATE OR REPLACE FUNCTION public.trigger_on_moderation_state_changed()
RETURNS TRIGGER AS $$
DECLARE
    v_old_status TEXT := NULL;
    v_old_level INT := NULL;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Only log if actual status or restriction level changed
        IF OLD.moderation_status IS NOT DISTINCT FROM NEW.moderation_status AND OLD.restriction_level IS NOT DISTINCT FROM NEW.restriction_level THEN
            RETURN NEW;
        END IF;
        v_old_status := OLD.moderation_status;
        v_old_level := OLD.restriction_level;
    END IF;

    PERFORM public.log_moderation_event(
        auth.uid(),
        'content_moderation_state_change',
        NEW.target_id,
        NEW.target_type,
        'Moderation status ' || COALESCE(v_old_status, 'none') || ' -> ' || NEW.moderation_status || ' (Restriction: ' || NEW.restriction_level || ')',
        jsonb_build_object('moderation_status', v_old_status, 'restriction_level', v_old_level),
        jsonb_build_object('moderation_status', NEW.moderation_status, 'restriction_level', NEW.restriction_level)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_moderation_state_changed_log ON public.content_moderation_states;
CREATE TRIGGER trg_moderation_state_changed_log
AFTER INSERT OR UPDATE ON public.content_moderation_states
FOR EACH ROW EXECUTE PROCEDURE public.trigger_on_moderation_state_changed();
