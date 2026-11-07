import { fromDateOnly, toDateOnly } from '#lib/dates.js';
import { db, nameKey, type Tx } from './db';
import { UserError } from './errors';
import { withReceipt, type ReceiptChange, type StoredReceipt } from './blob';
import { checkedLineTotal, hundredthsToDecimal } from './cash';
import type { Prisma } from './generated/prisma/client';
import type { TableQuery } from './table-query';

// Daftar Belanja Bangunan (R-SH*). Purchases and their cash rows move together (R-L1–R-L3).

const ITEM_SORT_KEYS = ['number', 'name', 'status'] as const;
export type ItemSortKey = (typeof ITEM_SORT_KEYS)[number];
export { ITEM_SORT_KEYS };

export type ItemCard = {
	id: string;
	number: number;
	name: string;
	explanation: string;
	unit: string;
	sectionId: string;
	purchaseCount: number;
	lastPurchase: { id: string; date: string; total: number } | null;
};

export type SectionGroup = { id: string; number: number; name: string; items: ItemCard[] };

/** Items grouped by work section, with search and sort (R-T6). */
export async function listItems(t: TableQuery<ItemSortKey>): Promise<SectionGroup[]> {
	const where: Prisma.ShoppingItemWhereInput = t.q
		? {
				OR: [
					{ name: { contains: t.q, mode: 'insensitive' } },
					{ explanation: { contains: t.q, mode: 'insensitive' } },
					{ section: { name: { contains: t.q, mode: 'insensitive' } } }
				]
			}
		: {};
	const items = await db.shoppingItem.findMany({
		where,
		include: {
			section: true,
			_count: { select: { purchases: true } },
			purchases: { orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], take: 1 }
		},
		orderBy: t.sort === 'name' ? { name: t.dir } : { number: t.dir }
	});
	if (t.sort === 'status') {
		// "Belum Dicatat" first when ascending (R-SH3)
		items.sort((a, b) => (a._count.purchases > 0 ? 1 : 0) - (b._count.purchases > 0 ? 1 : 0));
		if (t.dir === 'desc') items.reverse();
	}

	const groups = new Map<string, SectionGroup>();
	for (const it of items) {
		const g = groups.get(it.sectionId) ?? {
			id: it.section.id,
			number: it.section.number,
			name: it.section.name,
			items: []
		};
		const last = it.purchases[0];
		g.items.push({
			id: it.id,
			number: it.number,
			name: it.name,
			explanation: it.explanation,
			unit: it.unit,
			sectionId: it.sectionId,
			purchaseCount: it._count.purchases,
			lastPurchase: last ? { id: last.id, date: toDateOnly(last.date), total: last.total } : null
		});
		groups.set(it.sectionId, g);
	}
	return [...groups.values()].sort((a, b) => a.number - b.number);
}

export async function listSections() {
	const sections = await db.workSection.findMany({ orderBy: { number: 'asc' } });
	return sections.map((s) => ({ id: s.id, name: `${s.number}. ${s.name}` }));
}

/** Picks a section or creates one numbered highest + 1 (R-SH7). Accepts "4. Panel ..." too. */
async function resolveSection(tx: Tx, sectionId: string | null, sectionName: string | null) {
	if (sectionId) {
		const found = await tx.workSection.findUnique({ where: { id: sectionId } });
		if (found) return found.id;
	}
	const name = sectionName
		?.trim()
		.replace(/^\d+\.\s*/, '')
		.replace(/\s+/g, ' ');
	if (!name) throw new UserError('Pilih atau tulis Bagian Pekerjaan.');
	const existing = await tx.workSection.findUnique({ where: { nameKey: nameKey(name) } });
	if (existing) return existing.id;
	const max = await tx.workSection.aggregate({ _max: { number: true } });
	const created = await tx.workSection.create({
		data: { name, nameKey: nameKey(name), number: (max._max.number ?? 0) + 1 }
	});
	return created.id;
}

// ---------------------------------------------------------------------------
// Purchases (linked to the cash book)

export type PurchaseInput = { date: string; quantity: number; unitPrice: number };

