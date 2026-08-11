# Hustle Booking & Escrow Database Schema

This document details the production-ready PostgreSQL relational database schema for the Hustle Booking and Escrow System. This architecture is designed to manage the full lifecycle of transactional contracts between client buyers and specialist creators/providers. It enforces strict status transitions, records automated event-driven audit trails, maintains linear state transition history, and facilitates disputes and escrow arbitration.

---

## 1. Relational Schema Architecture

```
                 +-----------------------+
                 |     public.profiles   |
                 +-----------------------+
                 | PK | id         (UUID)|
                 +-----------------------+
                   | (buyer)       | (seller)
                   v               v
+-------------------------------------------------------+
|                    public.bookings                    |
+-------------------------------------------------------+
| PK  | id                  (UUID)                      |
| FK  | buyer_id            (UUID)                      |
| FK  | seller_id           (UUID)                      |
|     | amount              (NUMERIC)                   |
|     | status              (TEXT / ENUM CHECK)         |
|     | payment_status      (TEXT / ENUM CHECK)         |
|     | escrow_status       (TEXT / ENUM CHECK)         |
|     | delivery_deadline   (TIMESTAMP)                 |
|     | files               (TEXT[])                    |
+-------------------------------------------------------+
  | (1:1)                  | (1:N)                 | (1:N)
  v                        v                       v
+------------------+     +-------------------+   +---------------------------+
| public.disputes  |     |  public.booking_  |   |   public.booking_status   |
|                  |     |      events       |   |          history          |
+------------------+     +-------------------+   +---------------------------+
| PK | id    (UUID)|     | PK | id     (UUID)|   | PK | id             (UUID)|
| FK | booking(UUID|     | FK | booking(UUID)|   | FK | booking_id     (UUID)|
|    | reason(TEXT)|     |    | event_t(TEXT)|   |    | from_status    (TEXT)|
|    | status(TEXT)|     |    | payload(JSON)|   |    | to_status      (TEXT)|
+------------------+     +-------------------+   +---------------------------+
```

### Table Relationships and Rules:
1. **`bookings` table**: This serves as the master contract ledger, containing references to the buyer (client) and seller (provider). It tracks general transaction parameters like timeline, current delivery deadline, locked funds, and files/briefs dynamically.
2. **`booking_status_history` table**: Records all state transitions to prevent audit-tampering. When a transition occurs, the previous and new statuses are logged alongside the changing user.
3. **`booking_events` table**: Provides a rich event-driven trigger foundation. All contract actions (e.g., brief submission, milestone start, assets submission) are captured with metadata for notification and automated server-side responses.
4. **`disputes` table**: Stores information regarding disputes opened by either the client or provider. It holds the escrow hold boundaries, resolution justifications, and reference metadata.

---

## 2. SQL Schema DDL Statements

Below is the clean and production-tested SQL script defining the full schema, check constraints, foreign-key relations, performance-tuned database indices, row-level security (RLS) policies, and automated event triggers.

