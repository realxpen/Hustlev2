-- Migration: Concurrency Controls and Atomic Inventory Management
-- Ensures absolute transactional consistency and prevents overselling.

-- 1. Drop existing inventory trigger if it exists
DROP TRIGGER IF EXISTS tr_update_inventory_on_booking ON public.bookings;
DROP TRIGGER IF EXISTS tr_manage_booking_inventory ON public.bookings;

-- 2. Define standard manage_booking_inventory function
CREATE OR REPLACE FUNCTION public.manage_booking_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_current_inventory INTEGER;
BEGIN
    -- ATOMIC RESERVE: On INSERT of a product booking
    IF TG_OP = 'INSERT' THEN
        IF NEW.listing_type = 'product' THEN
            -- Atomically attempt to decrement the product inventory
            -- Row/Table locks are managed cleanly by PostgreSQL here
            UPDATE public.products
            SET inventory_count = inventory_count - NEW.quantity
            WHERE id = NEW.listing_id AND inventory_count >= NEW.quantity
            RETURNING inventory_count INTO v_current_inventory;
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Insufficient stock. Required %, but listing inventory is lower.', NEW.quantity;
            END IF;
        END IF;
        
    -- ATOMIC REPLENISH / TRANSFER: On UPDATE of a product booking
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.listing_type = 'product' THEN
            -- Check if state is moving from an active state to an inactive/cancelled state
            -- Active states: everything except ('rejected', 'cancelled', 'refunded')
            IF (OLD.status NOT IN ('rejected', 'cancelled', 'refunded')) AND 
               (NEW.status IN ('rejected', 'cancelled', 'refunded')) THEN
               
                UPDATE public.products
                SET inventory_count = inventory_count + OLD.quantity
                WHERE id = NEW.listing_id;
                
            -- Check if state is moving from an inactive state back to an active state
            ELSIF (OLD.status IN ('rejected', 'cancelled', 'refunded')) AND 
                  (NEW.status NOT IN ('rejected', 'cancelled', 'refunded')) THEN
                  
                UPDATE public.products
                SET inventory_count = inventory_count - NEW.quantity
                WHERE id = NEW.listing_id AND inventory_count >= NEW.quantity;
                
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Cannot update booking: Insufficient stock. Required %, but listing lacks current inventory.', NEW.quantity;
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Register the trigger
CREATE TRIGGER tr_manage_booking_inventory
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.manage_booking_inventory();
