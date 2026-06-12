-- Migration: Service Discovery Support Database Schema
-- Created: 2026-06-10
-- Purpose: Optimized tables and structures for high-performance service searching, semantic indexing, and ML/interaction recommendation signals.

-- ====================================================================
-- 1. SEARCH SYSTEM METADATA & RE-INDEXING VEHICLE
-- ====================================================================

-- Denormalized High-Performance Search Index Table matching services
CREATE TABLE IF NOT EXISTS public.service_search_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE UNIQUE,
    category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES public.service_subcategories(id) ON DELETE SET NULL,
    
    -- Search target strings
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}'::TEXT[],
    provider_name VARCHAR(255),
    
    -- Search Vector precomputed for sub-second FTS queries
    tsv_search_vector TSVECTOR,
    
    -- Filter mirrors for single-scan operations
    base_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    rating_average NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified_provider BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 2. RECONSTRUCT INTERACTION SIGNALS (RECOMMENDATION ENGINE BRAIN)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.service_recommendation_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Can be null for guest user sessions
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
    
    -- Signal categorization mapping (Weights indicate implicit signal importances)
    signal_type VARCHAR(50) NOT NULL CHECK (
        signal_type IN ('view', 'click', 'bookmark', 'share', 'contact', 'hire_attempt', 'hire_success')
    ),
    signal_weight INTEGER NOT NULL DEFAULT 1 CHECK (signal_weight BETWEEN 1 AND 25),
    
    -- Context parameters
    device_category VARCHAR(50) DEFAULT 'desktop',
    session_id VARCHAR(100),
    referring_channel VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 3. INTERACTION TRIGGER ENGINE (AUTOMATED SYNC & WEIGHT COMPUTATIONS)
-- ====================================================================

-- Automatically compute recommendation signal numeric weights on insert
CREATE OR REPLACE FUNCTION public.fn_compute_signal_weight()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.signal_type = 'view' THEN
    NEW.signal_weight := 1;
  ELSIF NEW.signal_type = 'click' THEN
    NEW.signal_weight := 2;
  ELSIF NEW.signal_type = 'bookmark' THEN
    NEW.signal_weight := 5;
  ELSIF NEW.signal_type = 'share' THEN
    NEW.signal_weight := 8;
  ELSIF NEW.signal_type = 'contact' THEN
    NEW.signal_weight := 12;
  ELSIF NEW.signal_type = 'hire_attempt' THEN
    NEW.signal_weight := 15;
  ELSIF NEW.signal_type = 'hire_success' THEN
    NEW.signal_weight := 25;
  ELSE
    NEW.signal_weight := 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_recommendation_signal_weight ON public.service_recommendation_signals;
CREATE TRIGGER trg_set_recommendation_signal_weight
  BEFORE INSERT ON public.service_recommendation_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_compute_signal_weight();

-- Automatic service_search_index sync trigger on main service changes
CREATE OR REPLACE FUNCTION public.fn_sync_service_search_index()
RETURNS TRIGGER AS $$
DECLARE
  v_provider_name VARCHAR(255);
  v_is_verified BOOLEAN := false;
BEGIN
  -- Obtain provider profile metadata safely
  SELECT COALESCE(hustle_name, full_name, 'Hustle Pro'), COALESCE(verified, false)
  INTO v_provider_name, v_is_verified
  FROM public.profiles
  WHERE id = NEW.owner_id;

  INSERT INTO public.service_search_index (
    service_id,
    category_id,
    subcategory_id,
    title,
    description,
    tags,
    provider_name,
    base_price,
    rating_average,
    is_active,
    is_verified_provider,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.category_id,
    NEW.subcategory_id,
    NEW.title,
    NEW.description,
    NEW.tags,
    v_provider_name,
    NEW.base_price,
    NEW.rating_average,
    NEW.is_active,
    v_is_verified,
    timezone('utc'::text, now())
  )
  ON CONFLICT (service_id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    subcategory_id = EXCLUDED.subcategory_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    tags = EXCLUDED.tags,
    provider_name = EXCLUDED.provider_name,
    base_price = EXCLUDED.base_price,
    rating_average = EXCLUDED.rating_average,
    is_active = EXCLUDED.is_active,
    is_verified_provider = EXCLUDED.is_verified_provider,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_service_search_index ON public.services;
CREATE TRIGGER trg_sync_service_search_index
  AFTER INSERT OR UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_service_search_index();

-- Also apply full text search tsvector generation inside service_search_index
CREATE OR REPLACE FUNCTION public.fn_service_search_index_tsvector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tsv_search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.provider_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.tags, '{}'), ' ')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_search_index_tsvector_refresh ON public.service_search_index;
CREATE TRIGGER trg_service_search_index_tsvector_refresh
  BEFORE INSERT OR UPDATE OF title, provider_name, description, tags
  ON public.service_search_index
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_service_search_index_tsvector();

-- Trigger to update modified timestamps
DROP TRIGGER IF EXISTS update_service_search_index_modtime ON public.service_search_index;
CREATE TRIGGER update_service_search_index_modtime
    BEFORE UPDATE ON public.service_search_index
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_column();


-- ====================================================================
-- 4. ULTRA-PERFORMANCE INDEXING (LOW INDEX SCANS, HIGH BUFFER HITS)
-- ====================================================================

-- FTS Search Engine Optimization
CREATE INDEX IF NOT EXISTS idx_service_search_fts ON public.service_search_index USING GIN (tsv_search_vector);

-- Multi-column scan cover optimized for category browsing, pricing slices, and state checking
CREATE INDEX IF NOT EXISTS idx_service_search_category_browse ON public.service_search_index (
    category_id, 
    subcategory_id, 
    is_active, 
    base_price, 
    rating_average DESC
);

-- Compound Verification Index coverage for top tier talent filter
CREATE INDEX IF NOT EXISTS idx_service_search_talent_tier ON public.service_search_index (
    is_active,
    is_verified_provider,
    rating_average DESC
);

-- Recommendation Signals lookup speeds and weights indexation
CREATE INDEX IF NOT EXISTS idx_recommended_signals_lookup ON public.service_recommendation_signals (
    service_id, 
    signal_type, 
    signal_weight DESC
);

-- Collaborative recommendations personalized retrieval index
CREATE INDEX IF NOT EXISTS idx_recommended_signals_user_journey ON public.service_recommendation_signals (
    user_id, 
    category_id, 
    created_at DESC
);


-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.service_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_recommendation_signals ENABLE ROW LEVEL SECURITY;

-- Service Search Index Policies
CREATE POLICY "Anyone can scan service indexes" ON public.service_search_index 
  FOR SELECT USING (is_active = true);

-- Recommendation Signals Policies
CREATE POLICY "Self read and insert signals" ON public.service_recommendation_signals 
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can feed dynamic signal indicators" ON public.service_recommendation_signals 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
