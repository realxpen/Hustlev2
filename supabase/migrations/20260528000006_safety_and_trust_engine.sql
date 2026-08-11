-- 20260528000006_safety_and_trust_engine.sql
-- AUTOMATED SAFETY HOOKS AND TRUST SCORING FOUNDATION

-- 1. Trust Scoring Logic
-- Factors: account age, successful bookings, reviews, moderation history
CREATE OR REPLACE FUNCTION public.calculate_user_trust_score(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_score NUMERIC := 50.0; -- Base score
    v_account_age_days INT;
    v_successful_bookings INT;
    v_reports_count INT;
BEGIN
    -- Account Age Factor (+1 per month, max 10)
    SELECT EXTRACT(DAY FROM (now() - created_at)) / 30 INTO v_account_age_days
    FROM public.profiles WHERE id = p_user_id;
    v_score := v_score + LEAST(v_account_age_days, 10);

    -- Successful Bookings Factor (+5 per completion, max 30)
    SELECT COUNT(*) INTO v_successful_bookings
    FROM public.bookings 
    WHERE (seller_id = p_user_id OR buyer_id = p_user_id) 
    AND status = 'completed';
    v_score := v_score + LEAST(v_successful_bookings * 5, 30);

    -- Negative Moderation Factor (-20 per resolved report, max -50)
    SELECT COUNT(*) INTO v_reports_count
    FROM public.reports
    WHERE target_id = p_user_id AND target_type = 'profile' AND status = 'resolved';
    v_score := v_score - LEAST(v_reports_count * 20, 50);

    -- Clamp score between 0 and 100
    RETURN GREATEST(LEAST(v_score, 100), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Automated Spam Detection Hook (Stubs for future logic)
CREATE OR REPLACE FUNCTION public.check_content_spam_score()
RETURNS TRIGGER AS $$
DECLARE
    v_spam_score INT := 0;
    v_recent_post_count INT;
BEGIN
    -- Rate limiting check (e.g., > 5 posts in 1 minute)
    SELECT COUNT(*) INTO v_recent_post_count
    FROM public.posts
    WHERE user_id = NEW.user_id AND created_at > now() - interval '1 minute';

    IF v_recent_post_count > 5 THEN
        v_spam_score := v_spam_score + 50;
    END IF;

    -- If suspected spam, flag it automatically
    IF v_spam_score >= 50 THEN
        INSERT INTO public.reports (target_id, target_type, reason, details, status)
        VALUES (NEW.id, 'post', 'Automated Spam Detection', 'High frequency posting detected', 'pending')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Spam Detection to Posts
DROP TRIGGER IF EXISTS tr_on_post_created_spam_check ON public.posts;
CREATE TRIGGER tr_on_post_created_spam_check
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE PROCEDURE public.check_content_spam_score();

-- 3. Content Visibility View (Secure Discovery)
-- This view should be used by the frontend to fetch content that isn't hidden/removed.
CREATE OR REPLACE VIEW public.active_safe_posts AS
SELECT p.*
FROM public.posts p
LEFT JOIN public.content_moderation_states cms ON p.id = cms.target_id
WHERE cms.moderation_status IS NULL OR cms.moderation_status NOT IN ('hidden', 'removed');

-- 4. User Suspension Enforcement Function
CREATE OR REPLACE FUNCTION public.is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.content_moderation_states
        WHERE target_id = p_user_id AND target_type = 'profile' AND moderation_status IN ('hidden', 'removed')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
