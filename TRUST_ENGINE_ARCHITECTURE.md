# Trust Engine Architecture

## Overview
The Trust Engine is a proprietary, silent background system that calculates user reliability and safety. It ensures that the Hustle platform remains safe by analyzing verifications, review scores, escrow dispute rates, and platform engagement.

## Core Principle
**Users NEVER see their raw Trust Score.** The numeric calculation remains strictly server-side (0-10,000 range). The user only ever sees their mapped "Visible Label". This prevents gamification and 'gaming' the system, while providing a clear status indicator for buyers and sellers.

## 1. Inputs & Signals
The engine ingests the following real-time signals:
- **Completed Jobs:** Logarithmic scaling (prevents grinding) with value weighting (prevents penny-job boosting).
- **Review Quality:** Bayesian average of all reviews received.
- **Dispute Rate:** Ratio of lost escrow disputes to total jobs.
- **Account Age:** Tenure on the platform.
- **Verification Status:** Identity, phone, and email verifications set the base "Trust Floor".
- **Booking Success Rate:** Ratio of completed jobs versus cancellations or no-shows.
- **Content Quality:** Heuristic evaluation of profile completeness, portfolio items, and service descriptions.

## 2. The Algorithm (Dynamic Scoring Model)
The score is calculated continuously based on:
1. **Verification Base:** Completing identity, phone, and business checks grants a foundational pool of points.
2. **Volume & Satisfaction (Multiplier):** `log10(Completed_Jobs + 1) * (Bayesian_Avg / 5.0)^2`. High reviews multiply job value; bad reviews exponentially decay it.
3. **Penalties (Deductions):** Cancellations and lost disputes apply harsh, flat point deductions.
4. **Time Decay:** Jobs and reviews older than 12 months carry 50% less weight, ensuring the score reflects *current* reliability.

## 3. Anti-Manipulation Mechanisms
- **Sybil Resistance:** Jobs between the same buyer and seller yield diminishing returns after the first transaction.
- **Stat-Padding Prevention:** Micro-transactions (e.g., $1 jobs) contribute fractionally compared to standard local average jobs.
- **Velocity Sandboxing:** Statistically anomalous spikes in positive reviews or job completion speed temporarily freeze the score pending human audit.
- **Hard Caps:** Unverified accounts cannot progress past the "New" tier, regardless of job volume.

## 4. Output Mapping (Visible Labels)
The internal continuous score is mapped to the following discrete visible labels:

| Internal Score | Visible Badge | Requirements / Thresholds |
| :--- | :--- | :--- |
| **0 - 1,499** | **New** | Default state for fresh accounts. Unverified. |
| **1,500 - 3,999** | **Verified** | ID/Phone Verified. |
| **4,000 - 6,999** | **Trusted** | Min 10 jobs. >90% Success Rate. >4.5 Rating. |
| **7,000 - 8,999** | **Top Rated** | Min 50 jobs. >95% Success Rate. >4.8 Rating. |
| **9,000 - 10,000** | **Expert** | Elite tier, zero disputes, vetted through quality audits. |

## Components
- **Trust Scorer**: Background worker observing events (job completed, verification approved, dispute raised).
- **Label Mapper**: Service that translates the numeric score into the visible label.
- **API Endpoint**: `GET /trust-profile` returns the calculated label to the client.
