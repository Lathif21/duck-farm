import { del, get, put } from '@vercel/blob';
import { BLOB_READ_WRITE_TOKEN } from '$app/env/private';
import { todayJakarta } from '#lib/dates.js';
import { UserError } from './errors';

// Receipts (UC09, 08): JPG/PNG/WebP/PDF, max 4 MB, one per entry, stored in a private
// Vercel Blob store and served only to signed-in users through /nota/[entryId].

const MAX_BYTES = 4 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'application/pdf': 'pdf'
};

export type StoredReceipt = { receiptUrl: string; receiptPathname: string };

/**
 * What the form asked for: `undefined` keeps the current receipt, `null` removes it,
 * a File replaces it.
 */
export type ReceiptChange = File | null | undefined;

/** Reads the `receipt` (file) and `removeReceipt` ("1") fields. Throws UserError on a bad file. */
export function readReceiptChange(form: FormData): ReceiptChange {
	const file = form.get('receipt');
	if (file instanceof File && file.size > 0) {
		if (!EXTENSIONS[file.type])
			throw new UserError('Nota harus berupa foto (JPG, PNG, WebP) atau PDF.');
		if (file.size > MAX_BYTES) throw new UserError('File terlalu besar (maks. 4 MB).');
		return file;
	}
	return form.get('removeReceipt') === '1' ? null : undefined;
}

async function upload(file: File): Promise<StoredReceipt> {
	if (!BLOB_READ_WRITE_TOKEN) {
		throw new UserError('Penyimpanan nota belum disiapkan. Simpan tanpa nota dulu.');
	}
	const [yyyy, mm] = todayJakarta().split('-');
	const blob = await put(`receipts/${yyyy}/${mm}/nota.${EXTENSIONS[file.type]}`, file, {
		access: 'private',
		addRandomSuffix: true,
		contentType: file.type,
		token: BLOB_READ_WRITE_TOKEN
	});
	return { receiptUrl: blob.url, receiptPathname: blob.pathname };
}

export async function deleteReceipt(pathname: string | null | undefined): Promise<void> {
	if (!pathname || !BLOB_READ_WRITE_TOKEN) return;
	try {
		await del(pathname, { token: BLOB_READ_WRITE_TOKEN });
	} catch (err) {
		// The DB is already correct; an orphaned file is harmless. Log and move on.
		console.error('Failed to delete receipt blob', pathname, err);
	}
}

export async function readReceipt(pathname: string) {
	if (!BLOB_READ_WRITE_TOKEN) return null;
	return get(pathname, { access: 'private', token: BLOB_READ_WRITE_TOKEN });
}

/**
 * Receipt-safe write path (skill linked-cash-transaction, steps 3, 5, 6):
 * 1. upload the new file first,
 * 2. run the DB transaction with the new receipt fields (`undefined` = unchanged, `null` = cleared),
 * 3. if the transaction fails, delete the just-uploaded file,
 * 4. after commit, delete the file the transaction replaced or removed.
 */
export async function withReceipt<T>(
	change: ReceiptChange,
	run: (
		receipt: StoredReceipt | { receiptUrl: null; receiptPathname: null } | undefined
	) => Promise<{ result: T; oldPathname: string | null }>
): Promise<T> {
	const uploaded = change ? await upload(change) : undefined;
	const receipt =
		uploaded ?? (change === null ? { receiptUrl: null, receiptPathname: null } : undefined);

	let outcome: { result: T; oldPathname: string | null };
	try {
		outcome = await run(receipt);
	} catch (err) {
		if (uploaded) await deleteReceipt(uploaded.receiptPathname);
		throw err;
	}
	await deleteReceipt(outcome.oldPathname);
	return outcome.result;
}
