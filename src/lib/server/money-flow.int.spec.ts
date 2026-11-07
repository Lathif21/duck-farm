// Integration tests against a real Postgres (doc 10). Run with `npm run test:integration`,
// which points DATABASE_URL at TEST_DATABASE_URL. Every table is emptied first.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import {
	createManualEntry,
	deleteManualEntry,
	getReport,
	getSummary,
	listCashEntries,
	updateManualEntry
} from './cash';
import {
	createItem,
	deleteItem,
	deletePurchase,
	listItems,
	recordPurchase,
	updatePurchase
} from './shopping';
import { UserError } from './errors';
import type { TableQuery } from './table-query';

const run = process.env.RUN_INTEGRATION === '1';
const FORCED_FAIL_TOTAL = 4242;

async function resetDb() {
	await db.$executeRawUnsafe(
		`TRUNCATE "CashEntry", "ShoppingPurchase", "ShoppingItem", "WorkSection", "CashCategory",
		 "DuckMovement", "DuckType", "Session", "LoginAttempt", "User" CASCADE`
	);
	await db.$executeRawUnsafe(`ALTER SEQUENCE shopping_item_number_seq RESTART WITH 1`);
	await db.cashEntry.create({
		data: {
			date: new Date('2026-11-01T00:00:00Z'),
			direction: 'IN',
			source: 'INITIAL_CAPITAL',
			description: 'Uang Tunai dari Tante untuk Modal Pembangunan Cold Storage',
			total: 70_000_000
		}
	});
}

const entry = (description: string, unitPrice: number, quantity = 100) => ({
	date: '2026-11-07',
	categoryId: null,
	categoryName: 'Lain-lain',
	description,
	quantity,
	unitPrice
});
const item = (name: string) => ({
	sectionId: null,
	sectionName: '5. Mesin Pendingin',
	name,
	explanation: 'Penjelasan.',
	unit: 'Unit'
});
const purchase = (quantity: number, unitPrice: number, date = '2026-11-07') => ({
	date,
	quantity,
	unitPrice
});
const query = <K extends string>(sort: K): TableQuery<K> => ({
	q: '',
	from: null,
	to: null,
	preset: null,
	sort,
	dir: 'desc',
	page: 1,
	skip: 0,
	take: 20
});

