import { lineTotal, MAX_INT, type Direction } from '#lib/money.js';
import { fromDateOnly, toDateOnly } from '#lib/dates.js';
import { db, nameKey, type Tx } from './db';
import { Prisma } from './generated/prisma/client';
import { UserError } from './errors';
import { withReceipt, type ReceiptChange } from './blob';
import type { TableQuery } from './table-query';

// Cash book (R-C*). Every rupiah is a CashEntry row; balances are always computed (R-C1).

export type CashSource = 'INITIAL_CAPITAL' | 'MANUAL' | 'SHOPPING' | 'DUCK';

export type Summary = {
	balance: number;
	otherIncome: number;
	totalExpense: number;
	stockGrams: number;
	stockHeads: number;
};

/** Summary cards (R-C2). All-time; table filters never change them. */
export async function getSummary(): Promise<Summary> {
	const [[cash], [stock]] = await Promise.all([
		db.$queryRaw<{ balance: bigint; other_income: bigint; total_expense: bigint }[]>`
			SELECT
				COALESCE(SUM(total) FILTER (WHERE direction = 'IN'), 0)
					- COALESCE(SUM(total) FILTER (WHERE direction = 'OUT'), 0) AS balance,
				COALESCE(SUM(total) FILTER (WHERE direction = 'IN' AND source <> 'INITIAL_CAPITAL'), 0) AS other_income,
				COALESCE(SUM(total) FILTER (WHERE direction = 'OUT'), 0) AS total_expense
			FROM "CashEntry"`,
		db.$queryRaw<{ grams: bigint; heads: bigint }[]>`
			SELECT
				COALESCE(SUM(CASE WHEN direction = 'IN' THEN "weightGrams" ELSE -"weightGrams" END), 0) AS grams,
				COALESCE(SUM(CASE WHEN direction = 'IN' THEN heads ELSE -heads END), 0) AS heads
			FROM "DuckMovement"`
	]);
	return {
		balance: Number(cash.balance),
		otherIncome: Number(cash.other_income),
		totalExpense: Number(cash.total_expense),
		stockGrams: Number(stock.grams),
		stockHeads: Number(stock.heads)
	};
}

// ---------------------------------------------------------------------------
// History table

export const CASH_SORT_KEYS = [
	'date',
	'category',
	'note',
	'in',
	'out',
	'balance',
	'receipt'
] as const;
export type CashSortKey = (typeof CASH_SORT_KEYS)[number];

const SORT_SQL: Record<CashSortKey, string> = {
	date: 'date',
	category: 'category_label',
	note: 'note',
	in: "(CASE WHEN direction = 'IN' THEN total END)",
	out: "(CASE WHEN direction = 'OUT' THEN total END)",
	balance: 'balance',
	receipt: 'has_receipt'
};

/**
 * One row per cash entry with its display label (R-C6), its description read from the
 * source (R-L5) and the running balance over *all* rows (P8), before any filter.
 */
const BASE_CTE = Prisma.sql`
	WITH base AS (
		SELECT
			e.id, e.date, e.direction::text AS direction, e.source::text AS source, e.total, e."createdAt",
			e."categoryId" AS category_id, e.description,
			(e.quantity * 100)::int AS quantity, e."unitPrice" AS unit_price,
			e."receiptPathname" IS NOT NULL AS has_receipt,
			sp."itemId" AS item_id,
			CASE e.source
				WHEN 'INITIAL_CAPITAL' THEN 'Modal Awal'
				WHEN 'SHOPPING' THEN 'Belanja Pembangunan'
				WHEN 'DUCK' THEN CASE WHEN e.direction = 'OUT' THEN 'Beli Daging Bebek' ELSE 'Jual Daging Bebek' END
				ELSE c.name
			END AS category_label,
			CASE e.source
				WHEN 'SHOPPING' THEN si.name
				WHEN 'DUCK' THEN dt.name || ' – ' || dm."partyName"
				ELSE e.description
			END AS note,
			SUM(CASE WHEN e.direction = 'IN' THEN e.total ELSE -e.total END)
				OVER (ORDER BY e.date, e."createdAt", e.id) AS balance
		FROM "CashEntry" e
		LEFT JOIN "CashCategory" c ON c.id = e."categoryId"
		LEFT JOIN "ShoppingPurchase" sp ON sp.id = e."shoppingPurchaseId"
		LEFT JOIN "ShoppingItem" si ON si.id = sp."itemId"
		LEFT JOIN "DuckMovement" dm ON dm.id = e."duckMovementId"
		LEFT JOIN "DuckType" dt ON dt.id = dm."duckTypeId"
	)`;

