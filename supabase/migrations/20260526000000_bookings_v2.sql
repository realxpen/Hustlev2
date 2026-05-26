-- Migration: Unified Bookings and Order System Foundation
-- This migration implements the architecture for a multi-tenant marketplace order lifecycle.

-- Drop legacy bookings table to rebuild with unified architecture
DROP TABLE IF EXISTS public.bookings CASCADE;

-- Step 1: Create the new bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    listing_id UUID NOT NULL, -- Can be from services, products, or training
    listing_type TEXT NOT NULL CHECK (listing_type IN ('service', 'product', 'training')),
    
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    
    -- Order Lifecycle Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Waiting for seller acceptance
        'accepted',     -- Seller confirmed
        'rejected',     -- Seller did not accept
        'in_progress',  -- Active work being done
        'completed',    -- Delivered/Finished
        'cancelled',    -- Cancelled by buyer or system before completion
        'refunded'      -- Payment returned to buyer
    )),
    
    -- Escrow Architecture
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
    escrow_status TEXT NOT NULL DEFAULT 'none' CHECK (escrow_status IN ('none', 'held', 'released', 'refunded')),
    release_status TEXT NOT NULL DEFAULT 'pending' CHECK (release_status IN ('pending', 'released', 'disputed')),
    
    -- Notes and Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 5: Create training enrollments table
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    training_id UUID REFERENCES public.training(id) ON DELETE CASCADE NOT NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, training_id)
);

-- Step 10: Security Rules (RLS)

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Bookings RLS
CREATE POLICY "Users can view their own bookings as buyer or seller"
    ON public.bookings FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = buyer_id AND buyer_id != seller_id);

CREATE POLICY "Participants can update their own bookings"
    ON public.bookings FOR UPDATE
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Enrollments RLS
CREATE POLICY "Users can view their own enrollments"
    ON public.enrollments FOR SELECT
    USING (auth.uid() = user_id);

-- Step 11: Performance Optimizations
CREATE INDEX idx_bookings_buyer_id ON public.bookings(buyer_id);
CREATE INDEX idx_bookings_seller_id ON public.bookings(seller_id);
CREATE INDEX idx_bookings_listing_id ON public.bookings(listing_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Step 4: Product Inventory Management Function (Atomic updates)
CREATE OR REPLACE FUNCTION public.update_product_inventory()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.listing_type = 'product' AND NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
        UPDATE public.products
        SET inventory_count = inventory_count - NEW.quantity
        WHERE id = NEW.listing_id AND inventory_count >= NEW.quantity;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Insufficient inventory for product %', NEW.listing_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_inventory_on_booking
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_product_inventory();

-- Step 8: Notification Integration (SQL Triggers)

CREATE OR REPLACE FUNCTION public.tr_notify_booking_change()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient UUID;
    v_actor UUID;
    v_type TEXT;
    v_msg TEXT;
BEGIN
    -- Determine who to notify and what message to send
    IF TG_OP = 'INSERT' THEN
        v_recipient := NEW.seller_id;
        v_actor := NEW.buyer_id;
        v_type := 'booking_new';
        v_msg := 'New booking request received';
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            IF NEW.status = 'accepted' THEN
                v_recipient := NEW.buyer_id;
                v_actor := NEW.seller_id;
                v_type := 'booking_accepted';
                v_msg := 'Your booking has been accepted';
            ELSIF NEW.status = 'rejected' THEN
                v_recipient := NEW.buyer_id;
                v_actor := NEW.seller_id;
                v_type := 'booking_rejected';
                v_msg := 'Your booking was not accepted';
            ELSIF NEW.status = 'completed' THEN
                v_recipient := NEW.buyer_id;
                v_actor := NEW.seller_id;
                v_type := 'booking_completed';
                v_msg := 'Your order is complete!';
            ELSE
                RETURN NEW;
            END IF;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    IF v_recipient IS NOT NULL THEN
        PERFORM public.create_notification(
            v_recipient,
            v_actor,
            v_type,
            NEW.id,
            'booking',
            v_msg
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_notify_booking_change
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.tr_notify_booking_change();

-- Trigger for updated_at
CREATE TRIGGER tr_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
