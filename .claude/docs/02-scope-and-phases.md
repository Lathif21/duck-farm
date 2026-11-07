# 02 — Scope & Phases

Build Phase 1 first; Phase 2 follows. Phase 2 has open questions (`11`) that must be answered before its blocked tickets start.

## Phase 1 — Construction & Cash Book (Decided)

- Login (admin accounts only).
- Summary cards: Sisa Uang Tunai Tante, Total Uang Masuk Lain, Total Uang Keluar, Isi Gudang Bebek (shows 0 until Phase 2).
- **Menu 1 — Buku Uang Kas:** manual income/expense entries, create/edit/delete, categories via "pick or add new" dropdown (separate lists for income and expense, start empty), optional receipt upload on every expense.
- **Menu 3 — Daftar Belanja Bangunan:** admin-editable shopping list with work sections, plain-language explanations, record purchase → cash book in one click, buy again with a reminder of the previous purchase, add new items.
- Initial capital Rp 70.000.000 entry (edit rules TBD — `11`, T1).
- PDF report (contents: `08`, PDF report).
- All tables: search, date range filter, sort per column, 20 rows/page, cards on phone.

## Phase 2 — Duck Warehouse (Decided unless marked)

- **Menu 2 — Gudang Daging Bebek:** duck types added by users; stock in (buy) and out (sell) with ekor + kg + price/kg; linked cash entries; stock guard by kg; blocked delete/edit when it would make stock negative.
- "Isi Gudang Bebek" summary card goes live.
- **TBD T2:** what an unchecked "Otomatis catat ke Buku Uang Kas" means; whether outbound needs the same checkbox (credit sales, spoiled stock, free samples).
- **TBD T3:** profit / loss reporting.

## Changes from the PRD (agreed with owner)

| PRD says                                    | Plan says                                                                     | Why                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| Data in browser localStorage, offline-first | Neon Postgres, online. Offline is **TBD T4**                                  | Shared data across family phones                   |
| iOS Liquid Glass, text `#0f172a`            | Eggsy reference palette (`06`)                                                | Owner's design choice                              |
| Shopping list items 1–12 fixed              | Starter list, editable by admin; starter content approved by owner (Nov 2026) | Original list came from AI suggestions, unverified |
| Initial capital row "permanent"             | Editable in future; rules TBD (T1)                                            | Waiting on Tante                                   |
| Delete only                                 | Edit and delete                                                               | Owner decision                                     |
| —                                           | Receipt upload on expenses, PDF report, login                                 | Owner/team additions                               |

## Out of scope (until requested)

Multiple roles/permissions, public signup, dark mode (light only, owner decision Nov 2026), multi-currency, bank integration, notifications.
