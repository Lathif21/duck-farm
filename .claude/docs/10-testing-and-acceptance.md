# 10 — Testing & Acceptance

PRD standard: **zero bugs** in money and stock. Money and stock logic is test-first (write the failing test, then the code).

## Layers

| Layer       | Tool                      | Covers                                                                                            |
| ----------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| Unit        | Vitest                    | `money.ts`, `dates.ts`, stock-guard simulation, table query parsing                               |
| Integration | Vitest + Neon test branch | `src/lib/server/*` against a real Postgres: linked create/edit/delete, constraints, summary query |
| E2E         | Playwright                | Every UC in `03` on a phone viewport (iPhone 13) and a laptop viewport (1280px)                   |

Integration and E2E tests run on a throwaway Neon branch created per CI run and deleted afterwards; never on `main`.

## Must-have test cases

### Money (R-F, R-C)

- Parse "1.500.000", "1500000", "Rp 1.500.000" → `1500000`; reject "1,5" in money fields.
- Typing `450000` in `MoneyInput` shows `450.000`, caret stays at the end; editing a middle digit keeps the caret in place.
- `2 × 450.000 = 900.000`; `2,5 × 13.000 = 32.500`; `95 Kg × 38.000 = 3.610.000`; `95,5 Kg × 38.000 = 3.629.000`.
- Summary cards on fixture (70.000.000 capital, +10.000.000 extra capital, +1.710.000 sale, −500.000 electricity, −900.000 breather valve, −3.610.000 duck purchase): Sisa = **76.700.000**, Uang Masuk Lain = **11.710.000**, Uang Keluar = **5.010.000**.

### Linked records (R-L)

- Purchase save creates exactly one cash row with the same total and date.
- Force the cash insert to fail → no purchase row exists (rollback).
- Edit purchase total → cash row total changes; balance changes by the difference only.
- Delete purchase → cash row gone; receipt file deleted; balance restored exactly.

### Shopping list (R-SH)

- New item gets max number + 1; deleting No. 13 then adding gives No. 14.
- Second "Catat ke Uang Kas" on the same item shows the UC07 dialog; both buttons do the right thing.
- Status badge flips back to "Belum Dicatat" when the last purchase is deleted.

### Stock (R-S) — Phase 2

- UC05 alternative: sell 120 Kg with 57 Kg in stock → exact message "Stok di gudang tidak cukup! Sisa: 57 Kg", nothing saved.
- UC13: deleting the 95 Kg purchase after a 38 Kg sale is blocked with the R-S2 message.
- Editing a sale from 38 → 40 Kg with 57 Kg left succeeds (available = 57 + 38).
- **Race:** two concurrent sales of 40 Kg each with 57 Kg in stock → exactly one succeeds.

### Tables (R-T)

- Search, each date preset, custom range, sort asc/desc on every column, page 2 — all reflected in the URL and restored on reload.
- At 360px width: rows render as cards, `document.documentElement.scrollWidth === clientWidth` on every page.

### Auth

- Every `(app)` route and `/api/report` returns a redirect/401 without a session.
- 6th wrong password within 15 minutes is rate-limited.

## Acceptance checklist (per ticket)

- [ ] All "Done when" items in `09` pass.
- [ ] No sideways scroll at 360px; inputs ≥ 17px bold; touch targets ≥ 44px.
- [ ] All UI text Indonesian; matches labels in `07`.
- [ ] New business logic has tests that reference the rule ID.
- [ ] No TBD/PROPOSAL item built without approval.

## Phase 1 sign-off (with Tante, on her phone)

- Reads the balance, a category breakdown and any item explanation without help.
- Records an expense with a receipt photo in under 15 seconds.
- Balance in the app equals the cash she counts.
