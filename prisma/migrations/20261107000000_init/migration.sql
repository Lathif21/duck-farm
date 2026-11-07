-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "CashSource" AS ENUM ('INITIAL_CAPITAL', 'MANUAL', 'SHOPPING', 'DUCK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "usernameKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashCategory" (
    "id" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashEntry" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "direction" "Direction" NOT NULL,
    "source" "CashSource" NOT NULL DEFAULT 'MANUAL',
    "categoryId" TEXT,
    "description" TEXT,
    "quantity" DECIMAL(10,2),
    "unitPrice" INTEGER,
    "total" INTEGER NOT NULL,
    "receiptPathname" TEXT,
    "shoppingPurchaseId" TEXT,
    "duckMovementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSection" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingPurchase" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuckType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuckType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuckMovement" (
    "id" TEXT NOT NULL,
    "duckTypeId" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "date" DATE NOT NULL,
    "partyName" TEXT NOT NULL,
    "heads" INTEGER NOT NULL,
    "weightGrams" INTEGER NOT NULL,
    "pricePerKg" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DuckMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "LoginAttempt_usernameKey_createdAt_idx" ON "LoginAttempt"("usernameKey", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CashCategory_direction_nameKey_key" ON "CashCategory"("direction", "nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "CashEntry_shoppingPurchaseId_key" ON "CashEntry"("shoppingPurchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "CashEntry_duckMovementId_key" ON "CashEntry"("duckMovementId");

-- CreateIndex
CREATE INDEX "CashEntry_date_idx" ON "CashEntry"("date");

-- CreateIndex
CREATE INDEX "CashEntry_direction_date_idx" ON "CashEntry"("direction", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkSection_number_key" ON "WorkSection"("number");

-- CreateIndex
CREATE UNIQUE INDEX "WorkSection_nameKey_key" ON "WorkSection"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingItem_number_key" ON "ShoppingItem"("number");

-- CreateIndex
CREATE INDEX "ShoppingPurchase_itemId_idx" ON "ShoppingPurchase"("itemId");

-- CreateIndex
CREATE INDEX "ShoppingPurchase_date_idx" ON "ShoppingPurchase"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DuckType_nameKey_key" ON "DuckType"("nameKey");

-- CreateIndex
CREATE INDEX "DuckMovement_duckTypeId_idx" ON "DuckMovement"("duckTypeId");

-- CreateIndex
CREATE INDEX "DuckMovement_date_idx" ON "DuckMovement"("date");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CashCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_shoppingPurchaseId_fkey" FOREIGN KEY ("shoppingPurchaseId") REFERENCES "ShoppingPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_duckMovementId_fkey" FOREIGN KEY ("duckMovementId") REFERENCES "DuckMovement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "WorkSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingPurchase" ADD CONSTRAINT "ShoppingPurchase_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ShoppingItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuckMovement" ADD CONSTRAINT "DuckMovement_duckTypeId_fkey" FOREIGN KEY ("duckTypeId") REFERENCES "DuckType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Constraints Prisma can't express (05-data-model.md, "Extra constraints")
ALTER TABLE "CashEntry"        ADD CONSTRAINT cash_total_positive     CHECK (total > 0);
ALTER TABLE "CashEntry"        ADD CONSTRAINT cash_single_source_link CHECK (NOT ("shoppingPurchaseId" IS NOT NULL AND "duckMovementId" IS NOT NULL));
ALTER TABLE "ShoppingPurchase" ADD CONSTRAINT purchase_positive        CHECK (quantity > 0 AND "unitPrice" > 0 AND total > 0);
ALTER TABLE "DuckMovement"     ADD CONSTRAINT duck_positive            CHECK (heads > 0 AND "weightGrams" > 0 AND "pricePerKg" > 0 AND total > 0);
-- Only one initial capital row may exist (R-C3)
CREATE UNIQUE INDEX one_initial_capital ON "CashEntry" (source) WHERE source = 'INITIAL_CAPITAL';
-- Shopping item numbers are never reused, even after deleting the highest one (R-SH2)
CREATE SEQUENCE shopping_item_number_seq;
