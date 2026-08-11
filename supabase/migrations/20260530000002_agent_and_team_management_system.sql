-- 20260530000002_agent_and_team_management_system.sql
-- COMPREHENSIVE AGENT ROLE ENGINE, HUSTLER-AGENCY COUPLING, PERMISSIONS, INTEGRATED COMMISSION PIPELINE, AND COLLABORATION RLS

-- 1. Extend the public.profiles table with agent meta-attributes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_agent BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_name TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS managed_hustlers_count INT DEFAULT 0 NOT NULL;

-- 2. Create the Agent Applications schema to manage verification and onboarding flow
CREATE TABLE IF NOT EXISTS public.agent_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    agency_name TEXT NOT NULL CHECK (char_length(agency_name) >= 2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL,
    submission_metadata JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS for Agent Applications
ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;

-- 3. Create the Hustler-Agent relationship state engine
CREATE TABLE IF NOT EXISTS public.hustler_agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    hustler_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')) NOT NULL,
    commission_percentage NUMERIC DEFAULT 0 NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_hustler_agent_pair UNIQUE (hustler_id, agent_id)
);

-- Enable RLS for Hustler-Agent Relationships
ALTER TABLE public.hustler_agents ENABLE ROW LEVEL SECURITY;

-- 4. Create Agent Permissions registry
CREATE TABLE IF NOT EXISTS public.agent_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    relationship_id UUID REFERENCES public.hustler_agents(id) ON DELETE CASCADE UNIQUE NOT NULL,
    manage_bookings BOOLEAN DEFAULT true NOT NULL,
    manage_listings BOOLEAN DEFAULT true NOT NULL,
    message_clients BOOLEAN DEFAULT true NOT NULL,
    analytics_access BOOLEAN DEFAULT true NOT NULL
);

-- Enable RLS for Agent Permissions
ALTER TABLE public.agent_permissions ENABLE ROW LEVEL SECURITY;

