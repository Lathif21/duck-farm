import { describe, expect, it } from 'vitest';
import { PAGE_SIZE, parseTableQuery } from './table-query';

const config = {
	sortKeys: ['date', 'category', 'in'] as const,
	defaultSort: 'date' as const,
	defaultDir: 'desc' as const,
	dateFilter: true
};
const now = new Date('2026-11-07T05:00:00Z');
const parse = (qs: string, c = config) => parseTableQuery(new URL(`http://x/kas?${qs}`), c, now);

describe('parseTableQuery (R-T1–R-T5)', () => {
	it('defaults: no filters, default sort, page 1 (R-T3)', () => {
		expect(parse('')).toEqual({
			q: '',
			from: null,
			to: null,
			preset: null,
			sort: 'date',
			dir: 'desc',
			page: 1,
			skip: 0,
			take: PAGE_SIZE
		});
	});

	it('reads search, sort and page (R-T1, R-T4)', () => {
		const t = parse('q=%20listrik%20&sort=category&dir=asc&page=3');
		expect(t).toMatchObject({ q: 'listrik', sort: 'category', dir: 'asc', page: 3, skip: 40 });
	});

	it('falls back on unknown sort keys and bad pages', () => {
		expect(parse('sort=hack&dir=sideways&page=-4')).toMatchObject({
			sort: 'date',
			dir: 'desc',
			page: 1
		});
		expect(parse('page=abc').page).toBe(1);
	});

	it('resolves presets on the server in Jakarta time (R-T2)', () => {
		expect(parse('preset=7d')).toMatchObject({
			preset: '7d',
			from: '2026-11-01',
			to: '2026-11-07'
		});
	});

	it('accepts a valid custom range and drops invalid dates', () => {
		expect(parse('from=2026-10-01&to=2026-10-31')).toMatchObject({
			from: '2026-10-01',
			to: '2026-10-31'
		});
		expect(parse('from=2026-13-01&to=oops')).toMatchObject({ from: null, to: null });
	});

	it('ignores dates on tables without a date filter (R-T6)', () => {
		expect(parse('preset=today&from=2026-10-01', { ...config, dateFilter: false })).toMatchObject({
			preset: null,
			from: null,
			to: null
		});
	});
});
