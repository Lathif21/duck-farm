---
name: data-table
description: Build or change any list/table screen with the shared DataTable (search, date range filter, per-column sort, pagination, phone cards). Use when adding a history table, a list page, or a new column/filter.
---

# Data Table

Every table in the app uses one component, `src/lib/components/DataTable.svelte`, driven by URL query params. Rules R-T1–R-T6 in `.claude/docs/04-business-rules.md`.

## URL contract

`?q=<text>&from=YYYY-MM-DD&to=YYYY-MM-DD&preset=today|7d|30d|month&sort=<columnKey>&dir=asc|desc&page=<n>`

- Parse it on the server with `parseTableQuery(url, config)` from `src/lib/server/table-query.ts`. Unknown `sort` keys fall back to the default sort; `page` below 1 becomes 1.
- Presets are resolved to `from`/`to` on the server in Asia/Jakarta time.

## Steps to add a table

1. **Define columns** in the route's `+page.server.ts`: `key`, Indonesian `label`, `sortable` (true for every column, R-T3), the Prisma `orderBy` it maps to, and whether it's searchable text. Done when every visible column has a sort mapping.
2. **Load** with one `findMany` (`where` from search + date range, `orderBy` from sort plus `createdAt desc` as tiebreaker, `take: 20`, `skip`) and one `count` with the same `where`, in `Promise.all`. Search = `contains` + `mode: 'insensitive'` OR-ed across searchable columns. Done when `count` and rows use the identical `where`.
3. **Render** `<DataTable {columns} {rows} {total} dateFilter={hasDate}>` with a `row` snippet for the laptop row and a `card` snippet for the phone card. Tables without dates pass `dateFilter={false}` (R-T6).
4. **Phone card:** most important value biggest (amount or kg), date + label on top, long text fully wrapped, actions in the footer. Sorting on phone uses a "Urutkan" select listing every column with "(A–Z / Z–A)" or "(Terbaru / Terlama)".
5. **Verify** at 360px and 1280px: search, every preset, custom range, each column asc/desc, page 2, reload keeps state. Done when all pass and the page has no horizontal scroll.

## Component behaviour

- Search input: placeholder "Cari…", debounced 300 ms, updates the URL with `goto(..., { keepFocus: true, noScroll: true, replaceState: true })`; resets `page` to 1.
- Date filter chips: "Semua", "Hari ini", "7 hari", "30 hari", "Bulan ini", "Pilih tanggal" (opens from/to inputs).
- Header click cycles asc → desc on that column; arrow icon shows the active direction; `aria-sort` set on the active header.
- Pagination: "Sebelumnya" / "Berikutnya" + "Halaman {n} dari {m}" + "{total} catatan".
- Breakpoint: cards below `md` (768px), table from `md` up. Render both via CSS (`hidden md:table` / `md:hidden`), not JS media queries, so the server-rendered HTML is right on first paint.
- Empty state text is passed in per table; with active filters show "Tidak ada catatan yang cocok." + "Hapus filter".