type RawCashRow = {
	id: string;
	date: Date;
	direction: Direction;
	source: CashSource;
	total: number;
	category_id: string | null;
	description: string | null;
	quantity: number | null;
	unit_price: number | null;
	has_receipt: boolean;
	item_id: string | null;
	category_label: string | null;
	note: string | null;
	balance: bigint;
};

export type CashRow = {
	id: string;
	date: string;
	direction: Direction;
	source: CashSource;
	total: number;
	categoryId: string | null;
	categoryLabel: string;
	note: string;
	description: string;
	quantity: number | null; // hundredths
	unitPrice: number | null;
	hasReceipt: boolean;
	itemId: string | null;
	balance: number;
};

function toCashRow(r: RawCashRow): CashRow {
	return {
		id: r.id,
		date: toDateOnly(r.date),
		direction: r.direction,
		source: r.source,
		total: r.total,
		categoryId: r.category_id,
		categoryLabel: r.category_label ?? '',
		note: r.note ?? '',
		description: r.description ?? '',
		quantity: r.quantity,
		unitPrice: r.unit_price,
		hasReceipt: r.has_receipt,
		itemId: r.item_id,
		balance: Number(r.balance)
	};
}

/** Escapes LIKE wildcards so the search is a plain "contains" (R-T1). */
export function likePattern(q: string): string {
	return `%${q.replace(/[\\%_]/g, '\\$&')}%`;
}

function rangeWhere(from: string | null, to: string | null): Prisma.Sql[] {
	const conds: Prisma.Sql[] = [];
	if (from) conds.push(Prisma.sql`date >= ${from}::date`);
	if (to) conds.push(Prisma.sql`date <= ${to}::date`);
	return conds;
}

export async function listCashEntries(t: TableQuery<CashSortKey>) {
	const conds = rangeWhere(t.from, t.to);
	if (t.q) {
		const like = likePattern(t.q);
		conds.push(Prisma.sql`(category_label ILIKE ${like} OR note ILIKE ${like})`);
	}
	const where = conds.length ? Prisma.sql`WHERE ${Prisma.join(conds, ' AND ')}` : Prisma.empty;
	const dir = t.dir === 'asc' ? 'ASC' : 'DESC';
	const orderBy = Prisma.raw(`${SORT_SQL[t.sort]} ${dir} NULLS LAST, "createdAt" DESC, id DESC`);

	const [rows, [{ count }]] = await Promise.all([
		db.$queryRaw<
			RawCashRow[]
		>`${BASE_CTE} SELECT * FROM base ${where} ORDER BY ${orderBy} LIMIT ${t.take} OFFSET ${t.skip}`,
		db.$queryRaw<{ count: bigint }[]>`${BASE_CTE} SELECT COUNT(*) AS count FROM base ${where}`
	]);
	return { rows: rows.map(toCashRow), total: Number(count) };
}

// ---------------------------------------------------------------------------
// Categories (R-C5, UC11)

export function listCategories(direction: Direction) {
	return db.cashCategory.findMany({
		where: { direction },
		select: { id: true, name: true },
		orderBy: { name: 'asc' }
	});
}

/** Picks an existing category or creates one; "listrik" = "Listrik", first spelling kept. */
async function resolveCategory(
	tx: Tx,
	direction: Direction,
	categoryId: string | null,
	categoryName: string | null
): Promise<string> {
	if (categoryId) {
		const found = await tx.cashCategory.findFirst({ where: { id: categoryId, direction } });
		if (found) return found.id;
	}
	const name = categoryName?.trim().replace(/\s+/g, ' ');
	if (!name) throw new UserError('Pilih atau tulis Kelompok Keperluan.');
	const category = await tx.cashCategory.upsert({
		where: { direction_nameKey: { direction, nameKey: nameKey(name) } },
		create: { direction, name, nameKey: nameKey(name) },
		update: {}
	});
	return category.id;
}

// ---------------------------------------------------------------------------
// Manual entries (R-C4, UC06, UC08)

export type ManualEntryInput = {
	date: string;
	categoryId: string | null;
	categoryName: string | null;
	description: string;
	quantity: number; // hundredths
	unitPrice: number;
};

/** Server-side total (never trusted from the client), within the DB integer range. */
export function checkedLineTotal(quantity: number, unitPrice: number): number {
	const total = lineTotal(quantity, unitPrice);
	if (total > MAX_INT) throw new UserError('Total terlalu besar. Pecah menjadi beberapa catatan.');
	return total;
}

