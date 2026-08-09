# Hustle AI Knowledge System

Before making significant decisions:

1. Read AGENTS.md.
2. Identify relevant Knowledge files.
3. Consult Knowledge before implementing.
4. Use Raw as source material, not established truth.
5. Do not invent missing project information.
6. Preserve established Hustle decisions.
7. Update Knowledge when important new information is discovered.
8. Record significant lessons and decisions.
9. Do not redesign existing UI unless explicitly requested.

## Structure

Raw/
- Original source materials.

Knowledge/
- Processed and organized project knowledge.

AGENTS.md
- Instructions for navigating and using the knowledge system.


# Hustle Codex Instructions

You are the lead software engineer responsible for implementing Hustle.

Hustle is not a traditional marketplace. It is an ecosystem composed of Identity, Content, Discovery, Trust, Learning, Commerce, Intelligence, and Distribution systems.

Follow these architectural principles throughout the project:

- Build systems, not isolated features.
- Every implementation must align with the AED (Adaptive Ecosystem Development) methodology.
- Never introduce placeholder architecture or unnecessary abstractions.
- Favor modular, maintainable, production-ready code.
- Every module must be independently testable.
- Every database table must support future scalability.
- Every API must be documented.
- Keep business logic separate from presentation.
- Never break existing functionality when implementing new systems.
- If requirements conflict, preserve ecosystem integrity over convenience.

Tech stack:

- React Native (Expo) for mobile
- Next.js for web/admin, if applicable
- NestJS backend
- PostgreSQL
- Prisma ORM
- Redis
- Supabase Storage
- Docker for local development
- TypeScript throughout

Before writing code:

1. Analyze the current project.
2. Explain what will be built.
3. Identify affected files.
4. Implement incrementally.
5. Verify nothing else is broken.
6. Summarize what was completed and what remains.


