<script lang="ts" module>
	export type Column = {
		key: string;
		label: string;
		align?: 'left' | 'right';
		sortable?: boolean;
		/** Labels for the phone "Urutkan" select: [asc, desc]. */
		sortNames?: [string, string];
	};
</script>

<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { setQuery } from '#lib/nav.js';
	import Icon from './Icon.svelte';

	// Shared table (skill data-table, R-T1–R-T6). All state lives in the URL query.
	// Laptop (md+): <table>. Phone: one card per row. Both are rendered; CSS picks one,
	// so the server HTML is right on first paint.

	type Props = {
		columns: Column[];
		rows: T[];
		total: number;
		pageSize?: number;
		defaultSort: string;
		defaultDir: 'asc' | 'desc';
		dateFilter?: boolean;
		search?: boolean;
		emptyText: string;
		rowKey: (r: T) => string;
		row: Snippet<[T]>;
		card: Snippet<[T]>;
	};
	let {
		columns,
		rows,
		total,
		pageSize = 20,
		defaultSort,
		defaultDir,
		dateFilter = true,
		search = true,
		emptyText,
		rowKey,
		row,
		card
	}: Props = $props();

	const params = $derived(page.url.searchParams);
	const sort = $derived(params.get('sort') ?? defaultSort);
	const dir = $derived(params.get('dir') ?? defaultDir);
	const preset = $derived(params.get('preset') ?? '');
	const from = $derived(params.get('from') ?? '');
	const to = $derived(params.get('to') ?? '');
	const currentPage = $derived(Math.max(1, Number(params.get('page')) || 1));
	const pages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const hasFilters = $derived(!!(params.get('q') || preset || from || to));

	let q = $state(page.url.searchParams.get('q') ?? '');
	let customOpen = $state(!!(page.url.searchParams.get('from') || page.url.searchParams.get('to')));
	let timer: ReturnType<typeof setTimeout> | undefined;

	function update(changes: Record<string, string | null>, resetPage = true) {
		setQuery(changes, { resetPage });
	}

	function onSearch() {
		clearTimeout(timer);
		timer = setTimeout(() => update({ q: q.trim() || null }), 300);
	}

	function sortBy(key: string) {
		const nextDir = sort === key && dir === 'asc' ? 'desc' : 'asc';
		update({ sort: key, dir: nextDir });
	}

	const chips = [
		{ value: '', label: 'Semua' },
		{ value: 'today', label: 'Hari ini' },
		{ value: '7d', label: '7 hari' },
		{ value: '30d', label: '30 hari' },
		{ value: 'month', label: 'Bulan ini' }
	];

	function pickPreset(value: string) {
		customOpen = false;
		update({ preset: value || null, from: null, to: null });
	}

	function clearFilters() {
		q = '';
		customOpen = false;
		update({ q: null, preset: null, from: null, to: null });
	}

	function ariaSort(key: string) {
		if (sort !== key) return 'none';
		return dir === 'asc' ? 'ascending' : 'descending';
	}

	const sortOptions = $derived(
		columns
			.filter((c) => c.sortable !== false)
			.flatMap((c) => [
				{ value: `${c.key}:asc`, label: `${c.label} (${c.sortNames?.[0] ?? 'A–Z'})` },
				{ value: `${c.key}:desc`, label: `${c.label} (${c.sortNames?.[1] ?? 'Z–A'})` }
			])
	);
</script>

