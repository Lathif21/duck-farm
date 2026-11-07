<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
	import DataTable, { type Column } from '#lib/components/DataTable.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { formatDate } from '#lib/dates.js';
	import { useForm } from '#lib/form.svelte.js';
	import { setQuery } from '#lib/nav.js';
	import { formatDots, formatRupiah, quantityToInput } from '#lib/money.js';
	import PurchaseFields from '../PurchaseFields.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	type Row = (typeof data.table.rows)[number];

	const columns: Column[] = [
		{ key: 'date', label: 'Tanggal', sortNames: ['Terlama', 'Terbaru'] },
		{ key: 'quantity', label: 'Jumlah', align: 'right', sortNames: ['Terkecil', 'Terbesar'] },
		{
			key: 'unitPrice',
			label: 'Harga Satuan',
			align: 'right',
			sortNames: ['Termurah', 'Termahal']
		},
		{ key: 'total', label: 'Total', align: 'right', sortNames: ['Terkecil', 'Terbesar'] },
		{ key: 'receipt', label: 'Nota', sortNames: ['Ada nota dulu', 'Tanpa nota dulu'] },
		{ key: 'actions', label: 'Aksi', sortable: false }
	];

	// Opening an edit form scrolls to the top, where the form is.
	const setEdit = (id: string | null) => setQuery({ edit: id }, { replace: false, reset: !!id });

	// Edit form (opened by "Ubah" or by "Lihat & Ubah Catatan Lama", UC07). Values are
	// re-read whenever a different purchase is opened.
	let date = $state('');
	let quantity = $state('');
	let unitPrice = $state('');
	$effect(() => {
		const e = data.editing;
		if (!e) return;
		date = e.date;
		quantity = quantityToInput(e.quantity);
		unitPrice = formatDots(e.unitPrice);
	});
	const f = useForm({ success: 'Catatan diubah.', onSuccess: () => setEdit(null) });

	const qty = (h: number) => `${quantityToInput(h)} ${data.item.unit}`;
</script>

<svelte:head><title>{data.item.name} — Daftar Belanja Bangunan</title></svelte:head>

<section class="space-y-4">
	<a href={resolve('belanja')} class="btn-ghost px-0"
		><Icon name="chevronLeft" />Kembali ke Daftar Belanja</a
	>

	<article class="rounded-card bg-yellow p-4 text-ink shadow-card md:p-6">
		<div class="flex items-start gap-3">
			<span
				class="flex size-12 shrink-0 items-center justify-center rounded-full bg-white font-display text-xl font-extrabold"
				>{data.item.number}</span
			>
			<div class="min-w-0">
				<h1 class="text-2xl leading-snug font-extrabold break-words text-ink">{data.item.name}</h1>
				<p class="font-bold">{data.item.sectionName} · Satuan: {data.item.unit}</p>
			</div>
		</div>
		<div class="mt-3 rounded-xl bg-white p-3">
			<p class="text-sm font-extrabold text-brown">Penjelasan Nomor {data.item.number}</p>
			<p class="mt-1 break-words whitespace-pre-line text-charcoal">{data.item.explanation}</p>
		</div>
	</article>

	{#if data.editing}
		{@const e = data.editing}
		<form
			method="POST"
			action="?/updatePurchase"
			enctype="multipart/form-data"
			use:enhance={f.enhance}
			class="space-y-4 card border-t-8 border-primary p-4 md:p-6"
		>
			<h2 class="text-xl font-bold">Ubah Catatan Pembelian {formatDate(e.date)}</h2>
			<p class="font-semibold">Catatan di Buku Uang Kas ikut berubah.</p>
			{#if f.message}<p class="alert" role="alert"><Icon name="alert" />{f.message}</p>{/if}
			<input type="hidden" name="id" value={e.id} />
			{#key e.id}
				<PurchaseFields
					prefix="edit"
					unit={data.item.unit}
					bind:date
					bind:quantity
					bind:unitPrice
					receiptEntryId={e.hasReceipt ? e.cashEntryId : null}
					error={f.error}
				/>
			{/key}
			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button type="button" class="btn-secondary" onclick={() => setEdit(null)}>Batal</button>
				<button class="btn-primary" disabled={f.saving}>
					{f.saving ? 'Menyimpan…' : 'Simpan Perubahan'}
				</button>
			</div>
		</form>
	{/if}

	<h2 class="pt-2 text-lg font-bold uppercase">Riwayat Pembelian</h2>
	<DataTable
		{columns}
		rows={data.table.rows}
		total={data.table.total}
		defaultSort="date"
		defaultDir="desc"
		search={false}
		emptyText="Belum ada catatan pembelian untuk barang ini."
		rowKey={(r) => r.id}
	>
		{#snippet row(r)}
			<tr class="border-t border-cream align-top hover:bg-cream/60">
				<td class="px-3 py-3 whitespace-nowrap">{formatDate(r.date)}</td>
				<td class="tabular px-3 py-3 text-right">{qty(r.quantity)}</td>
				<td class="tabular px-3 py-3 text-right">{formatRupiah(r.unitPrice)}</td>
				<td class="tabular px-3 py-3 text-right font-bold text-danger">− {formatRupiah(r.total)}</td
				>
				<td class="px-3 py-3">{@render receipt(r)}</td>
				<td class="px-3 py-2">{@render actions(r)}</td>
			</tr>
		{/snippet}
		{#snippet card(r)}
			<p class="text-sm font-bold">{formatDate(r.date)}</p>
			<p class="mt-1">{qty(r.quantity)} × {formatRupiah(r.unitPrice)}</p>
			<p class="tabular mt-2 font-display text-2xl font-extrabold text-danger">
				− {formatRupiah(r.total)}
			</p>
			<div class="mt-3 flex flex-wrap items-center gap-2 border-t border-cream pt-3">
				{@render receipt(r)}
				<div class="ml-auto">{@render actions(r)}</div>
			</div>
		{/snippet}
	</DataTable>
</section>

{#snippet receipt(r: Row)}
	{#if r.hasReceipt && r.cashEntryId}
		<a
			href={resolve('/nota/[entryId]', { entryId: r.cashEntryId })}
			target="_blank"
			rel="noopener"
			class="inline-flex min-h-11 min-w-11 items-center gap-1 font-bold text-primary-deep"
			aria-label="Lihat nota"
		>
			<Icon name="receipt" /><span class="md:sr-only">Nota</span>
		</a>
	{/if}
{/snippet}

{#snippet actions(r: Row)}
	<div class="flex flex-wrap gap-2">
		<button type="button" class="btn-secondary min-h-11 px-4 py-1" onclick={() => setEdit(r.id)}
			>Ubah</button
		>
		<ConfirmDelete
			action="?/delete"
			id={r.id}
			message="Hapus catatan ini? Catatan di Buku Uang Kas juga akan dihapus."
		/>
	</div>
{/snippet}
