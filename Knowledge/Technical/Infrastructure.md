# Infrastructure and Runtime

Status: Current
Confidence: High
Source: package.json, server.ts, supabase/config.toml

## Canonical summary
The project is configured as a TypeScript Vite application with an Express server and a Supabase integration path. It is designed to run locally with Node.js and Vite.

## Current runtime model
- Development server: Vite + Express via [server.ts](server.ts).
- Production build: Vite front-end bundle plus Express server bundle.
- Storage: Supabase expected for production data, with localStorage as a development-safe fallback.

## Current implementation evidence
- [package.json](package.json) defines dev/build/start scripts.
- [supabase/config.toml](supabase/config.toml) exists for local Supabase tooling.
