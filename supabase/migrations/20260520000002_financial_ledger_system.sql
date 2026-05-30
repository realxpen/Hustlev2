-- Alter existing wallets table to support 'balance' column
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0 NOT NULL CHECK (balance >= 0);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund', 'escrow_hold', 'escrow_release')) NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending' NOT NULL,
    reference_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create ledger_entries table
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    debit NUMERIC DEFAULT 0 NOT NULL,
    credit NUMERIC DEFAULT 0 NOT NULL,
    balance_after NUMERIC NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create escrow_accounts table
CREATE TABLE IF NOT EXISTS public.escrow_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL UNIQUE,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    status TEXT CHECK (status IN ('held', 'released', 'refunded')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add currency preferences to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'USD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_currency TEXT DEFAULT 'USD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_country TEXT;
-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;

-- Post RLS Policies for transactions
DROP POLICY IF EXISTS "Users can view their own transaction history" ON public.transactions;
CREATE POLICY "Users can view their own transaction history"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Post RLS Policies for ledger_entries
DROP POLICY IF EXISTS "Users can view ledger entries related to their transactions" ON public.ledger_entries;
CREATE POLICY "Users can view ledger entries related to their transactions"
    ON public.ledger_entries FOR SELECT
    USING (
        transaction_id IN (
            SELECT id FROM public.transactions WHERE user_id = auth.uid()
        )
    );

-- Post RLS Policies for escrow_accounts
DROP POLICY IF EXISTS "Participants can view escrow balances" ON public.escrow_accounts;
CREATE POLICY "Participants can view escrow balances"
    ON public.escrow_accounts FOR SELECT
    USING (
        booking_id IN (
            SELECT id FROM public.bookings WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
        )
    );

-- --- IMMUTABILITY & SAFETY ENFORCEMENT ---

-- 0. Ensure additional balance columns are constrained (reinforce)
ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_available_balance_check;
ALTER TABLE public.wallets ADD CONSTRAINT wallets_available_balance_check CHECK (available_balance >= 0);
ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_escrow_balance_check;
ALTER TABLE public.wallets ADD CONSTRAINT wallets_escrow_balance_check CHECK (escrow_balance >= 0);

-- 1. Create a function to block updates and deletes on immutable tables
CREATE OR REPLACE FUNCTION public.prevent_immutable_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Database Governance Error: Table % is immutable and records cannot be modified or deleted.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- 2. Apply immutability to ledger_entries
DROP TRIGGER IF EXISTS ledger_entries_immutable ON public.ledger_entries;
CREATE TRIGGER ledger_entries_immutable 
BEFORE UPDATE OR DELETE ON public.ledger_entries
FOR EACH ROW EXECUTE PROCEDURE public.prevent_immutable_modification();

-- 3. Apply immutability to transactions
DROP TRIGGER IF EXISTS transactions_immutable ON public.transactions;
CREATE TRIGGER transactions_immutable 
BEFORE UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE PROCEDURE public.prevent_immutable_modification();

-- Secure RPC Database Functions for Walnut operations to avoid race conditions and maintain database trust block.

-- 1. Ensure wallets can be created/retrieved safely
CREATE OR REPLACE FUNCTION secure_ensure_wallet(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    INSERT INTO public.wallets (user_id, balance, available_balance)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = p_user_id;

    -- Ensure 'balance' is set if it was NULL (to support legacy records migration)
    UPDATE public.wallets
    SET balance = COALESCE(balance, available_balance, 0)
    WHERE id = v_wallet_id AND balance IS NULL;

    RETURN v_wallet_id;
END;
$$;

-- 2. Process deposit with ledger recording atomically
CREATE OR REPLACE FUNCTION secure_process_deposit(
    p_user_id UUID,
    p_amount NUMERIC,
    p_reference TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
    v_transaction_id UUID;
    v_balance_after NUMERIC;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than zero';
    END IF;

    v_wallet_id := secure_ensure_wallet(p_user_id);

    -- Atomically lock the wallet row for update
    SELECT balance INTO v_balance_after FROM public.wallets WHERE id = v_wallet_id FOR UPDATE;

    -- Calculate new balance
    v_balance_after := v_balance_after + p_amount;

    -- Update wallet state
    UPDATE public.wallets
    SET balance = v_balance_after,
        available_balance = v_balance_after,
        updated_at = now()
    WHERE id = v_wallet_id;

    -- Create transaction record under the transactions table
    INSERT INTO public.transactions(wallet_id, user_id, type, amount, status, reference_id, metadata)
    VALUES (v_wallet_id, p_user_id, 'deposit', p_amount, 'completed', p_reference, p_metadata)
    RETURNING id INTO v_transaction_id;

    -- Create double-entry immutable ledger entry (Deposit is credit to user's wallet)
    INSERT INTO public.ledger_entries(transaction_id, debit, credit, balance_after, description)
    VALUES (v_transaction_id, 0, p_amount, v_balance_after, 'Deposit of funds via reference: ' || COALESCE(p_reference, 'N/A'));

    RETURN v_transaction_id;
END;
$$;

-- 3. Process withdrawal with ledger recording atomically
CREATE OR REPLACE FUNCTION secure_process_withdrawal(
    p_user_id UUID,
    p_amount NUMERIC,
    p_reference TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
    v_transaction_id UUID;
    v_balance_after NUMERIC;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than zero';
    END IF;

    v_wallet_id := secure_ensure_wallet(p_user_id);

    -- Atomically lock row for update
    SELECT balance INTO v_balance_after FROM public.wallets WHERE id = v_wallet_id FOR UPDATE;

    IF v_balance_after < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds for withdrawal';
    END IF;

    -- Calculate balance after
    v_balance_after := v_balance_after - p_amount;

    -- Update wallet
    UPDATE public.wallets
    SET balance = v_balance_after,
        available_balance = v_balance_after,
        updated_at = now()
    WHERE id = v_wallet_id;

    -- Create withdrawal transactions record
    INSERT INTO public.transactions(wallet_id, user_id, type, amount, status, reference_id, metadata)
    VALUES (v_wallet_id, p_user_id, 'withdrawal', p_amount, 'completed', p_reference, p_metadata)
    RETURNING id INTO v_transaction_id;

    -- Debit from user account ledger
    INSERT INTO public.ledger_entries(transaction_id, debit, credit, balance_after, description)
    VALUES (v_transaction_id, p_amount, 0, v_balance_after, 'Withdrawal of funds via reference: ' || COALESCE(p_reference, 'N/A'));

    RETURN v_transaction_id;
END;
$$;

-- 4. Hold Escrow: Deduct available user balance and hold in escrow_accounts
CREATE OR REPLACE FUNCTION secure_hold_escrow(
    p_user_id UUID,
    p_booking_id UUID,
    p_amount NUMERIC,
    p_reference TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
    v_transaction_id UUID;
    v_balance_after NUMERIC;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than zero';
    END IF;

    v_wallet_id := secure_ensure_wallet(p_user_id);

    -- Lock wallet for update
    SELECT balance INTO v_balance_after FROM public.wallets WHERE id = v_wallet_id FOR UPDATE;

    IF v_balance_after < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds to hold in escrow';
    END IF;

    -- Deduct balance
    v_balance_after := v_balance_after - p_amount;

    -- Update client wallet (balance reduced, escrow balance in public.wallets enhanced for tracking purposes)
    UPDATE public.wallets
    SET balance = v_balance_after,
        available_balance = v_balance_after,
        escrow_balance = escrow_balance + p_amount,
        lifetime_spending = lifetime_spending + p_amount,
        updated_at = now()
    WHERE id = v_wallet_id;

    -- Insert record into public.escrow_accounts
    INSERT INTO public.escrow_accounts (booking_id, amount, status)
    VALUES (p_booking_id, p_amount, 'held')
    ON CONFLICT (booking_id) 
    DO UPDATE SET amount = public.escrow_accounts.amount + EXCLUDED.amount, status = 'held', updated_at = now();

    -- Create Transaction Record
    INSERT INTO public.transactions(wallet_id, user_id, type, amount, status, reference_id, metadata)
    VALUES (v_wallet_id, p_user_id, 'escrow_hold', p_amount, 'completed', p_reference, jsonb_build_object('booking_id', p_booking_id))
    RETURNING id INTO v_transaction_id;

    -- Ledger transaction creation
    INSERT INTO public.ledger_entries(transaction_id, debit, credit, balance_after, description)
    VALUES (v_transaction_id, p_amount, 0, v_balance_after, 'Escrow held for booking: ' || p_booking_id);

    -- Update Booking model fields
    UPDATE public.bookings
    SET payment_status = 'paid', escrow_status = 'held'
    WHERE id = p_booking_id;

    RETURN v_transaction_id;
END;
$$;

-- 5. Release Escrow: Release held escrow funds to hustler's wallet balance
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
    v_client_tx_id UUID;
    v_hustler_tx_id UUID;
    v_client_balance_after NUMERIC;
    v_hustler_balance_after NUMERIC;
BEGIN
    -- 1. Deduct from client's escrow tracker (their main balance is already deducted, now we deduct from the tracked escrow fields)
    v_client_wallet_id := secure_ensure_wallet(p_client_id);
    
    -- Lock client wallet for atomic update of escrow tracking
    PERFORM id FROM public.wallets WHERE id = v_client_wallet_id FOR UPDATE;
    
    UPDATE public.wallets
    SET escrow_balance = GREATEST(0, escrow_balance - p_total_amount),
        updated_at = now()
    WHERE id = v_client_wallet_id;

    -- Update escrow_accounts status
    UPDATE public.escrow_accounts
    SET status = 'released',
        updated_at = now()
    WHERE booking_id = p_booking_id;

    -- Create client side audit transaction
    INSERT INTO public.transactions(wallet_id, user_id, type, amount, status, reference_id, metadata)
    VALUES (v_client_wallet_id, p_client_id, 'escrow_release', p_total_amount, 'completed', p_reference || '_client', jsonb_build_object('booking_id', p_booking_id))
    RETURNING id INTO v_client_tx_id;

    -- Ledger trace for client (no further balance action since it was deducted when locked)
    INSERT INTO public.ledger_entries(transaction_id, debit, credit, balance_after, description)
    VALUES (v_client_tx_id, 0, 0, (SELECT balance FROM public.wallets WHERE id = v_client_wallet_id), 'Escrow funds of $' || p_total_amount || ' released to Specialist: ' || p_hustler_id);

    -- 2. Add to hustler's wallet balance
    v_hustler_wallet_id := secure_ensure_wallet(p_hustler_id);

    -- Lock rows for atomic update
    SELECT balance INTO v_hustler_balance_after FROM public.wallets WHERE id = v_hustler_wallet_id FOR UPDATE;
    v_hustler_balance_after := v_hustler_balance_after + p_payout_amount;

    UPDATE public.wallets
    SET balance = v_hustler_balance_after,
        available_balance = v_hustler_balance_after,
        lifetime_earnings = lifetime_earnings + p_payout_amount,
        updated_at = now()
    WHERE id = v_hustler_wallet_id;

    -- Insert transactions for hustler
    INSERT INTO public.transactions(wallet_id, user_id, type, amount, status, reference_id, metadata)
    VALUES (v_hustler_wallet_id, p_hustler_id, 'payment', p_payout_amount, 'completed', p_reference || '_hustler', jsonb_build_object('booking_id', p_booking_id))
    RETURNING id INTO v_hustler_tx_id;

    -- Ledger Entry for Hustler: credit account balance with earnings
    INSERT INTO public.ledger_entries(transaction_id, debit, credit, balance_after, description)
    VALUES (v_hustler_tx_id, 0, p_payout_amount, v_hustler_balance_after, 'Escrow payout received for booking: ' || p_booking_id || '. Platform fee deducted: $' || p_platform_fee);

    -- Keep bookings status accurate
    UPDATE public.bookings
    SET status = 'completed', escrow_status = 'released'
    WHERE id = p_booking_id;

    RETURN TRUE;
END;
$$;

-- 6. Refund Escrow: Refund held escrow funds back to client's wallet balance
CREATE OR REPLACE FUNCTION secure_refund_escrow(
    p_client_id UUID,
    p_booking_id UUID,
    p_amount NUMERIC,
    p_reference TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_client_wallet_id UUID;
    v_transaction_id UUID;
    v_balance_after NUMERIC;
BEGIN
    v_client_wallet_id := secure_ensure_wallet(p_client_id);

    -- Lock record for atomic write
    SELECT balance INTO v_balance_after FROM public.wallets WHERE id = v_client_wallet_id FOR UPDATE;
    v_balance_after := v_balance_after + p_amount;

    -- Add back to available scale, subtract from escrow
    UPDATE public.wallets
    SET balance = v_balance_after,
        available_balance = v_balance_after,
        escrow_balance = GREATEST(0, escrow_balance - p_amount),
        lifetime_spending = GREATEST(0, lifetime_spending - p_amount),
        updated_at = now()
    WHERE id = v_client_wallet_id;

    -- Update escrow_accounts
    UPDATE public.escrow_accounts
    SET status = 'refunded',
        updated_at = now()
    WHERE booking_id = p_booking_id;

    -- Create refund transactions
    INSERT INTO public.transactions(wallet_id, user_id, type, amount, status, reference_id, metadata)
    VALUES (v_client_wallet_id, p_client_id, 'refund', p_amount, 'completed', p_reference, jsonb_build_object('booking_id', p_booking_id))
    RETURNING id INTO v_transaction_id;

    -- Ledger audit tracking
    INSERT INTO public.ledger_entries(transaction_id, debit, credit, balance_after, description)
    VALUES (v_transaction_id, 0, p_amount, v_balance_after, 'Refunded escrow funds back to client wallet for booking ID: ' || p_booking_id);

    -- Keep bookings status accurate
    UPDATE public.bookings
    SET status = 'cancelled', escrow_status = 'refunded'
    WHERE id = p_booking_id;

    RETURN TRUE;
END;
$$;
