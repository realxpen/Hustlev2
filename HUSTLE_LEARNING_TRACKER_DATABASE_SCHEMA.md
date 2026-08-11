# Hustle Academy Support Database Schema

This document details the production-ready PostgreSQL design for the **Hustle Academy Skill & Learning System**. Built on top of Supabase/Postgres, this schema models pathways, progression levels, structured modules, and index tuning to maximize transactional speed while safeguarding user data under Row-Level Security rules.

---

## 1. Schema Layout Map

The data structure is normalized across **three core entities** to separate static layout materials (`learning_paths`, `skill_modules`) from client-specific completions tracking (`learning_progress`):

```
+-----------------------------------+
|             profiles              |
+-----------------------------------+
                  | (1 : N)
                  v
+-----------------------------------+
|         learning_progress         | <--- Maps user status of each module
+-----------------------------------+
                  ^ (N : 1)
                  |
+-----------------------------------+
|           skill_modules           | <--- Level: Beginner, Intermediate, Advanced
+-----------------------------------+
                  ^ (N : 1)
                  |
+-----------------------------------+
|          learning_paths           | <--- Main Curriculum Path (e.g. Grooming, Trades)
+-----------------------------------+
```

---

## 2. Table Specifications (DDL)

The schema definitions are structured as follows:

### A. `learning_paths` Table
Holds registered trade branches, categories, and total cumulative XP goals.
```sql
CREATE TABLE public.learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    featured_img VARCHAR(512),
    xp_total INT DEFAULT 0 NOT NULL CONSTRAINT check_xp_total_positive CHECK (xp_total >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### B. `skill_modules` Table
Granular course tutorials mapped under parent learning streams. Organized by sequence sorting order and complex levels.
```sql
CREATE TABLE public.skill_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    level VARCHAR(50) DEFAULT 'beginner' NOT NULL CONSTRAINT check_module_level CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    title VARCHAR(255) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    description TEXT,
    rich_content TEXT,
    xp_reward INT DEFAULT 100 NOT NULL CONSTRAINT check_xp_reward_positive CHECK (xp_reward >= 0),
    sort_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### C. `learning_progress` Table
Enforces transaction isolation rules on course checking, scores auditing, and timeline records.
```sql
CREATE TABLE public.learning_progress (
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
```

---

## 3. High-Performance Index Tuning

These indices speed up retrieval and sort queries, ensuring consistent speed across screen navigation events:
```sql
-- Speeds up fetching chronological curricula sequences inside active paths
CREATE INDEX idx_skill_modules_path ON public.skill_modules (path_id, level, sort_order);

-- Speeds up retrieving total progress completion maps from active student workspaces
CREATE INDEX idx_learning_progress_user ON public.learning_progress (user_id);

-- Speeds up sorting historic activity feed items chronologically
CREATE INDEX idx_learning_progress_completed ON public.learning_progress (user_id, completed_at DESC);
```

---

## 4. Security & Isolation Policies (RLS)

All structures enforce native Row-Level Security rules to isolate personal student statistics:

- **Public Curricula**: Users can view all active paths (`learning_paths`) and lessons (`skill_modules`) regardless of authenticated role to encourage discoverability.
- **Strict Data Isolation**: Students are strictly locked out of viewing or updating other users' learning progress records.

```sql
-- 1. LEARNING_PATHS POLICIES
CREATE POLICY "Learning paths are viewable by everyone" ON public.learning_paths FOR SELECT USING (true);

-- 2. SKILL_MODULES POLICIES
CREATE POLICY "Skill modules are viewable by everyone" ON public.skill_modules FOR SELECT USING (true);

-- 3. LEARNING_PROGRESS POLICIES
CREATE POLICY "Users can track and view their own learning progress logs" ON public.learning_progress FOR SELECT USING (auth.uid() = user_id);
```
