-- 20260528000006_admin_analytics.sql
-- AGGREGATED ANALYTICS FOR ADMIN HUB

-- 1. Create a function to get high-level platform stats
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT count(*) FROM public.profiles),
        'active_escrow', (SELECT COALESCE(SUM(amount), 0) FROM public.escrow_accounts WHERE status = 'held'),
        'monthly_revenue', (SELECT COALESCE(SUM(platform_fee), 0) FROM public.escrow_transactions WHERE created_at > (now() - interval '30 days')),
        'open_disputes', (SELECT count(*) FROM public.reports WHERE status = 'pending'),
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

-- 2. Grant access to moderators and admins
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;

-- 3. Add a helper for dispute trends (last 7 days)
CREATE OR REPLACE FUNCTION public.get_dispute_trends()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(t) INTO result
    FROM (
        SELECT 
            date_trunc('day', created_at)::date as date,
            count(*) as count
        FROM public.reports
        WHERE created_at > (now() - interval '7 days')
        GROUP BY 1
        ORDER BY 1 ASC
    ) t;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_dispute_trends() TO authenticated;
