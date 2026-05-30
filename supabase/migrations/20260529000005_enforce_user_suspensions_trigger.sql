-- 20260529000005_enforce_user_suspensions_trigger.sql
-- COMPLETE USER SUSPENSION ENFORCEMENT STATE

-- 1. Create safety trigger function to block suspended users from inserting/updating standard tables
CREATE OR REPLACE FUNCTION public.check_user_suspension_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check for authenticated users (system trigger inserts might have auth.uid() as null)
    IF auth.uid() IS NOT NULL AND public.is_user_suspended(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Your account has been suspended for violating platform policies.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Bind safety triggers to transactional and content creation tables
-- Posts
DROP TRIGGER IF EXISTS tr_restrict_suspended_users ON public.posts;
CREATE TRIGGER tr_restrict_suspended_users
    BEFORE INSERT OR UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_suspension_trigger();

-- Comments
DROP TRIGGER IF EXISTS tr_restrict_suspended_users ON public.comments;
CREATE TRIGGER tr_restrict_suspended_users
    BEFORE INSERT OR UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_suspension_trigger();

-- Bookings
DROP TRIGGER IF EXISTS tr_restrict_suspended_users ON public.bookings;
CREATE TRIGGER tr_restrict_suspended_users
    BEFORE INSERT OR UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_suspension_trigger();

-- Messages
DROP TRIGGER IF EXISTS tr_restrict_suspended_users ON public.messages;
CREATE TRIGGER tr_restrict_suspended_users
    BEFORE INSERT OR UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_suspension_trigger();

-- Reviews
DROP TRIGGER IF EXISTS tr_restrict_suspended_users ON public.reviews;
CREATE TRIGGER tr_restrict_suspended_users
    BEFORE INSERT OR UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_suspension_trigger();

-- Services (Marketplace)
DROP TRIGGER IF EXISTS tr_restrict_suspended_users ON public.services;
CREATE TRIGGER tr_restrict_suspended_users
    BEFORE INSERT OR UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_suspension_trigger();

-- Products (Marketplace)
DROP TRIGGER IF EXISTS tr_restrict_suspended_users ON public.products;
CREATE TRIGGER tr_restrict_suspended_users
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_suspension_trigger();

-- Training (Marketplace)
DROP TRIGGER IF EXISTS tr_restrict_suspended_users ON public.training;
CREATE TRIGGER tr_restrict_suspended_users
    BEFORE INSERT OR UPDATE ON public.training
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_suspension_trigger();


-- 3. Update view to filter out posts from suspended users
CREATE OR REPLACE VIEW public.active_safe_posts AS
SELECT p.*
FROM public.posts p
LEFT JOIN public.content_moderation_states cms ON p.id = cms.target_id
WHERE (cms.moderation_status IS NULL OR cms.moderation_status NOT IN ('hidden', 'removed'))
  AND NOT public.is_user_suspended(p.user_id);


-- 4. Update core SELECT RLS policies to automatically filter out suspended users' content from standard SELECT queries
-- Posts
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (
    NOT public.is_user_suspended(user_id)
);

-- Comments
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (
    NOT public.is_user_suspended(user_id)
);

-- Services
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (
    (is_active = true AND NOT public.is_user_suspended(owner_id)) OR owner_id = auth.uid()
);

-- Products
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (
    (is_active = true AND NOT public.is_user_suspended(owner_id)) OR owner_id = auth.uid()
);

-- Training
DROP POLICY IF EXISTS "Anyone can view active training" ON public.training;
CREATE POLICY "Anyone can view active training" ON public.training FOR SELECT USING (
    (is_active = true AND NOT public.is_user_suspended(owner_id)) OR owner_id = auth.uid()
);
