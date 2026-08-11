# API Architecture

Status: Current
Confidence: High
Source: server.ts, server/routes

## Canonical summary
The backend exposes a broad surface area of REST-style endpoints under both raw and /api-prefixed paths. The server uses route modules to keep endpoint concerns modular.

## Current API structure
- Auth and onboarding endpoints.
- Feed/profile/content endpoints.
- Booking, hire, wallet, escrow, and review endpoints.
- Trust, verification, chat, notification, agent, learning, and referral endpoints.

## Current implementation evidence
- The main server file mounts each feature domain into the API surface.
- Route modules exist under [server/routes](server/routes) with matching controller/service/repository layers.

## Caveat
- The repository does not yet show a central API contract document that fully documents every endpoint.
