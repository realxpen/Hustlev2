# Hustle Agent Service Architecture

This document details the high-fidelity, production-ready backend **Agent & Agency Service** built to coordinate partner specialists, track talent group performances, oversee escrow bookings, manage permissions, and distribute commission payouts securely across the Hustle platform.

---

## 1. Architectural Overview & Component Modeling

The Agent Service coordinates three domains of full-stack agency automation:
- **Agency Onboarding**: Promotes verified, approved Hustlers/Specialists into authorized Agent status.
- **Roster Management (Assignments)**: Links specialists securely to managing agents with custom commission split rules, controlled by micro-permissions.
- **Performance & Business Intelligence**: Aggregates real-time delivery telemetry, captures historical booking income, calculates growth indexes, and routes payout allocations automatically.

### Architecture Topology Interaction Flow:
```
                                +---------------------------+
                                |      Client Browser       |
                                +---------------------------+
                                  |                       |
                       (REST API) |                       | (supa-sync/WebSocket)
                                  v                       v
                         +-----------------+    +-----------------+
                         |  EXPRESS HOST   |    | SUPABASE REALM  |
                         +-----------------+    +-----------------+
                                  |                       |
                    (Routes: /agent/*) |                       | (sync schema.ts)
                                  v                       v
                      +-----------------------+ +---------------------+
                      |     AgentService      | | database: pg_hooks  |
                      +-----------------------+ +---------------------+
                        /         |         \              |
                       /          |          \             v
                      v           v           v    +------------------+
                 [Profiles]   [Bookings]  [Escrows]| Event Subscriber |
                                                   +------------------+
```

---

## 2. Relational Database Schema & System Layout

To maintain persistent records and scale correctly under heavy concurrent query load, storage models are cataloged across dedicated partitioned tables:

```sql
-- =========================================================================
-- 1. AGENT_APPLICATIONS TABLE
-- Track application processes and agency brand names
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.agent_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    agency_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CONSTRAINT check_app_status CHECK (status IN ('pending', 'approved', 'rejected')),
    submission_metadata JSONB DEFAULT '{}'::jsonb NOT NULL, -- Holds biography/credentials
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_agent_app UNIQUE (user_id)
);

-- =========================================================================
-- 2. HUSTLER_AGENTS RELATIONSHIP TABLE (Assignment / Roster)
-- Maps the N:M association between agency managers and talented specialists
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.hustler_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hustler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 15.0 CONSTRAINT check_percentage CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CONSTRAINT check_agent_hustler_status CHECK (status IN ('pending', 'active', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_agent_hustler_pair UNIQUE (agent_id, hustler_id)
);

-- =========================================================================
-- 3. AGENT_PERMISSIONS TABLE
-- Granular, capability-based delegation matrix for active roster specialists
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.agent_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES public.hustler_agents(id) ON DELETE CASCADE,
    can_manage_bookings BOOLEAN DEFAULT true NOT NULL,
    can_view_earnings BOOLEAN DEFAULT true NOT NULL,
    can_edit_services BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_rel_permissions UNIQUE (relationship_id)
);

-- =========================================================================
-- 4. AGENT_COMMISSIONS TABLE
-- Automated escrow financial ledger log
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.agent_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    hustler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    booking_amount NUMERIC(12,2) NOT NULL,
    commission_amount NUMERIC(12,2) NOT NULL,
    commission_percentage NUMERIC(5,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CONSTRAINT check_comm_status CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### High-Throughput Indices Matrix:
```sql
-- Speed up active roster queries inside the Agent Control Deck
CREATE INDEX IF NOT EXISTS idx_hustler_agents_lookup ON public.hustler_agents(agent_id, status);

-- Accelerate financial balance calculations across historical commissions
CREATE INDEX IF NOT EXISTS idx_comms_earnings_calcs ON public.agent_commissions(agent_id, status);
```

---

## 3. REST API Endpoint Declarations

The Agent Service exposes compliant, authenticated Express JSON endpoints:

### 1. `POST /api/agent/apply`
Authenticates and promotes the request user to Agent.
- **Pre-requisite Rules Checked**: Checks user profile data. Evaluates whether `isHustler == true` (Only approved/vetted specialists are allowed to establish and manage agencies).
- **Request Body**:
  ```json
  {
    "agencyName": "Swift Digital Agency",
    "bio": "Bespoke modern UI/UX production crew."
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Agency application approved and manager privileges granted instantly.",
    "application": {
      "id": "agent-app-uuid",
      "user_id": "creator-sophia",
      "agency_name": "Swift Digital Agency",
      "status": "approved",
      "submission_metadata": { "bio": "..." }
    }
  }
  ```

### 2. `POST /api/agent/assign`
Creates an allocation link/invite.
- **Pre-requisite Rules Checked**: The dispatcher profile must have `isAgent = true`. The recipient profile must have `isHustler = true`.
- **Request Body**:
  ```json
  {
    "hustlerId": "creator-marcus",
    "commissionPercentage": 15
  }
  ```
- **Response `200 OK`**: Adds the relationship, starts states as `'pending'`, and fires a real-time event notice to the specialist's control card.

### 3. `GET /api/agent/dashboard`
The core business intelligence aggregator. Combiles analytics and financial tracking in one retrieval.
- **Response Elements**:
  - `analytics`: Contains sum total revenue, monthly trends, growth scores, average commissions, and individual specialist performance indexes (bookings completed, earned balances, generated commissions split).
  - `bookings`: Lists overseen contracts and current escrow stages (`status`, `payment_status`, `timeline` etc) to let agents track projects.
  - `commissionHistory`: Lists historical payout distributions.

### 4. `GET /api/agent/hustlers`
Returns the active and pending roster including nested permissions and profile states.

---

## 4. Operational Gating Rules (Control Logic)

To guarantee compliance, the following business logic rules are evaluated strictly:

1. **Approved Specialist Constraint**
   - *Logic*: When evaluating `POST /agent/apply`, if the account has `isHustler` set to `false`, the request is rejected with a code `403 Forbidden` block. This prevents consumer/client accounts from overstepping service controls.
2. **Double-Sided Verification for Partnerships**
   - *Logic*: An Agent cannot force-add a specialist to their roster. A `POST /agent/assign` initializes a `'pending'` request and sends a real-time system recommendation notification to the specialist's deck. The specialist must dispatch a request to target `/relationship/respond` with `'active'` to confirm.
3. **Escrow Splitting Hook Integration**
   - *Logic*: On completion of a contract booking via `BookingEventService`, any active `HustlerAgent` association is calculated. If a match is found, the commission percentage is processed, allocating the partner's share automatically into the ledger table `agent_commissions`, and dispatching a financial payout alert to both parties.