/** Decimal(10,2) string from integer hundredths. */
export function hundredthsToDecimal(h: number): string {
	return (h / 100).toFixed(2);
}

function entryFields(input: ManualEntryInput) {
	return {
		date: fromDateOnly(input.date),
		description: input.description,
		quantity: hundredthsToDecimal(input.quantity),
		unitPrice: input.unitPrice,
		total: checkedLineTotal(input.quantity, input.unitPrice)
	};
}

export async function createManualEntry(
	direction: Direction,
	input: ManualEntryInput,
	receipt: ReceiptChange
): Promise<string> {
	// Receipts belong to expenses only (UC09).
	return withReceipt(direction === 'OUT' ? receipt : undefined, async (stored) => {
		const entry = await db.$transaction(async (tx) => {
			const categoryId = await resolveCategory(tx, direction, input.categoryId, input.categoryName);
			return tx.cashEntry.create({
				data: { ...entryFields(input), direction, source: 'MANUAL', categoryId, ...stored }
			});
		});
		return { result: entry.id, oldPathname: null };
	});
}

async function findManual(tx: Tx, id: string) {
	const existing = await tx.cashEntry.findUnique({ where: { id } });
	if (!existing) throw new UserError('Catatan ini sudah tidak ada. Muat ulang halaman.');
	// Initial capital: no edit/delete until T1. Linked rows: through their source only (R-L4).
	if (existing.source !== 'MANUAL') throw new UserError('Catatan ini tidak bisa diubah di sini.');
	return existing;
}

export async function updateManualEntry(
	id: string,
	input: ManualEntryInput,
	receipt: ReceiptChange
): Promise<void> {
	const direction = (await db.cashEntry.findUnique({ where: { id }, select: { direction: true } }))
		?.direction;
	await withReceipt(direction === 'OUT' ? receipt : undefined, async (stored) => {
		const existing = await db.$transaction(async (tx) => {
			const entry = await findManual(tx, id);
			const categoryId = await resolveCategory(
				tx,
				entry.direction,
				input.categoryId,
				input.categoryName
			);
			await tx.cashEntry.update({
				where: { id },
				data: { ...entryFields(input), categoryId, ...stored }
			});
			return entry;
		});
		return { result: undefined, oldPathname: stored ? existing.receiptPathname : null };
	});
}

export async function deleteManualEntry(id: string): Promise<void> {
	await withReceipt(undefined, async () => {
		const existing = await db.$transaction(async (tx) => {
			const entry = await findManual(tx, id);
			await tx.cashEntry.delete({ where: { id } });
			return entry;
		});
		return { result: undefined, oldPathname: existing.receiptPathname };
	});
}

export async function getReceiptPathname(entryId: string): Promise<string | null> {
	const entry = await db.cashEntry.findUnique({
		where: { id: entryId },
		select: { receiptPathname: true }
	});
	return entry?.receiptPathname ?? null;
}

// ---------------------------------------------------------------------------
// PDF report data (08, PDF report)

export type ReportData = {
	from: string;
	to: string;
	startBalance: number;
	totalIn: number;
	totalOut: number;
	endBalance: number;
	categories: { direction: Direction; label: string; total: number }[];
	rows: CashRow[];
};

export async function getReport(from: string, to: string): Promise<ReportData> {
	const [[start], raw] = await Promise.all([
		db.$queryRaw<{ balance: bigint }[]>`
			SELECT COALESCE(SUM(CASE WHEN direction = 'IN' THEN total ELSE -total END), 0) AS balance
			FROM "CashEntry" WHERE date < ${from}::date`,
		db.$queryRaw<RawCashRow[]>`${BASE_CTE}
			SELECT * FROM base WHERE date >= ${from}::date AND date <= ${to}::date
			ORDER BY date ASC, "createdAt" ASC, id ASC`
	]);
	const rows = raw.map(toCashRow);

	const totals = new Map<string, { direction: Direction; label: string; total: number }>();
	let totalIn = 0;
	let totalOut = 0;
	for (const r of rows) {
		if (r.direction === 'IN') totalIn += r.total;
		else totalOut += r.total;
		const key = `${r.direction}:${r.categoryLabel}`;
		const t = totals.get(key) ?? { direction: r.direction, label: r.categoryLabel, total: 0 };
		t.total += r.total;
		totals.set(key, t);
	}
	const startBalance = Number(start.balance);
	return {
		from,
		to,
		startBalance,
		totalIn,
		totalOut,
		endBalance: startBalance + totalIn - totalOut,
		categories: [...totals.values()].sort((a, b) => b.total - a.total),
		rows
	};
}
