# Data Architecture

Status: Current
Confidence: Medium
Source: ARCHITECTURE.md, src/lib/supabase.ts, server/services

## Canonical summary
The repository models a rich domain graph across profiles, content, bookings, escrow, trust, notifications, chat, and learning data. The current implementation uses Supabase-style data access patterns and a localStorage mock fallback.

## Key data domains
- Profiles and onboarding states.
- Content and engagement.
- Booking and escrow transactions.
- Wallet and notification records.
- Chat/message history.
- Learning and referral data.

## Current implementation evidence
- The frontend’s Supabase client seeds default data into localStorage tables such as profiles, posts, bookings, notifications, messages, wallets, and onboarding_status.
- The server modules include repositories for several of these domains.

## Gap
- The repository does not yet show a single canonical database schema for the full system beyond the architecture and schema documents.
