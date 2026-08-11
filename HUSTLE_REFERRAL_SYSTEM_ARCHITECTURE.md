# Hustle: Viral Referral System Architecture

The **Hustle Referral System** is engineered to drive organic, virally-optimized growth. By utilizing double-sided financial incentives ($20 + $20 split payouts) and instantaneous experience bonuses, the system motivates active tradespeople to register their peers and coordinate on the platform.

---

## 1. System Topology & Layers

The referral engine utilizes a fully-decoupled MVC lifecycle architecture to manage persistent campaigns, invite states, and secure payout cash transactions:

```
                  [Client Application UI (ReferralHub)]
                                   │
                                   ▼ (Secured HTTPS REST API)
                    [Express Routing Security Filter] (server/routes/referralRoutes.ts)
                                   │
                                   ▼
                       [Referral Flight Controller] (server/controllers/referralController.ts)
                                   │
                                   ▼
                        [Referral Service Layer] (server/services/referralService.ts) (Checks Anti-Fraud Engine)
                                   │
                                   ▼
                       [Repository Campaign Store] (server/repositories/referralRepository.ts)
                         ┌─────────┴─────────┐
                         ▼                   ▼
                 [Referrals Ledger]  [Invitation Logs]
```

### Component Roles

1. **Type Definitions (`/server/types/referral.ts`)**: Models safe contracts representing referral statistics, cash configurations, fraud tracking identifiers, and invitation states.
2. **Repository Layer (`/server/repositories/referralRepository.ts`)**: Tracks sent campaigns, counts successful signups, manages pending leads, houses security aggregation metrics (flagged count history), and processes ledger mutations.
3. **Service Layer (`/server/services/referralService.ts`)**: Orchestrates deep anti-fraud rules (disposable email domain blockades, self-referral blocks, and Sybil rate limiting) and processes ledger credits upon qualifying onboard completions.
4. **Controllers (`/server/controllers/referralController.ts`)**: Extracts authenticated profiles, retrieves request headers (IP/Host, User-Agent), and converts payloads safely.

---

## 2. API Endpoint Specifications

All endpoints are mounted under `/referrals` / `/api/referrals` (with singular fallback `/referral` / `/api/referral` maintained for backwards-compatibility):

### A. Track Outbound Referrals
* **Route**: `POST /referrals/create`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Request Payload**:
  ```json
  {
    "name": "Marcus Rashford",
    "email": "marcus.rash@gmail.com"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Referral invitation successfully created",
    "invite": {
      "id": "ref-17180921001-925",
      "referrerId": "test-client-id",
      "inviteeName": "Marcus Rashford",
      "inviteeEmail": "marcus.rash@gmail.com",
      "status": "pending",
      "rewardsAwarded": false,
      "createdAt": "2026-06-11T13:40:00Z"
    }
  }
  ```
* **Error Response (`400 Bad Request` e.g. Self-referral / Flagged Fraud)**:
  ```json
  {
    "success": false,
    "error": "Referral flagged as suspicious: Blocked: Disposable email provider detected (@mailinator.com)"
  }
  ```

### B. Retrieve Referral stats
* **Route**: `GET /referrals/stats`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "referralCode": "HUSTLE-JOIN-XPENS7",
        "referralLink": "https://hustle.app/join?ref=XPENS7",
        "invitesSentCount": 13,
        "successfulSignupsCount": 4,
        "pendingSignupsCount": 4,
        "rewardsBalance": 85.00,
        "rewardsXp": 240,
        "flaggedCount": 1
      },
      "logs": [
        {
          "id": "ref-17180921001-925",
          "name": "Marcus Rashford",
          "email": "marcus.rash@gmail.com",
          "status": "pending",
          "date": "2026-06-11",
          "rewardAmount": "Pending Signup"
        }
      ]
    }
  }
  ```

### C. Simulate & Reward Qualifying Joins
* **Route**: `POST /referrals/reward`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Request Payload**:
  ```json
  {
    "email": "marcus.rash@gmail.com"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Referral successfully approved! Split cash incentives applied to account ledger.",
    "result": {
      "id": "ref-17180921001-925",
      "referrerId": "test-client-id",
      "inviteeName": "Marcus Rashford",
      "inviteeEmail": "marcus.rash@gmail.com",
      "status": "signed_up",
      "rewardsAwarded": true,
      "createdAt": "2026-06-11T13:40:00Z"
    }
  }
  ```
* **Error Response (`400 Bad Request` e.g. Trying to reward a flagged lead)**:
  ```json
  {
    "success": false,
    "error": "Cannot issue split payouts: This referral is flagged as a security/fraud hazard (Blocked: Disposable email provider detected (@mailinator.com))"
  }
  ```

### D. Trigger Cash Withdrawal Payouts
* **Route**: `POST /referrals/payout` (back-compat: `/referral/payout`)
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Cash referral bonus successfully withdrawn to connected card",
    "payout": {
      "claimed": 85.00,
      "currentBalance": 0
    }
  }
  ```

