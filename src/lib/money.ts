// Shared by client previews and server writes, so both compute the same totals.
// Money is integer rupiah; weight is integer grams; shopping quantities are integer hundredths.

export type Direction = 'IN' | 'OUT';

/** Largest value a Postgres `integer` column holds. */
export const MAX_INT = 2_147_483_647;

const dots = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const kgFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 });
const plainDecimal = new Intl.NumberFormat('id-ID', {
	maximumFractionDigits: 3,
	useGrouping: false
});

/** "Rp 1.500.000", "1.500.000", "1500000" → 1500000. Commas are rejected (R-F1). */
export function parseRupiah(input: string): number | null {
	const s = input.trim().replace(/^rp\s*/i, '');
	if (!/^\d{1,3}(\.\d{3})*$|^\d+$/.test(s)) return null;
	const n = Number(s.replaceAll('.', ''));
	return Number.isSafeInteger(n) ? n : null;
}

export function formatDots(n: number): string {
	return dots.format(n);
}

export function formatRupiah(n: number): string {
	return `Rp ${dots.format(n)}`;
}

/** Income "+ Rp …", expense "− Rp …" (R-F4: never color alone). */
export function formatSignedRupiah(n: number, direction: Direction): string {
	return `${direction === 'IN' ? '+' : '−'} ${formatRupiah(n)}`;
}

/**
 * Parses a decimal typed with "," or "." into an integer of `10^places` units.
 * Returns null for empty, zero, negative, or too many decimals.
 */
function parseFixed(input: string, places: number, scale: number): number | null {
	const s = input.trim();
	const m = new RegExp(`^(\\d+)(?:[.,](\\d{1,${places}}))?$`).exec(s);
	if (!m) return null;
	const whole = Number(m[1]);
	const frac = Number((m[2] ?? '').padEnd(Math.log10(scale), '0') || '0');
	const n = whole * scale + frac;
	return n > 0 && Number.isSafeInteger(n) ? n : null;
}

/** "95,5" or "95.5" kg → 95500 grams; up to 2 decimals (R-S1, R-F2). */
export function parseKgToGrams(input: string): number | null {
	return parseFixed(input, 2, 1000);
}

/** "2,5" → 250 hundredths (Decimal(10,2), R-SH5). */
export function parseQuantity(input: string): number | null {
	return parseFixed(input, 2, 100);
}

/** 95500 → "95,5 Kg" */
export function formatKg(grams: number): string {
	return `${kgFormat.format(grams / 1000)} Kg`;
}

/** 95500 → "95,5" for prefilling a kg input. */
export function gramsToKgInput(grams: number): string {
	return plainDecimal.format(grams / 1000);
}

/** 250 hundredths → "2,5" for display and prefilling inputs. */
export function quantityToInput(hundredths: number): string {
	return plainDecimal.format(hundredths / 100);
}

/** round(a × b / divisor), half up, exact for positive integers of any size. */
function mulDivRound(a: number, b: number, divisor: number): number {
	const d = BigInt(divisor);
	return Number((BigInt(a) * BigInt(b) * 2n + d) / (2n * d));
}

/** total = round(quantity × unitPrice); quantity in hundredths. */
export function lineTotal(quantityHundredths: number, unitPrice: number): number {
	return mulDivRound(quantityHundredths, unitPrice, 100);
}

/** total = round(weightGrams × pricePerKg / 1000) (R-S1). */
export function duckTotal(weightGrams: number, pricePerKg: number): number {
	return mulDivRound(weightGrams, pricePerKg, 1000);
}

/**
 * Live formatting for money inputs (R-F1): keeps digits only, inserts dots, and returns
 * where the caret goes so it stays after the same digit the user was typing at.
 */
export function formatMoneyTyping(raw: string, caret: number): { text: string; caret: number } {
	const allDigits = raw.replace(/\D/g, '');
	const digits = allDigits.replace(/^0+/, '');
	const stripped = allDigits.length - digits.length;
	const digitsBefore = Math.max(0, raw.slice(0, caret).replace(/\D/g, '').length - stripped);
	const text = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	let pos = 0;
	for (let seen = 0; pos < text.length && seen < digitsBefore; pos++) {
		if (text[pos] !== '.') seen++;
	}
	return { text, caret: pos };
}
