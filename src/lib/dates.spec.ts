import { describe, expect, it } from 'vitest';
import { formatDate, isDateOnly, presetRange, toDateOnly, todayJakarta } from './dates';

describe('dates (R-F3)', () => {
	it('formats business dates as "7 Nov 2026"', () => {
		expect(formatDate(new Date('2026-11-07T00:00:00Z'))).toBe('7 Nov 2026');
		expect(formatDate('2026-05-07')).toBe('7 Mei 2026');
	});

	it('computes today in Asia/Jakarta (UTC+7)', () => {
		// 18:30 UTC on 6 Nov is 01:30 on 7 Nov in Jakarta
		expect(todayJakarta(new Date('2026-11-06T18:30:00Z'))).toBe('2026-11-07');
		expect(todayJakarta(new Date('2026-11-06T16:59:00Z'))).toBe('2026-11-06');
	});

	it('round-trips date-only values', () => {
		expect(toDateOnly(new Date('2026-11-07T00:00:00Z'))).toBe('2026-11-07');
		expect(isDateOnly('2026-11-07')).toBe(true);
		expect(isDateOnly('2026-02-30')).toBe(false);
		expect(isDateOnly('7/11/2026')).toBe(false);
	});

	it('resolves date presets (R-T2)', () => {
		const now = new Date('2026-11-07T05:00:00Z');
		expect(presetRange('today', now)).toEqual({ from: '2026-11-07', to: '2026-11-07' });
		expect(presetRange('7d', now)).toEqual({ from: '2026-11-01', to: '2026-11-07' });
		expect(presetRange('30d', now)).toEqual({ from: '2026-10-09', to: '2026-11-07' });
		expect(presetRange('month', now)).toEqual({ from: '2026-11-01', to: '2026-11-07' });
	});
});
