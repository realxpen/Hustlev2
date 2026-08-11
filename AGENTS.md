# Hustle AED Operating Manual

This repository is the working knowledge base and implementation surface for Hustle under AED v3 — Living Ecosystem Engine.

## What Hustle is
Hustle is not a traditional marketplace. It is an ecosystem for identity, content discovery, trust, commerce, communication, learning, and distribution. The product is described as a social-first, local, trust-driven economic platform for individuals and small service economies.

## AED v3 expectations
AED v3 treats the project as a living ecosystem rather than a fixed feature list. Capabilities can be planned, partially implemented, validated, or superseded. Agents should preserve that nuance rather than pretending a capability is complete simply because a document exists.

## Repository structure
- Raw/: source material and evidence that must remain intact.
- Knowledge/: canonical, synthesized knowledge that reflects current repository evidence.
- AED/: AED capability artifacts and lifecycle documentation.
- Application/ and src/: current implementation surface. In this repository the active app code is under src/ and server/.
- docs/ and top-level architecture/product documents: design intent and domain architecture sources.

## Knowledge authority
When evidence conflicts, use the following authority order:
1. Current explicit human decision.
2. Current project specification or repository instruction.
3. Current canonical Knowledge.
4. Validated research or implementation evidence.
5. Recorded lessons.
6. Raw material.
7. General AI knowledge.

Do not silently resolve contradictions. Record the conflict, preserve the historical evidence, and keep the currently authoritative view in Knowledge.

## Knowledge workflow
- Read existing Knowledge before making changes.
- Treat Raw as evidence, not truth by itself.
- Synthesize rather than copy raw documents wholesale.
- Update Knowledge when important decisions, implementation realities, or gaps are discovered.
- Keep decisions separate from general product knowledge.
- Mark obsolete information as deprecated or historical rather than deleting it.

## Current project status
The repository contains:
- a product blueprint and architecture documentation,
- an integrated React/Vite frontend,
- an Express backend with modular route/controller/service/repository layers,
- a broad set of domain modules including auth, onboarding, feed, profile, content, chat, booking, wallet, escrow, trust, verification, learning, referrals, and agent services.

The implementation appears to be an integrated prototype or early platform skeleton rather than a fully production-verified system.

## Coding workflow
Before editing code:
1. Inspect the relevant feature area and surrounding documentation.
2. Identify whether the change is aligned with the current product and architecture intent.
3. Prefer surgical changes that preserve ecosystem integrity.
4. Validate with the existing repo commands after editing.

## Validation commands
- npm run lint
- npm run build

## Human authority and AI responsibility
Humans remain the authority for product and strategic decisions. AI agents are responsible for preserving evidence, surfacing conflicts, updating the knowledge base, and keeping implementation aligned with the current repository evidence.

## Documentation rules
Do not create documentation for its own sake. Update documentation when it directly improves traceability, decision memory, or implementation alignment.

## When to update PROJECT_STATE.md
Update PROJECT_STATE.md when the repository’s actual status materially changes, such as when a major capability is validated, a blocker is removed, or the focus shifts.
