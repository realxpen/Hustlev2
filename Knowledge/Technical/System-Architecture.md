# System Architecture

Status: Current
Confidence: High
Source: ARCHITECTURE.md, server.ts, src/App.tsx

## Canonical summary
The implementation is a modular TypeScript application with a React/Vite frontend and an Express backend. The backend is organized into route/controller/service/repository/validation layers across many product domains.

## High-level architecture
- Frontend: React + Vite + Framer Motion + Zustand-style feature stores.
- Backend: Express service modules mounted on a single server process.
- Persistence: Supabase client integration with localStorage-backed mock persistence as a fallback.

## Current implementation evidence
- [server.ts](server.ts) mounts route groups for onboarding, auth, feed, profile, content, engagement, comments, services, booking, wallet, escrow, review, applications, verification, trust, chat, notifications, agent, learning, and referral services.
- The frontend is organized into feature modules under [src/features](src/features) and component modules under [src/components](src/components).
