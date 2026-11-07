import {
	DeleteObjectCommand,
	GetObjectCommand,
	NoSuchKey,
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';
import {
	S3_ACCESS_KEY_ID,
	S3_BUCKET,
	S3_ENDPOINT,
	S3_REGION,
	S3_SECRET_ACCESS_KEY
} from '$app/env/private';
import { todayJakarta } from '#lib/dates.js';
import { UserError } from './errors';

// Receipts (UC09, 08): JPG/PNG/WebP/PDF, max 4 MB, one per entry, stored in a private
// Neon Object Storage bucket (S3 API) and served only to signed-in users through /nota/[entryId].
// The object key is saved in CashEntry.receiptPathname.

const MAX_BYTES = 4 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'application/pdf': 'pdf'
};

const s3 =
	S3_ENDPOINT && S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY
		? new S3Client({
				endpoint: S3_ENDPOINT,
				region: S3_REGION ?? 'us-east-2',
				credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
				forcePathStyle: true // Neon requires path-style addressing
			})
		: null;

export type StoredReceipt = { receiptPathname: string };

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
	if (!s3) throw new UserError('Penyimpanan nota belum disiapkan. Simpan tanpa nota dulu.');
	const [yyyy, mm] = todayJakarta().split('-');
	const key = `receipts/${yyyy}/${mm}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
	await s3.send(
		new PutObjectCommand({
			Bucket: S3_BUCKET,
			Key: key,
			Body: new Uint8Array(await file.arrayBuffer()),
			ContentType: file.type
		})
	);
	return { receiptPathname: key };
}

export async function deleteReceipt(key: string | null | undefined): Promise<void> {
	if (!key || !s3) return;
	try {
		await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
	} catch (err) {
		// The DB is already correct; an orphaned file is harmless. Log and move on.
		console.error('Failed to delete receipt object', key, err);
	}
}

/** The receipt's bytes as a stream, or null when storage is not set up or the object is gone. */
export async function readReceipt(
	key: string
): Promise<{ body: ReadableStream; contentType: string } | null> {
	if (!s3) return null;
	try {
		const res = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
		if (!res.Body) return null;
		return {
			body: res.Body.transformToWebStream(),
			contentType: res.ContentType ?? 'application/octet-stream'
		};
	} catch (err) {
		if (err instanceof NoSuchKey) return null;
		throw err;
	}
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
		receipt: StoredReceipt | { receiptPathname: null } | undefined
	) => Promise<{ result: T; oldPathname: string | null }>
): Promise<T> {
	const uploaded = change ? await upload(change) : undefined;
	const receipt = uploaded ?? (change === null ? { receiptPathname: null } : undefined);

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
