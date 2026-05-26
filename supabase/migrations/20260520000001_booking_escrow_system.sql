-- Create gigs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.gigs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    pricing_type TEXT CHECK (pricing_type IN ('fixed', 'hourly', 'custom')) DEFAULT 'fixed' NOT NULL,
    base_price NUMERIC NOT NULL,
    delivery_time TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alter bookings table to support the new specifications
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gig_id UUID REFERENCES public.gigs(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS delivery_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

-- Remove old CHECK constraints from bookings if they exist
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_escrow_status_check;

-- Create/update CHECK constraints with all requested values
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed'));
ALTER TABLE public.bookings ADD CONSTRAINT bookings_escrow_status_check CHECK (escrow_status IN ('unpaid', 'held', 'released', 'refunded', 'locked'));

-- Create escrow_transactions table
CREATE TABLE IF NOT EXISTS public.escrow_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    payer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    platform_fee NUMERIC DEFAULT 0 NOT NULL,
    status TEXT CHECK (status IN ('pending', 'held', 'released', 'refunded')) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create booking_deliveries table
CREATE TABLE IF NOT EXISTS public.booking_deliveries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    file_url TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure RLS is enabled for all tables
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Post RLS Policies for gigs
CREATE POLICY "Anyone can view active gigs"
  ON public.gigs FOR SELECT
  USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own gigs"
  ON public.gigs FOR ALL
  USING (auth.uid() = user_id);

-- Post RLS Policies for escrow_transactions
CREATE POLICY "Participants can view escrow_transactions"
  ON public.escrow_transactions FOR SELECT
  USING (auth.uid() = payer_id OR auth.uid() = receiver_id);

CREATE POLICY "System/participants can insert escrow transactions"
  ON public.escrow_transactions FOR INSERT
  WITH CHECK (auth.uid() = payer_id);

-- Post RLS Policies for booking_deliveries
CREATE POLICY "Participants can view booking_deliveries"
  ON public.booking_deliveries FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE client_id = auth.uid() OR hustler_id = auth.uid()
    )
  );

CREATE POLICY "Hustlers can insert booking deliveries"
  ON public.booking_deliveries FOR INSERT
  WITH CHECK (
    booking_id IN (
      SELECT id FROM public.bookings WHERE hustler_id = auth.uid()
    )
  );

-- Post RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert notification for recipient"
  ON public.notifications FOR INSERT
  WITH CHECK (true);
