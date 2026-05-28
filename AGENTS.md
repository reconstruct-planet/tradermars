# AGENTS.md

Guidance for future Codex sessions working in this repository.

## Project Purpose

Edgefolio is an original trading journal and analytics SaaS MVP. It helps traders import trades, journal decisions, review dashboards, analyze performance, inspect a trading calendar, manage notes/tags/plans/goals, and ask deterministic AI-style analytics questions over local trade data.

The product may be inspired by the broad category of trading journal SaaS products, but it must remain original.

## Do-Not-Copy Rule

Do not copy any existing website's proprietary source code, branding, logo, exact layout, screenshots, text, pricing language, images, visual identity, or assets. Use original copy, components, mockups, data models, and visual design. Functional concepts from the trading journal category are acceptable; proprietary expression is not.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- PostgreSQL with Prisma
- NextAuth
- Recharts
- TanStack Table
- Zod
- PapaParse for CSV parsing
- Vitest

## Folder Structure

- `app/`: Next.js routes, API routes, layouts, providers, global styles.
- `app/(app)/app/`: Authenticated product pages.
- `app/(auth)/`: Login, signup, and password placeholder pages.
- `components/`: Reusable UI, product workspaces, charts, marketing, billing, imports, trades, dashboard, insights.
- `components/ui/`: Local shadcn-style primitives.
- `lib/`: Domain utilities, Prisma client, auth config, data mapping, metrics, validation, CSV/import logic, plan gates, insight engine.
- `prisma/`: Prisma schema and seed script.
- `public/`: Static assets, including sample CSV.
- `tests/`: Vitest unit tests.
- `types/`: Shared type declarations when needed.

## Local Commands

This Windows workspace may not have `npm` on the default PATH. If needed, prepend Visual Studio's bundled Node path:

```powershell
$env:PATH='C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs;' + $env:PATH
```

Run the dev server:

```powershell
npm run dev
```

If using the bundled npm directly:

```powershell
& 'C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs\npm.cmd' run dev
```

Run Prisma migrations:

```powershell
npm run db:migrate
```

Generate Prisma client:

```powershell
npm run db:generate
```

Seed demo data:

```powershell
npm run db:seed
```

Run tests:

```powershell
npm run test
```

Run lint:

```powershell
npm run lint
```

Run typecheck:

```powershell
npm run typecheck
```

Production build:

```powershell
npm run build
```

If Prisma generate or Next build fails with an `EPERM` lock under `.next` or `node_modules/.prisma`, stop only the project-local Next/node dev server processes, then retry. Do not stop the Codex/OpenAI process.

## Prisma And Data

- Main schema: `prisma/schema.prisma`.
- Demo seed user: `demo@edgefolio.app` / `demo1234`.
- Demo fallback data lives in `lib/demo-data.ts`.
- App data mapping lives in `lib/data.ts`.
- Financial metric calculations live in `lib/metrics.ts`.
- Subscription feature gates live in `lib/plans.ts`.
- Deterministic AI insight logic lives in `lib/insight-engine.ts`.

When adding Prisma fields:

- Update `prisma/schema.prisma`.
- Run `npm run db:generate`.
- Update seed data and `lib/types.ts`/mapping code as needed.
- Add or update tests for domain logic.

## Coding Conventions

- Use TypeScript throughout.
- Keep changes scoped to the requested feature.
- Prefer existing local patterns and components over new abstractions.
- Use `apply_patch` for manual file edits.
- Do not rewrite unrelated files or revert user changes.
- Keep comments sparse and useful.
- Use Zod schemas for user-controlled data validation.
- Keep calculations in utility modules rather than embedding them in components.
- For deterministic analytics, keep metric computation auditable and separate from UI wording.

## UI Conventions

- Use existing `components/ui` primitives when possible.
- Keep the app desktop-first but responsive.
- Use dark mode and light mode compatible colors.
- Prefer dense, workstation-like layouts for authenticated product screens.
- Use cards for repeated items, modals, or framed tools; avoid nesting cards inside cards.
- Use lucide-react icons for controls and navigation.
- Avoid decorative clutter and one-note palettes.
- Ensure text does not overflow or overlap on mobile and desktop.
- Marketing pages should use original product copy and mockups, never copied screenshots.

## Data Validation Rules

- Validate trade writes and imports with Zod.
- Prevent impossible numeric values such as negative quantity, invalid prices, invalid dates, and impossible entry/exit combinations.
- CSV import must separate valid and invalid rows.
- Invalid rows must not be imported.
- Import batches and row errors should be persisted when importing.
- Duplicate detection should use symbol + side + quantity + entryTime + exitTime.

## Security Rules

- Do not implement real billing unless Stripe keys and price ids are available.
- Do not expose secrets in code, logs, screenshots, or docs.
- Keep auth-sensitive logic on the server where practical.
- Treat uploaded CSV data as untrusted input.
- Do not call external AI APIs from the Insights page until explicitly requested and configured.
- Server-side feature gates should remain the source of truth for subscription access.
- Avoid destructive database or git commands unless the user explicitly asks.

## Done Definition

A task is complete only when:

- The implementation is working locally.
- `npm run typecheck` passes.
- `npm run lint` passes.
- Relevant tests pass, and new tests are added for meaningful domain logic.
- UI changes are smoke-tested in the browser when practical.
- The final response summarizes changed files and verification steps.
