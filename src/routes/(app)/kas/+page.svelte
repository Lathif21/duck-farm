<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
	import DataTable, { type Column } from '#lib/components/DataTable.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { formatDate } from '#lib/dates.js';
	import { formatRupiah, formatSignedRupiah } from '#lib/money.js';
	import { downloadReportPdf, type ReportJson } from '#lib/report-pdf.js';
	import EntryForm from './EntryForm.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	type Row = (typeof data.table.rows)[number];

	// Form: closed by default so the history stays visible on phones (07).
	let mode = $state<'IN' | 'OUT' | null>(null);
	let editing = $state<Row | null>(null);
	let formBox: HTMLElement | undefined = $state();

	async function open(direction: 'IN' | 'OUT', row: Row | null = null) {
		mode = direction;
		editing = row;
		await tick();
		formBox?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
	function close() {
		mode = null;
		editing = null;
	}

	const columns: Column[] = [
		{ key: 'date', label: 'Tanggal', sortNames: ['Terlama', 'Terbaru'] },
		{ key: 'category', label: 'Kelompok Keperluan' },
		{ key: 'note', label: 'Catatan' },
		{ key: 'in', label: 'Masuk', align: 'right', sortNames: ['Terkecil', 'Terbesar'] },
		{ key: 'out', label: 'Keluar', align: 'right', sortNames: ['Terkecil', 'Terbesar'] },
		{ key: 'balance', label: 'Sisa', align: 'right', sortNames: ['Terkecil', 'Terbesar'] },
		{ key: 'receipt', label: 'Nota', sortNames: ['Tanpa nota dulu', 'Ada nota dulu'] },
		{ key: 'actions', label: 'Aksi', sortable: false }
	];

	// PDF report dialog (UC10)
	let reportDialog: HTMLDialogElement;
	// Defaults: this month so far. Read once; the user changes them in the dialog.
	const today = untrack(() => data.today);
	let reportFrom = $state(`${today.slice(0, 8)}01`);
	let reportTo = $state(today);
	let reportBusy = $state(false);
	let reportError = $state<string | null>(null);

	async function downloadReport() {
		reportError = null;
		if (!reportFrom || !reportTo || reportFrom > reportTo) {
			reportError = 'Pilih tanggal awal dan akhir yang benar.';
			return;
		}
		reportBusy = true;
		try {
			const res = await fetch(`/api/report?from=${reportFrom}&to=${reportTo}`);
			if (!res.ok) throw new Error(String(res.status));
			await downloadReportPdf((await res.json()) as ReportJson);
			reportDialog.close();
		} catch {
			reportError = 'Gagal membuat laporan. Periksa sinyal internet lalu coba lagi.';
		} finally {
			reportBusy = false;
		}
	}
</script>

<svelte:head><title>Buku Uang Kas — Pembukuan Cold Storage Bebek</title></svelte:head>

<section class="space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-2xl font-bold">Buku Uang Kas</h1>
		<button type="button" class="btn-secondary" onclick={() => reportDialog.showModal()}>
			<Icon name="download" />Unduh Laporan PDF
		</button>
	</div>

	<div class="grid grid-cols-2 gap-3">
		<button
			type="button"
			class="btn min-h-16 bg-success text-lg text-white {mode === 'IN' && !editing
				? 'ring-4 ring-success/40'
				: ''}"
			aria-pressed={mode === 'IN' && !editing}
			onclick={() => open('IN')}>+ Uang Masuk</button
		>
		<button
			type="button"
			class="btn min-h-16 bg-danger text-lg text-white {mode === 'OUT' && !editing
				? 'ring-4 ring-danger/40'
				: ''}"
			aria-pressed={mode === 'OUT' && !editing}
			onclick={() => open('OUT')}>− Uang Keluar</button
		>
	</div>

	<div bind:this={formBox} class="scroll-mt-4">
		{#if mode}
			{#key `${mode}:${editing?.id ?? 'new'}`}
				<EntryForm
					direction={mode}
					categories={mode === 'IN' ? data.incomeCategories : data.expenseCategories}
					today={data.today}
					entry={editing}
					onDone={close}
				/>
			{/key}
		{/if}
	</div>

	<h2 class="pt-2 text-lg font-bold uppercase">Riwayat Uang Kas</h2>
	<DataTable
		{columns}
		rows={data.table.rows}
		total={data.table.total}
		defaultSort="date"
		defaultDir="desc"
		emptyText="Belum ada catatan. Tekan Uang Masuk atau Uang Keluar untuk mulai."
		rowKey={(r) => r.id}
	>
		{#snippet row(r)}
			<tr class="border-t border-cream align-top hover:bg-cream/60">
				<td class="px-3 py-3 whitespace-nowrap">{formatDate(r.date)}</td>
				<td class="px-3 py-3 font-bold">{r.categoryLabel}</td>
				<td class="px-3 py-3 break-words">{r.note}</td>
				<td class="tabular px-3 py-3 text-right font-bold whitespace-nowrap text-success">
					{r.direction === 'IN' ? formatSignedRupiah(r.total, 'IN') : ''}
				</td>
				<td class="tabular px-3 py-3 text-right font-bold whitespace-nowrap text-danger">
					{r.direction === 'OUT' ? formatSignedRupiah(r.total, 'OUT') : ''}
				</td>
				<td class="tabular px-3 py-3 text-right whitespace-nowrap">{formatRupiah(r.balance)}</td>
				<td class="px-3 py-3">{@render receipt(r)}</td>
				<td class="px-3 py-2">{@render actions(r)}</td>
			</tr>
		{/snippet}
		{#snippet card(r)}
			<div class="flex flex-wrap items-baseline justify-between gap-x-3 text-sm font-bold">
				<span>{formatDate(r.date)}</span>
				<span class="text-brown">{r.categoryLabel}</span>
			</div>
			<p class="mt-1 break-words">{r.note}</p>
			<p
				class="tabular mt-2 font-display text-2xl font-extrabold {r.direction === 'IN'
					? 'text-success'
					: 'text-danger'}"
			>
				{formatSignedRupiah(r.total, r.direction)}
			</p>
			<p class="tabular text-sm font-semibold">Sisa: {formatRupiah(r.balance)}</p>
			<div class="mt-3 flex flex-wrap items-center gap-2 border-t border-cream pt-3">
				{@render receipt(r)}
				<div class="ml-auto">{@render actions(r)}</div>
			</div>
		{/snippet}
	</DataTable>
</section>

{#snippet receipt(r: Row)}
	{#if r.hasReceipt}
		<a
			href={resolve('/nota/[entryId]', { entryId: r.id })}
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
	{#if r.source === 'MANUAL'}
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				class="btn-secondary min-h-11 px-4 py-1"
				onclick={() => open(r.direction, r)}>Ubah</button
			>
			<ConfirmDelete
				action="?/delete"
				id={r.id}
				message="Hapus catatan ini? Saldo kas akan dihitung ulang."
			/>
		</div>
	{:else if r.source === 'SHOPPING' && r.itemId}
		<a
			href={resolve('/(app)/belanja/[itemId]', { itemId: r.itemId })}
			class="btn-ghost min-h-11 px-0 text-left">Ubah di Daftar Belanja</a
		>
	{:else if r.source === 'DUCK'}
		<a href={resolve('gudang')} class="btn-ghost min-h-11 px-0 text-left">Ubah di Gudang Bebek</a>
	{/if}
{/snippet}

<dialog
	bind:this={reportDialog}
	class="m-auto w-[calc(100%-2rem)] max-w-md rounded-card bg-white p-5 text-charcoal shadow-card backdrop:bg-ink/50"
>
	<h2 class="text-xl font-bold">Unduh Laporan PDF</h2>
	<p class="mt-1 font-semibold">Pilih tanggal laporan.</p>
	{#if reportError}<p class="mt-3 alert" role="alert"><Icon name="alert" />{reportError}</p>{/if}
	<div class="mt-4 grid grid-cols-2 gap-3">
		<div>
			<label class="label" for="report-from">Dari</label>
			<input id="report-from" type="date" class="input" bind:value={reportFrom} />
		</div>
		<div>
			<label class="label" for="report-to">Sampai</label>
			<input id="report-to" type="date" class="input" bind:value={reportTo} />
		</div>
	</div>
	<div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
		<button type="button" class="btn-secondary" onclick={() => reportDialog.close()}>Batal</button>
		<button type="button" class="btn-primary" disabled={reportBusy} onclick={downloadReport}>
			{reportBusy ? 'Membuat laporan…' : 'Unduh'}
		</button>
	</div>
</dialog>
