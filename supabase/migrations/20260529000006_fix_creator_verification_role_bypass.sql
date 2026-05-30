-- 20260529000006_fix_creator_verification_role_bypass.sql
-- SECURE ROLE BYPASS AND INTEGRITY FOR CREATOR VERIFICATIONS

-- 1. Tighten the Insert Policy on creator_verifications so users can only submit 'pending' verifications
DROP POLICY IF EXISTS "Users can insert own verification" ON public.creator_verifications;
CREATE POLICY "Users can insert own verification" ON public.creator_verifications FOR INSERT WITH CHECK (
    auth.uid() = user_id AND status = 'pending'
);

-- 2. Update restrict_profile_role_updates to allow promotion to 'creator' if there is an approved verification
CREATE OR REPLACE FUNCTION public.restrict_profile_role_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is not changing, proceed.
    IF OLD.role IS NOT DISTINCT FROM NEW.role THEN
        RETURN NEW;
    END IF;

    -- Avoid restrictions for system level service_role or trigger-based system queries (auth.uid() is null during handle_new_user)
    IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Bypass check if the user is being promoted to 'creator', 'hustler', or 'both' and there is a verified approval in creator_verifications
    IF NEW.role IN ('creator', 'hustler', 'both') AND EXISTS (
        SELECT 1 FROM public.creator_verifications 
        WHERE user_id = NEW.id AND status = 'approved'
    ) THEN
        RETURN NEW;
    END IF;

    -- Standard/Creator/Other roles cannot mutate profile roles under any circumstance
    IF NOT public.is_caller_admin_or_superadmin() THEN
        RAISE EXCEPTION 'Access Denied: You do not possess the required higher-tier administrative privileges to modify roles.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
