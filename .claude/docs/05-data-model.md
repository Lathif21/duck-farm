# 05 — Data Model (Prisma + Neon)

Validated against Prisma 7's schema engine (Nov 2026). Prisma 7 moves connection URLs out of the schema into `prisma.config.ts` and connects through a driver adapter (`@prisma/adapter-neon`); see `08-tech-architecture.md`. Confirm against the current Prisma docs when setting up.

## Design decisions

- **Money is `Int` rupiah.** Max Rp 2.147.483.647 per row, far above any single transaction here. Sums are computed in SQL (`bigint`), so balances can exceed that.
- **Weight is `Int` grams** to avoid floating-point drift. 95,5 Kg → `95500`.
- **Cash entries own the link.** `CashEntry.shoppingPurchaseId` / `duckMovementId` are unique and `onDelete: Cascade`, so a source can never leave an orphan cash row (R-L3). Code still deletes both explicitly inside one transaction.
- **Receipts sit on `CashEntry`**, because every expense, manual or linked, is a cash row (UC09).
- **`nameKey`** (lower-case, trimmed) enforces case-insensitive uniqueness for categories, sections and duck types (R-C5, R-SH7, R-S4).
- **Item numbers come from a sequence** (`shopping_item_number_seq`), not `max + 1`, so deleting the highest item never frees its number (R-SH2, test in `10`). The seed moves the sequence past the seeded numbers.
- **`LoginAttempt`** stores failed logins for the rate limit (`08`, Auth); a table because Vercel functions do not share memory.
- No `createdBy` audit columns: not requested. Add only if T1's answer asks for a change history.

## Schema

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/lib/server/generated/prisma"
}

datasource db {
  provider = "postgresql"
  // Connection URLs live in prisma.config.ts (Prisma 7). See 08-tech-architecture.md.
}

enum Role {
  ADMIN
}

enum Direction {
  IN
  OUT
}

enum CashSource {
  INITIAL_CAPITAL
  MANUAL
  SHOPPING
  DUCK
}

model User {
  id           String    @id @default(cuid())
  username     String    @unique
  name         String
  passwordHash String
  role         Role      @default(ADMIN)
  createdAt    DateTime  @default(now())
  sessions     Session[]
}

model Session {
  id        String   @id // SHA-256 of the session token, never the raw token
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime

  @@index([userId])
}

// Failed logins, for the rate limit: 5 per username per 15 minutes (08, Auth).
// A table rather than memory, because Vercel functions don't share memory.
model LoginAttempt {
  id          String   @id @default(cuid())
  usernameKey String   // lower-case trimmed username
  createdAt   DateTime @default(now())

  @@index([usernameKey, createdAt])
}

model CashCategory {
  id        String      @id @default(cuid())
  direction Direction
  name      String      // as first typed, trimmed
  nameKey   String      // lower-case trimmed name, for uniqueness (R-C5)
  createdAt DateTime    @default(now())
  entries   CashEntry[]

  @@unique([direction, nameKey])
}

