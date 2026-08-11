# Source Inventory

Status: Current
Confidence: Medium
Source: Repository audit performed in the current session.

## High-value sources reviewed
- [PRODUCT_BLUEPRINT.md](PRODUCT_BLUEPRINT.md): primary product and UX blueprint.
- [ARCHITECTURE.md](ARCHITECTURE.md): system architecture overview.
- [server.ts](server.ts): actual route mounting and runtime architecture.
- [src/App.tsx](src/App.tsx) and [src/components/MockHome.tsx](src/components/MockHome.tsx): current UI shell and feature surface.
- [src/lib/supabase.ts](src/lib/supabase.ts): current persistence strategy and mock fallback.
- [Raw/PDFs](Raw/PDFs): source material for AED and ecosystem concepts.

## Inventory classification
- CURRENT: architecture docs, application code, package manifest, and current knowledge files.
- VALIDATED: product blueprint and code alignment around feed/profile/chat/booking/trust experience.
- USEFUL: AED PDFs and images as conceptual source material.
- HISTORICAL/OUTDATED: some architectural files are likely aspirational and should be treated as design intent rather than fully implemented reality.

## Raw material not yet fully processed
- The raw AED/PDF bundle was reviewed for metadata and one core Hustle vision PDF was extracted, but the larger AED PDFs and image-based raw assets remain only partially processed.
- The current knowledge base therefore reflects the repository’s documented product/architecture evidence more directly than it reflects every raw artifact in full.
