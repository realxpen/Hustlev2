-- 20260529000004_admin_profile_management_rls.sql
-- SECURE ROLE PROVISIONING AND ADMIN PERMISSION ENFORCEMENT

-- 1. Explicit RLS Policies for Profiles table to permit administrators to manage profiles
DROP POLICY IF EXISTS "Admins and super admins can update any profile" ON public.profiles;
CREATE POLICY "Admins and super admins can update any profile" ON public.profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 2. Prevent role mutation/elevation by standard users
CREATE OR REPLACE FUNCTION public.restrict_profile_role_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is not changing, proceed.
    IF OLD.role IS NOT DISTINCT FROM NEW.role THEN
        RETURN NEW;
    END IF;

    -- Avoid restrictions foACr system level service_role or trigger-based system queries (auth.uid() is null during handle_new_user)
    IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Standard/Creator/Other roles cannot mutate profile roles under any circumstance
    IF NOT public.is_caller_admin_or_superadmin() THEN
        RAISE EXCEPTION 'Access Denied: You do not possess the required higher-tier administrative privileges to modify roles.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_restrict_profile_role_updates ON public.profiles;
CREATE TRIGGER trg_restrict_profile_role_updates
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.restrict_profile_role_updates();


-- 3. Automatic creator role assignment on verification approval
CREATE OR REPLACE FUNCTION public.promote_approved_creator()
RETURNS TRIGGER AS $$
BEGIN
    -- When a verification status changes to approved, update the profile's role to 'creator' (and set is_hustler = true)
    IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        UPDATE public.profiles
        SET role = 'creator', is_hustler = true
        WHERE id = NEW.user_id;
        
        -- Insert a moderation logs entry for audit purposes
        INSERT INTO public.moderation_logs (moderator_id, action_type, target_id, target_type, reason, old_state, new_state)
        VALUES (
            NEW.reviewed_by,
            'verify_creator',
            NEW.user_id,
            'profile',
            'Creator verification request approved',
            jsonb_build_object('role', 'user'),
            jsonb_build_object('role', 'creator')
        );
    ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Insert a moderation logs entry for rejection audit
        INSERT INTO public.moderation_logs (moderator_id, action_type, target_id, target_type, reason, old_state, new_state)
        VALUES (
            NEW.reviewed_by,
            'reject_creator_verification',
            NEW.user_id,
            'profile',
            'Creator verification request rejected',
            jsonb_build_object('verification_status', 'pending'),
            jsonb_build_object('verification_status', 'rejected')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_promote_approved_creator ON public.creator_verifications;
CREATE TRIGGER trg_promote_approved_creator
    AFTER UPDATE OF status ON public.creator_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.promote_approved_creator();