model CashEntry {
  id          String        @id @default(cuid())
  date        DateTime      @db.Date
  direction   Direction
  source      CashSource    @default(MANUAL)
  categoryId  String?       // MANUAL only; linked rows use a source label (R-C6)
  category    CashCategory? @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  description String?       // MANUAL / INITIAL_CAPITAL only; linked rows read it from the source (R-L5)
  quantity    Decimal?      @db.Decimal(10, 2)
  unitPrice   Int?          // rupiah
  total       Int           // rupiah, > 0

  receiptPathname String?   // object key in the private receipts bucket (expenses only)

  shoppingPurchaseId String?           @unique
  shoppingPurchase   ShoppingPurchase? @relation(fields: [shoppingPurchaseId], references: [id], onDelete: Cascade)
  duckMovementId     String?           @unique
  duckMovement       DuckMovement?     @relation(fields: [duckMovementId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([date])
  @@index([direction, date])
}

model WorkSection {
  id        String         @id @default(cuid())
  number    Int            @unique
  name      String
  nameKey   String         @unique
  createdAt DateTime       @default(now())
  items     ShoppingItem[]
}

model ShoppingItem {
  id          String             @id @default(cuid())
  number      Int                @unique // never reused (R-SH2)
  name        String
  explanation String
  unit        String             // "Unit", "Roll", "Meter", "Hari", ...
  sectionId   String
  section     WorkSection        @relation(fields: [sectionId], references: [id], onDelete: Restrict)
  isSeed      Boolean            @default(false)
  purchases   ShoppingPurchase[]
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
}

model ShoppingPurchase {
  id        String       @id @default(cuid())
  itemId    String
  item      ShoppingItem @relation(fields: [itemId], references: [id], onDelete: Restrict) // R-SH6
  date      DateTime     @db.Date
  quantity  Decimal      @db.Decimal(10, 2)
  unitPrice Int
  total     Int
  cashEntry CashEntry?
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@index([itemId])
  @@index([date])
}

model DuckType {
  id        String         @id @default(cuid())
  name      String
  nameKey   String         @unique
  createdAt DateTime       @default(now())
  movements DuckMovement[]
}

model DuckMovement {
  id          String     @id @default(cuid())
  duckTypeId  String
  duckType    DuckType   @relation(fields: [duckTypeId], references: [id], onDelete: Restrict)
  direction   Direction  // IN = beli (masuk gudang), OUT = jual (keluar gudang)
  date        DateTime   @db.Date
  partyName   String     // farmer or buyer
  heads       Int        // ekor / pak
  weightGrams Int        // kg × 1000
  pricePerKg  Int        // rupiah
  total       Int        // round(weightGrams × pricePerKg / 1000)
  cashEntry   CashEntry?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([duckTypeId])
  @@index([date])
}
```

## Extra constraints (add by hand in the first migration)

Prisma can't express these; add them as raw SQL in the migration file (`prisma migrate dev --create-only`, edit, then apply):

```sql
ALTER TABLE "CashEntry"        ADD CONSTRAINT cash_total_positive     CHECK (total > 0);
ALTER TABLE "CashEntry"        ADD CONSTRAINT cash_single_source_link CHECK (NOT ("shoppingPurchaseId" IS NOT NULL AND "duckMovementId" IS NOT NULL));
ALTER TABLE "ShoppingPurchase" ADD CONSTRAINT purchase_positive        CHECK (quantity > 0 AND "unitPrice" > 0 AND total > 0);
ALTER TABLE "DuckMovement"     ADD CONSTRAINT duck_positive            CHECK (heads > 0 AND "weightGrams" > 0 AND "pricePerKg" > 0 AND total > 0);
-- Only one initial capital row may exist (R-C3)
CREATE UNIQUE INDEX one_initial_capital ON "CashEntry" (source) WHERE source = 'INITIAL_CAPITAL';
-- Shopping item numbers are never reused, even after deleting the highest one (R-SH2)
CREATE SEQUENCE shopping_item_number_seq;
```

## Key queries

**Summary cards (R-C2)** — one aggregate query:

```sql
SELECT
  COALESCE(SUM(total) FILTER (WHERE direction = 'IN'), 0)
    - COALESCE(SUM(total) FILTER (WHERE direction = 'OUT'), 0)                     AS balance,
  COALESCE(SUM(total) FILTER (WHERE direction = 'IN' AND source <> 'INITIAL_CAPITAL'), 0) AS other_income,
  COALESCE(SUM(total) FILTER (WHERE direction = 'OUT'), 0)                          AS total_expense
FROM "CashEntry";
```

(The initial capital is itself an IN row, so `balance` already equals `initial capital + Σ income − Σ expense`.)

**Stock per duck type (R-S2):**

```sql
SELECT "duckTypeId",
  SUM(CASE WHEN direction = 'IN' THEN "weightGrams" ELSE -"weightGrams" END) AS grams,
  SUM(CASE WHEN direction = 'IN' THEN heads ELSE -heads END)                 AS heads
FROM "DuckMovement" GROUP BY "duckTypeId";
```

**Running balance column** — window function over all rows ordered by `date, createdAt`, computed before search/filter/sort are applied so each row's balance is the true balance after that entry.

## Seed (`prisma/seed.ts`)

1. Initial capital entry (R-C3), date = project start date (**ask the owner**; it's part of T1).
2. Work sections + starter shopping items from `12-seed-shopping-list.md`, `isSeed = true`.
3. No categories, no duck types (both start empty).
4. Admin users: created with the `create-admin` script, not the seed.