-- 5. Create Agent Commissions ledger
CREATE TABLE IF NOT EXISTS public.agent_commissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
    agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    hustler_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    commission_amount NUMERIC NOT NULL CHECK (commission_amount >= 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Commissions
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;


-- 6. TRIGGER LOGIC: AUTOMATIC NOTIFICATIONS & METRICS SYNC

-- Promote Approved Agents Trigger
CREATE OR REPLACE FUNCTION public.promote_approved_agent()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        UPDATE public.profiles
        SET is_agent = true, agency_name = NEW.agency_name
        WHERE id = NEW.user_id;

        -- Admin audit log trace
        INSERT INTO public.moderation_logs (moderator_id, action_type, target_id, target_type, reason, old_state, new_state)
        VALUES (
            NEW.reviewed_by,
            'verify_agent',
            NEW.user_id,
            'profile',
            'Agent application request approved',
            jsonb_build_object('is_agent', false, 'agency_name', null),
            jsonb_build_object('is_agent', true, 'agency_name', NEW.agency_name)
        );

        -- Send system status notification
        PERFORM public.create_notification(
            NEW.user_id,
            NEW.reviewed_by,
            'agent_approved',
            NEW.id,
            'agent_application',
            'Your application to become an Agency Manager has been approved! Welcoming you to the workspace.'
        );

    ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.moderation_logs (moderator_id, action_type, target_id, target_type, reason, old_state, new_state)
        VALUES (
            NEW.reviewed_by,
            'reject_agent',
            NEW.user_id,
            'profile',
            'Agent application request rejected',
            jsonb_build_object('status', 'pending'),
            jsonb_build_object('status', 'rejected')
        );

        -- Send status notice
        PERFORM public.create_notification(
            NEW.user_id,
            NEW.reviewed_by,
            'agent_rejected',
            NEW.id,
            'agent_application',
            'Your application to become an Agency Manager has been rejected. Please verify the registration specifications.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_promote_approved_agent ON public.agent_applications;
CREATE TRIGGER trg_promote_approved_agent
    AFTER UPDATE OF status ON public.agent_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.promote_approved_agent();


-- Handle Single-Active-Agent rule, metrics updates and invite notifications
CREATE OR REPLACE FUNCTION public.handle_hustler_agent_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Automate agent_permissions insertion
    INSERT INTO public.agent_permissions (relationship_id)
    VALUES (NEW.id);

    -- 2. Notify the Hustler that an agency is requesting access
    PERFORM public.create_notification(
        NEW.hustler_id,
        NEW.agent_id,
        'agent_request',
        NEW.id,
        'hustler_agent',
        'Agency "' || COALESCE((SELECT agency_name FROM public.profiles WHERE id = NEW.agent_id), 'Specialized Management') || '" is requesting to manage your career and bookings.'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_hustler_agent_insert ON public.hustler_agents;
CREATE TRIGGER trg_hustler_agent_insert
    AFTER INSERT ON public.hustler_agents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_hustler_agent_insert();


-- Handle active status promotion (revoke competitors) and metrics sync
CREATE OR REPLACE FUNCTION public.handle_hustler_agent_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Guard: Only intercept on status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- If status is active, revoke other relationships of the same hustler (One-Active-Agent Primary constraint)
        IF NEW.status = 'active' THEN
            -- First capture the agents who are about to be revoked
            -- to recalibrate their counts later
            UPDATE public.hustler_agents
            SET status = 'revoked'
            WHERE hustler_id = NEW.hustler_id AND id <> NEW.id AND status = 'active';

            -- Re-calc agent managed counts for ALL agents involved with this hustler
            -- This is more robust than just incrementing/decrementing
            UPDATE public.profiles p
            SET managed_hustlers_count = (
                SELECT COUNT(*) FROM public.hustler_agents ha
                WHERE ha.agent_id = p.id AND ha.status = 'active'
            )
            WHERE id IN (
                SELECT agent_id FROM public.hustler_agents 
                WHERE hustler_id = NEW.hustler_id
            );

            -- Notify new Agent
            PERFORM public.create_notification(
                NEW.agent_id,
                NEW.hustler_id,
                'agent_approved_by_hustler',
                NEW.id,
                'hustler_agent',
                'Your agency proposal has been accepted! You can now manage this Specialist''s account.'
            );

        ELSIF NEW.status = 'revoked' THEN
            -- Recalibrate the agent's managed count
            UPDATE public.profiles
            SET managed_hustlers_count = (
                SELECT COUNT(*) FROM public.hustler_agents 
                WHERE agent_id = NEW.agent_id AND status = 'active'
            )
            WHERE id = NEW.agent_id;

            -- Notify Agent
            PERFORM public.create_notification(
                NEW.agent_id,
                NEW.hustler_id,
                'agent_revoked_by_hustler',
                NEW.id,
                'hustler_agent',
                'Access revoked: The managed Specialist has disconnected from your agency.'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_hustler_agent_status_change ON public.hustler_agents;
CREATE TRIGGER trg_hustler_agent_status_change
    BEFORE UPDATE OF status ON public.hustler_agents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_hustler_agent_status_change();


-- 7. RECURSION-SAFE AGENT PERMISSIONS HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.agent_has_permission(p_hustler_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_perm BOOLEAN := FALSE;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Dynamic safe SQL to bypass RLS recursion limits
    EXECUTE 'SELECT EXISTS (
        SELECT 1 
        FROM public.hustler_agents ha
        JOIN public.agent_permissions ap ON ap.relationship_id = ha.id
        WHERE ha.agent_id = $1 
          AND ha.hustler_id = $2 
          AND ha.status = ''active''
          AND (
              ($3 = ''manage_bookings'' AND ap.manage_bookings = true) OR
              ($3 = ''manage_listings'' AND ap.manage_listings = true) OR
              ($3 = ''message_clients'' AND ap.message_clients = true) OR
              ($3 = ''analytics_access'' AND ap.analytics_access = true)
          )
    )' INTO v_has_perm USING auth.uid(), p_hustler_id, p_permission;

    RETURN v_has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. INTEGRATED DUAL-RECIPIENT ESCROW PAYOUT SPLIT (TRANSACTION LEVEL)
CREATE OR REPLACE FUNCTION secure_release_escrow(
    p_client_id UUID,
    p_hustler_id UUID,
    p_booking_id UUID,
    p_total_amount NUMERIC,
    p_payout_amount NUMERIC,
    p_platform_fee NUMERIC,
    p_reference TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_client_wallet_id UUID;
    v_hustler_wallet_id UUID;
    v_agent_wallet_id UUID;
    
    v_client_tx_id UUID;
    v_hustler_tx_id UUID;
    v_agent_tx_id UUID;
    
    v_client_balance_after NUMERIC;
    v_hustler_balance_after NUMERIC;
    v_agent_balance_after NUMERIC;
    
    v_has_active_agent BOOLEAN := FALSE;
    v_agent_id UUID;
    v_commission_percentage NUMERIC := 0;
    
    v_commission_amount NUMERIC := 0;
    v_net_hustler_amount NUMERIC;
BEGIN
    -- 1. Deduct tracker from client's wallet
    v_client_wallet_id := secure_ensure_wallet(p_client_id);
    PERFORM id FROM public.wallets WHERE id = v_client_wallet_id FOR UPDATE;
    
    UPDATE public.wallets
    SET escrow_balance = GREATEST(0, escrow_balance - p_total_amount),
        updated_at = now()
    WHERE id = v_client_wallet_id;

    -- Release the specific escrow account
    UPDATE public.escrow_accounts
    SET status = 'released',
        updated_at = now()
    WHERE booking_id = p_booking_id;

    -- Insert client payout transaction trail
    INSERT INTO public.transactions(wallet_id, user_id, type, amount, status, reference_id, metadata)
    VALUES (v_client_wallet_id, p_client_id, 'escrow_release', p_total_amount, 'completed', p_reference || '_client', jsonb_build_object('booking_id', p_booking_id))
    RETURNING id INTO v_client_tx_id;

    -- Audit trace ledger
    INSERT INTO public.ledger_entries(transaction_id, debit, credit, balance_after, description)
    VALUES (v_client_tx_id, 0, 0, (SELECT balance FROM public.wallets WHERE id = v_client_wallet_id), 'Escrow funds of ₦' || p_total_amount || ' released to Specialist: ' || p_hustler_id);

    -- 2. Check for active Agent relationship to split funds
    SELECT EXISTS (
        SELECT 1 FROM public.hustler_agents 
        WHERE hustler_id = p_hustler_id AND status = 'active'
    ) INTO v_has_active_agent;

    IF v_has_active_agent THEN
        SELECT agent_id, commission_percentage 
        INTO v_agent_id, v_commission_percentage
        FROM public.hustler_agents 
        WHERE hustler_id = p_hustler_id AND status = 'active'
        LIMIT 1;
        
        -- Compute splits
        v_commission_amount := ROUND((p_payout_amount * v_commission_percentage / 100.0), 2);
    END IF;
    
    v_net_hustler_amount := p_payout_amount - v_commission_amount;

    -- 3. Release funds to Hustler (Minus Commission)
    v_hustler_wallet_id := secure_ensure_wallet(p_hustler_id);
    SELECT balance INTO v_hustler_balance_after FROM public.wallets WHERE id = v_hustler_wallet_id FOR UPDATE;
    
    v_hustler_balance_after := v_hustler_balance_after + v_net_hustler_amount;

    UPDATE public.wallets
    SET balance = v_hustler_balance_after,
        available_balance = v_hustler_balance_after,
        lifetime_earnings = lifetime_earnings + v_net_hustler_amount,
        updated_at = now()
    WHERE id = v_hustler_wallet_id;

    -- Record Hustler payout transaction
    INSERT INTO public.transactions(wallet_id, user_id, type, amount, status, reference_id, metadata)
    VALUES (
        v_hustler_wallet_id, 
        p_hustler_id, 
        'payment', 
        v_net_hustler_amount, 
        'completed', 
        p_reference || '_hustler', 
        jsonb_build_object(
            'booking_id', p_booking_id, 
            'commission_deducted', v_commission_amount, 
            'commission_percentage', v_commission_percentage, 
            'agent_id', v_agent_id
        )
    )
    RETURNING id INTO v_hustler_tx_id;

    -- Record Hustler Ledger entry
    INSERT INTO public.ledger_entries(transaction_id, debit, credit, balance_after, description)
    VALUES (
        v_hustler_tx_id, 
        0, 
        v_net_hustler_amount, 
        v_hustler_balance_after, 
        'Escrow payout received for booking: ' || p_booking_id || '. Platform fee: ₦' || p_platform_fee || '. Agency commission: ₦' || v_commission_amount
    );

    -- 4. Route Commission to Agent (If applicable)
    IF v_commission_amount > 0 THEN
        v_agent_wallet_id := secure_ensure_wallet(v_agent_id);
        SELECT balance INTO v_agent_balance_after FROM public.wallets WHERE id = v_agent_wallet_id FOR UPDATE;
        
        v_agent_balance_after := v_agent_balance_after + v_commission_amount;

        UPDATE public.wallets
        SET balance = v_agent_balance_after,
            available_balance = v_agent_balance_after,
            lifetime_earnings = lifetime_earnings + v_commission_amount,
            updated_at = now()
        WHERE id = v_agent_wallet_id;

        -- Record Agent commission transaction
        INSERT INTO public.transactions(wallet_id, user_id, type, amount, status, reference_id, metadata)
        VALUES (
            v_agent_wallet_id, 
            v_agent_id, 
            'earning', 
            v_commission_amount, 
            'completed', 
            p_reference || '_agent_commission', 
            jsonb_build_object(
                'booking_id', p_booking_id, 
                'hustler_id', p_hustler_id, 
                'commission_percentage', v_commission_percentage, 
                'original_payout_amount', p_payout_amount
            )
        )
        RETURNING id INTO v_agent_tx_id;

        -- Record Agent Ledger entry
        INSERT INTO public.ledger_entries(transaction_id, debit, credit, balance_after, description)
        VALUES (
            v_agent_tx_id, 
            0, 
            v_commission_amount, 
            v_agent_balance_after, 
            'Agency commission (' || v_commission_percentage || '%) for booking: ' || p_booking_id || ' by Specialist: ' || p_hustler_id
        );

        -- Insert record inside agent_commissions tracker
        INSERT INTO public.agent_commissions (booking_id, agent_id, hustler_id, commission_amount, status)
        VALUES (p_booking_id, v_agent_id, p_hustler_id, v_commission_amount, 'paid');

        -- Dispatch split payout notifications
        PERFORM public.create_notification(
            v_agent_id,
            p_hustler_id,
            'commission_paid',
            p_booking_id,
            'booking',
            'In-escrow split completed! Commission of ₦' || v_commission_amount || ' earned from Specialist ' || p_hustler_id || ' (Booking Ref: ' || p_booking_id || ').'
        );

        PERFORM public.create_notification(
            p_hustler_id,
            v_agent_id,
            'commission_payout',
            p_booking_id,
            'booking',
            'Escrow released. Agency commission share of ₦' || v_commission_amount || ' (' || v_commission_percentage || '%) has been securely split.'
        );
    END IF;

    -- 5. Mark Booking record completed/released safely
    UPDATE public.bookings
    SET status = 'completed', escrow_status = 'released'
    WHERE id = p_booking_id;

    RETURN TRUE;
END;
$$;


-- 9. RECURSION-FREE AGENT CHAT OVERRIDE
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- 1. Direct participant lookup
    SELECT EXISTS (
        SELECT 1 
        FROM public.conversation_participants 
        WHERE conversation_id = p_conversation_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        RETURN TRUE;
    END IF;

    -- 2. Authorized managed Specialist delegation lookup (with 'message_clients' permission)
    SELECT EXISTS (
        SELECT 1
        FROM public.conversation_participants cp
        JOIN public.hustler_agents ha ON ha.hustler_id = cp.user_id
        JOIN public.agent_permissions ap ON ap.relationship_id = ha.id
        WHERE cp.conversation_id = p_conversation_id
          AND ha.agent_id = p_user_id
          AND ha.status = 'active'
          AND ap.message_clients = true
    ) INTO v_exists;

    RETURN v_exists;
END;
$$;


-- 10. SECURITY POLICIES (RLS COUPLING FOR MULTI-TENANT AGENCY PRIVILEGES)

-- Agent Applications Permissions
DROP POLICY IF EXISTS "Applicants can see own application" ON public.agent_applications;
CREATE POLICY "Applicants can see own application" ON public.agent_applications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Applicants can insert own application" ON public.agent_applications;
CREATE POLICY "Applicants can insert own application" ON public.agent_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Moderators/Admins can see/manage agent applications" ON public.agent_applications;
CREATE POLICY "Moderators/Admins can see/manage agent applications" ON public.agent_applications
    FOR ALL USING (public.is_caller_admin_or_moderator());

-- Hustler-Agent Relationships Permissions
DROP POLICY IF EXISTS "Clients can view their own relationships" ON public.hustler_agents;
CREATE POLICY "Clients can view their own relationships" ON public.hustler_agents
    FOR SELECT USING (auth.uid() = hustler_id OR auth.uid() = agent_id OR public.is_caller_admin_or_moderator());

DROP POLICY IF EXISTS "Agents can invite/propose management" ON public.hustler_agents;
CREATE POLICY "Agents can invite/propose management" ON public.hustler_agents
    FOR INSERT WITH CHECK (
        auth.uid() = agent_id 
        AND public.is_caller_agent()
        AND status = 'pending'
    );

DROP POLICY IF EXISTS "Hustlers can accept and anyone involved can revoke" ON public.hustler_agents;
CREATE POLICY "Hustlers can accept and anyone involved can revoke" ON public.hustler_agents
    FOR UPDATE USING (auth.uid() = hustler_id OR auth.uid() = agent_id OR public.is_caller_admin_or_moderator());

-- Agent Permissions Modification Rules
DROP POLICY IF EXISTS "Involved parties can view flags" ON public.agent_permissions;
CREATE POLICY "Involved parties can view flags" ON public.agent_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.hustler_agents ha
            WHERE ha.id = relationship_id AND (ha.hustler_id = auth.uid() OR ha.agent_id = auth.uid())
        ) OR public.is_caller_admin_or_moderator()
    );

DROP POLICY IF EXISTS "Specialists can alter agent permission boundaries" ON public.agent_permissions;
CREATE POLICY "Specialists can alter agent permission boundaries" ON public.agent_permissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.hustler_agents ha
            WHERE ha.id = relationship_id AND ha.hustler_id = auth.uid()
        )
    );

-- Commission Record Permissions
DROP POLICY IF EXISTS "Involved members can view commission list" ON public.agent_commissions;
CREATE POLICY "Involved members can view commission list" ON public.agent_commissions
    FOR SELECT USING (auth.uid() = hustler_id OR auth.uid() = agent_id OR public.is_caller_admin_or_moderator());


-- 11. ENHANCED GIGS, PRODUCTS, AND BOOKING SELECTION POLICIES (DELEGATED MANAGEMENT ACTION)

-- Allow select/update on bookings for authorized agents
DROP POLICY IF EXISTS "Participants can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings as buyer or seller" ON public.bookings;
CREATE POLICY "Users can view their own bookings as buyer or seller" ON public.bookings 
    FOR SELECT USING (
        auth.uid() = buyer_id 
        OR auth.uid() = seller_id 
        OR public.agent_has_permission(seller_id, 'analytics_access')
        OR public.agent_has_permission(seller_id, 'manage_bookings')
    );

DROP POLICY IF EXISTS "Participants can update their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Participants can update their own bookings" ON public.bookings;
CREATE POLICY "Participants can update their own bookings" ON public.bookings 
    FOR UPDATE USING (
        auth.uid() = buyer_id 
        OR auth.uid() = seller_id 
        OR public.agent_has_permission(seller_id, 'manage_bookings')
    );

-- Allow select/all management on Gigs
DROP POLICY IF EXISTS "Anyone can view active gigs" ON public.gigs;
CREATE POLICY "Anyone can view active gigs" ON public.gigs 
    FOR SELECT USING (
        is_active = true 
        OR auth.uid() = user_id 
        OR public.agent_has_permission(user_id, 'analytics_access')
        OR public.agent_has_permission(user_id, 'manage_listings')
    );

DROP POLICY IF EXISTS "Users can manage their own gigs" ON public.gigs;
CREATE POLICY "Users can manage their own gigs" ON public.gigs 
    FOR ALL USING (
        auth.uid() = user_id 
        OR public.agent_has_permission(user_id, 'manage_listings')
    );

-- Allow select/all on Services (Active listings)
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services 
    FOR SELECT USING (
        -- Bypassed for admins/moderators in dual-layer secure-discovery matching
        public.is_caller_admin_or_moderator()
        OR
        owner_id = auth.uid()
        OR
        public.agent_has_permission(owner_id, 'analytics_access')
        OR
        (
            is_active = true 
            AND NOT public.is_user_suspended(owner_id)
            AND NOT public.is_content_hidden(id)
        )
    );

DROP POLICY IF EXISTS "Agents or specialists can manage services" ON public.services;
CREATE POLICY "Agents or specialists can manage services" ON public.services
    FOR ALL USING (
        owner_id = auth.uid()
        OR public.agent_has_permission(owner_id, 'manage_listings')
    );

-- Allow select/all on Products (Active listings)
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products 
    FOR SELECT USING (
        public.is_caller_admin_or_moderator()
        OR
        owner_id = auth.uid()
        OR
        public.agent_has_permission(owner_id, 'analytics_access')
        OR
        (
            is_active = true 
            AND NOT public.is_user_suspended(owner_id)
            AND NOT public.is_content_hidden(id)
        )
    );

DROP POLICY IF EXISTS "Agents or specialists can manage products" ON public.products;
CREATE POLICY "Agents or specialists can manage products" ON public.products
    FOR ALL USING (
        owner_id = auth.uid()
        OR public.agent_has_permission(owner_id, 'manage_listings')
    );

-- Allow select/all on Training program listings
DROP POLICY IF EXISTS "Anyone can view active training" ON public.training;
CREATE POLICY "Anyone can view active training" ON public.training 
    FOR SELECT USING (
        public.is_caller_admin_or_moderator()
        OR
        owner_id = auth.uid()
        OR
        public.agent_has_permission(owner_id, 'analytics_access')
        OR
        (
            is_active = true 
            AND NOT public.is_user_suspended(owner_id)
            AND NOT public.is_content_hidden(id)
        )
    );

DROP POLICY IF EXISTS "Agents or specialists can manage training programs" ON public.training;
CREATE POLICY "Agents or specialists can manage training programs" ON public.training
    FOR ALL USING (
        owner_id = auth.uid()
        OR public.agent_has_permission(owner_id, 'manage_listings')
    );
