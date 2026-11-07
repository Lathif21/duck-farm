# 09 — Task Breakdown

Tickets in order. Each is done only when its **Done when** items pass (see also `10`). ⛔ = blocked by an open item in `11`; don't start until it's resolved.

## M0 — Foundation

- **T-01 Project setup.** SvelteKit + Svelte 5 + TS strict, Tailwind v4 with tokens (`06`), fonts (Baloo 2 + Nunito), ESLint + Prettier, Vitest, Playwright, Vercel adapter (`sin1`).
  Done when: `npm run check`, `lint`, `test` pass in CI; blank page deploys to a Vercel preview.
- **T-02 Database.** Neon project (Singapore) with `main` + `dev` branches, Prisma 7 + Neon adapter, schema from `05`, first migration including the raw SQL constraints, Neon–Vercel preview integration.
  Done when: `prisma migrate deploy` works on a fresh branch; inserting `total = 0` fails.
- **T-03 Shared helpers.** `money.ts` (parse "1.500.000" → 1500000, format, `lineTotal`, `duckTotal` with grams), `dates.ts` (Jakarta today, id-ID format).
  Done when: unit tests cover R-F1–R-F3 and rounding, including `95,5 Kg × 38.000 = 3.629.000`.

## M1 — Auth

- **T-04 Sessions + login page** (`/login`, hooks guard, sign out).
- **T-05 `create-admin` script** + login rate limit.
  Done when: unauthenticated requests to any `(app)` route redirect to `/login`; session survives reload; sign out kills it.

## M2 — Layout & core components

- **T-06 App layout:** top bar, bottom bar (phone), laptop nav, summary cards with the R-C2 query.
- **T-07 `MoneyInput`, `KgInput`:** live dots/commas, caret kept, 17px bold.
- **T-08 `Combobox`** (pick or add new; case-insensitive duplicate check).
- **T-09 `DataTable`** per skill `data-table` (search, date presets + custom, sort per header, 20/page, URL state, phone cards).
- **T-10 `ReceiptField` + `blob.ts`** (compress, upload, replace, remove, cleanup on failure).
- **T-11 `ConfirmDialog`, toasts, offline banner** (T4 interim behaviour from `08`).
  Done when: each component has a demo route in dev only and passes the checks in `10`.

## M3 — Buku Uang Kas (Phase 1)

- **T-12 Seed:** initial capital row (R-C3; start date: ask owner, part of T1).
- **T-13 Manual income/expense:** create with categories (R-C5), receipt on expense.
- **T-14 Edit/delete manual entries** (initial capital row has no actions until T1).
- **T-15 History table** with source labels (R-C6), linked-row actions (R-L4), running balance.
  Done when: UC01 and UC06 pass end to end; summary cards match a hand calculation on a 20-row fixture.

## M4 — Daftar Belanja Bangunan (Phase 1)

- **T-16 Seed sections & starter items** (`12`).
- **T-17 Item list** grouped by section, full explanations, status badges, search/sort.
- **T-18 Record purchase → cash** (linked create, R-L1) + receipt.
- **T-19 Buy-again dialog** (UC07) + item detail page with purchase history and `?edit=`.
- **T-20 Edit/delete purchases** (linked edit/delete, R-L2/R-L3).
- **T-21 Add new item** (UC03, both buttons), edit item, delete item (blocked for items with purchases, R-SH6).
  Done when: UC02, UC03, UC07, UC08 pass; deleting a purchase restores the balance exactly.

## M5 — Report (Phase 1)

- **T-22 `/api/report` + PDF download** from `/kas`.
  Done when: PDF totals equal the summary for the same range on a fixture; Indonesian formatting throughout.

## M6 — Phase 1 hardening

- **T-23 UAT with Tante** on her own phone: every Phase 1 UC under 15 s, no sideways scroll at 360px, no auto-zoom on iOS.
- **T-24 Production launch:** prod Neon branch, seed, create admin accounts, backup check (Neon point-in-time restore window noted in README).

## M7 — Gudang Daging Bebek (Phase 2)

- **T-25 Duck types** (combobox, UC12).
- **T-26 Movements in/out** with linked cash (R-L1), stock guard (R-S2, Serializable transaction), live stock hint.
- **T-27 Edit/delete movements** with guard (UC13).
- **T-28 Stock overview + history table; "Isi Gudang Bebek" card live.**
- **T-29 "Off" path of the auto-record checkbox** ⛔ T2.
- **T-30 Profit report** ⛔ T3.
  Done when: UC04, UC05 (incl. alternative flow), UC13 pass; two parallel sales can't oversell (test in `10`).

## Offline ⛔ T4

Not scheduled until the owner decides.