describe.skipIf(!run)('money flow against Postgres', () => {
	beforeAll(async () => {
		// Lets the rollback test make the *second* write of a linked create fail.
		await db.$executeRawUnsafe(`
			CREATE OR REPLACE FUNCTION test_force_cash_fail() RETURNS trigger AS $$
			BEGIN
				IF NEW.total = ${FORCED_FAIL_TOTAL} THEN RAISE EXCEPTION 'forced failure'; END IF;
				RETURN NEW;
			END $$ LANGUAGE plpgsql`);
		await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS test_force_cash_fail ON "CashEntry"`);
		await db.$executeRawUnsafe(`
			CREATE TRIGGER test_force_cash_fail BEFORE INSERT ON "CashEntry"
			FOR EACH ROW EXECUTE FUNCTION test_force_cash_fail()`);
	});
	afterAll(async () => {
		await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS test_force_cash_fail ON "CashEntry"`);
		await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS test_force_cash_fail()`);
		await db.$disconnect();
	});
	beforeEach(resetDb);

	it('UC01: fresh database shows only the initial capital (R-C2, R-C3)', async () => {
		expect(await getSummary()).toEqual({
			balance: 70_000_000,
			otherIncome: 0,
			totalExpense: 0,
			stockGrams: 0,
			stockHeads: 0
		});
	});

	it('summary cards match the doc 10 fixture (R-C2)', async () => {
		await createManualEntry('IN', entry('Tambahan modal keluarga', 10_000_000), undefined);
		await createManualEntry('OUT', entry('Token listrik', 500_000), undefined);
		await createItem(item('Breather Valve'), purchase(200, 450_000), undefined);
		// Duck movements (Phase 2 UI not built yet): written directly with their cash rows.
		const type = await db.duckType.create({ data: { name: 'Bebek M', nameKey: 'bebek m' } });
		for (const [direction, grams, price, total] of [
			['IN', 95_000, 38_000, 3_610_000],
			['OUT', 38_000, 45_000, 1_710_000]
		] as const) {
			const m = await db.duckMovement.create({
				data: {
					duckTypeId: type.id,
					direction,
					date: new Date('2026-11-07T00:00:00Z'),
					partyName: 'Pak Budi',
					heads: direction === 'IN' ? 100 : 40,
					weightGrams: grams,
					pricePerKg: price,
					total
				}
			});
			await db.cashEntry.create({
				data: {
					date: m.date,
					direction: direction === 'IN' ? 'OUT' : 'IN',
					source: 'DUCK',
					total,
					duckMovementId: m.id
				}
			});
		}
		expect(await getSummary()).toEqual({
			balance: 76_700_000,
			otherIncome: 11_710_000,
			totalExpense: 5_010_000,
			stockGrams: 57_000,
			stockHeads: 60
		});
	});

	it('categories are unique per direction, case-insensitive, first spelling kept (R-C5)', async () => {
		await createManualEntry('OUT', { ...entry('A', 1000), categoryName: 'Listrik' }, undefined);
		await createManualEntry('OUT', { ...entry('B', 1000), categoryName: ' listrik ' }, undefined);
		await createManualEntry('IN', { ...entry('C', 1000), categoryName: 'listrik' }, undefined);
		const cats = await db.cashCategory.findMany({ orderBy: { direction: 'asc' } });
		expect(cats.map((c) => [c.direction, c.name])).toEqual([
			['IN', 'listrik'],
			['OUT', 'Listrik']
		]);
	});

	it('manual entry: total computed on the server; edit and delete restore the balance', async () => {
		const id = await createManualEntry('OUT', entry('Semen', 13_000, 250), undefined); // 2,5 × 13.000
		expect((await getSummary()).totalExpense).toBe(32_500);
		await updateManualEntry(id, entry('Semen', 13_000, 300), undefined);
		expect((await getSummary()).balance).toBe(70_000_000 - 39_000);
		await deleteManualEntry(id);
		expect((await getSummary()).balance).toBe(70_000_000);
	});

	it('initial capital cannot be edited or deleted (T1 interim)', async () => {
		const capital = await db.cashEntry.findFirstOrThrow({ where: { source: 'INITIAL_CAPITAL' } });
		await expect(deleteManualEntry(capital.id)).rejects.toBeInstanceOf(UserError);
		await expect(updateManualEntry(capital.id, entry('x', 1), undefined)).rejects.toBeInstanceOf(
			UserError
		);
	});

	it('purchase creates exactly one cash row with the same total and date (R-L1)', async () => {
		await createItem(item('Breather Valve'), null, undefined);
		const [group] = await listItems(query('number'));
		await recordPurchase(group.items[0].id, purchase(200, 450_000), undefined);
		const rows = await db.cashEntry.findMany({ where: { source: 'SHOPPING' } });
		expect(rows).toHaveLength(1);
		expect(rows[0].total).toBe(900_000);
		expect(rows[0].date.toISOString().slice(0, 10)).toBe('2026-11-07');
		expect((await getSummary()).balance).toBe(69_100_000); // UC02
	});

	it('rollback: if the cash insert fails, no purchase is saved (R-L1)', async () => {
		await createItem(item('X'), null, undefined);
		const [group] = await listItems(query('number'));
		await expect(
			recordPurchase(group.items[0].id, purchase(100, FORCED_FAIL_TOTAL), undefined)
		).rejects.toThrow();
		expect(await db.shoppingPurchase.count()).toBe(0);
		expect((await getSummary()).balance).toBe(70_000_000);
	});

	it('editing a purchase changes the balance by the difference only (R-L2)', async () => {
		await createItem(item('Kabel'), purchase(100, 1_000_000), undefined);
		const p = await db.shoppingPurchase.findFirstOrThrow();
		await updatePurchase(p.id, purchase(100, 1_250_000, '2026-11-08'), undefined);
		const cash = await db.cashEntry.findFirstOrThrow({ where: { shoppingPurchaseId: p.id } });
		expect(cash.total).toBe(1_250_000);
		expect(cash.date.toISOString().slice(0, 10)).toBe('2026-11-08');
		expect((await getSummary()).balance).toBe(70_000_000 - 1_250_000);
	});

	it('deleting a purchase removes its cash row and restores the balance exactly (R-L3)', async () => {
		await createItem(item('Kabel'), purchase(200, 1_250_000), undefined);
		const p = await db.shoppingPurchase.findFirstOrThrow();
		await deletePurchase(p.id);
		expect(await db.cashEntry.count({ where: { source: 'SHOPPING' } })).toBe(0);
		expect((await getSummary()).balance).toBe(70_000_000);
		const [group] = await listItems(query('number'));
		expect(group.items[0].purchaseCount).toBe(0); // status back to "Belum Dicatat" (R-SH3)
	});

	it('item numbers are never reused (R-SH2)', async () => {
		const n1 = await createItem(item('A'), null, undefined);
		const n2 = await createItem(item('B'), null, undefined);
		const b = await db.shoppingItem.findUniqueOrThrow({ where: { number: n2 } });
		await deleteItem(b.id);
		const n3 = await createItem(item('C'), null, undefined);
		expect([n1, n2, n3]).toEqual([1, 2, 3]);
	});

	it('an item with purchases cannot be deleted (R-SH6)', async () => {
		const n = await createItem(item('A'), purchase(100, 5_000), undefined);
		const a = await db.shoppingItem.findUniqueOrThrow({ where: { number: n } });
		await expect(deleteItem(a.id)).rejects.toThrow(
			'Barang ini sudah punya catatan pembelian. Hapus dulu catatan pembeliannya.'
		);
	});

	it('sections are created inline as highest + 1 and matched case-insensitively (R-SH7)', async () => {
		await createItem({ ...item('A'), sectionName: 'Pintu' }, null, undefined);
		await createItem({ ...item('B'), sectionName: '2. pintu' }, null, undefined);
		const sections = await db.workSection.findMany();
		expect(sections.map((s) => [s.number, s.name])).toEqual([[1, 'Pintu']]);
	});

	it('history shows source labels, source descriptions and a running balance (R-C6, R-L5, P8)', async () => {
		await createItem(item('Breather Valve'), purchase(200, 450_000), undefined);
		await db.shoppingItem.updateMany({ data: { name: 'Katup Udara' } }); // rename → old rows follow
		const { rows, total } = await listCashEntries(query('date'));
		expect(total).toBe(2);
		const shop = rows.find((r) => r.source === 'SHOPPING')!;
		expect(shop.categoryLabel).toBe('Belanja Pembangunan');
		expect(shop.note).toBe('Katup Udara');
		expect(shop.balance).toBe(69_100_000);
		const capital = rows.find((r) => r.source === 'INITIAL_CAPITAL')!;
		expect(capital.categoryLabel).toBe('Modal Awal');
		expect(capital.balance).toBe(70_000_000);
	});

	it('report totals equal the summary for the same range (T-22)', async () => {
		await createManualEntry('IN', entry('Modal tambahan', 10_000_000), undefined);
		await createManualEntry('OUT', entry('Listrik', 500_000), undefined);
		const r = await getReport('2026-11-01', '2026-11-30');
		const s = await getSummary();
		expect(r.startBalance).toBe(0);
		expect(r.endBalance).toBe(s.balance);
		expect(r.totalOut).toBe(s.totalExpense);
		expect(r.totalIn - 70_000_000).toBe(s.otherIncome);
	});
});
