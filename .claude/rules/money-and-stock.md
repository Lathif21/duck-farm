# Money & Stock Rules

These protect the core promise of the app: the balance on screen equals the cash Tante holds.

## Cash book is the single ledger

- Every rupiah that moves is a row in `CashEntry`. Balances and totals are always computed from these rows; never stored as running totals.
- Shopping purchases and duck movements create, edit and delete their cash row in the **same database transaction** (`prisma.$transaction`). Use the `linked-cash-transaction` skill.
- A linked cash row is edited or deleted only through its source record (shopping purchase / duck movement), so the two can never drift apart.

## Number types

- Rupiah: integer (`Int`), no decimals, no floats in storage.
- Weight: integer grams (`weightGrams`). Display as kg with comma decimals (`95,5 Kg`).
- Quantity for shopping items: `Decimal(10,2)` (e.g. 2,5 meter).
- Totals: `total = round(quantity × unitPrice)`; duck: `total = round(weightGrams × pricePerKg / 1000)`. Compute on the server; the client preview must use the same helper from `src/lib/money.ts`.

## Formatting (id-ID)

- Rupiah: `Rp 1.500.000` (dot thousands separator). Money inputs show dots live while typing.
- Kg: comma decimal (`0,9`). Accept both `,` and `.` when typing; store grams.
- Dates: `7 Nov 2026`, timezone `Asia/Jakarta`.

## Stock guard

- Duck stock is checked in **kg only**, per duck type.
- Reject any save, edit or delete that would make a duck type's kg stock negative, with a clear Indonesian error (see `docs/04-business-rules.md`).
