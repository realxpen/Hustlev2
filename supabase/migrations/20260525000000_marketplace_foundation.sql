-- Migration: Marketplace Foundation

-- 1. Create tables if they do not exist
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    pricing_type TEXT CHECK (pricing_type IN ('fixed', 'hourly', 'custom')),
    base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    delivery_time TEXT,
    media JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    product_type TEXT CHECK (product_type IN ('physical', 'digital')),
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    inventory_count INTEGER DEFAULT 0,
    media JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.training (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    training_type TEXT CHECK (training_type IN ('live', 'recorded', 'mentorship')),
    media JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Handle migrations of columns gracefully if tables already existed
DO $$
BEGIN
    -- Services Columns Migration
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='services' AND column_name='user_id') THEN
        ALTER TABLE public.services RENAME COLUMN user_id TO owner_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='services' AND column_name='active') THEN
        ALTER TABLE public.services RENAME COLUMN active TO is_active;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='services' AND column_name='price') THEN
        ALTER TABLE public.services RENAME COLUMN price TO base_price;
    END IF;

    -- Products Columns Migration
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='user_id') THEN
        ALTER TABLE public.products RENAME COLUMN user_id TO owner_id;
    END IF;

    -- Training Columns Migration
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training' AND column_name='user_id') THEN
        ALTER TABLE public.training RENAME COLUMN user_id TO owner_id;
    END IF;
END $$;

-- 3. Add any missing columns to services, products, & training if they are not already present
-- Services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS base_price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS delivery_time TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS orders_count INTEGER DEFAULT 0;

-- Products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type TEXT CHECK (product_type IN ('physical', 'digital'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS orders_count INTEGER DEFAULT 0;

-- Training
ALTER TABLE public.training ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE public.training ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.training ADD COLUMN IF NOT EXISTS training_type TEXT CHECK (training_type IN ('live', 'recorded', 'mentorship'));
ALTER TABLE public.training ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.training ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.training ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.training ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.training ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;
ALTER TABLE public.training ADD COLUMN IF NOT EXISTS orders_count INTEGER DEFAULT 0;

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_owner_id ON public.services(owner_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_products_owner_id ON public.products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_training_owner_id ON public.training(owner_id);
CREATE INDEX IF NOT EXISTS idx_training_is_active ON public.training(is_active);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training ENABLE ROW LEVEL SECURITY;

-- Post relationships/references
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS attached_listing_type TEXT CHECK (attached_listing_type IN ('service', 'product', 'training', NULL));
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS attached_listing_id UUID;

-- RLS Policies - Safe Drops & Restructure

-- Safe drop for any previous legacy policies
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Hustlers can manage their services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view training" ON public.training;
DROP POLICY IF EXISTS "Users can manage own training" ON public.training;

-- Drop new policies if they existed from failed runs
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Owners can create services" ON public.services;
DROP POLICY IF EXISTS "Owners can update services" ON public.services;

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Owners can create products" ON public.products;
DROP POLICY IF EXISTS "Owners can update products" ON public.products;

DROP POLICY IF EXISTS "Anyone can view active training" ON public.training;
DROP POLICY IF EXISTS "Owners can create training" ON public.training;
DROP POLICY IF EXISTS "Owners can update training" ON public.training;

-- Recreate Policies with unified naming and rules
-- Services
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (is_active = true OR owner_id = auth.uid());
CREATE POLICY "Owners can create services" ON public.services FOR INSERT WITH CHECK (
  auth.uid() = owner_id AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_hustler = true OR role = 'hustler' OR role = 'admin')
  )
);
CREATE POLICY "Owners can update services" ON public.services FOR UPDATE USING (auth.uid() = owner_id);

-- Products
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true OR owner_id = auth.uid());
CREATE POLICY "Owners can create products" ON public.products FOR INSERT WITH CHECK (
  auth.uid() = owner_id AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_hustler = true OR role = 'hustler' OR role = 'admin')
  )
);
CREATE POLICY "Owners can update products" ON public.products FOR UPDATE USING (auth.uid() = owner_id);

-- Training
CREATE POLICY "Anyone can view active training" ON public.training FOR SELECT USING (is_active = true OR owner_id = auth.uid());
CREATE POLICY "Owners can create training" ON public.training FOR INSERT WITH CHECK (
  auth.uid() = owner_id AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_hustler = true OR role = 'hustler' OR role = 'admin')
  )
);
CREATE POLICY "Owners can update training" ON public.training FOR UPDATE USING (auth.uid() = owner_id);
