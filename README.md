# Pembukuan Cold Storage Bebek

Cash book, construction shopping list and (Phase 2) duck-meat warehouse for a family cold-storage business.
SvelteKit 3 (Svelte 5) · TypeScript · Prisma 7 · Neon Postgres · Tailwind v4 · Vercel · Vercel Blob.

The plan lives in [`.claude/docs/`](.claude/docs/README.md); open questions in
[`11-open-questions-and-proposals.md`](.claude/docs/11-open-questions-and-proposals.md).

## Status

Phase 1 is built: login, summary cards, Buku Uang Kas (manual entries, categories, receipts, running balance, PDF report),
Daftar Belanja Bangunan (starter list, purchases linked to the cash book, buy-again dialog, add/edit/delete items, purchase history).
`/gudang` shows "Segera hadir" until Phase 2.

## First-time setup

1. **Neon** — create a project in **AWS ap-southeast-1 (Singapore)** with branches `main` (production) and `dev`.
2. **Vercel Blob** — create a **private** Blob store; copy its `BLOB_READ_WRITE_TOKEN`. (Optional at first: without it, saving with a receipt shows "Penyimpanan nota belum disiapkan".)
3. Copy `.env.example` to `.env` and fill in the `dev` branch URLs (pooled `DATABASE_URL`, direct `DIRECT_URL`).
4. Install, migrate, seed, create an admin:
   ```sh
   npm install
   npm run db:deploy          # applies prisma/migrations
   CAPITAL_DATE=2026-11-01 npm run db:seed   # initial capital date: still open question T1; defaults to today
   npm run create-admin -- --username tante --name "Tante"
   npm run dev
   ```

The seed is idempotent: re-running never duplicates the initial capital or the starter list, and never overwrites admin edits.

## Scripts

| Script                     | What it does                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`              | Dev server                                                                                                                                                    |
| `npm run check` / `lint`   | svelte-check / Prettier + ESLint                                                                                                                              |
| `npm test`                 | Unit tests (money, dates, table query)                                                                                                                        |
| `npm run test:integration` | Integration tests against `TEST_DATABASE_URL` (a throwaway Neon branch — the tests **empty every table**; refuses to run against `DATABASE_URL`/`DIRECT_URL`) |
| `npm run db:migrate`       | `prisma migrate dev` (dev branch only; see skill `prisma-migration`)                                                                                          |
| `npm run db:deploy`        | `prisma migrate deploy` (CI, before deploy)                                                                                                                   |
| `npm run db:seed`          | Seed initial capital + starter shopping list                                                                                                                  |
| `npm run create-admin`     | Create an admin or reset their password                                                                                                                       |

## Deploy (Vercel)

- Functions run in `sin1` (set in `vite.config.ts`). Install the Neon–Vercel integration so previews get their own branch.
- Env vars: `DATABASE_URL` (needed at build time too — SvelteKit 3 validates it), `DIRECT_URL`, `BLOB_READ_WRITE_TOKEN`.
- Run `npm run db:deploy` before each production deploy; never `migrate dev` against `main`.
- Backups: Neon point-in-time restore. The free plan keeps 6 hours of history; check the plan's window before launch (T-24).
