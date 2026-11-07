import { DATE_PRESETS, isDateOnly, presetRange, type DatePreset } from '#lib/dates.js';

// URL contract (skill data-table, R-T5):
// ?q=&from=YYYY-MM-DD&to=YYYY-MM-DD&preset=today|7d|30d|month&sort=&dir=asc|desc&page=

export const PAGE_SIZE = 20; // R-T4

export type SortDir = 'asc' | 'desc';

export type TableConfig<K extends string> = {
	sortKeys: readonly K[];
	defaultSort: K;
	defaultDir: SortDir;
	dateFilter: boolean;
};

export type TableQuery<K extends string> = {
	q: string;
	from: string | null;
	to: string | null;
	preset: DatePreset | null;
	sort: K;
	dir: SortDir;
	page: number;
	skip: number;
	take: number;
};

export function parseTableQuery<K extends string>(
	url: URL,
	config: TableConfig<K>,
	now: Date = new Date()
): TableQuery<K> {
	const p = url.searchParams;
	const q = (p.get('q') ?? '').trim().slice(0, 100);

	const rawSort = p.get('sort');
	const sort = config.sortKeys.find((k) => k === rawSort) ?? config.defaultSort;
	const rawDir = p.get('dir');
	const dir: SortDir = rawDir === 'asc' || rawDir === 'desc' ? rawDir : config.defaultDir;

	const pageNum = Number(p.get('page'));
	const page = Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1;

	let from: string | null = null;
	let to: string | null = null;
	let preset: DatePreset | null = null;
	if (config.dateFilter) {
		const rawPreset = p.get('preset');
		preset = DATE_PRESETS.find((x) => x === rawPreset) ?? null;
		if (preset) {
			({ from, to } = presetRange(preset, now));
		} else {
			const f = p.get('from') ?? '';
			const t = p.get('to') ?? '';
			from = isDateOnly(f) ? f : null;
			to = isDateOnly(t) ? t : null;
		}
	}

	return { q, from, to, preset, sort, dir, page, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}
