-- Migration: Service Database Schema Design (Scalable, Searchable, Recommendation Compatible)
-- Created: 2026-06-10

-- ====================================================================
-- 1. REFERENCE TABLES: CATEGORIES & SUBCATEGORIES
-- ====================================================================

-- Categories Table
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(50) DEFAULT 'briefcase',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subcategories Table (Scaling relationship representation)
CREATE TABLE IF NOT EXISTS public.service_subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uniq_category_subcategory UNIQUE (category_id, name)
);

-- ====================================================================
-- 2. ALTER/ENHANCE THE core 'services' TABLE
-- ====================================================================
-- This ensures backward compatibility with the marketplace foundation, 
-- while injecting relational categoric properties & high-volume indexes.

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.service_subcategories(id) ON DELETE SET NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Recommendation engine scoring and activity signals
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS rating_average NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating_average BETWEEN 0.00 AND 5.00);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS reviews_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS completion_rate NUMERIC(5,2) NOT NULL DEFAULT 100.00 CHECK (completion_rate BETWEEN 0.00 AND 100.00);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS response_time_seconds INTEGER DEFAULT 3600; -- Default 1 hour Response Interval
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS location_geog GEOGRAPHY(POINT, 4326); -- Spatial search compatibility

-- Full-Text-Search (FTS) computed column for sub-second database queries
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS tsv_search_vector TSVECTOR;

-- ====================================================================
-- 3. INTERACTIVE SCALE COMPONENT: SERVICE MEDIA
-- ====================================================================
-- Unlocks multi-upload CDN distribution workflows.

CREATE TABLE IF NOT EXISTS public.service_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('image', 'video', 'pdf', 'document')),
    display_order INTEGER DEFAULT 0 NOT NULL,
    is_cover BOOLEAN DEFAULT false NOT NULL,
    width INTEGER,
    height INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 4. DYNAMIC PERFORMANCE ENGINE: SERVICE AVAILABILITY
-- ====================================================================
-- Real-time calendaring checking. High transactional scale schema.

CREATE TABLE IF NOT EXISTS public.service_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday ... 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true NOT NULL,
    appointment_only BOOLEAN DEFAULT false NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
    custom_preferences TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Prevent overlapping schedule records for the same service day
    CONSTRAINT uniq_service_day_schedule UNIQUE (service_id, day_of_week, start_time, end_time)
);

-- Calendar exception table for blackout dates
CREATE TABLE IF NOT EXISTS public.service_availability_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    exception_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uniq_service_exception_date UNIQUE (service_id, exception_date)
);

-- ====================================================================
-- 5. TRIGGER: AUTOMATED TEXT SEARCH UPDATE
-- ====================================================================

-- Function to regenerate search vector dynamically on create/update
CREATE OR REPLACE FUNCTION public.fn_services_update_tsvector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tsv_search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_services_tsvector_refresh ON public.services;
CREATE TRIGGER trg_services_tsvector_refresh
  BEFORE INSERT OR UPDATE OF title, description
  ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_services_update_tsvector();

-- Trigger to system-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_service_categories_modtime ON public.service_categories;
CREATE TRIGGER update_service_categories_modtime
    BEFORE UPDATE ON public.service_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_service_subcategories_modtime ON public.service_subcategories;
CREATE TRIGGER update_service_subcategories_modtime
    BEFORE UPDATE ON public.service_subcategories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_service_availability_modtime ON public.service_availability;
CREATE TRIGGER update_service_availability_modtime
    BEFORE UPDATE ON public.service_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_column();


-- ====================================================================
-- 6. HIGH PERFORMANCE INDEXING (SEARCH & RECOMMENDATION ENGINES)
-- ====================================================================

-- A. Categories & Subcategories Optimization
CREATE INDEX IF NOT EXISTS idx_service_categories_slug ON public.service_categories(slug);
CREATE INDEX IF NOT EXISTS idx_service_subcategories_slug ON public.service_subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_service_subcategories_cat_id ON public.service_subcategories(category_id);

-- B. Scalable Core Listings Querying & Filtering
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services (category_id, is_active, is_archived);
CREATE INDEX IF NOT EXISTS idx_services_subcategory_id ON public.services (subcategory_id, is_active, is_archived);
CREATE INDEX IF NOT EXISTS idx_services_tags_gin ON public.services USING GIN (tags);

-- C. Recommendation Engine Custom Feed Sort Indexes
-- (Multi-column covering indexes allowing instant extraction of top-ranked and highest-engaging services)
CREATE INDEX IF NOT EXISTS idx_services_ranking_feed ON public.services (
    is_active, 
    is_archived, 
    rating_average DESC, 
    orders_count DESC, 
    views_count DESC
);

-- D. Sub-second Full Text Search
CREATE INDEX IF NOT EXISTS idx_services_search_gin ON public.services USING GIN (tsv_search_vector);

-- E. Spatially Aware Local Search
-- (Allows calculating proximity of services to a user coordinate inside postgis geofence queries)
CREATE INDEX IF NOT EXISTS idx_services_location_geog ON public.services USING GIST (location_geog);

-- F. Service Media and Schedulers Relational Join Coverage
CREATE INDEX IF NOT EXISTS idx_service_media_lookup ON public.service_media (service_id, is_cover, display_order);
CREATE INDEX IF NOT EXISTS idx_service_availability_lookup ON public.service_availability (service_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_service_availability_exceptions ON public.service_availability_exceptions (service_id, exception_date);

-- ====================================================================
-- 7. SECURITY & ROW LEVEL ACCESS POLICIES (RLS)
-- ====================================================================

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_availability_exceptions ENABLE ROW LEVEL SECURITY;

-- Categories
CREATE POLICY "Public read active categories" ON public.service_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admin write categories" ON public.service_categories ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'admin')
    )
);

-- Subcategories
CREATE POLICY "Public read active subcategories" ON public.service_subcategories FOR SELECT USING (is_active = true);
CREATE POLICY "Admin write subcategories" ON public.service_subcategories ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'admin')
    )
);

-- Service Media
CREATE POLICY "Anyone can view service media" ON public.service_media FOR SELECT USING (true);
CREATE POLICY "Owners can manage service media" ON public.service_media ALL USING (
    EXISTS (
        SELECT 1 FROM public.services
        WHERE id = service_id AND (owner_id = auth.uid() OR EXISTS (
            -- Agent delegation support
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_agent = true
        ))
    )
);

-- Service Availability
CREATE POLICY "Anyone can view service availability" ON public.service_availability FOR SELECT USING (true);
CREATE POLICY "Owners can manage service availability" ON public.service_availability ALL USING (
    EXISTS (
        SELECT 1 FROM public.services
        WHERE id = service_id AND (owner_id = auth.uid() OR EXISTS (
             SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_agent = true
        ))
    )
);

-- Service Availability Exceptions
CREATE POLICY "Anyone can view service exceptions" ON public.service_availability_exceptions FOR SELECT USING (true);
CREATE POLICY "Owners can manage service exceptions" ON public.service_availability_exceptions ALL USING (
    EXISTS (
        SELECT 1 FROM public.services
        WHERE id = service_id AND (owner_id = auth.uid() OR EXISTS (
             SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_agent = true
        ))
    )
);
