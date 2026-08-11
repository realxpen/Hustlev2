-- Create an explicit enumeration type tracking safe contract cycles
CREATE TYPE escrow_status AS ENUM (
  'awaiting_deposit', 
  'funds_held', 
  'milestone_released', 
  'completed', 
  'disputed', 
  'refunded'
);

-- 1. Main Contract Ledger Table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  hustler_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  service_id UUID, -- Optional linkage to a static marketplace listing
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'NGN', -- Standardizing global codes (NGN, USD)
  status escrow_status NOT NULL DEFAULT 'awaiting_deposit',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

-- Guard ensuring workers cannot contract with themselves
CONSTRAINT client_is_not_hustler CHECK (client_id <> hustler_id) );

-- 2. Structured Milestone Sub-Ledger Table
CREATE TABLE booking_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    booking_id UUID NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    is_released BOOLEAN NOT NULL DEFAULT FALSE,
    released_at TIMESTAMP
    WITH
        TIME ZONE,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Automatic Milestone Allocation Weight Guard Constraint Function
CREATE OR REPLACE FUNCTION verify_milestone_math_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_total_booking NUMERIC(12,2);
  v_milestone_sum NUMERIC(12,2);
BEGIN
  -- Fetch the overarching contract total
  SELECT total_amount INTO v_total_booking FROM bookings WHERE id = NEW.booking_id;
  
  -- Calculate sum of all milestones attached to this transaction context
  SELECT COALESCE(SUM(amount), 0) INTO v_milestone_sum 
  FROM booking_milestones 
  WHERE booking_id = NEW.booking_id AND id <> NEW.id;
  
  v_milestone_sum := v_milestone_sum + NEW.amount;

  -- Guard checking against overall project weight over-allocations
  IF v_milestone_sum > v_total_booking THEN
    RAISE EXCEPTION 'Milestone math summation (%) exceeds overall project budget value (%)', v_milestone_sum, v_total_booking;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_milestone_math_trigger
  BEFORE INSERT OR UPDATE ON booking_milestones
  FOR EACH ROW EXECUTE FUNCTION verify_milestone_math_balance();

-- 4. Automatically Sync Modified Timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bookings_timestamp
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5. Row-Level Security (RLS) Rules Activation
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

ALTER TABLE booking_milestones ENABLE ROW LEVEL SECURITY;

-- Clients and Hustlers can view bookings they are actively a party to
CREATE POLICY view_own_bookings ON bookings FOR
SELECT USING (
        auth.uid () = client_id
        OR auth.uid () = hustler_id
    );

-- Only Clients can instantiate a new prospective escrow deal
CREATE POLICY insert_client_bookings ON bookings FOR
INSERT
WITH
    CHECK (auth.uid () = client_id);

-- Read-through security policy for associated child milestones
CREATE POLICY view_booking_milestones ON booking_milestones FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM bookings
            WHERE
                bookings.id = booking_milestones.booking_id
                AND (
                    bookings.client_id = auth.uid ()
                    OR bookings.hustler_id = auth.uid ()
                )
        )
    );