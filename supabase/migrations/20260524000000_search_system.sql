-- Search System Schema and Functions

-- Step 8: Search History System
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    query TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own search history" ON public.search_history;
CREATE POLICY "Users can manage their own search history" ON public.search_history
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Step 2 & 3: Global Search Engine with Ranking
CREATE OR REPLACE FUNCTION public.global_search(search_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_posts JSONB;
    v_creators JSONB;
    v_hashtags JSONB;
    v_services JSONB;
    v_products JSONB;
    v_training JSONB;
    formatted_query TEXT := '%' || search_query || '%';
BEGIN
    ---------- 1. POSTS ----------
    SELECT jsonb_agg(row_to_json(p)) INTO v_posts
    FROM (
        SELECT 
            p.*,
            -- Ranking: engagement score (trending_score) + recency + text match relevance
            (COALESCE(p.trending_score, 0) + (p.likes_count * 0.5) + (p.comments_count * 1.5)) as search_score,
            jsonb_build_object(
                'id', pr.id,
                'full_name', pr.full_name,
                'username', pr.username,
                'avatar_url', pr.avatar_url,
                'hustle_name', pr.hustle_name,
                'primary_skill', pr.primary_skill,
                'is_hustler', pr.is_hustler,
                'review_count', pr.review_count,
                'rating_average', pr.rating_average,
                'has_reviews', pr.has_reviews
            ) as profiles,
            (SELECT count(*) FROM public.post_likes pl WHERE pl.post_id = p.id) as likes_count_real,
            (SELECT count(*) FROM public.comments c WHERE c.post_id = p.id) as comments_count_real
        FROM public.posts p
        JOIN public.profiles pr ON p.user_id = pr.id
        WHERE p.caption ILIKE formatted_query OR p.content ILIKE formatted_query
        ORDER BY search_score DESC, p.created_at DESC
        LIMIT 20
    ) p;

    ---------- 2. CREATORS (USERS) ----------
    SELECT jsonb_agg(row_to_json(c)) INTO v_creators
    FROM (
        SELECT 
            pr.id, pr.full_name, pr.username, pr.avatar_url, pr.hustle_name, pr.primary_skill, pr.secondary_skills, 
            pr.rating_average, pr.review_count, pr.is_hustler, pr.has_reviews,
            -- Ranking: rating average * review count + profile completeness
            (COALESCE(pr.review_count, 0) * 2 + COALESCE(pr.rating_average, 0) * 10 + 
                CASE WHEN pr.hustle_name ILIKE search_query THEN 50 ELSE 0 END -- Exact hustle match boost
            ) as search_score
        FROM public.profiles pr
        WHERE pr.full_name ILIKE formatted_query
           OR pr.username ILIKE formatted_query
           OR pr.hustle_name ILIKE formatted_query
           OR pr.primary_skill ILIKE formatted_query
           OR (pr.secondary_skills::text) ILIKE formatted_query
        ORDER BY search_score DESC, pr.created_at DESC
        LIMIT 15
    ) c;

    ---------- 3. HASHTAGS ----------
    SELECT jsonb_agg(row_to_json(h)) INTO v_hashtags
    FROM (
        SELECT 
            id, tag_name, usage_count,
            -- Ranking exact match higher
            (usage_count * (CASE WHEN tag_name ILIKE search_query THEN 10 ELSE 1 END)) as search_score
        FROM public.hashtags
        WHERE tag_name ILIKE formatted_query
        ORDER BY search_score DESC
        LIMIT 10
    ) h;

    ---------- 4. SERVICES ----------
    SELECT jsonb_agg(row_to_json(s)) INTO v_services
    FROM (
        SELECT 
            s.*,
            (COALESCE(s.rating, 0) * COALESCE(s.completed_jobs, 0)) as search_score,
            jsonb_build_object(
                'id', pr.id,
                'full_name', pr.full_name,
                'username', pr.username,
                'avatar_url', pr.avatar_url,
                'hustle_name', pr.hustle_name,
                'is_hustler', pr.is_hustler
            ) as profiles
        FROM public.services s
        JOIN public.profiles pr ON s.user_id = pr.id
        WHERE s.title ILIKE formatted_query OR s.category ILIKE formatted_query OR s.description ILIKE formatted_query
        ORDER BY search_score DESC
        LIMIT 10
    ) s;

    ---------- 5. PRODUCTS ----------
    SELECT jsonb_agg(row_to_json(pr)) INTO v_products
    FROM (
        SELECT 
            prod.*,
            (COALESCE(prod.sales_count, 0) * 5 + COALESCE(prod.rating, 0) * 10) as search_score,
            jsonb_build_object(
                'id', profile.id,
                'full_name', profile.full_name,
                'username', profile.username,
                'avatar_url', profile.avatar_url,
                'hustle_name', profile.hustle_name,
                'is_hustler', profile.is_hustler
            ) as profiles
        FROM public.products prod
        JOIN public.profiles profile ON prod.user_id = profile.id
        WHERE prod.title ILIKE formatted_query OR prod.category ILIKE formatted_query OR prod.description ILIKE formatted_query
        ORDER BY search_score DESC
        LIMIT 10
    ) pr;

    ---------- 6. TRAINING ----------
    SELECT jsonb_agg(row_to_json(tr)) INTO v_training
    FROM (
        SELECT 
            train.*,
            (COALESCE(train.enrollment_count, 0) * 5 + COALESCE(train.rating, 0) * 10) as search_score,
            jsonb_build_object(
                'id', profile.id,
                'full_name', profile.full_name,
                'username', profile.username,
                'avatar_url', profile.avatar_url,
                'hustle_name', profile.hustle_name,
                'is_hustler', profile.is_hustler
            ) as profiles
        FROM public.training train
        JOIN public.profiles profile ON train.user_id = profile.id
        WHERE train.title ILIKE formatted_query OR train.category ILIKE formatted_query OR train.description ILIKE formatted_query
        ORDER BY search_score DESC
        LIMIT 10
    ) tr;

    ---------- RETURN GROUPED ----------
    RETURN jsonb_build_object(
        'posts', COALESCE(v_posts, '[]'::jsonb),
        'creators', COALESCE(v_creators, '[]'::jsonb),
        'hashtags', COALESCE(v_hashtags, '[]'::jsonb),
        'services', COALESCE(v_services, '[]'::jsonb),
        'products', COALESCE(v_products, '[]'::jsonb),
        'training', COALESCE(v_training, '[]'::jsonb)
    );
END;
$$;


-- Step 4: Search Suggestions / Autocomplete Engine
CREATE OR REPLACE FUNCTION public.get_search_suggestions(search_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_creators JSONB;
    v_hashtags JSONB;
    formatted_query TEXT := search_query || '%'; -- Prefix match for faster autocomplete
BEGIN
    ---------- CREATOR SUGGESTIONS ----------
    SELECT jsonb_agg(row_to_json(c)) INTO v_creators
    FROM (
        SELECT id, full_name, username, avatar_url, hustle_name
        FROM public.profiles
        WHERE username ILIKE formatted_query
           OR full_name ILIKE formatted_query
           OR hustle_name ILIKE formatted_query
        ORDER BY review_count DESC NULLS LAST
        LIMIT 5
    ) c;

    ---------- HASHTAG SUGGESTIONS ----------
    SELECT jsonb_agg(row_to_json(h)) INTO v_hashtags
    FROM (
        SELECT id, tag_name, usage_count
        FROM public.hashtags
        WHERE tag_name ILIKE formatted_query
        ORDER BY usage_count DESC
        LIMIT 5
    ) h;

    RETURN jsonb_build_object(
        'creators', COALESCE(v_creators, '[]'::jsonb),
        'hashtags', COALESCE(v_hashtags, '[]'::jsonb)
    );
END;
$$;
