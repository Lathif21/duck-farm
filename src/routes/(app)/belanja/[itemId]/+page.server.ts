import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { readReceiptChange } from '#lib/server/blob.js';
import { parseForm, runMutation, zDate, zMoney, zQuantity } from '#lib/server/forms.js';
import {
	PURCHASE_SORT_KEYS,
	deletePurchase,
	getItem,
	getPurchase,
	listPurchases,
	updatePurchase
} from '#lib/server/shopping.js';
import { parseTableQuery } from '#lib/server/table-query.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const item = await getItem(params.itemId);
	if (!item) error(404, 'Barang tidak ditemukan.');

	// Purchase history filters by purchase date (R-T6).
	const query = parseTableQuery(url, {
		sortKeys: PURCHASE_SORT_KEYS,
		defaultSort: 'date',
		defaultDir: 'desc',
		dateFilter: true
	});
	const editId = url.searchParams.get('edit');
	const [table, editing] = await Promise.all([
		listPurchases(item.id, query),
		editId ? getPurchase(editId) : null
	]);
	return { item, table, editing: editing?.itemId === item.id ? editing : null };
};

const purchaseSchema = z.object({ date: zDate, quantity: zQuantity, unitPrice: zMoney });

export const actions: Actions = {
	/** R-L2: edit purchase + its cash row together. */
	updatePurchase: async ({ request }) => {
		const form = await request.formData();
		const parsed = parseForm(purchaseSchema, form);
		if (parsed.failure) return parsed.failure;
		return runMutation(form, () =>
			updatePurchase(String(form.get('id')), parsed.data, readReceiptChange(form))
		);
	},

	/** R-L3: delete purchase + its cash row together. */
	delete: async ({ request }) => {
		const form = await request.formData();
		return runMutation(form, () => deletePurchase(String(form.get('id'))));
	}
};
