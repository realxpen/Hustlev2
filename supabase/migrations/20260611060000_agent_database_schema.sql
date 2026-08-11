-- =========================================================================
-- Hustle Agent Core Database Schema Migration
-- Designed for high-performance agent management, delegation, performance tracking, 
-- and financial auditing.
-- =========================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. AGENTS TABLE
-- Manages agency registrations and credentials. Linked directly to user profiles.
-- Rule: Only approved/vetted hustlers are promoted to run agencies.
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    agency_name VARCHAR(255) NOT NULL,
    bio TEXT,
    logo_url VARCHAR(512),
    status VARCHAR(50) DEFAULT 'approved' NOT NULL CONSTRAINT check_agent_status CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT unique_profile_agent UNIQUE (profile_id)
);

-- 2. AGENT_HUSTLERS TABLE
-- Tracks N:M relationship mapping between agents and managed specialists (hustlers).
-- Supports custom commission shares and active/revoked states.
CREATE TABLE IF NOT EXISTS public.agent_hustlers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    hustler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    commission_percentage NUMERIC(5,2) DEFAULT 15.0 NOT NULL CONSTRAINT check_commission_bounds CHECK (commission_percentage >= 0.00 AND commission_percentage <= 100.00),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CONSTRAINT check_relationship_status CHECK (status IN ('pending', 'active', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT unique_agent_hustler_pairing UNIQUE (agent_id, hustler_id)
);

-- 3. AGENT_COMMISSIONS TABLE
-- Ledger recording all financial allocations processed from completed bookings/jobs.
CREATE TABLE IF NOT EXISTS public.agent_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE SET NULL,
    hustler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    booking_id UUID NOT NULL, -- Logical link to the platform booking payment
    booking_amount NUMERIC(12,2) NOT NULL CONSTRAINT check_booking_positive CHECK (booking_amount > 0),
    commission_amount NUMERIC(12,2) NOT NULL CONSTRAINT check_commission_positive CHECK (commission_amount >= 0),
    commission_percentage NUMERIC(5,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CONSTRAINT check_payout_status CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. AGENT_PERFORMANCE TABLE
-- Cache collection tracking historical performance data, earnings, bookings count, and rating snapshots.
CREATE TABLE IF NOT EXISTS public.agent_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    hustler_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Can represent individual hustler performance or global agency aggregate (if NULL)
    
    total_assigned_bookings INT DEFAULT 0 NOT NULL CONSTRAINT check_bookings_count_nonnegative CHECK (total_assigned_bookings >= 0),
    total_completed_bookings INT DEFAULT 0 NOT NULL CONSTRAINT check_completed_count_nonnegative CHECK (total_completed_bookings >= 0),
    total_gross_revenue NUMERIC(12,2) DEFAULT 0.00 NOT NULL CONSTRAINT check_revenue_nonnegative CHECK (total_gross_revenue >= 0.00),
    total_commission_earned NUMERIC(12,2) DEFAULT 0.00 NOT NULL CONSTRAINT check_comm_earned_nonnegative CHECK (total_commission_earned >= 0.00),
    
    rating_average NUMERIC(3,2) CONSTRAINT check_rating_bounds CHECK (rating_average >= 1.00 AND rating_average <= 5.00),
    success_rate_percentage NUMERIC(5,2) DEFAULT 100.00 NOT NULL CONSTRAINT check_success_rate_bounds CHECK (success_rate_percentage >= 0.00 AND success_rate_percentage <= 100.00),
    
    reporting_period VARCHAR(20) NOT NULL, -- e.g. '2026-06', 'all_time'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT unique_agent_hustler_timeframe UNIQUE (agent_id, hustler_id, reporting_period)
);

-- =========================================================================
-- DATABASE ACCESS SECURITY POLICIES (ROW LEVEL SECURITY)
-- =========================================================================

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_hustlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance ENABLE ROW LEVEL SECURITY;

-- 1. AGENTS POLICIES
CREATE POLICY "Agents are viewable by everyone" 
ON public.agents FOR SELECT 
USING (true);

CREATE POLICY "Agents can manage their own profile" 
ON public.agents FOR ALL 
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- 2. AGENT_HUSTLERS POLICIES
CREATE POLICY "Users can view relationships they are part of" 
ON public.agent_hustlers FOR SELECT 
USING (
    hustler_id = auth.uid() OR 
    agent_id IN (SELECT id FROM public.agents WHERE profile_id = auth.uid())
);

CREATE POLICY "Agents can invite/set relationships" 
ON public.agent_hustlers FOR INSERT 
WITH CHECK (
    agent_id IN (SELECT id FROM public.agents WHERE profile_id = auth.uid())
);

CREATE POLICY "Users can respond or update their active relation mapping" 
ON public.agent_hustlers FOR UPDATE 
USING (
    hustler_id = auth.uid() OR 
    agent_id IN (SELECT id FROM public.agents WHERE profile_id = auth.uid())
);

-- 3. AGENT_COMMISSION POLICIES
CREATE POLICY "Users can track their commissions ledger logs" 
ON public.agent_commissions FOR SELECT 
USING (
    hustler_id = auth.uid() OR 
    agent_id IN (SELECT id FROM public.agents WHERE profile_id = auth.uid())
);

-- 4. AGENT_PERFORMANCE POLICIES
CREATE POLICY "Performance analytics viewable by relative partners" 
ON public.agent_performance FOR SELECT 
USING (
    hustler_id = auth.uid() OR 
    agent_id IN (SELECT id FROM public.agents WHERE profile_id = auth.uid())
);

-- =========================================================================
-- INDICES FOR HIGH-PERFORMANCE REAL-TIME TELEMETRY
-- =========================================================================

-- Accelerates retrieving an agency roster sorting active teams
CREATE INDEX IF NOT EXISTS idx_agent_hustlers_active
ON public.agent_hustlers (agent_id, status);

-- Accelerates list tracking of a specialist's managing agents
CREATE INDEX IF NOT EXISTS idx_hustlers_manager_lookup
ON public.agent_hustlers (hustler_id);

-- Speeds up financial ledger tracking and quarterly reports
CREATE INDEX IF NOT EXISTS idx_commissions_history
ON public.agent_commissions (agent_id, status, created_at DESC);

-- Optimizes real-time performance rendering inside Agent Control Center dashboard
CREATE INDEX IF NOT EXISTS idx_performance_analytics
ON public.agent_performance (agent_id, reporting_period);

-- =========================================================================
-- COMPLEX POSTGRES ACTIONS & TRIGGER ENGINE INSTRUCTIONS
-- =========================================================================

-- Trigger to automatically calculate and populate agent_performance caches 
-- upon commission ledger status change to 'paid'.
CREATE OR REPLACE FUNCTION public.aggregate_payment_performance()
RETURNS TRIGGER AS $$
DECLARE
    v_gross_booking NUMERIC(12,2);
    v_comm_sum NUMERIC(12,2);
    v_total_bookings INT;
    v_completed_bookings INT;
    v_success_rate NUMERIC(5,2);
BEGIN
    -- Aggregates sum statistics matching target agent and hustler
    SELECT COALESCE(SUM(booking_amount), 0.00), COALESCE(SUM(commission_amount), 0.00)
    INTO v_gross_booking, v_comm_sum
    FROM public.agent_commissions
    WHERE agent_id = NEW.agent_id AND hustler_id = NEW.hustler_id AND status = 'paid';

    -- Count total contracts from bookings (Simulate evaluation logic)
    v_completed_bookings := (
        SELECT COUNT(id) FROM public.agent_commissions 
        WHERE agent_id = NEW.agent_id AND hustler_id = NEW.hustler_id AND status = 'paid'
    );

    v_total_bookings := (
        SELECT COUNT(id) FROM public.agent_commissions 
        WHERE agent_id = NEW.agent_id AND hustler_id = NEW.hustler_id
    );

    IF v_total_bookings > 0 THEN
        v_success_rate := ROUND((v_completed_bookings::numeric / v_total_bookings::numeric) * 100, 2);
    ELSE
        v_success_rate := 100.00;
    END IF;

    -- Upsert result into Cache Aggregates
    INSERT INTO public.agent_performance (
        agent_id, hustler_id, total_assigned_bookings, total_completed_bookings, 
        total_gross_revenue, total_commission_earned, success_rate_percentage, reporting_period, updated_at
    )
    VALUES (
        NEW.agent_id, NEW.hustler_id, v_total_bookings, v_completed_bookings, 
        v_gross_booking, v_comm_sum, v_success_rate, 'all_time', NOW()
    )
    ON CONFLICT (agent_id, hustler_id, reporting_period) 
    DO UPDATE SET
        total_assigned_bookings = EXCLUDED.total_assigned_bookings,
        total_completed_bookings = EXCLUDED.total_completed_bookings,
        total_gross_revenue = EXCLUDED.total_gross_revenue,
        total_commission_earned = EXCLUDED.total_commission_earned,
        success_rate_percentage = EXCLUDED.success_rate_percentage,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger to Agent Commissions updates
DROP TRIGGER IF EXISTS tr_aggregate_performance ON public.agent_commissions;
CREATE TRIGGER tr_aggregate_performance
AFTER INSERT OR UPDATE OF status ON public.agent_commissions
FOR EACH ROW
EXECUTE PROCEDURE public.aggregate_payment_performance();
