import { z } from 'zod';
import { todayJakarta } from '#lib/dates.js';
import { readReceiptChange } from '#lib/server/blob.js';
import {
	CASH_SORT_KEYS,
	createManualEntry,
	deleteManualEntry,
	listCashEntries,
	listCategories,
	updateManualEntry
} from '#lib/server/cash.js';
import {
	parseForm,
	runMutation,
	zDate,
	zMoney,
	zOptionalText,
	zQuantity,
	zText
} from '#lib/server/forms.js';
import { parseTableQuery } from '#lib/server/table-query.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const query = parseTableQuery(url, {
		sortKeys: CASH_SORT_KEYS,
		defaultSort: 'date',
		defaultDir: 'desc',
		dateFilter: true
	});
	const [table, incomeCategories, expenseCategories] = await Promise.all([
		listCashEntries(query),
		listCategories('IN'),
		listCategories('OUT')
	]);
	return { table, incomeCategories, expenseCategories, today: todayJakarta() };
};

// R-C4: date, category, description, quantity, unit price; total is computed on the server.
const entrySchema = z.object({
	date: zDate,
	categoryId: zOptionalText,
	categoryName: zOptionalText,
	description: zText('Nama Barang / Catatan'),
	quantity: zQuantity,
	unitPrice: zMoney
});

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const direction = z.enum(['IN', 'OUT']).safeParse(form.get('direction'));
		const parsed = parseForm(entrySchema, form);
		if (parsed.failure) return parsed.failure;
		return runMutation(form, async () => {
			if (!direction.success) throw new Error('Missing direction');
			await createManualEntry(direction.data, parsed.data, readReceiptChange(form));
		});
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const parsed = parseForm(entrySchema, form);
		if (parsed.failure) return parsed.failure;
		return runMutation(form, () =>
			updateManualEntry(String(form.get('id')), parsed.data, readReceiptChange(form))
		);
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		return runMutation(form, () => deleteManualEntry(String(form.get('id'))));
	}
};
