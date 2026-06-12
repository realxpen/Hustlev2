# Hustle Agency Support Database Schema

This document details the production-ready PostgreSQL database design for the **Hustle Agent & Roster Management System**. Built on top of Supabase/Postgres, this schema supports modular talent assignments, micro-scoped delegation parameters, real-time trigger pipelines, and auto-aggregating performance metrics.

---

## 1. Relational Map Topology

The structure is normalized across **four core entities** to separate write-intensive operations (transaction commission audits) from read-optimized workloads (analytical metrics lookups):

```
+-----------------------------------+
|              profiles             |
+-----------------------------------+
                  | (1 : 1)
                  v
+-----------------------------------+
|               agents              | <--- Profile promoted to Agency Status
+-----------------------------------+
        | (1 : N)        | (1 : N)
        |                |
        v                v
+----------------+ +----------------+
| agent_hustlers | |agent_commissions| <--- Holds actual individual payments logs
+----------------+ +----------------+
        | (1 : 1)        |
        |                | (Aggregate loop updates)
        v                v
  (Permissions)    +----------------+
                   |agent_performance| <--- Real-time analytics cache
                   +----------------+
```

---

## 2. Table Specifications (DDL)

The schema definitions are structured as follows:

### A. `agents` Table
Holds registered company entities and verification credentials.
```sql
CREATE TABLE public.agents (
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
```

### B. `agent_hustlers` Table
Normalized association mapping. Supports commission fee agreements and active status workflows.
```sql
CREATE TABLE public.agent_hustlers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    hustler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    commission_percentage NUMERIC(5,2) DEFAULT 15.0 NOT NULL CONSTRAINT check_commission_bounds CHECK (commission_percentage >= 0.00 AND commission_percentage <= 100.00),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CONSTRAINT check_relationship_status CHECK (status IN ('pending', 'active', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_agent_hustler_pairing UNIQUE (agent_id, hustler_id)
);
```

### C. `agent_commissions` Table
Secured ledger tracks real-time transaction processing rules on platform contracts.
```sql
CREATE TABLE public.agent_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE SET NULL,
    hustler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    booking_id UUID NOT NULL, -- Logical link to the main platform bookings
    booking_amount NUMERIC(12,2) NOT NULL CONSTRAINT check_booking_positive CHECK (booking_amount > 0),
    commission_amount NUMERIC(12,2) NOT NULL CONSTRAINT check_commission_positive CHECK (commission_amount >= 0),
    commission_percentage NUMERIC(5,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CONSTRAINT check_payout_status CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### D. `agent_performance` Table
Analytic caches prevent heavy nesting scans during real-time screen loads.
```sql
CREATE TABLE public.agent_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    hustler_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_assigned_bookings INT DEFAULT 0 NOT NULL CONSTRAINT check_bookings_count_nonnegative CHECK (total_assigned_bookings >= 0),
    total_completed_bookings INT DEFAULT 0 NOT NULL CONSTRAINT check_completed_count_nonnegative CHECK (total_completed_bookings >= 0),
    total_gross_revenue NUMERIC(12,2) DEFAULT 0.00 NOT NULL CONSTRAINT check_revenue_nonnegative CHECK (total_gross_revenue >= 0.00),
    total_commission_earned NUMERIC(12,2) DEFAULT 0.00 NOT NULL CONSTRAINT check_comm_earned_nonnegative CHECK (total_commission_earned >= 0.00),
    rating_average NUMERIC(3,2) CONSTRAINT check_rating_bounds CHECK (rating_average >= 1.00 AND rating_average <= 5.00),
    success_rate_percentage NUMERIC(5,2) DEFAULT 100.00 NOT NULL CONSTRAINT check_success_rate_bounds CHECK (success_rate_percentage >= 0.00 AND success_rate_percentage <= 100.00),
    reporting_period VARCHAR(20) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_agent_hustler_timeframe UNIQUE (agent_id, hustler_id, reporting_period)
);
```

---

## 3. High-Performance Index Tuning

These indexes optimize query dispatching, keeping transactions light:
```sql
-- Speeds up retrieval of the agency specialists list in the control deck
CREATE INDEX idx_agent_hustlers_active ON public.agent_hustlers (agent_id, status);

-- Speeds up list of managing agencies from parent specialist dashboards
CREATE INDEX idx_hustlers_manager_lookup ON public.agent_hustlers (hustler_id);

-- Optimizes historical financial reports sorting payments chronologically
CREATE INDEX idx_commissions_history ON public.agent_commissions (agent_id, status, created_at DESC);

-- Speeds up analytics render passes inside our customized Agency Center interface
CREATE INDEX idx_performance_analytics ON public.agent_performance (agent_id, reporting_period);
```

---

## 4. Automatic Performance Cache Trigger

To avoid $O(N)$ scanning functions across millions of financial rows during dashboard screen rendering, a PostgreSQL trigger compiles telemetry calculations asynchronously whenever payment statuses change:

```sql
CREATE OR REPLACE FUNCTION public.aggregate_payment_performance()
RETURNS TRIGGER AS $$
DECLARE
    v_gross_booking NUMERIC(12,2);
    v_comm_sum NUMERIC(12,2);
    v_total_bookings INT;
    v_completed_bookings INT;
    v_success_rate NUMERIC(5,2);
BEGIN
    SELECT COALESCE(SUM(booking_amount), 0.00), COALESCE(SUM(commission_amount), 0.00)
    INTO v_gross_booking, v_comm_sum
    FROM public.agent_commissions
    WHERE agent_id = NEW.agent_id AND hustler_id = NEW.hustler_id AND status = 'paid';

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
```

---

## 5. Security & Isolation Policies (RLS)

All tables enforce PostgreSQL Row-Level Security rules, preventing unauthorized queries outside of active partnership matches:

- **Self-Service Gating**: Users can only update/view roster details if their authenticated ID matches either the requested `hustler_id` or the owner of `agent_id`.
- **Read-Only Ledger**: Payout commissions cannot be modified by users; they can only be selected of their own matching profiles.

```sql
CREATE POLICY "Users can view relationships they are part of" 
ON public.agent_hustlers FOR SELECT 
USING (
    hustler_id = auth.uid() OR 
    agent_id IN (SELECT id FROM public.agents WHERE profile_id = auth.uid())
);
```
