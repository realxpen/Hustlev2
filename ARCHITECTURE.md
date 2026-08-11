# Hustle: The Economy of You
## System Architecture Blueprint (Production-Ready)

This document outlines the end-to-end technical architecture for Hustle, integrating social discovery, identity evolution, and a secure marketplace economy.

---

### 1. Full System Architecture (Text-Based Diagram)

```bash
[ CLIENT LAYER (MOBILE-FIRST WEB) ]
      |
      |-- [ FRONTEND (React/Next.js) ]
      |      |-- State: Auth, Bookings, Wallet, Discovery
      |      |-- Components: Feed, Profile, Chat, BookingFlow
      |
[ GATEWAY & LOGIC LAYER ]
      |
      |-- [ AUTH & IDENTITY SERVICE ] <--- (Role Escalation Control)
      |-- [ DISCOVERY & RECO ENGINE ] <--- (Personalization Logic)
      |-- [ MESSAGING SERVICE ]       <--- (Real-time Socket.io/Firebase)
      |-- [ BOOKING & ESCROW ENGINE ] <--- (Lifecycle Management)
      |-- [ PAYMENT & WALLET SERVICE ] <--- (Ledger & Stripe/Payment Gateway)
      |
[ DATA LAYER ]
      |
      |-- [ USER COLLECTIONS ] (Verified Profiles)
      |-- [ TRANSACTION LEDGER ] (Immutable Logs)
      |-- [ CONTENT REPOSITORY ] (Video/Image Assets)
      |-- [ ANALYTICS / EVENT BUS ] (Behavior Tracking)
```

---

### 2. Frontend Structure Breakdown

**Directory Organization:**
- `/src/app`: Route-based views (Home, Discovery, Wallet, Profile, Chat, Bookings).
- `/src/components`: Atomic and molecular UI components (Shared, UI-specific, Feature-specific).
- `/src/services`: client-side abstraction for API/Back-end interactions.
- `/src/state`: Global state persistence (Zustand/Redux) for cross-cut concerns like Auth and active Journey Missions.
- `/src/hooks`: Reactive logic for location-aware discovery and moment-based adaptation.

---

### 3. Backend Service Architecture

The system is designed as a **Modular Services** architecture:

1.  **Identity Service:** Manages `UserRole` escalation. `CLIENT` to `HUSTLER` transitions are validated via server-side verification of business/ID tokens.
2.  **Marketplace Engine:** Handles the Booking lifecycle. Enforces status transitions: `REQUESTED -> BOOKED -> IN_PROGRESS -> COMPLETED`.
3.  **Escrow Protected Payments:** All funds are held in a virtual ledger until service completion is verified by both parties or an automated timeout.
4.  **Intel Service (AI):** A background personalization worker that ranks the Feed based on `EngagementPatterns` (Implicit) and `SearchHistory` (Explicit).

---

### 4. Database Schema Design (Entities)

- **Users:** (Base profile, `Role`, `HustlerMetrics`).
- **Profiles:** (Services, Portfolio, Availability, repeat-client count).
- **Bookings:** (Client Ref, Hustler Ref, status, `EscrowStatus`, timestamps).
- **Transactions:** (Ledger entries, UID, amount, type, booking link).
- **Events:** (Watch history, clicks, search queries) used for Recommendation training.

---

### 5. API / Service Contracts

| Endpoint | Method | Purpose | Security |
|---|---|---|---|
| `/api/profile/upgrade` | POST | Move from Client to Hustler | Admin Verify |
| `/api/bookings/create` | POST | Initialize service contract | Signed-In |
| `/api/escrow/release` | POST | Trigger payment flow | Multi-sig (User+System) |
| `/api/feed/personalized`| GET | Fetch AI-ranked content | Token-based |

---

### 6. Role Security Model

- **Identity Integrity:** Roles are defined as `UserRole`. Any mutation to `role` field results in a server-side hash verification.
- **Access Control:** `HUSTLER` views (e.g., Earnings, Job Management) are blocked at the middleware level for `CLIENT` accounts.
- **PII Isolation:** User contact info is separate from the public profile and only revealed once a Booking is `FUNDED`.

---

### 7. End-to-End System Flow (The "Hustle Loop")

1.  **Discovery:** AI Feed highlights Nearby Hustlers with `RecommendationReason`.
2.  **Intent:** User bridges to Profile, triggering a `JourneyMission`.
3.  **Trust:** Profile displays `IdentityEvolution` (Milestones, TrustScore).
4.  **Action:** Chat integrated with Booking request flow.
5.  **Transaction:** Payment goes to `Escrow`.
6.  **Outcome:** Completion triggers `ReputationUpdate` and `ProfileGrowth`.

---

### 8. State Management Design (Zustand/Zod)

- **Global:** `Auth`, `Theme`, `Session`.
- **Feature:** `ActiveMission` (Journey flow), `CurrentConversation`, `WalletBalance`.
- **Persistence:** Local storage for Search filters; Server-state for Transactions.

---

### 9. Scalability Plan

- **High Volume Feed:** Use a Redis-backed cache for regional "trending" feeds.
- **Image/Video:** Cloudflare Stream / CDN for 0-latency playback.
- **Database:** Vertically partitioned NoSQL for Feed/Events; ACID-compliant RDBMS for Ledger/Transactions.

---

### 10. Production Readiness Checklist

- [ ] Rate-limiting on AI-search endpoints.
- [ ] KYC/AML compliance for Hustler onboarding (Stripe Connect).
- [ ] SSL Encryption for PII fields.
- [ ] End-to-end testing of the "Booking -> Completion -> Release Funds" flow.
- [ ] Automated Reputation recalculation job.
