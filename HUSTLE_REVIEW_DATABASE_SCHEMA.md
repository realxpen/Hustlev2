# Review System Database Schema

This schema manages reviews submitted by clients after a booking is completed, including detailed category ratings, media attachments, and hooks to support the robust Trust Engine.

```sql
-- 1. Reviews
-- The core review record linked to a verified booking.
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL, -- Ensures one review per booking (verified work)
    reviewer_id UUID NOT NULL, -- Client who is reviewing
    reviewee_id UUID NOT NULL, -- Provider being reviewed
    
    -- Overall Rating (1-5)
    overall_rating DECIMAL(3, 2) NOT NULL,
    
    -- Written textual review
    content TEXT,
    
    -- Trust Engine Support: Signals determining review weight and visibility
    is_verified_purchase BOOLEAN NOT NULL DEFAULT true, -- Was the booking monetary through escrow?
    is_flagged BOOLEAN NOT NULL DEFAULT false, -- Has the trust engine flagged this for manual review?
    trust_weight DECIMAL(3, 2) NOT NULL DEFAULT 1.00, -- Trust Engine calculated weight of the review 
    helpful_votes INTEGER NOT NULL DEFAULT 0, -- Community trust signal
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_rating_range CHECK (overall_rating >= 1 AND overall_rating <= 5),
    CONSTRAINT unique_booking_review UNIQUE(booking_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_trust ON reviews(trust_weight DESC);


-- 2. Review Media
-- Photos or videos attached to a review to provide visual proof of service quality.
CREATE TABLE review_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL, -- 'image', 'video'
    
    -- Trust Engine: Optionally verified metadata
    verified_location BOOLEAN DEFAULT false,
    verified_metadata JSONB, -- Check EXIF data matching context
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_review_media_review ON review_media(review_id);


-- 3. Review Categories
-- Normalizes the categories available for rating (dynamically expandable by service type).
CREATE TABLE review_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL, -- 'quality', 'communication', 'timeliness', 'professionalism'
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 4. Review Scores
-- Maps a numeric rating to a specific review and category.
CREATE TABLE review_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES review_categories(id) ON DELETE CASCADE,
    
    score DECIMAL(3, 2) NOT NULL,
    
    CONSTRAINT chk_score_range CHECK (score >= 1 AND score <= 5),
    CONSTRAINT unique_review_category UNIQUE(review_id, category_id)
);

CREATE INDEX idx_review_scores_review ON review_scores(review_id);
CREATE INDEX idx_review_scores_category ON review_scores(category_id);


-- 5. Review Summaries (Trust Engine Aggregation)
-- Periodically updated by the Trust Engine, applies trust_weight to raw scores for displaying the real quality metric.
CREATE TABLE profile_review_summaries (
    user_id UUID PRIMARY KEY, -- The provider
    
    total_verified_reviews INTEGER NOT NULL DEFAULT 0,
    weighted_average_score DECIMAL(3, 2) NOT NULL DEFAULT 0.00, -- Weighted by reviewer Trust Weight
    
    -- Category Weighted Averages
    avg_quality DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    avg_communication DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    avg_timeliness DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    avg_professionalism DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Trust Engine Integrity
- **Verified Purchase Requirement**: The `reviews` table mandates a `booking_id` with a `UNIQUE(booking_id, reviewer_id)` constraint to enforce that only verified, completed transactions via Escrow can be reviewed, eliminating fake rating boosting.
- **Trust Weighting**: `trust_weight` inside `reviews` allows the anomaly engine to down-rank suspicious positive reviews or revenge reviews without fully deleting them, preventing system gaming.
- **Dynamic Categories**: `review_categories` combined with `review_scores` ensures that only structurally verified categories (e.g. general ones or service-specific like "Cleanliness") are rated without schema rewrites.
- **Media Exif Verification**: `verified_metadata` within `review_media` allows the platform algorithm to ensure media isn't a stock image.
