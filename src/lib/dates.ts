// Business dates are date-only values ("YYYY-MM-DD"). In the DB they are `@db.Date`,
// which Prisma returns as a Date at UTC midnight, so they are formatted in UTC.
// "Today" is always Asia/Jakarta (R-F3).

const TZ = 'Asia/Jakarta';

const dateFormat = new Intl.DateTimeFormat('id-ID', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'UTC'
});
const dateTimeFormat = new Intl.DateTimeFormat('id-ID', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	timeZone: TZ
});
const isoInJakarta = new Intl.DateTimeFormat('en-CA', {
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	timeZone: TZ
});

/** "2026-11-07" for the current day in Jakarta. */
export function todayJakarta(now: Date = new Date()): string {
	return isoInJakarta.format(now);
}

export function isDateOnly(s: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
	const d = new Date(`${s}T00:00:00Z`);
	return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

/** "2026-11-07" → Date at UTC midnight, the value Prisma expects for `@db.Date`. */
export function fromDateOnly(s: string): Date {
	return new Date(`${s}T00:00:00Z`);
}

export function toDateOnly(d: Date): string {
	return d.toISOString().slice(0, 10);
}

/** "7 Nov 2026" */
export function formatDate(d: Date | string): string {
	return dateFormat.format(typeof d === 'string' ? fromDateOnly(d) : d);
}

/** "7 Nov 2026, 16.48" in Jakarta time, for timestamps (e.g. report printed at). */
export function formatDateTime(d: Date): string {
	return dateTimeFormat.format(d);
}

function addDays(s: string, days: number): string {
	const d = fromDateOnly(s);
	d.setUTCDate(d.getUTCDate() + days);
	return toDateOnly(d);
}

export const DATE_PRESETS = ['today', '7d', '30d', 'month'] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

/** Resolves a preset to an inclusive from/to range in Jakarta time (R-T2). */
export function presetRange(
	preset: DatePreset,
	now: Date = new Date()
): { from: string; to: string } {
	const to = todayJakarta(now);
	switch (preset) {
		case 'today':
			return { from: to, to };
		case '7d':
			return { from: addDays(to, -6), to };
		case '30d':
			return { from: addDays(to, -29), to };
		case 'month':
			return { from: `${to.slice(0, 8)}01`, to };
	}
}
