# 04 — Business Rules

Every rule has an ID; reference it in code comments and tests (e.g. `// R-C2`).

## Cash (R-C)

- **R-C1 — Single ledger.** Every movement of money is one `CashEntry` row. Nothing else stores money totals.
- **R-C2 — Summary cards** (always all-time; table filters never change them):
  - `Saldo Kas = initial capital + Σ income − Σ expense`
  - `Total Uang Masuk Lain = Σ income, excluding the initial capital entry` (sales, extra capital, anything else)
  - `Total Uang Keluar = Σ expense`
  - `Isi Gudang Bebek = Σ kg in − Σ kg out` and `Σ ekor in − Σ ekor out`, across all duck types _(Phase 2; shows 0 before)_
- **R-C3 — Initial capital.** Seeded once as an income entry, source `INITIAL_CAPITAL`, Rp 70.000.000, description "Uang Tunai dari Tante untuk Modal Pembangunan Cold Storage". Edit/delete: **TBD T1**; until then no edit/delete in the UI or API.
- **R-C4 — Manual entries** have: date, direction (income/expense), category, description, quantity, unit price, total = `round(quantity × unitPrice)`. Expenses may have a receipt.
- **R-C5 — Categories.** Separate lists for income and expense; both start empty. Names are trimmed and unique per direction, case-insensitive ("listrik" = "Listrik"; the first spelling is kept). Created inline from the dropdown (UC11). Rename/delete of categories: out of scope until requested.
- **R-C6 — Source labels.** Linked rows show a fixed label in the category column instead of a user category: `Belanja Pembangunan` (shopping purchase), `Beli Daging Bebek` (duck in), `Jual Daging Bebek` (duck out), `Modal Awal` (initial capital).
- **R-C7 — Validation.** Total > 0; quantity > 0; date required (defaults to today in Asia/Jakarta; past dates allowed).

## Linked records (R-L)

- **R-L1 — Linked create.** Saving a shopping purchase, or a duck movement with "Otomatis catat ke Buku Uang Kas" on, creates its cash row in the same DB transaction. If either fails, neither is saved.
- **R-L2 — Linked edit.** Editing the source updates its cash row (date, total, receipt) in the same transaction.
- **R-L3 — Linked delete.** Deleting the source deletes its cash row in the same transaction. The receipt file is deleted from object storage after the transaction commits.
- **R-L4 — Edit through the source only.** In the cash book, a linked row shows "Ubah di Daftar Belanja" / "Ubah di Gudang Bebek" instead of edit/delete buttons, and links to the source.
- **R-L5 — Description.** A linked row's description is read from its source (item name / duck type + party) at display time, so renaming an item updates old rows too.

## Shopping list (R-SH)

- **R-SH1 — Starter list.** Seeded items (content: `12-seed-shopping-list.md`) are normal items: admin can edit name, section, unit, explanation, or delete them.
- **R-SH2 — Numbering.** New item number = highest number ever used + 1 (a DB sequence). Numbers are never reused or renumbered after a delete.
- **R-SH3 — Status.** "Belum Dicatat" when the item has no purchases; "Sudah Dicatat di Kas" (green) when it has one or more.
- **R-SH4 — Buy again.** Recording a purchase for an item that already has one shows the UC07 dialog first. Both choices are valid.
- **R-SH5 — Purchase fields.** Date, quantity (`Decimal`, e.g. 2,5), unit price, total = `round(quantity × unitPrice)`, optional receipt. Unit comes from the item.
- **R-SH6 — Delete item with purchases.** Blocked: "Barang ini sudah punya catatan pembelian. Hapus dulu catatan pembeliannya." Items without purchases delete freely.
- **R-SH7 — Work sections** are numbered ("4. Panel Listrik & Pengaman") and created inline like categories (UC11); new section number = highest + 1.

## Stock (R-S) — Phase 2

- **R-S1 — Units.** Each movement records ekor (positive integer) and weight (stored in grams, entered as kg with up to 2 decimals). Total = `round(weightGrams × pricePerKg / 1000)`.
- **R-S2 — Stock guard (kg only).** Any create, edit or delete of a movement is simulated first; if any affected duck type's resulting kg stock is below 0, reject:
  - Sell too much: "Stok di gudang tidak cukup! Sisa: {57} Kg"
  - Delete/edit a purchase: "Catatan ini tidak bisa dihapus/diubah karena stok {jenis} akan menjadi minus {38} Kg. Ubah atau hapus dulu catatan penjualannya."
  - Run the check and the write inside one Serializable transaction, so two phones saving at once can't oversell.
- **R-S3 — Ekor not guarded.** Per owner decision, only kg is checked; ekor stock may show negative if typed inconsistently. Display it as is.
- **R-S4 — Duck types** created inline (UC12), unique case-insensitive.
- **R-S5 — Unchecked "Otomatis catat ke Buku Uang Kas"** — meaning **TBD T2**. Build the "on" path only; the "off" path waits for the answer to T2.

## Tables (R-T)

- **R-T1** Search box: case-insensitive "contains" across the table's text columns; debounced 300 ms; server-side.
- **R-T2** Date range filter: presets "Hari ini", "7 hari", "30 hari", "Bulan ini", plus custom range. Default: all dates.
- **R-T3** Sort: every column header toggles asc → desc. Default: date desc, then created time desc.
- **R-T4** Pagination: 20 rows per page.
- **R-T5** Filters, sort and page live in the URL query (`?q=&from=&to=&sort=date&dir=desc&page=1`) so reload/back keeps them.
- **R-T6** Tables without a date (stock per duck type, shopping list items) get search and sort only. The shopping list's purchase history table filters by purchase date.

## Formatting (R-F)

- **R-F1** Rupiah `Rp 1.500.000`; money inputs insert dots live as the user types and keep the caret position.
- **R-F2** Kg with comma decimals `95,5 Kg`; input accepts `,` or `.`.
- **R-F3** Dates `7 Nov 2026`, Asia/Jakarta.
- **R-F4** Income shown green with "+", expense red with "−".
