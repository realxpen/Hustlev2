-- Create Wallets Table
CREATE TABLE public.wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    available_balance NUMERIC DEFAULT 0 NOT NULL CHECK (available_balance >= 0),
    escrow_balance NUMERIC DEFAULT 0 NOT NULL CHECK (escrow_balance >= 0),
    lifetime_earnings NUMERIC DEFAULT 0 NOT NULL CHECK (lifetime_earnings >= 0),
    lifetime_spending NUMERIC DEFAULT 0 NOT NULL CHECK (lifetime_spending >= 0),
    currency TEXT DEFAULT 'USD' NOT NULL,
    wallet_status TEXT CHECK (wallet_status IN ('active', 'suspended')) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Wallet Transactions Table
CREATE TABLE public.wallet_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('deposit', 'withdrawal', 'escrow_lock', 'escrow_release', 'escrow_refund', 'payment', 'payout', 'fee', 'transfer')) NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending' NOT NULL,
    reference TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Triggers for updated_at
CREATE TRIGGER update_wallets_modtime
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_wallet_transactions_modtime
BEFORE UPDATE ON public.wallet_transactions
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Secure RPCs for atomic operations

-- 1. Create Wallet
CREATE OR REPLACE FUNCTION ensure_wallet_exists(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    INSERT INTO public.wallets (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = p_user_id;
    RETURN v_wallet_id;
END;
$$;

-- 2. Process Deposit
CREATE OR REPLACE FUNCTION process_deposit(p_user_id UUID, p_amount NUMERIC, p_reference TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
    v_transaction_id UUID;
BEGIN
    IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

    v_wallet_id := ensure_wallet_exists(p_user_id);

    UPDATE public.wallets
    SET available_balance = available_balance + p_amount,
        updated_at = now()
    WHERE id = v_wallet_id;

    INSERT INTO public.wallet_transactions(wallet_id, user_id, type, amount, status, reference)
    VALUES (v_wallet_id, p_user_id, 'deposit', p_amount, 'completed', p_reference)
    RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
END;
$$;

-- 3. Lock Escrow
CREATE OR REPLACE FUNCTION lock_escrow(p_user_id UUID, p_booking_id UUID, p_amount NUMERIC, p_reference TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
    v_transaction_id UUID;
BEGIN
    IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

    v_wallet_id := ensure_wallet_exists(p_user_id);

    -- This will fail if available_balance < p_amount due to CHECK constraint
    UPDATE public.wallets
    SET available_balance = available_balance - p_amount,
        escrow_balance = escrow_balance + p_amount,
        lifetime_spending = lifetime_spending + p_amount,
        updated_at = now()
    WHERE id = v_wallet_id;

    INSERT INTO public.wallet_transactions(wallet_id, user_id, booking_id, type, amount, status, reference)
    VALUES (v_wallet_id, p_user_id, p_booking_id, 'escrow_lock', p_amount, 'completed', p_reference)
    RETURNING id INTO v_transaction_id;

    -- Update booking payment status
    UPDATE public.bookings 
    SET payment_status = 'paid', escrow_status = 'locked' 
    WHERE id = p_booking_id;

    RETURN v_transaction_id;
END;
$$;

-- 4. Release Escrow
CREATE OR REPLACE FUNCTION release_escrow(p_client_id UUID, p_hustler_id UUID, p_booking_id UUID, p_total_amount NUMERIC, p_payout_amount NUMERIC, p_platform_fee NUMERIC, p_reference TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_client_wallet_id UUID;
    v_hustler_wallet_id UUID;
BEGIN
    -- Deduct from client escrow
    SELECT id INTO v_client_wallet_id FROM public.wallets WHERE user_id = p_client_id FOR UPDATE;
    
    UPDATE public.wallets
    SET escrow_balance = escrow_balance - p_total_amount,
        updated_at = now()
    WHERE id = v_client_wallet_id;

    INSERT INTO public.wallet_transactions(wallet_id, user_id, booking_id, type, amount, status, reference)
    VALUES (v_client_wallet_id, p_client_id, p_booking_id, 'escrow_release', p_total_amount, 'completed', p_reference || '_client');

    -- Add to hustler available balance
    v_hustler_wallet_id := ensure_wallet_exists(p_hustler_id);

    UPDATE public.wallets
    SET available_balance = available_balance + p_payout_amount,
        lifetime_earnings = lifetime_earnings + p_payout_amount,
        updated_at = now()
    WHERE id = v_hustler_wallet_id;

    INSERT INTO public.wallet_transactions(wallet_id, user_id, booking_id, type, amount, status, reference)
    VALUES (v_hustler_wallet_id, p_hustler_id, p_booking_id, 'payout', p_payout_amount, 'completed', p_reference || '_hustler_payout');

    -- Update booking
    UPDATE public.bookings 
    SET status = 'completed', escrow_status = 'released' 
    WHERE id = p_booking_id;

    RETURN TRUE;
END;
$$;

-- 5. Refund Escrow
CREATE OR REPLACE FUNCTION refund_escrow(p_client_id UUID, p_booking_id UUID, p_amount NUMERIC, p_reference TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_client_wallet_id UUID;
BEGIN
    SELECT id INTO v_client_wallet_id FROM public.wallets WHERE user_id = p_client_id FOR UPDATE;
    
    UPDATE public.wallets
    SET escrow_balance = escrow_balance - p_amount,
        available_balance = available_balance + p_amount,
        lifetime_spending = lifetime_spending - p_amount,
        updated_at = now()
    WHERE id = v_client_wallet_id;

    INSERT INTO public.wallet_transactions(wallet_id, user_id, booking_id, type, amount, status, reference)
    VALUES (v_client_wallet_id, p_client_id, p_booking_id, 'escrow_refund', p_amount, 'completed', p_reference);

    -- Update booking
    UPDATE public.bookings 
    SET escrow_status = 'refunded' 
    WHERE id = p_booking_id;

    RETURN TRUE;
END;
$$;
