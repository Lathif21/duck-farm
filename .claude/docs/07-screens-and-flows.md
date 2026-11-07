# 07 — Screens & Flows

All labels below are the exact UI text (Indonesian). Behaviour rules: `04-business-rules.md`. Styling: `06-design-system.md`.

## Routes

| Route               | Screen                           | Phase                                        |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `/login`            | Masuk                            | 1                                            |
| `/`                 | Redirects to `/kas`              | 1                                            |
| `/kas`              | Menu 1 — Buku Uang Kas           | 1                                            |
| `/belanja`          | Menu 3 — Daftar Belanja Bangunan | 1                                            |
| `/belanja/[itemId]` | Item detail + purchase history   | 1                                            |
| `/gudang`           | Menu 2 — Gudang Daging Bebek     | 2 (Phase 1 shows "Segera hadir" placeholder) |

## Shared layout (every signed-in page)

1. **Top:** app name "Pembukuan Cold Storage Bebek", user name, "Keluar" (sign out). Laptop: brown top bar with the 3 menu links.
2. **Summary cards (R-C2):** hero "Sisa Uang Tunai Tante"; then "Total Uang Masuk Lain", "Total Uang Keluar", "Isi Gudang Bebek" (`95 Kg (100 Ekor / Pak)`).
3. **Page content.**
4. **Phone:** floating bottom bar "1. Uang Kas", "2. Stok Bebek", "3. Daftar Belanja" (PRD numbering kept). Page content gets bottom padding so the bar never covers the last row.

## `/login` — Masuk

Fields "Nama Pengguna", "Kata Sandi"; button "Masuk". Error: "Nama pengguna atau kata sandi salah."

## `/kas` — Buku Uang Kas

1. Two big toggle buttons: **"Uang Masuk"** (success) / **"Uang Keluar"** (danger). Selecting one opens the form below (no form open by default on phone, to keep the history visible).
2. **Form:**
   - "Tanggal" (default today)
   - "Kelompok Keperluan" (combobox, list for the chosen direction; UC11)
   - "Nama Barang / Catatan"
   - "Jumlah" + "Harga (Rp)" → read-only "Total (Rp)" updates live
   - Expense only: "Foto / File Nota (opsional)"
   - Submit: "Simpan Pemasukan Uang" / "Simpan Pengeluaran Uang"; "Batal"
3. **"Unduh Laporan PDF"** button (secondary) → dialog with date range + "Unduh".
4. **History table** (`DataTable`):
   - Columns: Tanggal · Kelompok Keperluan · Catatan · Masuk · Keluar · Sisa · Nota · Aksi
   - Masuk shown `+ Rp …` green; Keluar `− Rp …` red.
   - Aksi: manual rows "Ubah" / "Hapus"; linked rows "Ubah di Daftar Belanja" / "Ubah di Gudang Bebek" (R-L4); initial capital row: none (T1).
   - Phone card: line 1 date + category label; line 2 note (full, wrapped); line 3 amount big with sign; footer: nota icon + actions.
   - Empty state: "Belum ada catatan. Tekan Uang Masuk atau Uang Keluar untuk mulai."

## `/belanja` — Daftar Belanja Bangunan

1. **Top box:** "Tambah Barang / Biaya yang Belum Ada di Daftar" (collapsible on phone):
   - "Bagian Pekerjaan" (combobox, UC11), "Nama Barang Baru", "Penjelasan Kegunaan" (multi-line), "Jumlah", "Satuan", "Harga Satuan (Rp)" → "Total (Rp)", "Tanggal", "Foto / File Nota (opsional)"
   - Buttons: **"Tambahkan & Catat ke Buku Uang Kas"** (success); "Tambahkan ke Daftar Saja" (adds the item with no purchase)
2. **Item list** grouped by Bagian Pekerjaan (section titles), search + sort (R-T6), cards on all widths (yellow cards, 2–3 per row on laptop):
   - "Nomor {n}" badge, name, status badge "Belum Dicatat" / "Sudah Dicatat di Kas"
   - Box "Penjelasan Nomor {n}" with the full explanation (never truncated)
   - Inline purchase form: "Jumlah" ({unit} suffix), "Harga Satuan (Rp)", "Total (Rp)" auto, "Tanggal", "Foto / File Nota (opsional)", button **"Catat ke Uang Kas"** (success)
   - Link "Lihat Riwayat Pembelian ({count})" → `/belanja/[itemId]`
   - Admin menu "⋯": "Ubah Barang", "Hapus Barang" (R-SH6)
3. **Buy-again dialog (UC07):** title "Barang ini sudah pernah dicatat"; text "Terakhir dicatat pada {tanggal} sebesar Rp {total}. Mau ubah catatan lama atau catat pembelian baru?"; buttons "Lihat & Ubah Catatan Lama", "Catat Pembelian Baru", "Batal".

## `/belanja/[itemId]` — Item detail

Item header (number, name, section, unit, explanation) + purchase history `DataTable`: Tanggal · Jumlah · Harga Satuan · Total · Nota · Aksi ("Ubah", "Hapus"). Opened in edit mode when coming from "Lihat & Ubah Catatan Lama" (`?edit={purchaseId}`).

## `/gudang` — Gudang Daging Bebek _(Phase 2)_

1. **Stock overview:** one card per duck type: name, `{kg} Kg ({ekor} Ekor / Pak)`; search + sort (R-T6).
2. **Form in 3 steps** (one screen, numbered sections):
   - "Langkah 1": toggle **"Bebek Masuk Gudang (Beli)"** / **"Bebek Keluar Gudang (Jual)"**
   - "Langkah 2": "Jenis Bebek" (combobox, UC12); "Nama Peternak / Penjual" (in) or "Nama Pembeli" (out); "Tanggal"
   - "Langkah 3": "Jumlah (Ekor / Pak)", "Berat Total (Kg)", "Harga per 1 Kg (Rp)" → "Total Harga (Rp)" auto; inbound only: "Foto / File Nota (opsional)"
   - Checkbox "Otomatis catat ke Buku Uang Kas" (checked; off path TBD T2)
   - Live stock hint on outbound: "Sisa stok: {57} Kg"; error in red when exceeded (R-S2)
   - Submit: "Simpan Catatan Bebek"
3. **History table:** Tanggal · Masuk/Keluar · Jenis Bebek · Pihak · Ekor · Berat (Kg) · Harga/Kg · Total · Nota · Aksi.

## Delete confirmations

- Manual entry: "Hapus catatan ini? Saldo kas akan dihitung ulang."
- Linked source: "Hapus catatan ini? Catatan di Buku Uang Kas juga akan dihapus."
- Buttons: "Ya, Hapus" (danger) / "Batal".

## Loading & errors

- Submit buttons show a spinner and are disabled while saving (prevents double entries).
- Network/server error: "Gagal menyimpan. Periksa sinyal internet lalu coba lagi." Form values are kept.
