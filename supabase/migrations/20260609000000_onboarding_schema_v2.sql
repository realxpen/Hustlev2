-- CREATE SKILLS TABLE TO HOST STANDARD OFFERINGS
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    popularity_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- SEED THE BASE CORE VALUES DEFINED IN DISCOVERY REQUIREMENT 
INSERT INTO public.skills (name, category, popularity_index) VALUES
    ('Haircut', 'Beauty & Styling', 120),
    ('Photography', 'Media & Arts', 250),
    ('Plumbing', 'Home Repairs', 85),
    ('Graphics Design', 'Creative & Design', 310),
    ('Tailoring', 'Fashion & Apparel', 45),
    ('Makeup', 'Beauty & Styling', 180),
    ('Mechanic', 'Automotive', 140),
    ('Electrician', 'Home Repairs', 95),
    ('UI/UX Design', 'Software & Design', 410),
    ('House Painting', 'Home Repairs', 60),
    ('Fitness Coaching', 'Health & Wellness', 205),
    ('Catering', 'Food & Event Services', 80),
    ('Accounting', 'Business Services', 115),
    ('Language Tutoring', 'Education', 130)
ON CONFLICT (name) DO UPDATE SET 
    popularity_index = EXCLUDED.popularity_index;

-- CREATE USER INTERESTS ASSOCIATIVE MAPPING TABLE (MANY-TO-MANY RELATIONSHIP)
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    affinity_score NUMERIC(3, 2) DEFAULT 1.00 NOT NULL, -- Flexible decimal weight scale factor (0.00 to 1.00) for machine learning recommendations
    click_count INT DEFAULT 0 NOT NULL,                  -- Counter tracking behavioral action frequency to optimize active feed relevance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_skill_interest UNIQUE (user_id, skill_id)
);

-- INDEXES TO SPEED UP FILTER MATCHES & FEED COMPUTATIONS
CREATE INDEX IF NOT EXISTS idx_user_interests_user ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_skill ON public.user_interests(skill_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);
CREATE INDEX IF NOT EXISTS idx_user_interests_affinity ON public.user_interests(affinity_score DESC);

-- ENSURE PROFILE TRACKS ONBOARDING STATUS FOR HIGH SPEED CONDITIONAL RENDERING
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'has_completed_onboarding'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT false;
    END IF;
END $$;