type ReceiptFields = StoredReceipt | { receiptUrl: null; receiptPathname: null } | undefined;

/** R-L1: purchase + its cash row, inside the caller's transaction. */
async function createPurchaseTx(tx: Tx, itemId: string, p: PurchaseInput, receipt: ReceiptFields) {
	const total = checkedLineTotal(p.quantity, p.unitPrice);
	const purchase = await tx.shoppingPurchase.create({
		data: {
			itemId,
			date: fromDateOnly(p.date),
			quantity: hundredthsToDecimal(p.quantity),
			unitPrice: p.unitPrice,
			total
		}
	});
	await tx.cashEntry.create({
		data: {
			date: purchase.date,
			direction: 'OUT',
			source: 'SHOPPING',
			total,
			shoppingPurchaseId: purchase.id,
			...receipt
		}
	});
	return purchase;
}

export async function recordPurchase(
	itemId: string,
	p: PurchaseInput,
	receipt: ReceiptChange
): Promise<void> {
	await withReceipt(receipt, async (stored) => {
		await db.$transaction(async (tx) => {
			const item = await tx.shoppingItem.findUnique({ where: { id: itemId } });
			if (!item) throw new UserError('Barang ini sudah tidak ada. Muat ulang halaman.');
			await createPurchaseTx(tx, itemId, p, stored);
		});
		return { result: undefined, oldPathname: null };
	});
}

/** R-L2: edits the purchase and its cash row (date, total, receipt) together. */
export async function updatePurchase(
	purchaseId: string,
	p: PurchaseInput,
	receipt: ReceiptChange
): Promise<void> {
	await withReceipt(receipt, async (stored) => {
		const oldPathname = await db.$transaction(async (tx) => {
			const existing = await tx.shoppingPurchase.findUnique({
				where: { id: purchaseId },
				include: { cashEntry: true }
			});
			if (!existing?.cashEntry)
				throw new UserError('Catatan ini sudah tidak ada. Muat ulang halaman.');
			const total = checkedLineTotal(p.quantity, p.unitPrice);
			const date = fromDateOnly(p.date);
			await tx.shoppingPurchase.update({
				where: { id: purchaseId },
				data: { date, quantity: hundredthsToDecimal(p.quantity), unitPrice: p.unitPrice, total }
			});
			await tx.cashEntry.update({
				where: { id: existing.cashEntry.id },
				data: { date, total, ...stored }
			});
			return stored ? existing.cashEntry.receiptPathname : null;
		});
		return { result: undefined, oldPathname };
	});
}

/** R-L3: deletes the purchase and its cash row; the receipt file goes after commit. */
export async function deletePurchase(purchaseId: string): Promise<void> {
	await withReceipt(undefined, async () => {
		const oldPathname = await db.$transaction(async (tx) => {
			const existing = await tx.shoppingPurchase.findUnique({
				where: { id: purchaseId },
				include: { cashEntry: true }
			});
			if (!existing) throw new UserError('Catatan ini sudah tidak ada. Muat ulang halaman.');
			await tx.cashEntry.deleteMany({ where: { shoppingPurchaseId: purchaseId } });
			await tx.shoppingPurchase.delete({ where: { id: purchaseId } });
			return existing.cashEntry?.receiptPathname ?? null;
		});
		return { result: undefined, oldPathname };
	});
}

// ---------------------------------------------------------------------------
// Items

export type ItemInput = {
	sectionId: string | null;
	sectionName: string | null;
	name: string;
	explanation: string;
	unit: string;
};

/** UC03: adds an item (next number, never reused, R-SH2), optionally with its first purchase. */
export async function createItem(
	input: ItemInput,
	purchase: PurchaseInput | null,
	receipt: ReceiptChange
): Promise<number> {
	return withReceipt(purchase ? receipt : undefined, async (stored) => {
		const item = await db.$transaction(async (tx) => {
			const sectionId = await resolveSection(tx, input.sectionId, input.sectionName);
			const [{ n }] = await tx.$queryRaw<
				{ n: bigint }[]
			>`SELECT nextval('shopping_item_number_seq') AS n`;
			const created = await tx.shoppingItem.create({
				data: {
					number: Number(n),
					name: input.name,
					explanation: input.explanation,
					unit: input.unit,
					sectionId
				}
			});
			if (purchase) await createPurchaseTx(tx, created.id, purchase, stored);
			return created;
		});
		return { result: item.number, oldPathname: null };
	});
}

