# Fraud & Safety Database Schema

This schema powers the Hustle Trust & Safety engine. It tracks suspicious signals, user risk profiles, and the moderation actions taken to protect the marketplace.

```sql
-- 1. Fraud Signals
-- Captures individual suspicious indicators detected by automated heuristics or AI models.
CREATE TABLE fraud_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    signal_type VARCHAR(100) NOT NULL, 
    -- e.g., 'ip_collision', 'rapid_review_cycle', 'device_fingerprint_match', 'content_toxicity'
    
    severity VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    
    -- Additional context for evaluation (e.g., the IP address, the matched user_id, or the toxic text)
    signal_data JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fraud_signals_user ON fraud_signals(user_id);
CREATE INDEX idx_fraud_signals_type ON fraud_signals(signal_type);


-- 2. Risk Scores
-- Aggregated safety profile for a user. High risk scores trigger moderation actions.
CREATE TABLE risk_scores (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Confidential Raw Risk Score (0-10,000, where 10,000 is maximum danger)
    raw_risk_score INTEGER NOT NULL DEFAULT 0,
    
    -- Categorization for quick system logic
    risk_tier VARCHAR(50) NOT NULL DEFAULT 'low', 
    -- 'low', 'medium', 'high', 'restricted'
    
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_scores_tier ON risk_scores(risk_tier);


-- 3. Safety Reports
-- User-submitted complaints regarding behavior, content, or service quality.
CREATE TABLE safety_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    report_type VARCHAR(100) NOT NULL, -- 'scam', 'harassment', 'duplicate_account', 'quality_issue'
    context_id UUID, -- References the job_id, service_id, or review_id being reported
    
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'under_review', 'resolved', 'dismissed'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_safety_reports_reported ON safety_reports(reported_user_id);
CREATE INDEX idx_safety_reports_status ON safety_reports(status);


-- 4. Moderation Actions
-- Record of disciplinary actions taken against accounts to maintain platform integrity.
CREATE TABLE moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    moderator_id UUID, -- Null if automated by system engine
    
    action_type VARCHAR(100) NOT NULL, 
    -- 'flag_profile', 'shadow_ban', 'reduce_visibility', 'temporary_lock', 'permanent_ban'
    
    reason TEXT NOT NULL,
    evidence_refs JSONB, -- Array of fraud_signal_ids or report_ids supporting the action
    
    expires_at TIMESTAMP WITH TIME ZONE, -- For temporary locks or shadow bans
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE -- For reversed bans
);

CREATE INDEX idx_mod_actions_user ON moderation_actions(user_id);
CREATE INDEX idx_mod_actions_type ON moderation_actions(action_type);
```

### Safety & Integrity Workflow
1.  **Detection**: Automated heuristics log **fraud_signals** in real-time based on user activity.
2.  **Aggregation**: The system continuously recalculates the **risk_scores** based on signal density and severity.
3.  **Reporting**: Users submit **safety_reports**, which are evaluated alongside automated signals.
4.  **Enforcement**: If risk thresholds are met or a human moderator intervenes, a **moderation_action** is logged, restricting account visibility or functionality.
5.  **Auditability**: Every restriction is tracked with evidence, ensuring transparency for the safety team.
