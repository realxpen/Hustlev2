-- Migration: Add Milestones and Location to Bookings
-- This enhances the escrow system with multi-step payouts and location tracking.

-- Step 1: Add location fields to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS delivery_mode TEXT CHECK (delivery_mode IN ('online', 'physical', 'home_service'));

-- Step 2: Create milestones table
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',              -- Not started
        'in_progress',          -- Hustler working on it
        'awaiting_approval',    -- Hustler finished, waiting for buyer release
        'released',             -- Funds sent to hustler
        'disputed'              -- Buyer rejected or flagged
    )),
    delivered_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 3: Security Rules for Milestones
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones for their bookings"
    ON public.milestones FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE id = booking_id 
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

CREATE POLICY "Hustlers can update milestone status"
    ON public.milestones FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE id = booking_id 
            AND seller_id = auth.uid()
        )
    );

CREATE POLICY "Buyers can release milestones"
    ON public.milestones FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE id = booking_id 
            AND buyer_id = auth.uid()
        )
    );

-- Step 4: Triggers for Milestones
CREATE TRIGGER tr_milestones_updated_at
BEFORE UPDATE ON public.milestones
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Step 6: Create default milestone for new bookings
CREATE OR REPLACE FUNCTION public.tr_create_default_milestone()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.milestones (booking_id, title, amount, status)
    VALUES (NEW.id, 'Project Completion', NEW.total_price, 'in_progress');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_create_default_milestone
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.tr_create_default_milestone();
CREATE OR REPLACE FUNCTION public.tr_notify_milestone_change()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient UUID;
    v_actor UUID;
    v_type TEXT;
    v_msg TEXT;
    v_booking public.bookings;
BEGIN
    SELECT * INTO v_booking FROM public.bookings WHERE id = NEW.booking_id;
    
    IF OLD.status != NEW.status THEN
        IF NEW.status = 'awaiting_approval' THEN
            v_recipient := v_booking.buyer_id;
            v_actor := v_booking.seller_id;
            v_type := 'milestone_delivered';
            v_msg := 'Milestone "' || NEW.title || '" has been delivered. Review and release funds.';
        ELSIF NEW.status = 'released' THEN
            v_recipient := v_booking.seller_id;
            v_actor := v_booking.buyer_id;
            v_type := 'milestone_released';
            v_msg := 'Funds for "' || NEW.title || '" have been released to your wallet.';
        ELSIF NEW.status = 'disputed' THEN
            v_recipient := v_booking.seller_id;
            v_actor := v_booking.buyer_id;
            v_type := 'milestone_disputed';
            v_msg := 'Milestone "' || NEW.title || '" has been flagged or disputed.';
        END IF;
    END IF;

    IF v_recipient IS NOT NULL THEN
        PERFORM public.create_notification(
            v_recipient,
            v_actor,
            v_type,
            NEW.id,
            'milestone',
            v_msg
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_notify_milestone_change
AFTER UPDATE ON public.milestones
FOR EACH ROW
EXECUTE FUNCTION public.tr_notify_milestone_change();
