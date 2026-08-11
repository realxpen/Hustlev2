# Verification Service Database Schema

This schema manages the process of verifying various aspects of a user's identity, contact information, and business status to build trust within the platform.

```sql
-- 1. Verification Requests
-- Central table tracking the status of all verification attempts by users.
CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    verification_type VARCHAR(50) NOT NULL, 
    -- e.g., 'phone', 'email', 'identity', 'address', 'business'
    
    status VARCHAR(50) NOT NULL DEFAULT 'pending', 
    -- e.g., 'pending', 'approved', 'rejected', 'more_info'
    
    -- Request payload (e.g., phone number, email, or basic metadata)
    payload JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Optional constraints depending on business logic:
    -- A user might only be allowed one pending request per type at a time.
    CONSTRAINT unique_pending_verification UNIQUE NULLS NOT DISTINCT (
        user_id,
        verification_type,
        CASE WHEN status IN ('pending', 'more_info') THEN true ELSE NULL END
    )
);

CREATE INDEX idx_ver_req_user ON verification_requests(user_id);
CREATE INDEX idx_ver_req_type_status ON verification_requests(verification_type, status);


-- 2. Verification Documents
-- Stores the actual media/documents provided for complex verifications (e.g., ID cards, utility bills).
CREATE TABLE verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
    
    document_type VARCHAR(50) NOT NULL, 
    -- e.g., 'id_front', 'id_back', 'selfie', 'utility_bill', 'business_license'
    
    document_url TEXT NOT NULL,
    
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ver_docs_req ON verification_documents(request_id);


-- 3. Verification Results
-- Audit trail tracking the outcome of manual reviews or automated Trust Engine checks.
CREATE TABLE verification_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
    
    reviewer_id UUID, -- Can be null if automatically verified by system
    decision VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'more_info_requested'
    
    reason TEXT, -- Feedback on why it was rejected or what more info is needed
    confidence_score DECIMAL(5,2), -- For automated verification scoring (e.g., 99.50)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ver_res_req ON verification_results(request_id);
```

### Trust & Moderation Integrity
1. **Isolated Documents**: The `verification_documents` table isolates sensitive PII references, allowing strict access controls and retention policies independent of the request state.
2. **Audit Trails**: The `verification_results` table maintains a robust history of who reviewed the verification, the outcome, and any confidence scoring, which is crucial for dispute resolution.
3. **State Locking**: The unique constraint on `verification_requests` prevents abuse where a user could spam the trust queue with multiple pending requests of the same type.
