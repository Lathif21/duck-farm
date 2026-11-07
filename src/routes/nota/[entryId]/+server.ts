import { error } from '@sveltejs/kit';
import { readReceipt } from '#lib/server/blob.js';
import { getReceiptPathname } from '#lib/server/cash.js';
import type { RequestHandler } from './$types';

// Serves a receipt from the private bucket to signed-in users only (hooks guard /nota/*).
export const GET: RequestHandler = async ({ params }) => {
	const pathname = await getReceiptPathname(params.entryId);
	if (!pathname) error(404, 'Nota tidak ditemukan.');
	const file = await readReceipt(pathname);
	if (!file) error(404, 'Nota tidak ditemukan.');
	return new Response(file.body, {
		headers: {
			'content-type': file.contentType,
			'cache-control': 'private, max-age=3600',
			'x-content-type-options': 'nosniff'
		}
	});
};
