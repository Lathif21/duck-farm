---
name: linked-cash-transaction
description: Create, edit or delete any record that moves money, so the cash book and its source never disagree. Use when touching shopping purchases, duck movements, manual cash entries, receipts, or the summary cards.
---

# Linked Cash Transaction

The app's core promise: the balance on screen equals Tante's physical cash. Rules: R-C*, R-L*, R-S2 in `.claude/docs/04-business-rules.md`; rule summary in `.claude/rules/money-and-stock.md`.

## Write path (every money-moving mutation)

1. **Validate** input with zod in the form action. Convert money strings to integer rupiah and kg to integer grams with `src/lib/money.ts`. Done when no float or string amount reaches the DB layer.
2. **Compute totals on the server** with the same helper the client preview uses (`lineTotal`, `duckTotal`). Never trust a total sent by the browser.
3. **Upload the receipt first** (if any) via `src/lib/server/blob.ts`; keep its object key (`receiptPathname`).
4. **One transaction** for the source row and its `CashEntry`:
   ```ts
   await db.$transaction(async (tx) => {
     // stock-affecting? run the guard here first (R-S2)
     const purchase = await tx.shoppingPurchase.create({ data: {...} });
     await tx.cashEntry.create({ data: {
       date: purchase.date, direction: 'OUT', source: 'SHOPPING',
       total: purchase.total, shoppingPurchaseId: purchase.id,
       receiptPathname,
     }});
   }, duckRelated ? { isolationLevel: 'Serializable' } : undefined);
   ```
   Done when the source and cash row are created, updated or deleted inside the same `$transaction`.
5. **On transaction failure:** delete the just-uploaded receipt file, return `fail()` with the form values so nothing typed is lost.
6. **After commit:** delete any replaced/removed receipt file. Then return success; `enhance` re-runs `load`, so summary cards refresh.

## Per operation

| Operation | In the transaction                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| Create    | Source row + cash row (copy `date`, `total`; direction OUT for purchases/duck in, IN for duck out).                |
| Edit      | Update source; update its cash row's `date`, `total`, receipt fields.                                              |
| Delete    | Delete source (cascade removes the cash row; delete it explicitly anyway for clarity). File deletion after commit.  |

## Stock guard (duck movements, R-S2)

Inside the Serializable transaction, before writing: load current grams per affected duck type, apply the change in memory (remove the old version of the movement if editing/deleting, add the new one), and throw a typed `StockError { duckTypeName, remainingGrams }` if any type goes below 0. Map it to the exact Indonesian messages in R-S2. Retry the transaction once on a serialization failure (Postgres `40001`).

## Must not

- Write a `CashEntry` with `source` SHOPPING/DUCK outside this path.
- Store a running balance anywhere; balances are always aggregate queries (R-C1).

## Tests to add with every change

Rollback (force the second write to fail), exact balance restore after delete, and for duck code the concurrent-oversell test. See `.claude/docs/10-testing-and-acceptance.md`.