<div class="space-y-3">
	{#if search || dateFilter}
		<div class="space-y-3">
			{#if search}
				<div class="relative">
					<span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-brown">
						<Icon name="search" />
					</span>
					<input
						class="input pl-11"
						type="search"
						placeholder="Cari…"
						aria-label="Cari"
						bind:value={q}
						oninput={onSearch}
					/>
				</div>
			{/if}
			{#if dateFilter}
				<div class="flex flex-wrap gap-2" role="group" aria-label="Filter tanggal">
					{#each chips as c (c.value)}
						{@const on = !customOpen && preset === c.value && !(c.value === '' && (from || to))}
						<button
							type="button"
							class="min-h-11 rounded-pill border-2 px-4 font-bold {on
								? 'border-primary bg-primary text-ink'
								: 'border-line bg-white text-brown'}"
							aria-pressed={on}
							onclick={() => pickPreset(c.value)}>{c.label}</button
						>
					{/each}
					<button
						type="button"
						class="min-h-11 rounded-pill border-2 px-4 font-bold {customOpen || from || to
							? 'border-primary bg-primary text-ink'
							: 'border-line bg-white text-brown'}"
						aria-pressed={customOpen}
						onclick={() => (customOpen = !customOpen)}>Pilih tanggal</button
					>
				</div>
				{#if customOpen}
					<div class="grid grid-cols-2 gap-2">
						<div>
							<label class="label" for="dt-from">Dari</label>
							<input
								id="dt-from"
								class="input"
								type="date"
								value={from}
								onchange={(e) => update({ preset: null, from: e.currentTarget.value || null })}
							/>
						</div>
						<div>
							<label class="label" for="dt-to">Sampai</label>
							<input
								id="dt-to"
								class="input"
								type="date"
								value={to}
								onchange={(e) => update({ preset: null, to: e.currentTarget.value || null })}
							/>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	{/if}

	<!-- Phone sort -->
	<div class="md:hidden">
		<label class="label" for="dt-sort">Urutkan</label>
		<select
			id="dt-sort"
			class="input"
			value="{sort}:{dir}"
			onchange={(e) => {
				const [k, d] = e.currentTarget.value.split(':');
				update({ sort: k, dir: d });
			}}
		>
			{#each sortOptions as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
		</select>
	</div>

	{#if total === 0}
		<div class="card p-6 text-center font-semibold">
			{#if hasFilters}
				<p>Tidak ada catatan yang cocok.</p>
				<button type="button" class="mt-3 btn-secondary" onclick={clearFilters}>Hapus filter</button
				>
			{:else}
				<p>{emptyText}</p>
			{/if}
		</div>
	{:else}
		<!-- Laptop table -->
		<div class="hidden overflow-hidden card md:block">
			<table class="w-full border-collapse text-left">
				<thead class="bg-cream">
					<tr>
						{#each columns as c (c.key)}
							<th
								scope="col"
								aria-sort={c.sortable === false ? undefined : ariaSort(c.key)}
								class="px-3 py-2 text-sm font-extrabold text-brown {c.align === 'right'
									? 'text-right'
									: ''}"
							>
								{#if c.sortable === false}
									{c.label}
								{:else}
									<button
										type="button"
										class="inline-flex min-h-11 items-center gap-1 font-extrabold {c.align ===
										'right'
											? 'flex-row-reverse'
											: ''}"
										onclick={() => sortBy(c.key)}
									>
										{c.label}
										<Icon
											name={sort === c.key ? (dir === 'asc' ? 'sortAsc' : 'sortDesc') : 'sortNone'}
											size={16}
											class={sort === c.key ? 'text-primary-deep' : 'text-line'}
										/>
									</button>
								{/if}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each rows as r (rowKey(r))}
						{@render row(r)}
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Phone cards -->
		<ul class="space-y-3 md:hidden">
			{#each rows as r (rowKey(r))}
				<li class="card p-4">{@render card(r)}</li>
			{/each}
		</ul>

		<nav class="flex flex-wrap items-center justify-between gap-2" aria-label="Halaman">
			<button
				type="button"
				class="btn-secondary px-4"
				disabled={currentPage <= 1}
				onclick={() => update({ page: String(currentPage - 1) }, false)}
			>
				<Icon name="chevronLeft" />Sebelumnya
			</button>
			<p class="text-center text-sm font-bold">
				Halaman {currentPage} dari {pages}<br /><span class="font-semibold">{total} catatan</span>
			</p>
			<button
				type="button"
				class="btn-secondary px-4"
				disabled={currentPage >= pages}
				onclick={() => update({ page: String(currentPage + 1) }, false)}
			>
				Berikutnya<Icon name="chevronRight" />
			</button>
		</nav>
	{/if}
</div>
