import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { isDateOnly } from '#lib/dates.js';
import { parseQuantity, parseRupiah } from '#lib/money.js';
import { SAVE_FAILED, UserError } from './errors';

// Form-action helpers: zod parsing with Indonesian messages, and one error path for every action.

export type FormFailure = {
	message?: string;
	errors?: Record<string, string>;
	values?: Record<string, string>;
};

export const zDate = z
	.string({ error: 'Isi tanggal.' })
	.refine(isDateOnly, { message: 'Tanggal tidak valid.' });

export const zText = (label: string, max = 500) =>
	z
		.string({ error: `Isi ${label}.` })
		.transform((s) => s.trim())
		.pipe(z.string().min(1, `Isi ${label}.`).max(max, `${label} terlalu panjang.`));

export const zOptionalText = z
	.string()
	.optional()
	.transform((s) => s?.trim() || null);

/** Money field: "1.500.000" → 1500000, must be > 0 (R-C7). */
export const zMoney = z.string({ error: 'Isi harga.' }).transform((s, ctx) => {
	const n = parseRupiah(s);
	if (n === null || n <= 0) {
		ctx.addIssue({ code: 'custom', message: 'Isi harga lebih dari 0, tanpa koma.' });
		return z.NEVER;
	}
	return n;
});

/** Quantity field: "2,5" → 250 hundredths, must be > 0 (R-C7, R-SH5). */
export const zQuantity = z.string({ error: 'Isi jumlah.' }).transform((s, ctx) => {
	const n = parseQuantity(s);
	if (n === null) {
		ctx.addIssue({
			code: 'custom',
			message: 'Isi jumlah lebih dari 0 (maks. 2 angka di belakang koma).'
		});
		return z.NEVER;
	}
	return n;
});

function textValues(form: FormData): Record<string, string> {
	const values: Record<string, string> = {};
	for (const [k, v] of form) if (typeof v === 'string') values[k] = v;
	return values;
}

/** Parses form fields with a zod object schema; returns data or an ActionFailure with field errors. */
export function parseForm<T extends z.ZodType>(schema: T, form: FormData) {
	const values = textValues(form);
	const result = schema.safeParse(values);
	if (result.success) return { data: result.data as z.output<T> };
	const errors: Record<string, string> = {};
	for (const issue of result.error.issues) {
		const key = String(issue.path[0] ?? 'form');
		errors[key] ??= issue.message;
	}
	return { failure: fail(400, { errors, values } satisfies FormFailure) };
}

/**
 * Runs a mutation. UserError → 400 with its Indonesian message; anything else is logged and
 * becomes the generic "Gagal menyimpan" message. Typed values come back so nothing is lost.
 */
export async function runMutation<T>(form: FormData, fn: () => Promise<T>) {
	try {
		return { ok: true as const, result: await fn() };
	} catch (err) {
		const values = textValues(form);
		if (err instanceof UserError)
			return fail(400, { message: err.message, values } satisfies FormFailure);
		console.error(err);
		return fail(500, { message: SAVE_FAILED, values } satisfies FormFailure);
	}
}