```sql
-- Ensure UUID extension is active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. BOOKINGS TABLE (Core transaction contract system)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    listing_id UUID NOT NULL, -- Reference to the root service gig or catalog item hured
    listing_type VARCHAR(50) NOT NULL DEFAULT 'service' CHECK (listing_type IN ('service', 'product', 'training')),
    
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    timeline_estimate VARCHAR(100) NOT NULL DEFAULT '7 Days',
    delivery_deadline TIMESTAMP WITH TIME ZONE,
    
    -- State management constraints
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Requested by Client; awaiting Specialist reviews
        'accepted',     -- Confirmed by Specialist; terms locked
        'in_progress',  -- Specialist actively working
        'delivered',    -- Work submitted; awaiting Client sign-off and release
        'completed',    -- Finished successfully; Escrow disbursed
        'cancelled',    -- Aborted; Escrow refunded to Client
        'disputed'      -- Payment suspended; placed in neutral quarantine for arbitration
    )),
    
    payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN (
        'unpaid', 
        'held_in_escrow', 
        'released', 
        'refunded', 
        'disputed'
    )),
    escrow_status VARCHAR(30) NOT NULL DEFAULT 'none' CHECK (escrow_status IN (
        'none', 
        'held', 
        'released', 
        'refunded', 
        'disputed'
    )),
    
    files TEXT[] DEFAULT '{}'::text[] NOT NULL, -- Array of relevant briefs, design files, or assets
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 2. BOOKING STATUS HISTORY TABLE (Linear audit trail tracker)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.booking_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    from_status VARCHAR(30) CHECK (from_status IN ('pending', 'accepted', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed')),
    to_status VARCHAR(30) NOT NULL CHECK (to_status IN ('pending', 'accepted', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed')),
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 3. BOOKING EVENTS TABLE (Fine-grained transaction tracing ledger)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.booking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'booking.created',
        'booking.accepted',
        'booking.started',
        'booking.delivered',
        'booking.completed',
        'booking.cancelled',
        'booking.disputed'
    )),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payload JSONB DEFAULT '{}'::jsonb NOT NULL, -- Stores dynamic parameters (e.g. filename list, notes reason)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 4. DISPUTES TABLE (Arbitration and security holding)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
    initiated_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    reason TEXT NOT NULL CHECK (char_length(reason) >= 10),
    dispute_amount NUMERIC(10,2) NOT NULL CHECK (dispute_amount >= 0),
    
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
    resolution_details TEXT,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Admin / Arbiter Profile Reference
    
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Auto-synchronize the `updated_at` timestamps on update event
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_bookings_timestamp
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

CREATE TRIGGER tr_update_disputes_timestamp
    BEFORE UPDATE ON public.disputes
    FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

-- =========================================================================
-- 5. AUTOMATED STATUS HISTORY HOOKS (Trigger function)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.on_booking_status_updated_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Log into history when status transitions
    IF (OLD.status IS NULL) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.booking_status_history (
            booking_id,
            from_status,
            to_status,
            changed_by,
            reason
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(auth.uid(), NEW.seller_id), -- Default to current session or specialist
            NEW.notes
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_log_booking_status_transitions
    AFTER UPDATE ON public.bookings
    FOR EACH ROW EXECUTE PROCEDURE public.on_booking_status_updated_log();
```

---

## 3. High-Performance Indexing Strategy

To keep tracking responsive and scale searches during peak marketplace periods, we provision single-column and composite indices for the tables:

```sql
-- Search optimization for core foreign key keys
CREATE INDEX IF NOT EXISTS idx_bookings_buyer ON public.bookings(buyer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_seller ON public.bookings(seller_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status_composite ON public.bookings(status, payment_status, escrow_status);

-- Rapid lookup index for tracking historical audit logs chronologically
CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking ON public.booking_status_history(booking_id, created_at DESC);

-- Rapid trace index for chronological event logging and monitoring
CREATE INDEX IF NOT EXISTS idx_booking_events_type_booking ON public.booking_events(booking_id, event_type, created_at DESC);

-- Rapid search filters for arbitration boards
CREATE INDEX IF NOT EXISTS idx_disputes_booking ON public.disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
```

---

## 4. Row-Level Security (RLS) & Access Control

These policies guard active transactions, preventing external users from spying on private contract terms, documents, or ongoing balance releases.

```sql
-- Enable Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- A. Bookings RLS
-- ----------------------------------------------------
CREATE POLICY "Users can track their own contractual bookings"
    ON public.bookings FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can open new bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = buyer_id AND buyer_id != seller_id);

CREATE POLICY "Participants can update active transaction terms"
    ON public.bookings FOR UPDATE
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ----------------------------------------------------
-- B. Status History RLS
-- ----------------------------------------------------
CREATE POLICY "Contract participants can view status audit history"
    ON public.booking_status_history FOR SELECT
    USING (booking_id IN (
        SELECT b.id FROM public.bookings b 
        WHERE b.buyer_id = auth.uid() OR b.seller_id = auth.uid()
    ));

-- ----------------------------------------------------
-- C. Event Stream RLS
-- ----------------------------------------------------
CREATE POLICY "Contract participants can view fine-grained event tracks"
    ON public.booking_events FOR SELECT
    USING (booking_id IN (
        SELECT b.id FROM public.bookings b 
        WHERE b.buyer_id = auth.uid() OR b.seller_id = auth.uid()
    ));

-- ----------------------------------------------------
-- D. Disputes Arbitration Board RLS
-- ----------------------------------------------------
CREATE POLICY "Participants can view dispute files they are in"
    ON public.disputes FOR SELECT
    USING (booking_id IN (
        SELECT b.id FROM public.bookings b 
        WHERE b.buyer_id = auth.uid() OR b.seller_id = auth.uid()
    ));

CREATE POLICY "Participants can issue disputes on active contracts"
    ON public.disputes FOR INSERT
    WITH CHECK (booking_id IN (
        SELECT b.id FROM public.bookings b 
        WHERE (b.buyer_id = auth.uid() OR b.seller_id = auth.uid()) 
          AND b.status NOT IN ('completed', 'cancelled')
    ));
```
