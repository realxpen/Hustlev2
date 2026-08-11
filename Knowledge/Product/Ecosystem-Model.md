# Ecosystem Model

Status: Current
Confidence: High
Source: PRODUCT_BLUEPRINT.md, ARCHITECTURE.md, server.ts

## Canonical summary
Hustle is modeled as an ecosystem rather than a single feature. The core systems are identity, content/discovery, trust, commerce, communication, learning, intelligence, and distribution. The raw Hustle vision source also frames the ecosystem as connecting people, skills, services, content, trust, commerce, learning, and opportunity into one system.

## Core systems
- Identity and profile evolution.
- Content and discovery feed.
- Messaging and activity.
- Booking, wallet, and escrow.
- Trust, verification, and reputation.
- Learning, agents, referrals, and notification systems.

## Current implementation evidence
- The Express server mounts dedicated route groups for onboarding, auth, feed, profile, content, engagement, comments, services, hire, booking, wallet, escrow, review, application, verification, trust, chat, notification, agent, learning, and referral functionalities.
- The front-end app shell exposes related capabilities from a single home surface.

## Interpretation
- The ecosystem model is strongly documented and partially implemented. It is more advanced than a simple app prototype.
