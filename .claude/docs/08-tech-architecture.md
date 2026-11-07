# 08 — Tech Architecture

## Stack (Decided)

| Concern    | Choice                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------- |
| Framework  | SvelteKit 2, **Svelte 5 runes**, TypeScript strict                                          |
| Styling    | Tailwind CSS v4 (`@tailwindcss/vite`), tokens in `src/app.css` (`06`)                       |
| Database   | Neon Postgres                                                                               |
| ORM        | **Prisma 7** with `@prisma/adapter-neon`                                                    |
| Hosting    | Vercel (`@sveltejs/adapter-vercel`)                                                         |
| Receipts   | Neon Object Storage, private bucket, via the S3 API (`@aws-sdk/client-s3`)                  |
| Validation | zod, in form actions                                                                        |
| PDF        | `jspdf` + `jspdf-autotable`, generated in the browser from data loaded by a server endpoint |
| Auth       | Username + password, DB sessions, `@node-rs/argon2` hashing                                 |

Check each package's current docs at setup time; versions move quickly.

## Regions

Put both close to Indonesia: Neon project in **AWS ap-southeast-1 (Singapore)**, Vercel functions region **`sin1`** (set in `svelte.config.js` adapter options). Every page load hits the DB, so this matters more than anything else for speed on a weak site connection.

## Project structure

```
prisma/
  schema.prisma
  migrations/
  seed.ts
prisma.config.ts
scripts/
  create-admin.ts
src/
  app.css                    # Tailwind + tokens
  hooks.server.ts            # session check, redirect to /login
  lib/
    money.ts                 # parse/format Rupiah & kg, total helpers (shared client+server)
    dates.ts                 # Asia/Jakarta "today", id-ID formatting
    components/
      DataTable.svelte       # skill: data-table
      MoneyInput.svelte      # live dots (R-F1)
      KgInput.svelte
      Combobox.svelte        # pick or add new (UC11)
      ReceiptField.svelte    # compress + upload (UC09)
      SummaryCards.svelte
      ConfirmDialog.svelte
    server/
      db.ts                  # Prisma client singleton
      auth.ts                # sessions
      blob.ts                # put/get/delete receipts (S3)
      cash.ts                # summary query, manual entries
      shopping.ts            # items, purchases (linked)
      duck.ts                # movements, stock guard (Phase 2)
      table-query.ts         # parse ?q=&from=&to=&sort=&dir=&page=
      generated/prisma/      # Prisma client output (gitignored)
  routes/
    login/
    (app)/                   # signed-in layout: summary cards + nav
      kas/
      belanja/
        [itemId]/
      gudang/
      api/report/+server.ts  # JSON for the PDF
```

## Database access (Prisma 7)

`prisma.config.ts` holds the migration URL; the app connects through the Neon adapter:

```ts
// prisma.config.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
	datasource: { url: env('DIRECT_URL') } // unpooled, for migrate
});
```

```ts
// src/lib/server/db.ts
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from './generated/prisma/client';
import { DATABASE_URL } from '$env/static/private';
export const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: DATABASE_URL }) });
```

Verify these import paths against the Prisma 7 docs during setup.

**Environment variables**

| Name                    | Value                                           |
| ----------------------- | ----------------------------------------------- |
| `DATABASE_URL`          | Neon **pooled** connection string (app runtime) |
| `DIRECT_URL`            | Neon **direct** connection string (migrations)  |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Neon Object Storage (receipts). Neon prints them as `AWS_*`; renamed because Vercel reserves the `AWS_*` names |

**Environments:** Neon branch `main` = production, branch `dev` = local development. Use the Neon–Vercel integration so each Vercel preview deploy gets its own Neon branch. Never run tests against `main`.

## Auth

- No signup page. Admins are created with `npm run create-admin -- --username tante --name "Tante"` (prompts for the password, hashes with argon2id).
- Login: verify hash → random 20-byte token in an `httpOnly`, `secure`, `sameSite=lax` cookie, 30 days; DB stores only `sha256(token)` as `Session.id`. Renew expiry when less than 15 days remain.
- `hooks.server.ts` loads the session on every request into `event.locals.user`; routes under `(app)` redirect to `/login` when missing.
- Rate-limit login: 5 failed attempts per username per 15 minutes → "Terlalu banyak percobaan. Coba lagi 15 menit lagi."

## Mutations

- Form actions with `use:enhance`. Each action: parse with zod → call a `src/lib/server/*` function → return `fail(400, { errors, values })` or success.
- Money-moving functions follow skill `linked-cash-transaction`.
- After success, `invalidateAll()` (default `enhance` behaviour) refreshes summary cards (R-C2).

## Receipts (Neon Object Storage)

Rules: JPG/PNG/WebP/PDF; photos auto-compressed in the browser; max 4 MB; one receipt per entry.

1. Browser: `ReceiptField` accepts `image/*` and `application/pdf`. Images are resized to max 1600px on the long side and re-encoded as JPEG (quality 0,8) with a canvas before upload; this keeps phone photos well under Vercel's 4,5 MB request body limit. PDFs over 4 MB are rejected: "File terlalu besar (maks. 4 MB)."
2. The file travels with the form submission. Server validates type/size, then `PutObject` to the private bucket with key `receipts/{yyyy}/{mm}/{uuid}.{ext}`.
3. Save the key in `receiptPathname` in the same DB transaction as the entry. If the DB write fails, delete the uploaded object.
4. Replace/remove/delete: delete the old object **after** the DB transaction commits.
5. Access: the bucket is private; receipts are served only to signed-in users through `GET /nota/[entryId]`, which streams the object.
6. Storage branches with the database: each Neon branch has its own copy of the bucket, so a dev/preview branch never touches production receipts.

## PDF report

`GET /api/report?from=&to=` (auth required) returns JSON; the browser builds the PDF with jsPDF + autoTable and downloads `Laporan-Kas-{from}-{to}.pdf`.

**"Laporan Buku Uang Kas"** for a chosen date range: header (app name, period, printed date/time, printed by); summary (balance at start of period, total income, total expense, balance at end); totals per category for income and for expense (linked rows grouped by their source label); detail table (date, category, note, income, expense, running balance); receipt column "Ada/–". A4 portrait, Indonesian formatting. Phase 2 adds a warehouse section (stock per duck type, movements in the period).

## Dates & time

- All business dates are `@db.Date` (no time). "Today" is computed in `Asia/Jakarta`, on the server, via `src/lib/dates.ts`.
- Sorting ties on the same date use `createdAt`.

## Offline _(TBD T4)_

The app needs internet. Until T4 is decided, show a banner when `navigator.onLine` is false: "Tidak ada sinyal internet. Catatan belum bisa disimpan." and keep form values in memory so nothing typed is lost.

## Deploy

- `main` branch → Vercel production. Build command runs `prisma generate`; migrations run as a separate step (`prisma migrate deploy`) in CI before deploy, never inside the app.
- CI (GitHub Actions): `npm run check` (svelte-check), `npm run lint`, `npm test` (Vitest), Playwright against a Neon preview branch.
