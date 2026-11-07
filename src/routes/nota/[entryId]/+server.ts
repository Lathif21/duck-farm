import { error } from '@sveltejs/kit';
import { readReceipt } from '#lib/server/blob.js';
import { getReceiptPathname } from '#lib/server/cash.js';
import type { RequestHandler } from './$types';

// Serves a receipt from the private Blob store to signed-in users only (hooks guard /nota/*).
export const GET: RequestHandler = async ({ params }) => {
	const pathname = await getReceiptPathname(params.entryId);
	if (!pathname) error(404, 'Nota tidak ditemukan.');
	const file = await readReceipt(pathname);
	if (!file || file.statusCode !== 200 || !file.stream) error(404, 'Nota tidak ditemukan.');
	return new Response(file.stream, {
		headers: {
			'content-type': file.blob.contentType ?? 'application/octet-stream',
			'cache-control': 'private, max-age=3600',
			'x-content-type-options': 'nosniff'
		}
	});
};
