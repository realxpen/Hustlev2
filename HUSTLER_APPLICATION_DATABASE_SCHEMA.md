# Hustler Application System Database Schema

This schema manages the process of a standard Client applying to earn the "Hustler" status, tracking their submitted skills, portfolio media, and the review workflow.

```sql
-- 1. Hustler Applications (Core Application Record)
CREATE TABLE hustler_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Information
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    
    -- Workflow Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending', 
    -- 'pending', 'approved', 'rejected', 'more_info'
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Only one active/pending application per user at a time
    CONSTRAINT unique_pending_application UNIQUE NULLS NOT DISTINCT (
        user_id, 
        CASE WHEN status IN ('pending', 'more_info') THEN true ELSE NULL END
    )
);

CREATE INDEX idx_hustler_apps_user ON hustler_applications(user_id);
CREATE INDEX idx_hustler_apps_status ON hustler_applications(status);


-- 2. Application Skills
-- Normalizes the skills a user is applying to offer
CREATE TABLE application_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES hustler_applications(id) ON DELETE CASCADE,
    
    skill_name VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    years_of_experience INTEGER,
    
    -- Ensuring one primary skill per application
    CONSTRAINT unique_primary_skill UNIQUE NULLS NOT DISTINCT (
        application_id, 
        CASE WHEN is_primary THEN true ELSE NULL END
    )
);

CREATE INDEX idx_app_skills_app ON application_skills(application_id);


-- 3. Application Media
-- Portfolio attachments providing proof of work
CREATE TABLE application_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES hustler_applications(id) ON DELETE CASCADE,
    
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'certification'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_app_media_app ON application_media(application_id);


-- 4. Application Reviews (Audit Trail)
-- Tracks admin or trust engine review decisions and feedback
CREATE TABLE application_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES hustler_applications(id) ON DELETE CASCADE,
    
    reviewer_id UUID NOT NULL, -- Admin or automated system ID
    decision VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'more_info_requested'
    notes TEXT, -- Feedback provided to the user or internal notes
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_app_reviews_app ON application_reviews(application_id);
```

### Trust Engine & Workflow Integrity
- **Normalized Media & Skills**: Storing skills and media in separate tables allows the trust engine to evaluate elements independently (e.g., verifying a certification URL vs a video).
- **Application Locking**: The `unique_pending_application` constraint ensures users cannot spam multiple applications while one is currently in the `pending` or `more_info` state.
- **Review History**: The `application_reviews` table provides a robust audit trail, critical for marketplace integrity and appealing rejected applications.
