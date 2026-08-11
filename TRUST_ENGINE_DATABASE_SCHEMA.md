# Trust Engine Database Schema

This schema manages the internal Trust Score system. The system calculates a confidential numeric score (0-10,000) that is then mapped to visible trust badges.

```sql
-- 1. Trust Badges (Configuration)
-- Defines the badge tiers and their required score thresholds.
CREATE TABLE trust_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(50) UNIQUE NOT NULL, -- 'New', 'Verified', 'Trusted', 'Top Rated', 'Expert'
    min_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    
    -- Additional metadata for UI
    icon_slug VARCHAR(100),
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed basic badges
INSERT INTO trust_badges (label, min_score, max_score, description) VALUES
('New', 0, 1499, 'Initial status for new or unverified accounts.'),
('Verified', 1500, 3999, 'Basic identity and contact verifications completed.'),
('Trusted', 4000, 6999, 'Reliable user with consistent positive history.'),
('Top Rated', 7000, 8999, 'Consistently high performance and community standing.'),
('Expert', 9000, 10000, 'Elite status reserved for top-tier vetted professionals.');


-- 2. Trust Profiles
-- Stores the current state and cached score for each user.
CREATE TABLE trust_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Confidential Raw Score
    internal_score INTEGER NOT NULL DEFAULT 1000, 
    
    -- References current badge (cached for performance)
    current_badge_id UUID REFERENCES trust_badges(id),
    
    -- Cached signals for performance
    completed_jobs_count INTEGER NOT NULL DEFAULT 0,
    dispute_count INTEGER NOT NULL DEFAULT 0,
    bayesian_rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    
    last_recalculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trust_profiles_score ON trust_profiles(internal_score);


-- 3. Trust Events (Signal Log)
-- Immutable log of every platform action that triggers a score evaluation.
CREATE TABLE trust_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    event_type VARCHAR(100) NOT NULL, 
    -- e.g., 'job_completed', 'dispute_lost', 'id_verified', 'profile_completed'
    
    reference_id UUID, -- ID of the related object (job_id, verification_id, etc.)
    metadata JSONB, -- Additional context for the algorithm (e.g., job value, dispute reason)
    
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trust_events_user ON trust_events(user_id);
CREATE INDEX idx_trust_events_type ON trust_events(event_type);


-- 4. Trust Score History (Audit Trail)
-- Tracks the evolution of a user's score over time.
CREATE TABLE trust_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES trust_events(id),
    
    previous_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    score_delta INTEGER NOT NULL,
    
    -- Previous and New badges (if a transition occurred)
    previous_badge_id UUID REFERENCES trust_badges(id),
    new_badge_id UUID REFERENCES trust_badges(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trust_history_user ON trust_score_history(user_id);
CREATE INDEX idx_trust_history_created ON trust_score_history(created_at);
```

### Relationship Map
- **users** 1:1 **trust_profiles**: Every user has a trust profile.
- **trust_profiles** N:1 **trust_badges**: Profiles are mapped to a badge based on score.
- **trust_profiles** 1:N **trust_events**: Every action a user takes is logged as an event.
- **trust_events** 1:1 **trust_score_history**: Each change in score is tied to a specific triggering event.
- **trust_score_history** N:1 **trust_badges**: History captures badge transitions for timeline auditing.