export async function updateItem(id: string, input: ItemInput): Promise<void> {
	await db.$transaction(async (tx) => {
		const sectionId = await resolveSection(tx, input.sectionId, input.sectionName);
		await tx.shoppingItem.update({
			where: { id },
			data: { name: input.name, explanation: input.explanation, unit: input.unit, sectionId }
		});
	});
}

/** R-SH6: an item with purchases can't be deleted until its purchases are deleted. */
export async function deleteItem(id: string): Promise<void> {
	await db.$transaction(async (tx) => {
		const count = await tx.shoppingPurchase.count({ where: { itemId: id } });
		if (count > 0) {
			throw new UserError(
				'Barang ini sudah punya catatan pembelian. Hapus dulu catatan pembeliannya.'
			);
		}
		await tx.shoppingItem.deleteMany({ where: { id } });
	});
}

// ---------------------------------------------------------------------------
// Item detail + purchase history

export const PURCHASE_SORT_KEYS = ['date', 'quantity', 'unitPrice', 'total', 'receipt'] as const;
export type PurchaseSortKey = (typeof PURCHASE_SORT_KEYS)[number];

export async function getItem(id: string) {
	const item = await db.shoppingItem.findUnique({ where: { id }, include: { section: true } });
	if (!item) return null;
	return {
		id: item.id,
		number: item.number,
		name: item.name,
		explanation: item.explanation,
		unit: item.unit,
		sectionId: item.sectionId,
		sectionName: `${item.section.number}. ${item.section.name}`
	};
}

export type PurchaseRow = {
	id: string;
	date: string;
	quantity: number; // hundredths
	unitPrice: number;
	total: number;
	cashEntryId: string | null;
	hasReceipt: boolean;
};

export async function listPurchases(itemId: string, t: TableQuery<PurchaseSortKey>) {
	const where: Prisma.ShoppingPurchaseWhereInput = {
		itemId,
		date: {
			...(t.from ? { gte: fromDateOnly(t.from) } : {}),
			...(t.to ? { lte: fromDateOnly(t.to) } : {})
		}
	};
	const orderBy: Prisma.ShoppingPurchaseOrderByWithRelationInput =
		t.sort === 'receipt'
			? { cashEntry: { receiptPathname: { sort: t.dir, nulls: 'last' } } }
			: { [t.sort]: t.dir };
	const [rows, total] = await Promise.all([
		db.shoppingPurchase.findMany({
			where,
			include: { cashEntry: { select: { id: true, receiptPathname: true } } },
			orderBy: [orderBy, { createdAt: 'desc' }],
			skip: t.skip,
			take: t.take
		}),
		db.shoppingPurchase.count({ where })
	]);
	return {
		total,
		rows: rows.map((r): PurchaseRow => ({
			id: r.id,
			date: toDateOnly(r.date),
			quantity: Math.round(Number(r.quantity) * 100),
			unitPrice: r.unitPrice,
			total: r.total,
			cashEntryId: r.cashEntry?.id ?? null,
			hasReceipt: !!r.cashEntry?.receiptPathname
		}))
	};
}

export async function getPurchase(id: string) {
	const p = await db.shoppingPurchase.findUnique({
		where: { id },
		include: { cashEntry: { select: { id: true, receiptPathname: true } } }
	});
	if (!p) return null;
	return {
		id: p.id,
		itemId: p.itemId,
		date: toDateOnly(p.date),
		quantity: Math.round(Number(p.quantity) * 100),
		unitPrice: p.unitPrice,
		total: p.total,
		cashEntryId: p.cashEntry?.id ?? null,
		hasReceipt: !!p.cashEntry?.receiptPathname
	};
}
