import { z } from 'zod';
import { todayJakarta } from '#lib/dates.js';
import { readReceiptChange } from '#lib/server/blob.js';
import {
	parseForm,
	runMutation,
	zDate,
	zMoney,
	zOptionalText,
	zQuantity,
	zText
} from '#lib/server/forms.js';
import {
	ITEM_SORT_KEYS,
	createItem,
	deleteItem,
	listItems,
	listSections,
	recordPurchase,
	updateItem
} from '#lib/server/shopping.js';
import { parseTableQuery } from '#lib/server/table-query.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Item list: search + sort only, no date filter (R-T6).
	const query = parseTableQuery(url, {
		sortKeys: ITEM_SORT_KEYS,
		defaultSort: 'number',
		defaultDir: 'asc',
		dateFilter: false
	});
	const [groups, sections] = await Promise.all([listItems(query), listSections()]);
	return { groups, sections, today: todayJakarta() };
};

const purchaseSchema = z.object({ date: zDate, quantity: zQuantity, unitPrice: zMoney });

const itemSchema = z.object({
	sectionId: zOptionalText,
	sectionName: zOptionalText,
	name: zText('Nama Barang', 200),
	explanation: zText('Penjelasan Kegunaan', 2000),
	unit: zText('Satuan', 30)
});

export const actions: Actions = {
	/** UC02: record a purchase of a listed item → cash book (R-L1). */
	purchase: async ({ request }) => {
		const form = await request.formData();
		const parsed = parseForm(purchaseSchema, form);
		if (parsed.failure) return parsed.failure;
		return runMutation(form, () =>
			recordPurchase(String(form.get('itemId')), parsed.data, readReceiptChange(form))
		);
	},

	/** UC03: add an item, with its first purchase ("Tambahkan & Catat") or without ("ke Daftar Saja"). */
	addItem: async ({ request }) => {
		const form = await request.formData();
		const withPurchase = form.get('withPurchase') === '1';
		const schema = withPurchase ? itemSchema.extend(purchaseSchema.shape) : itemSchema;
		const parsed = parseForm(schema, form);
		if (parsed.failure) return parsed.failure;
		const d = parsed.data as z.output<typeof itemSchema> & Partial<z.output<typeof purchaseSchema>>;
		const purchase =
			withPurchase && d.date && d.quantity && d.unitPrice
				? { date: d.date, quantity: d.quantity, unitPrice: d.unitPrice }
				: null;
		return runMutation(form, async () => ({
			number: await createItem(d, purchase, readReceiptChange(form))
		}));
	},

	updateItem: async ({ request }) => {
		const form = await request.formData();
		const parsed = parseForm(itemSchema, form);
		if (parsed.failure) return parsed.failure;
		return runMutation(form, () => updateItem(String(form.get('id')), parsed.data));
	},

	/** R-SH6: blocked when the item has purchases. */
	deleteItem: async ({ request }) => {
		const form = await request.formData();
		return runMutation(form, () => deleteItem(String(form.get('id'))));
	}
};
