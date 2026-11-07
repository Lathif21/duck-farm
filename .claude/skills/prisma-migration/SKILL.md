---
name: prisma-migration
description: Change the database schema safely with Prisma 7 on Neon. Use when editing prisma/schema.prisma, adding a constraint or index, or writing seed data.
---

# Prisma Migration (Neon)

Schema and constraints are documented in `.claude/docs/05-data-model.md`; update that doc in the same commit as the schema.

## Steps

1. **Work on a Neon dev branch**, never `main`. Check `DIRECT_URL` points to the dev branch before running anything. Done when `echo $DIRECT_URL` shows the dev branch host.
2. **Edit `prisma/schema.prisma`.** Money stays `Int` rupiah, weight `Int` grams, quantities `Decimal(10,2)`, business dates `@db.Date` (`.claude/rules/money-and-stock.md`).
3. **Create without applying:** `npx prisma migrate dev --create-only --name <verb_noun>`.
4. **Edit the generated SQL** to add what Prisma can't express: `CHECK` constraints, partial unique indexes, data backfills. Every new money/weight column gets a `> 0` check if it can never be zero.
5. **Make it safe for existing rows:** a new required column needs a default or a backfill in the same migration; renames are written as rename (not drop + add) so data survives.
6. **Apply and test:** `npx prisma migrate dev`, then `npm test`. Done when the migration applies on a fresh branch _and_ on a branch copied from production data (Neon branch from `main`).
7. **Update** `05-data-model.md` (schema block + constraints) and, if needed, `prisma/seed.ts`.

## Production

- Only CI runs `prisma migrate deploy`, before the deploy step. Never `migrate dev` or `db push` against `main`.
- Before a destructive migration (drop/alter type), create a Neon branch of `main` as a restore point and note its name in the PR.

## Seed rules

- Seed is idempotent (`upsert` by `number` / `nameKey`), so re-running never duplicates the initial capital or the starter list.
- Categories and duck types are never seeded (they start empty).
