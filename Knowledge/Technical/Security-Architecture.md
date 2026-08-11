# Security Architecture

Status: Current
Confidence: Medium
Source: ARCHITECTURE.md, server/middleware/authMiddleware.ts, server/services/authService.ts

## Canonical summary
The architecture documents describe role-based access control, signed-in access, and escrow protections. The repository also includes authentication middleware and token-based auth handling.

## Security-relevant patterns
- JWT or token-based auth handling is present in the backend.
- Authentication middleware exists for protected routes.
- The product blueprint and architecture documents emphasize trust, escrow, and verification.

## Current implementation evidence
- The repo contains [server/middleware/authMiddleware.ts](server/middleware/authMiddleware.ts).

## Gap
- The repository does not yet show a complete threat model, production auth policy, or full RBAC matrix.
