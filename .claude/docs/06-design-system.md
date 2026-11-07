# 06 — Design System

Visual reference: Dribbble "Eggsy – the poultry chicken farm landing page" (screenshot supplied by the owner). It's a marketing page; this doc translates its look to a data-heavy app.

## Colors

### From the reference (sampled from the screenshot — Decided)

| Token           | Hex       | Use                                                                 |
| --------------- | --------- | ------------------------------------------------------------------- |
| `primary`       | `#FA8F13` | Hero summary card, primary button fill, active nav item, focus ring |
| `primary-light` | `#FD9D33` | Hover/pressed state of primary surfaces                             |
| `yellow`        | `#FBC540` | Shopping-list item cards (like Eggsy's product cards), highlights   |
| `cream`         | `#FFF6DF` | Page background behind cards, table row hover, input background     |
| `brown`         | `#7C4200` | Headings, section titles, secondary button text, top bar on laptop  |
| `charcoal`      | `#404040` | Body text, bottom navigation bar background                         |
| `white`         | `#FFFFFF` | Cards, tables, inputs                                               |

Values were sampled from a compressed screenshot; if the designer's source file is available, prefer its exact values.

### Added for function & readability

Contrast was measured (WCAG 2.x). White text on `primary` is **2,33:1** and orange text on white is **2,33:1**, both too faint for a bright warehouse. These additions fix that:

| Token          | Hex       | Use                                                           | Contrast           |
| -------------- | --------- | ------------------------------------------------------------- | ------------------ |
| `ink`          | `#2A1600` | Text on `primary` and `yellow`                                | 7,42:1 on primary  |
| `primary-deep` | `#B85E00` | Orange-colored text/links on white                            | 4,53:1 on white    |
| `success`      | `#1E7A46` | Income (+), "Catat ke Uang Kas" button, "Sudah Dicatat" badge | white on it 5,35:1 |
| `danger`       | `#C62828` | Expense (−), stock warnings, delete                           | white on it 5,62:1 |
| `line`         | `#9C7A4A` | Input borders                                                 | 3,97:1 on white    |

Rules: never put white text on `primary`; use `ink`. Use `primary` as a fill, not as text color; for orange text use `primary-deep`. Income/expense are never shown by color alone: always with "+"/"−".

### Tailwind v4 tokens (`src/app.css`)

```css
@import 'tailwindcss';

@theme {
	--color-primary: #fa8f13;
	--color-primary-light: #fd9d33;
	--color-primary-deep: #b85e00;
	--color-yellow: #fbc540;
	--color-cream: #fff6df;
	--color-brown: #7c4200;
	--color-charcoal: #404040;
	--color-ink: #2a1600;
	--color-success: #1e7a46;
	--color-danger: #c62828;
	--color-line: #9c7a4a;

	--font-display: 'Baloo 2', ui-rounded, system-ui, sans-serif;
	--font-body: 'Nunito', system-ui, -apple-system, 'Segoe UI', sans-serif;

	--radius-card: 1.25rem;
	--radius-pill: 9999px;
}
```

## Typography

The reference uses a bold, rounded display face. **Baloo 2** (headings, big numbers) and **Nunito** (body), both on Google Fonts, both cover Indonesian text.

| Style                                                                         | Font    | Size / weight                                    |
| ----------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| Hero number (Sisa Uang)                                                       | display | 32px mobile / 40px laptop, 800                   |
| Page title                                                                    | display | 24px, 700, `brown`                               |
| Section title                                                                 | display | 18px, 700, `brown`, uppercase like "OUR PARTNER" |
| Body                                                                          | body    | 16px, 500, `charcoal`                            |
| Input text                                                                    | body    | **17px, 700** (anti-zoom, PRD)                   |
| Caption / labels                                                              | body    | 14px, 600                                        |
| Numbers use `font-variant-numeric: tabular-nums` so amounts align in columns. |

## Shape & spacing

- Cards: `radius-card` (20px), soft shadow `0 4px 16px rgb(124 66 0 / 0.08)`.
- Buttons: pill shape (like Eggsy's "SHOP NOW"), min height 48px.
- Spacing scale: Tailwind default; page padding 16px mobile, 32px laptop; max content width 1200px.

## Components

- **Summary cards.** "Sisa Uang Tunai Tante" is the hero: full-width `primary` card, `ink` text, hero number, faint large watermark-style text in the corner (echoing Eggsy's "SINCE 1996"), e.g. "KAS". The other three: white cards, label in `brown`, value in `charcoal`; on phone they sit in a 3-column row under the hero (2 + 1 if too narrow), never scrolling sideways.
- **Buttons.** Primary: `primary` fill + `ink` text. Record-to-cash: `success` fill + white text (PRD "tombol hijau besar"). Secondary: white fill, `brown` 2px border + `brown` text (like "CHECK THE FARM"). Danger: `danger` text, white fill; filled red only inside the delete confirmation.
- **Inputs.** White, 2px `line` border (meets the 3:1 rule for input outlines), focus ring `primary`, 17px bold. Money inputs right-aligned with "Rp" prefix; kg inputs with "Kg" suffix.
- **Combobox (pick or add new).** Searchable dropdown; last row "+ Tambah "{typed text}"" in `primary-deep`.
- **Shopping item card.** `yellow` background, `ink` text, number badge in a white circle, full explanation in a white inner box ("Penjelasan Nomor 5"), status badge top-right: "Belum Dicatat" (white/charcoal) or "Sudah Dicatat di Kas" (`success`).
- **Data table.** Laptop: white card, header row `cream` with `brown` bold labels and sort arrows, zebra rows off, row hover `cream`. Phone: one white card per row, key fields stacked (see skill `data-table`).
- **Bottom navigation (phone).** Floating `charcoal` pill bar, 3 items (Uang Kas, Stok Bebek, Daftar Belanja), active item `primary` with `ink` icon+label, inactive white. Laptop: top bar in `brown` with the same 3 links.
- **Alerts.** Stock/validation errors: `danger` left border, light red background `#FDECEC`, text `danger`, icon. Success toast: `success`.
- **Dialogs.** White card, `radius-card`, primary action on the right on laptop, full-width stacked buttons on phone.

## Not in scope

Dark mode (light only, owner decision Nov 2026). Photos/illustrations like Eggsy's hero images: optional, only if the owner supplies licensed images.
