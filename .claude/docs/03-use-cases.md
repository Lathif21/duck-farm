# 03 — Use Cases

UC01–UC06 come from the PRD (adapted to decisions). UC07+ are additions agreed with the owner. Exact labels: `07-screens-and-flows.md`. Rules: `04-business-rules.md`.

## UC00 — Sign in _(Phase 1)_

1. User opens the app → redirected to `/login`.
2. Enters username + password → lands on Buku Uang Kas.

- Wrong credentials: "Nama pengguna atau kata sandi salah."
- Auth method details: `08`, Auth.

## UC01 — Start with Tante's capital _(Phase 1)_

- **Pre:** fresh database after seeding.
- Summary cards show: Saldo Kas **Rp 70.000.000**, Total Uang Masuk Lain **Rp 0**, Total Uang Keluar **Rp 0**, Isi Gudang Bebek **0 Kg (0 Ekor/Pak)**.
- Buku Uang Kas has one row: "Uang Tunai dari Tante untuk Modal Pembangunan Cold Storage" **+ Rp 70.000.000**.
- Editing/deleting this row: **TBD T1**. Until decided, it has no edit or delete button.

## UC02 — Record a purchase from the shopping list _(Phase 1)_

Scenario: technician needs 2 × Breather Valve at Rp 450.000.

1. Menu 3 → item No. 5 → explanation shown in full.
2. Type Jumlah `2`, Harga Satuan `450000` (shows `450.000`) → Total `900.000` auto.
3. Optional: attach receipt photo.
4. Tap green **"Catat ke Uang Kas"**.

- **Post:** item 5 status "Sudah Dicatat di Kas" (green); balance −Rp 900.000 → Rp 69.100.000; cash book row "[Belanja Pembangunan] Katup Penyeimbang Udara Dinding (Breather Valve)" − Rp 900.000.

## UC03 — Add an item not on the list _(Phase 1)_

Scenario: 2 rolls of NYY main cable at Rp 1.250.000.

1. Menu 3 → top box "Tambah Barang / Biaya yang Belum Ada di Daftar".
2. Bagian Pekerjaan: pick "4. Panel Listrik & Pengaman" or type a new section.
3. Nama Barang, Penjelasan Kegunaan, Jumlah `2`, Satuan `Roll`, Harga Satuan `1.250.000` → Total `2.500.000`.
4. Tap **"Tambahkan & Catat ke Buku Uang Kas"**.

- **Post:** item appended as the next number (e.g. No. 13) with its explanation; cash −Rp 2.500.000.

## UC04 — Ducks into the warehouse (buy) _(Phase 2)_

Scenario: 100 ekor "Bebek Sedang - Size M (0,9 - 1,0 Kg)" from Pak Budi, 95 Kg, Rp 38.000/Kg.

1. Menu 2 → Step 1 "Bebek Masuk Gudang (Beli)".
2. Step 2: pick duck type (or add new, UC12), type party "Pak Budi".
3. Step 3: Ekor `100`, Berat `95`, Harga/Kg `38.000` → Total `3.610.000`.
4. Checkbox "Otomatis catat ke Buku Uang Kas" on by default (meaning when off: **TBD T2**). Optional receipt. Tap "Simpan Catatan Bebek".

- **Post:** Isi Gudang +95 Kg (+100 Ekor); cash −Rp 3.610.000 as "Beli Daging Bebek".

## UC05 — Ducks out of the warehouse (sell) _(Phase 2)_

Scenario: Rumah Makan Berkah buys 40 ekor, 38 Kg, Rp 45.000/Kg.

1. Menu 2 → "Bebek Keluar Gudang (Jual)" → type, buyer, Ekor `40`, Berat `38`, Harga/Kg `45.000` → Total `1.710.000`.
2. System checks stock in kg (38 ≤ 95). Tap "Simpan Catatan Bebek".

- **Post:** stock 57 Kg (60 Ekor); Total Uang Masuk Lain and balance +Rp 1.710.000.
- **Alt:** selling 120 Kg with 57 Kg in stock → red warning "Stok di gudang tidak cukup! Sisa: 57 Kg", save blocked.

## UC06 — General income / expense _(Phase 1)_

Scenario: pay electricity token Rp 500.000; receive Rp 10.000.000 extra capital from family.

1. Menu 1 → "Uang Keluar" or "Uang Masuk".
2. Tanggal (default today, past dates allowed), Kelompok Keperluan (UC11), Nama Barang/Catatan, Jumlah, Harga → Total auto. Expense only: optional receipt (UC09).
3. "Simpan Pengeluaran Uang" / "Simpan Pemasukan Uang".

- **Post:** balance updates immediately; row appears at top of history.

## UC07 — Buy a listed item again _(Phase 1)_

1. User taps "Catat ke Uang Kas" on an item that already has a purchase.
2. Dialog: "Barang ini sudah pernah dicatat pada {tanggal} sebesar Rp {total}. Mau ubah catatan lama atau catat pembelian baru?"
3. Buttons: **"Lihat & Ubah Catatan Lama"** (opens that purchase in edit mode) / **"Catat Pembelian Baru"** (saves new purchase) / "Batal".

- If several previous purchases exist, the dialog shows the latest and links to the item's purchase history.

## UC08 — Edit or delete a record _(Phase 1 & 2)_

- Any manual cash entry, shopping purchase or duck movement can be edited or deleted.
- Linked records update/remove their cash row in the same save (linked edit / linked delete).
- Delete confirmation names the side effect: "Catatan di Buku Uang Kas juga akan dihapus."
- Duck movement edit/delete that would make stock negative is blocked (rule R-S2).

## UC09 — Attach a receipt (nota) _(Phase 1)_

- Every expense form (manual expense, shopping purchase, duck purchase) has an optional "Foto / File Nota" field.
- Photo from camera or gallery, or a PDF. Rules: JPG/PNG/WebP/PDF, photos compressed in the browser, max 4 MB, one receipt per entry (`08`).
- The row shows a receipt icon; tapping opens the file. Receipt can be replaced or removed when editing.

## UC10 — Download PDF report _(Phase 1)_

- Pick a date range → "Unduh Laporan PDF". Contents: `08`, PDF report.

## UC11 — Pick or add a category _(Phase 1)_

- The Kelompok Keperluan dropdown lists categories previously used **for that direction** (income list and expense list are separate). Both start empty.
- Typing a name not in the list shows "+ Tambah kategori "{nama}"" → saved and selected, available next time.
- Same "pick or add new" behaviour for Bagian Pekerjaan (UC03) and duck types (UC12).

## UC12 — Add a duck type _(Phase 2)_

- Duck type dropdown in Step 2 works like UC11: pick existing or add new (e.g. "Bebek Besar - Size L (1,2 - 1,4 Kg)").

## UC13 — Blocked delete of an old purchase _(Phase 2)_

- Stock 57 Kg of type M (bought 95, sold 38). User deletes the 95 Kg purchase → result would be −38 Kg.
- Error: "Catatan ini tidak bisa dihapus karena stok {jenis bebek} akan menjadi minus {38} Kg. Ubah atau hapus dulu catatan penjualannya." Nothing changes.
