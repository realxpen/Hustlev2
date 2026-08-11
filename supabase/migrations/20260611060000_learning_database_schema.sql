-- =========================================================================
-- Hustle Academy Core Learning System Database Schema Migration
-- Designed for tracking progressive skill paths, modular lesson stages (skill_modules),
-- and transactional user learning progressions.
-- =========================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. LEARNING_PATHS TABLE
-- Structured trade curriculum headings and category tracking
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    featured_img VARCHAR(512),
    xp_total INT DEFAULT 0 NOT NULL CONSTRAINT check_xp_total_positive CHECK (xp_total >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 2. SKILL_MODULES TABLE
-- Granular lesson stages mapped under a parent learning path. Organized by level.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.skill_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    level VARCHAR(50) DEFAULT 'beginner' NOT NULL CONSTRAINT check_module_level CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    title VARCHAR(255) NOT NULL,
    duration VARCHAR(50) NOT NULL, -- e.g. "12 mins", "30 mins"
    description TEXT,
    rich_content TEXT, -- Markdown content for in-app reading modules
    xp_reward INT DEFAULT 100 NOT NULL CONSTRAINT check_xp_reward_positive CHECK (xp_reward >= 0),
    sort_order INT DEFAULT 0 NOT NULL, -- For maintaining strict sequence sorting within a level
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 3. LEARNING_PROGRESS TABLE
-- Tracks a user's lesson completions, scores, and active status progression
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.skill_modules(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT true NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    score INT CONSTRAINT check_score_bounds CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    CONSTRAINT unique_user_module_progress UNIQUE (user_id, module_id)
);

-- =========================================================================
-- DATABASE ACCESS SECURITY POLICIES (ROW LEVEL SECURITY)
-- =========================================================================

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

-- 1. LEARNING_PATHS POLICIES
CREATE POLICY "Learning paths are viewable by everyone"
ON public.learning_paths FOR SELECT
USING (true);

-- 2. SKILL_MODULES POLICIES
CREATE POLICY "Skill modules are viewable by everyone"
ON public.skill_modules FOR SELECT
USING (true);

-- 3. LEARNING_PROGRESS POLICIES
CREATE POLICY "Users can track and view their own learning progress logs"
ON public.learning_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning progress logs"
ON public.learning_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning progress logs"
ON public.learning_progress FOR UPDATE
USING (auth.uid() = user_id);

-- =========================================================================
-- INDICES FOR HIGH-PERFORMANCE REAL-TIME CURRICULUM RENDERING
-- =========================================================================

-- Speeds up retrieval of modular lessons corresponding to a parent pathway
CREATE INDEX IF NOT EXISTS idx_skill_modules_path
ON public.skill_modules (path_id, level, sort_order);

-- Speeds up checking a student's active lessons completions mapping
CREATE INDEX IF NOT EXISTS idx_learning_progress_user
ON public.learning_progress (user_id);

-- Optimizes filtering learning completions chronologically
CREATE INDEX IF NOT EXISTS idx_learning_progress_completed
ON public.learning_progress (user_id, completed_at DESC);

-- =========================================================================
-- SEED INITIAL FOUNDATIONAL ACADEMY DATA
-- =========================================================================

-- A. Insert Master Barbering Path
INSERT INTO public.learning_paths (id, title, category, description, featured_img, xp_total)
VALUES (
    'path-barbering',
    'Master Barbering & Styling',
    'Grooming',
    'Learn advanced skin fades, texturizing, customized blade postures, and premium beard styling techniques.',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
    450
) ON CONFLICT (id) DO NOTHING;

-- B. Insert Drywall Path
INSERT INTO public.learning_paths (id, title, category, description, featured_img, xp_total)
VALUES (
    'path-drywall',
    'Drywall & Interior Framing',
    'Trades',
    'Master drywall hanging, mudding coats, metal stud framing, and professional surface patching.',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    300
) ON CONFLICT (id) DO NOTHING;

-- C. Insert Freelance UX Path
INSERT INTO public.learning_paths (id, title, category, description, featured_img, xp_total)
VALUES (
    'path-ux',
    'Freelance UI/UX Designing',
    'Digital Arts',
    'Design spacing hierarchies, dark mode UI patterns, color theory, and responsive web animations.',
    'https://images.unsplash.com/photo-1561070791-26c113006238?w=600&auto=format&fit=crop&q=80',
    600
) ON CONFLICT (id) DO NOTHING;

-- D. Insert TikTok Marketing Path
INSERT INTO public.learning_paths (id, title, category, description, featured_img, xp_total)
VALUES (
    'path-marketing',
    'TikTok Organic Growth & Sales',
    'Marketing',
    'Build high converting video hooks, master native editing tools, and setup direct calendar schedules.',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
    450
) ON CONFLICT (id) DO NOTHING;

-- Seed Modular Lessons (Skill Modules)
-- --- BARBERING MODULES ---
INSERT INTO public.skill_modules (id, path_id, level, title, duration, description, rich_content, xp_reward, sort_order)
VALUES (
    'module-barber-1',
    'path-barbering',
    'beginner',
    'Blade Posture & Safety Mechanics',
    '8 mins',
    'Master direct skin touch angles, blade sanitization protocols, and natural posture ergonomics.',
    'Professional blade grooming begins with your hand ergonomics. Hold the straight edge at exactly a 30-degree angle from the client''s skin stretch line to maximize comfort and precision...',
    100,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.skill_modules (id, path_id, level, title, duration, description, rich_content, xp_reward, sort_order)
VALUES (
    'module-barber-2',
    'path-barbering',
    'intermediate',
    'Foil Shaver & Comb Blend Transitions',
    '15 mins',
    'How to erase weight lines between Clipper Open and Half Open blade extensions.',
    'Groomers fail most often at blending the zero line. We details how using soft, short flicking wrist movements creates smooth gradients without dark weight bands...',
    150,
    2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.skill_modules (id, path_id, level, title, duration, description, rich_content, xp_reward, sort_order)
VALUES (
    'module-barber-3',
    'path-barbering',
    'advanced',
    'Creative Texturing & Cropped Fringe',
    '22 mins',
    'Customize slide slices to introduce top volume and create visual weight depth layers.',
    'Advanced texturizing uses slide slicing to add movement to straight, rigid hair types. Never cut flat across the frontal fringe line unless designing micro crops...',
    200,
    3
) ON CONFLICT (id) DO NOTHING;

-- --- DRYWALL MODULES ---
INSERT INTO public.skill_modules (id, path_id, level, title, duration, description, rich_content, xp_reward, sort_order)
VALUES (
    'module-drywall-1',
    'path-drywall',
    'beginner',
    'Hanging Sheets & Screw Spacing rules',
    '10 mins',
    'Learn safe partition lifting, drywall anchor alignments, and stud-mapping math.',
    'Always hang ceilings before walls. When screwing into timber framing structure, space elements exactly 12 inches apart on ceilings and 16 inches apart on walls...',
    100,
    1
) ON CONFLICT (id) DO NOTHING;

-- --- UI/UX MODULES ---
INSERT INTO public.skill_modules (id, path_id, level, title, duration, description, rich_content, xp_reward, sort_order)
VALUES (
    'module-ux-1',
    'path-ux',
    'beginner',
    'Figma Spacing & Layout Rhythm',
    '12 mins',
    'Adopt consistent spacing metrics using the classic 8px grid constraint.',
    'Uniform layout grids build psychological rhythm. By fixing standard component spacers to increments of 8px (e.g. 8/16/24/32/64), layouts align cleanly inside browser boxes...',
    100,
    1
) ON CONFLICT (id) DO NOTHING;
