# Hustle: Referral System Database Schema

This document details the production-ready PostgreSQL database design for the **Hustle Viral Referral System**. Built on top of PostgreSQL/Supabase, this normalized schema manages the end-to-end user growth pipeline. It supports precise conversion tracking, micro-ledger balance auditing, comprehensive threat prevention logs, and high-performance querying while enforcing Row-Level Security (RLS).

---

## 1. Schema Relation Map

The relational architecture is segmented into **three specialized tables**:

```
                  +-----------------------------------+
                  |             profiles              |
                  +-----------------------------------+
                   /              \                 \
                  / (Referrer)     \ (Invitee)       \ (Recipient)
                 v                  v                 v
+------------------+         +------------------+    +------------------+
|    referrals     |-------> | referral_rewards |<---|   claim logs     |
+------------------+ (1:N)   +------------------+    +------------------+
        |
        | (1 : N)
        v
+------------------+
| referral_events  |
+------------------+
```

* **`referrals`**: Connects referrers with potential and registered candidates, recording IP footprints and fraud metrics.
* **`referral_rewards`**: Holds granular ledger entries representing cash bonuses or experience points assigned to campaign participants.
* **`referral_events`**: Chronological event streams tracking state transitions (such as clicks, signups, and security evaluations) for forensic anti-fraud audits.

---

## 2. Table Specifications (DDL)

The schema definitions are structured as follows:

### A. `referrals` Table
Traces structural links between referrers and applicants. Tracks sign-up states and initial metadata for device integrity matching.

```sql
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    invitee_email VARCHAR(255) NOT NULL,
    invitee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    referral_code VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL 
        CONSTRAINT check_referral_status 
        CHECK (status IN ('pending', 'signed_up', 'declined', 'flagged')),
    
    -- Forensic data collected prior to registration
    ip_address VARCHAR(100),
    user_agent VARCHAR(512),
    
    -- Fraud guard telemetry variables
    is_suspicious BOOLEAN DEFAULT false NOT NULL,
    fraud_reason VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Enforce single referral nomination per candidate email
    CONSTRAINT unique_invitee_email UNIQUE (invitee_email),
    -- Prevent users from referring themselves
    CONSTRAINT check_not_self_referral CHECK (referrer_id <> invitee_id)
);
```

### B. `referral_rewards` Table
Double-sided payout records. Credits are separated from user profiles to secure financial bookkeeping and allow granular withdrawal auditing.

```sql
CREATE TABLE public.referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reward_type VARCHAR(50) NOT NULL 
        CONSTRAINT check_reward_type 
        CHECK (reward_type IN ('cash', 'xp')),
    
    -- Numeric support for monetary and XP units
    amount DECIMAL(10, 2) NOT NULL 
        CONSTRAINT check_reward_amount_positive 
        CHECK (amount > 0),
    
    status VARCHAR(50) DEFAULT 'pending' NOT NULL 
        CONSTRAINT check_reward_award_status 
        CHECK (status IN ('pending', 'awarded', 'withdrawn', 'revoked')),
        
    payout_tx_id VARCHAR(255), -- Reference identifier linking outbound wire/ledger card payouts
    awarded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### C. `referral_events` Table
Tracks timeline transactions and system events. This acts as an audit log used by automated security rules to intercept rapid spamming or device farm clusters.

```sql
CREATE TABLE public.referral_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID REFERENCING public.referrals(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL 
        CONSTRAINT check_referral_event_type 
        CHECK (event_type IN (
            'invite_sent', 
            'link_clicked', 
            'account_created', 
            'onboarding_completed', 
            'fraud_flagged', 
            'reward_accrued', 
            'payout_claimed'
        )),
        
    -- Semi-structured column for storing device metadata, fingerprint hashes, or anti-fraud details
    event_metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

---

## 3. High-Performance Index Tuning

These indices optimize lookup speeds for referral stat dashboards and rapid verification inside Express API controllers:

```sql
-- 1. Accelerates client stats dashboard aggregation lookups
CREATE INDEX idx_referrals_referrer_status ON public.referrals (referrer_id, status);

-- 2. Fast login verification: lookup pending invitations by email address
CREATE INDEX idx_referrals_invitee_email ON public.referrals (LOWER(invitee_email));

-- 3. Speeds up real-time auditing of ledger rewards balance per user
CREATE INDEX idx_referral_rewards_search ON public.referral_rewards (recipient_id, status, reward_type);

-- 4. Fast event log trace for forensic anti-fraud analysis
CREATE INDEX idx_referral_events_lookup ON public.referral_events (referral_id, created_at DESC);

-- 5. Speeds up JSONB query scanning during velocity checking (e.g. tracking client-declared fingerprinted IPs)
CREATE INDEX idx_referral_metadata_gin ON public.referral_events USING gin (event_metadata);
```

---

## 4. Security & Row-Level Isolation (RLS)

All tables enforce native Row-Level Security rules to isolate personal statistics and prevent unauthorized modifications:

```sql
-- Enable security rules across tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

-- 1. REFERRALS ACCESS CONTROL
CREATE POLICY "Users can view invitations they dispatched"
    ON public.referrals FOR SELECT 
    USING (auth.uid() = referrer_id);

CREATE POLICY "Referrers are authorized to log new invites"
    ON public.referrals FOR INSERT 
    WITH CHECK (auth.uid() = referrer_id);

-- 2. KEY CONVECTIVE REWARDS BALANCES
CREATE POLICY "Users can track their allocated ledger bonuses"
    ON public.referral_rewards FOR SELECT
    USING (auth.uid() = recipient_id);

-- 3. AUDIT TRIAL SECURITY CONTROL
CREATE POLICY "Users can view audit trails relating to their referrals"
    ON public.referral_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.referrals 
            WHERE referrals.id = referral_events.referral_id 
              AND referrals.referrer_id = auth.uid()
        )
    );
```

---

## 5. Typical Query Flows

### A. Aggregating User Referral Stats
```sql
SELECT 
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_signups,
    COUNT(CASE WHEN status = 'signed_up' THEN 1 END) as successful_signups,
    COUNT(CASE WHEN status = 'flagged' THEN 1 END) as suspicious_flagged
FROM public.referrals
WHERE referrer_id = 'user-uuid';
```

### B. Accessing Withdrawable Cash Balance
```sql
SELECT COALESCE(SUM(amount), 0.00) as cash_balance
FROM public.referral_rewards
WHERE recipient_id = 'user-uuid'
  AND reward_type = 'cash'
  AND status = 'awarded';
```

### C. Sybil Velocity Validation Check (Last 10 Minutes)
```sql
SELECT COUNT(*) as invites_last_10min
FROM public.referral_events
WHERE event_type = 'invite_sent'
  AND (event_metadata->>'referrer_id')::UUID = 'user-uuid'
  AND created_at > (NOW() - INTERVAL '10 minutes');
```
