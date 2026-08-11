-- Create Services Table
CREATE TABLE public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    pricing_type TEXT CHECK (pricing_type IN ('fixed', 'hourly', 'negotiable')) NOT NULL,
    location TEXT,
    media_urls TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Bookings Table
CREATE TABLE public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    hustler_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed')) DEFAULT 'pending' NOT NULL,
    escrow_status TEXT CHECK (escrow_status IN ('locked', 'released', 'refunded')) DEFAULT 'locked' NOT NULL,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed')) DEFAULT 'pending' NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    total_price NUMERIC NOT NULL,
    platform_fee NUMERIC NOT NULL,
    payout_amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Payments Table
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE RESTRICT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    method TEXT CHECK (method IN ('card', 'wallet', 'crypto_simulated')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'successful', 'failed')) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Triggers for updated_at
CREATE TRIGGER update_services_modtime
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_bookings_modtime
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_payments_modtime
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- RLS Policies

-- Services: 
-- Anyone can view active services
-- Hustlers can view their own services
-- Hustlers can create, update, delete their own services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON public.services FOR SELECT
  USING (active = true OR auth.uid() = user_id);

CREATE POLICY "Hustlers can manage their services"
  ON public.services FOR ALL
  USING (auth.uid() = user_id);

-- Bookings:
-- Clients and Hustlers involved can view bookings
-- Clients can create bookings
-- Both can update certain fields (in reality, might restrict further via functions)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = hustler_id);

CREATE POLICY "Clients can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Participants can update their bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = hustler_id);

-- Payments:
-- Booking participants can view payments
-- System creates payments (but we might simulate via client, so allow insert)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT hustler_id FROM public.bookings WHERE id = booking_id));

CREATE POLICY "Users can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id);
