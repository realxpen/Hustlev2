# Verification Service Architecture

## Overview
The Verification Service handles the submission and status tracking of various identity and business verification milestones for Hustlers and Clients. Complete verification unlocks features such as higher withdrawal limits, improved trust rankings, and marketplace visibility.

## Core Verification Types
1. **Phone Verification**: Instant SMS-based verification.
2. **Email Verification**: Magic link/OTP email verification.
3. **Identity Verification**: Governmental ID checks (drivers license, passport).
4. **Address Verification**: Verification of physical location.
5. **Business Verification**: For registered LLCs and Corporations.

## Endpoints
- `GET /verification-status` - Returns the comprehensive verification status map for the user profile.
- `POST /verify/phone` - Submits a phone number and OTP for verification.
- `POST /verify/email` - Submits an email address and OTP for verification.
- `POST /verify/identity` - Submits identity documents for manual or automated trust engine review.
- `POST /verify/address` - Submits physical address details to be verified.

## Workflow
1. Client requests `GET /verification-status` to see which milestones are completed or pending.
2. User triggers specific verification via `POST /verify/*`.
3. Simple verifications (phone/email) are validated immediately and marked as `verified`.
4. Complex verifications (identity/address) enter a `pending` state awaiting review.
5. Once reviewed by the trust engine, the status is updated, and benefits are unlocked.
