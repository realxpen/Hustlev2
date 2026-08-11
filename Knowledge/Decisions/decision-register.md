# Decision Register

Status: Current
Confidence: High
Source: PRODUCT_BLUEPRINT.md, ARCHITECTURE.md, server.ts

## Consequential decisions recovered from the repository

### Decision: Build Hustle as an ecosystem, not a single-feature marketplace
Why: The product blueprint and architecture documents treat the platform as a set of interlocking systems rather than a simple listing app.
Evidence: PRODUCT_BLUEPRINT.md, ARCHITECTURE.md.
Status: Active.
Affected systems: feed, profile, chat, booking, wallet, trust, verification, learning, referral.

### Decision: Center the experience on social discovery and local relevance
Why: The product vision consistently prioritizes feed-driven discovery and neighborhood relevance.
Evidence: PRODUCT_BLUEPRINT.md, src/components/MockHome.tsx.
Status: Active.
Affected systems: feed, discovery, profile, search.

### Decision: Make trust and payments an integrated flow
Why: Escrow, reviews, verification, and trust are part of the product experience rather than separate add-ons.
Evidence: PRODUCT_BLUEPRINT.md, TRUST_ENGINE_ARCHITECTURE.md, server routes for escrow/review/trust.
Status: Active.
Affected systems: wallet, escrow, trust, review.

### Decision: Use a modular service architecture in the backend
Why: The server is organized into route/controller/service/repository/validation layers for multiple domains.
Evidence: server.ts and server/ directories.
Status: Active.
Affected systems: all backend domains.
