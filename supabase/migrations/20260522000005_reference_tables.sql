-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create training table
CREATE TABLE IF NOT EXISTS public.training (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure RLS on both
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Users can manage own products" ON public.products FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view training" ON public.training FOR SELECT USING (true);
CREATE POLICY "Users can manage own training" ON public.training FOR ALL USING (auth.uid() = user_id);
