# TradeHarbor Trading Journal MVP

TradeHarbor is an original trading journal and analytics SaaS MVP. It includes a public landing page, auth screens, an authenticated app shell, CSV import, trade CRUD, dashboards, charts, calendar review, notes, tags, plans, goals, settings, and a local rule-based AI-style insight engine.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- shadcn/ui-style local components
- PostgreSQL with Prisma
- NextAuth credentials auth
- Recharts, TanStack Table, Zod
- Papa Parse CSV import
- Vitest unit tests

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from the example:

```bash
cp .env.example .env
```

3. Start PostgreSQL and update `DATABASE_URL` if needed.

4. Generate Prisma client and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

5. Seed demo data:

```bash
npm run db:seed
```

6. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

Demo login after seeding:

- Email: `demo@tradeharbor.app`
- Password: `demo1234`

Elite test logins after seeding:

- Emails: `elite1@tradeharbor.app`, `elite2@tradeharbor.app`, `elite3@tradeharbor.app`, `elite4@tradeharbor.app`, `elite5@tradeharbor.app`
- Passwords: generated uniquely during seed and printed once; set `ELITE_TEST_PASSWORD_1` through `ELITE_TEST_PASSWORD_5` before seeding to pin them
- Plan: `ELITE` with active subscription status

If the database is not configured, app pages still render read-only fallback demo data so the UI can be reviewed.

## Useful Scripts

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run db:deploy
npm run db:push
npm run i18n:check
npm run i18n:scan
npm run admin:create
```

## Admin Console

The admin console is available at `/admin` after an operator account has a non-`USER` role. Create the first `SUPER_ADMIN` with environment variables instead of hard-coded credentials:

```bash
ADMIN_EMAIL="admin@example.com" ADMIN_INITIAL_PASSWORD="temporary-long-password" npm run admin:create
```

Admin actions are server-authorized and written to `AuditLog`. Use the temporary password once, then rotate it outside the codebase.

## Deployment

Use a server-capable platform such as Vercel with PostgreSQL for the full app. Static GitHub Pages deployment is not enough for auth, API routes, CSV import persistence, and trade writes.

See `DEPLOYMENT.md` for the production checklist.

## Languages And Translations

The app supports locale URLs such as `/en`, `/ko`, `/ja`, `/zh-CN`, and `/es`.

Translations live in `messages/*.json`. The supported language list, language dropdown labels, Intl locale codes, and default currency format settings are managed in `lib/i18n-config.ts`.

To add a language, copy `messages/en.json`, rename it to the new locale code, translate the values without changing keys or placeholders, then add the locale to `lib/i18n-config.ts` and `lib/i18n.ts`. Run:

```bash
npm run i18n:check
npm run i18n:scan
npm run typecheck
npm run lint
```

See `docs/i18n.md` for the non-developer checklist, formatting rules, and QA steps.

## CSV Import

Use the sample CSV at `/sample-trades.csv` or download it from the Import Center. The importer supports:

- Header detection
- Column mapping
- Preview rows
- Zod validation
- Accepted row import
- Rejected row reasons stored in `ImportRowError`

Bybit Futures / Perpetual imports are documented in [`docs/imports.md`](docs/imports.md). Upload Closed PnL first for accurate realized P&L analytics, then add Trade History when you want execution detail, fee validation, funding separation, and position reconstruction support.

## Data Model

Prisma models include:

- `User`
- `Account`
- `Trade`
- `TradeTag`
- `Tag`
- `Note`
- `DailyPlan`
- `ChecklistTemplate`
- `ChecklistItem`
- `Goal`
- `ImportBatch`
- `ImportRowError`
- `ExchangeImportFile`
- `ClosedPnlSegment`
- `ImportedExecution`
- `ImportedFundingEntry`
- `ReconstructedPosition`
- `PositionExecutionLink`

## AI Insights

The AI Insights page does not call an external model. It uses `lib/insight-engine.ts` to answer questions from computed metrics. A real LLM can be added later by passing filtered trade samples, aggregate metrics, and citations into a separate adapter.
