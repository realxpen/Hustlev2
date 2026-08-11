-- 20260529000000_fix_admin_stats_and_rls.sql
-- FIXES FOR ADMIN HUB DISPUTES AND ESCROW

-- 1. Fix get_platform_stats to use correct escrow balance and disputes count
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT count(*) FROM public.profiles),
        'active_escrow', (SELECT COALESCE(SUM(escrow_balance), 0) FROM public.wallets),
        'monthly_revenue', (SELECT COALESCE(SUM(platform_fee), 0) FROM public.escrow_transactions WHERE created_at > (now() - interval '30 days')),
        'open_disputes', (SELECT count(*) FROM public.reports WHERE status = 'pending' AND target_type = 'booking'),
        'pending_verifications', (SELECT count(*) FROM public.creator_verifications WHERE status = 'pending'),
        'fraud_risk_count', (SELECT count(*) FROM public.moderation_queue WHERE severity_score > 3),
        'booking_success_rate', (
            SELECT CASE 
                WHEN count(*) = 0 THEN 0 
                ELSE (count(*) FILTER (WHERE status = 'completed')::float / count(*)::float) * 100 
            END 
            FROM public.bookings
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Bookings RLS to allow Admins/Moderators to view all bookings
-- This is critical for the Admin Governance Hub to display dispute details
DROP POLICY IF EXISTS "Admins and moderators can view all bookings" ON public.bookings;
CREATE POLICY "Admins and moderators can view all bookings"
    ON public.bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin', 'super_admin')
        )
    );

-- 3. Add an explicit foreign key for report target_id to bookings (nullable/conditional)
-- Since we can't have a truly polymorphic FK in Postgres, we just ensure admins have access to the join.
-- Actually, we'll just fix the client-side query as joining without FK is mostly about RLS.
