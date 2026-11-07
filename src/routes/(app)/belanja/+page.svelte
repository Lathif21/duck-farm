<script lang="ts">
	import { page } from '$app/state';
	import Icon from '#lib/components/Icon.svelte';
	import { setQuery } from '#lib/nav.js';
	import AddItemBox from './AddItemBox.svelte';
	import ItemCard from './ItemCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Search + sort in the URL (R-T5, R-T6). No date filter on the item list.
	let q = $state(page.url.searchParams.get('q') ?? '');
	let timer: ReturnType<typeof setTimeout> | undefined;
	const sortValue = $derived(
		`${page.url.searchParams.get('sort') ?? 'number'}:${page.url.searchParams.get('dir') ?? 'asc'}`
	);

	const update = (changes: Record<string, string | null>) => setQuery(changes);
	function onSearch() {
		clearTimeout(timer);
		timer = setTimeout(() => update({ q: q.trim() || null }), 300);
	}

	const sortOptions = [
		{ value: 'number:asc', label: 'Nomor (Kecil–Besar)' },
		{ value: 'number:desc', label: 'Nomor (Besar–Kecil)' },
		{ value: 'name:asc', label: 'Nama Barang (A–Z)' },
		{ value: 'name:desc', label: 'Nama Barang (Z–A)' },
		{ value: 'status:asc', label: 'Status (Belum Dicatat dulu)' },
		{ value: 'status:desc', label: 'Status (Sudah Dicatat dulu)' }
	];
	const itemCount = $derived(data.groups.reduce((n, g) => n + g.items.length, 0));
</script>

<svelte:head><title>Daftar Belanja Bangunan — Pembukuan Cold Storage Bebek</title></svelte:head>

<section class="space-y-4">
	<h1 class="text-2xl font-bold">Daftar Belanja Bangunan</h1>

	<AddItemBox sections={data.sections} today={data.today} />

	<div class="grid gap-3 md:grid-cols-[1fr_18rem]">
		<div class="relative">
			<span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-brown">
				<Icon name="search" />
			</span>
			<input
				class="input pl-11"
				type="search"
				placeholder="Cari barang…"
				aria-label="Cari barang"
				bind:value={q}
				oninput={onSearch}
			/>
		</div>
		<div>
			<label class="sr-only" for="item-sort">Urutkan</label>
			<select
				id="item-sort"
				class="input"
				value={sortValue}
				onchange={(e) => {
					const [sort, dir] = e.currentTarget.value.split(':');
					update({ sort, dir });
				}}
			>
				{#each sortOptions as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
			</select>
		</div>
	</div>

	{#if itemCount === 0}
		<div class="card p-6 text-center font-semibold">
			{#if q}
				<p>Tidak ada barang yang cocok.</p>
				<button
					type="button"
					class="mt-3 btn-secondary"
					onclick={() => {
						q = '';
						update({ q: null });
					}}>Hapus filter</button
				>
			{:else}
				<p>Belum ada barang. Tambahkan lewat kotak di atas.</p>
			{/if}
		</div>
	{/if}

	{#each data.groups as group (group.id)}
		<section class="space-y-3">
			<h2 class="pt-2 text-lg font-bold uppercase">{group.number}. {group.name}</h2>
			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each group.items as item (item.id)}
					<ItemCard
						{item}
						sectionName="{group.number}. {group.name}"
						sections={data.sections}
						today={data.today}
					/>
				{/each}
			</div>
		</section>
	{/each}
</section>
