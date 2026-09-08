# Dependency Decisions

This project uses exact npm versions in `package.json` and `package-lock.json`.

Runtime baseline:

- Node.js 22 or newer; CI currently uses Node 22.
- Next.js App Router with default Node.js route-handler runtime.
- React with Server Components by default and small client islands for IndexedDB-backed UI.

Selected dependency roles:

- `next@16.3.4`, `react@19.2.8`, `react-dom@19.2.8`: App Router PWA runtime.
- `idb@8.0.3`: small IndexedDB wrapper for local event/snapshot transactions.
- `ajv@8.20.0`, `ajv-formats@3.0.1`: Draft 2020-12 JSON Schema validation.
- `zod@4.5.4`: runtime validation for environment and import envelopes.
- `lucide-react@1.43.0`: accessible UI icons.
- `vitest@5.0.0`, `@testing-library/react@16.3.3`, `@testing-library/jest-dom@7.0.1`, `@testing-library/user-event@14.6.7`, `jsdom@30.0.1`: domain, storage, integration, and component tests.
- `@playwright/test@1.63.0`, `@axe-core/playwright@4.13.0`: E2E and accessibility checks.
- `tsx@4.23.13`, `typescript@6.0.3`, `eslint@9.39.5`, `eslint-config-next@16.3.4`: scripts and quality gates.

Playwright runs the built app on `127.0.0.1:3217` to avoid accidentally reusing another local service on port 3000.
