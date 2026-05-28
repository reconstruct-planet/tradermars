# Production Deployment

TradeHarbor needs a server-capable host for the full product. Do not deploy it as a static GitHub Pages site if you want auth, trade writes, CSV imports, Prisma, and API routes to keep working.

## Recommended Path: Vercel + PostgreSQL

1. Import the GitHub repository into Vercel:

   `https://github.com/reconstruct-planet/tradermars`

2. Create or attach a PostgreSQL database. Vercel Postgres, Neon, Supabase, or any hosted PostgreSQL database works.

3. Add these environment variables in the Vercel project:

   ```bash
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="generate-a-long-random-secret"
   NEXTAUTH_URL="https://your-production-domain"
   ADMIN_EMAIL="admin@example.com"
   ADMIN_INITIAL_PASSWORD="temporary-password-change-after-login"
   ADMIN_INVITES_ENABLED="false"
   ADMIN_REQUIRE_2FA="false"
   ADMIN_AUDIT_RETENTION_DAYS="365"
   ```

4. Deploy once, then initialize the database schema from your machine or a trusted CI job:

   ```bash
   npm install
   npm run db:push
   npm run db:seed
   npm run admin:create
   ```

   Use the production `DATABASE_URL` when running those commands.

5. Redeploy after the schema exists.

## What Works After Server Deployment

- Public marketing pages and locale routes
- Credentials login and signup
- Authenticated app shell
- Trade CRUD and bulk tagging
- CSV preview/import with persisted rejected rows
- Dashboard, analytics, calendar, notes, tags, plans, goals, and settings
- Deterministic local insight engine
- Demo fallback when the database is not configured

## Why Not GitHub Pages

GitHub Pages only hosts static files. This app uses Next.js API routes, NextAuth, Prisma, and PostgreSQL-backed writes, so a static export would remove core product behavior.