---

## 3. Automated Fraud Prevention Engine (Hustle Shield Pro)

The system automatically subjects incoming requests through a pipeline containing 4 levels of validation filters inside `/server/services/referralService.ts`:

1. **Disposable Domain Blockade**: Prevents bots and malicious users from using temporary inboxes. All submissions from domains like `mailinator.com`, `tempmail.com`, `yopmail.com`, and `dispostable.com` are blocked:
   ```ts
   const DISPOSABLE_DOMAINS = ["mailinator.com", "tempmail.com", "yopmail.com", ...];
   ```
2. **Self-Referral Deterrence**: Enforces string normalization checks (strips plus-address aliases, e.g., `user+test@gmail.com` -> `user@gmail.com`) and matches them against the referrer's master identity, blocking attempts to self-refer.
3. **Sybil Rate Limiting (Velocity Throttle)**: Disallows account holders from dispatching more than **5 invites within a rolling 10-minute window**.
4. **Host Fingerprint Cluster Scan**: Analyzes client IP address headers. If multiple distinct profiles are attempting to record invitations from the exact same device footprint, the requests are blocked, preventing botnets and emulator device farms.

---

## 4. Database Schema Blueprint (PostgreSQL)

To scale seamlessly, the schema implements a normalized mapping to track invite transactions securely:

```sql
-- 1. Referral Link Codes & Stats Aggregates (Extends User Profiles metadata)
CREATE TABLE public.user_referrals (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    referral_code VARCHAR(100) UNIQUE NOT NULL,
    referral_link VARCHAR(512) NOT NULL,
    invites_sent INT DEFAULT 0 NOT NULL,
    successful_signups INT DEFAULT 0 NOT NULL,
    pending_signups INT DEFAULT 0 NOT NULL,
    rewards_balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    rewards_xp INT DEFAULT 0 NOT NULL,
    flagged_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Granular Referral Outbound Campaigns and Lifecycle Log
CREATE TABLE public.referral_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_name VARCHAR(255) NOT NULL,
    invitee_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CONSTRAINT check_invite_status CHECK (status IN ('pending', 'signed_up', 'declined', 'flagged')),
    rewards_awarded BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ip_address VARCHAR(100),
    user_agent VARCHAR(512),
    fraud_reason VARCHAR(255),
    
    CONSTRAINT unique_referrer_invitee UNIQUE (referrer_id, invitee_email)
);

-- Index tuning for fast dashboard retrieval loops
CREATE INDEX idx_referral_invitations_referrer ON public.referral_invitations (referrer_id, status);
CREATE INDEX idx_referral_invitations_email ON public.referral_invitations (invitee_email);
```

---

## 5. Double-Sided Viral Loop Mechanics

```
  [User invites Peer] 
         │ 
         ▼ (Peer receives Email with unique HUSTLE-JOIN-XPENS7 partner link)
  [Peer signs up & works] 
         │ 
         ▼ (Instantaneous platform settlement checks)
  [Split rewards distributed] ────► Referrer pockets $20.00 cash + 50 Academy XP 
                             ────► Invitee pockets $20.00 sign-up bonus
```
- **Frictionless Social Hooks**: Includes single-click shortcuts to route pre-made, high-converting social texts to **Twitter (X)**, **Facebook**, **WhatsApp**, or standard mailers.
- **Micro-Copy Convenience**: Incorporates a localized, live clipboard copy workflow with elegant visual validation indicators to maximize sharing fluidity.
- **Claim & Cash Withdrawals**: Connects seamlessly with the digital platform wallet, allowing users to initiate payout transfers straight to their bank accounts or debits instantly.
