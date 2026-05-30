-- 20260530000001_secure_admin_rpc_access.sql
-- CONSISTENT SECURE ADMIN ACCESS ONLY (BACKEND AND DATABASE INTEGRITY)

-- 1. Helper function to verify caller has administrator/moderator privileges
CREATE OR REPLACE FUNCTION public.assert_caller_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    EXECUTE 'SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = $1 AND role IN (''moderator'', ''admin'', ''super_admin'')
    )' INTO v_is_admin USING auth.uid();

    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RAISE EXCEPTION 'Access Denied: You do not possess the required higher-tier administrative privileges.';
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Secure get_platform_stats RPC
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON AS $$
DECLARE
    v_total_users INT;
    v_active_escrow NUMERIC;
    v_frozen_escrow NUMERIC;
    v_released_escrow NUMERIC;
    v_completed_escrow NUMERIC;
    v_monthly_revenue NUMERIC;
    v_open_disputes INT;
    v_pending_verifications INT;
    v_fraud_risk_count INT;
    v_booking_success_rate NUMERIC;
BEGIN
    -- Assert administrative/moderator access
    PERFORM public.assert_caller_is_admin();

    -- 1. Total users
    SELECT count(*) INTO v_total_users FROM public.profiles;

    -- 2. Dedicated Escrow aggregations
    SELECT COALESCE(SUM(total_price), 0) INTO v_active_escrow 
    FROM public.bookings 
    WHERE escrow_status IN ('held', 'locked') AND status NOT IN ('cancelled', 'rejected');

    SELECT COALESCE(SUM(total_price), 0) INTO v_frozen_escrow 
    FROM public.bookings 
    WHERE escrow_status = 'locked';

    SELECT COALESCE(SUM(total_price), 0) INTO v_released_escrow 
    FROM public.bookings 
    WHERE escrow_status = 'released';

    SELECT COALESCE(SUM(total_price), 0) INTO v_completed_escrow 
    FROM public.bookings 
    WHERE escrow_status = 'released' AND status = 'completed';

    -- 3. Platform revenue (from escrow transactions)
    SELECT COALESCE(SUM(platform_fee), 0) INTO v_monthly_revenue 
    FROM public.escrow_transactions 
    WHERE status = 'released' AND created_at > (now() - interval '30 days');

    -- 4. Open Disputes
    SELECT count(*) INTO v_open_disputes 
    FROM public.reports 
    WHERE target_type = 'booking' AND status = 'pending';

    -- 5. Pending Verifications
    SELECT count(*) INTO v_pending_verifications 
    FROM public.creator_verifications 
    WHERE status = 'pending';

    -- 6. Fraud risk count (high severity items in queue)
    SELECT count(*) INTO v_fraud_risk_count 
    FROM public.moderation_queue 
    WHERE severity_score > 3 AND status != 'closed';

    -- 7. Booking success rate
    SELECT 
        CASE 
            WHEN count(*) = 0 THEN 0 
            ELSE ROUND((count(*) FILTER (WHERE status = 'completed')::NUMERIC / count(*)::NUMERIC) * 100, 1)
        END INTO v_booking_success_rate
    FROM public.bookings;

    RETURN json_build_object(
        'total_users', v_total_users,
        'active_escrow', v_active_escrow,
        'frozen_escrow', v_frozen_escrow,
        'released_escrow', v_released_escrow,
        'completed_escrow', v_completed_escrow,
        'monthly_revenue', v_monthly_revenue,
        'open_disputes', v_open_disputes,
        'pending_verifications', v_pending_verifications,
        'fraud_risk_count', v_fraud_risk_count,
        'booking_success_rate', v_booking_success_rate
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Secure get_dispute_trends RPC
CREATE OR REPLACE FUNCTION public.get_dispute_trends()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Assert administrative/moderator access
    PERFORM public.assert_caller_is_admin();

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
