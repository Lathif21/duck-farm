<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance, type SubmitFunction } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
	import Combobox from '#lib/components/Combobox.svelte';
	import Field from '#lib/components/Field.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { formatDate } from '#lib/dates.js';
	import { useForm } from '#lib/form.svelte.js';
	import { formatRupiah } from '#lib/money.js';
	import PurchaseFields from './PurchaseFields.svelte';

	type Item = {
		id: string;
		number: number;
		name: string;
		explanation: string;
		unit: string;
		sectionId: string;
		purchaseCount: number;
		lastPurchase: { id: string; date: string; total: number } | null;
	};
	type Props = {
		item: Item;
		sectionName: string;
		sections: { id: string; name: string }[];
		today: string;
	};
	let { item, sectionName, sections, today }: Props = $props();

	const recorded = $derived(item.purchaseCount > 0);

	// --- Purchase form (UC02) -------------------------------------------------
	const startDate = untrack(() => today);
	let date = $state(startDate);
	let quantity = $state('');
	let unitPrice = $state('');
	let formKey = $state(0);
	let purchaseForm: HTMLFormElement;

	const purchase = useForm({
		success: 'Tercatat di Buku Uang Kas.',
		onSuccess: () => {
			quantity = '';
			unitPrice = '';
			date = startDate;
			formKey++; // remount to clear the chosen receipt file
		}
	});

	// --- Buy-again dialog (UC07, R-SH4) ----------------------------------------
	let againDialog: HTMLDialogElement;
	let confirmedNew = false;
	const submitPurchase: SubmitFunction = (input) => {
		if (recorded && !confirmedNew) {
			input.cancel();
			againDialog.showModal();
			return;
		}
		confirmedNew = false;
		return purchase.enhance(input);
	};
	function recordNew() {
		againDialog.close();
		confirmedNew = true;
		purchaseForm.requestSubmit();
	}

	// --- Edit item ---------------------------------------------------------------
	let menuOpen = $state(false);
	let editDialog: HTMLDialogElement;
	let editSectionId = $state('');
	let editSectionName = $state('');
	let editName = $state('');
	let editExplanation = $state('');
	let editUnit = $state('');
	const edit = useForm({ success: 'Barang diubah.', onSuccess: () => editDialog.close() });

	function openEdit() {
		menuOpen = false;
		editSectionId = item.sectionId;
		editSectionName = sectionName;
		editName = item.name;
		editExplanation = item.explanation;
		editUnit = item.unit;
		edit.clear();
		editDialog.showModal();
	}
</script>

<article class="flex flex-col rounded-card bg-yellow p-4 text-ink shadow-card">
	<header class="flex items-start gap-3">
		<span
			class="flex size-11 shrink-0 items-center justify-center rounded-full bg-white font-display text-lg font-extrabold"
			aria-label="Nomor {item.number}">{item.number}</span
		>
		<div class="min-w-0 flex-1">
			<h3 class="font-display text-lg leading-snug font-extrabold break-words text-ink">
				{item.name}
			</h3>
			<span
				class="mt-1 inline-flex items-center gap-1 rounded-pill px-3 py-0.5 text-sm font-extrabold {recorded
					? 'bg-success text-white'
					: 'bg-white text-charcoal'}"
			>
				{#if recorded}<Icon name="check" size={16} />Sudah Dicatat di Kas{:else}Belum Dicatat{/if}
			</span>
		</div>
		<div class="relative">
			<button
				type="button"
				class="flex size-11 items-center justify-center rounded-full hover:bg-white/50"
				aria-label="Menu barang nomor {item.number}"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<Icon name="dots" />
			</button>
			{#if menuOpen}
				<div class="absolute right-0 z-20 mt-1 w-48 space-y-1 rounded-xl bg-white p-2 shadow-card">
					<button type="button" class="btn-ghost w-full justify-start" onclick={openEdit}
						>Ubah Barang</button
					>
					<ConfirmDelete
						action="?/deleteItem"
						id={item.id}
						label="Hapus Barang"
						success="Barang dihapus."
						message="Hapus barang Nomor {item.number} dari daftar?"
					/>
				</div>
			{/if}
		</div>
	</header>

	<div class="mt-3 rounded-xl bg-white p-3">
		<p class="text-sm font-extrabold text-brown">Penjelasan Nomor {item.number}</p>
		<p class="mt-1 break-words whitespace-pre-line text-charcoal">{item.explanation}</p>
	</div>

	<form
		bind:this={purchaseForm}
		method="POST"
		action="?/purchase"
		enctype="multipart/form-data"
		use:enhance={submitPurchase}
		class="mt-3 space-y-3 rounded-xl bg-white/60 p-3"
	>
		<input type="hidden" name="itemId" value={item.id} />
		{#if purchase.message}<p class="alert" role="alert">
				<Icon name="alert" />{purchase.message}
			</p>{/if}
		{#key formKey}
			<PurchaseFields
				prefix="buy-{item.id}"
				unit={item.unit}
				bind:date
				bind:quantity
				bind:unitPrice
				error={purchase.error}
			/>
		{/key}
		<button class="btn-success w-full" disabled={purchase.saving}>
			{purchase.saving ? 'Menyimpan…' : 'Catat ke Uang Kas'}
		</button>
	</form>

	{#if recorded}
		<a
			href={resolve('/(app)/belanja/[itemId]', { itemId: item.id })}
			class="mt-2 btn-ghost self-start px-0 text-primary-deep"
		>
			Lihat Riwayat Pembelian ({item.purchaseCount})
		</a>
	{/if}
</article>

<dialog
	bind:this={againDialog}
	class="m-auto w-[calc(100%-2rem)] max-w-md rounded-card bg-white p-5 text-charcoal shadow-card backdrop:bg-ink/50"
>
	<h2 class="text-xl font-bold">Barang ini sudah pernah dicatat</h2>
	{#if item.lastPurchase}
		<p class="mt-2 font-semibold">
			Terakhir dicatat pada {formatDate(item.lastPurchase.date)} sebesar {formatRupiah(
				item.lastPurchase.total
			)}. Mau ubah catatan lama atau catat pembelian baru?
		</p>
		{#if item.purchaseCount > 1}
			<a href={resolve('/(app)/belanja/[itemId]', { itemId: item.id })} class="mt-1 btn-ghost px-0"
				>Lihat semua {item.purchaseCount} catatan pembelian</a
			>
		{/if}
	{/if}
	<div class="mt-5 flex flex-col gap-2">
		<button
			type="button"
			class="btn-secondary"
			onclick={() => {
				againDialog.close();
				goto(
					resolve(`/(app)/belanja/[itemId]?edit=${item.lastPurchase?.id ?? ''}`, {
						itemId: item.id
					})
				);
			}}>Lihat &amp; Ubah Catatan Lama</button
		>
		<button type="button" class="btn-success" onclick={recordNew}>Catat Pembelian Baru</button>
		<button type="button" class="btn-ghost" onclick={() => againDialog.close()}>Batal</button>
	</div>
</dialog>

<dialog
	bind:this={editDialog}
	class="m-auto w-[calc(100%-2rem)] max-w-lg rounded-card bg-white p-5 text-charcoal shadow-card backdrop:bg-ink/50"
>
	<h2 class="text-xl font-bold">Ubah Barang Nomor {item.number}</h2>
	<form method="POST" action="?/updateItem" use:enhance={edit.enhance} class="mt-4 space-y-4">
		<input type="hidden" name="id" value={item.id} />
		{#if edit.message}<p class="alert" role="alert"><Icon name="alert" />{edit.message}</p>{/if}
		<Combobox
			id="edit-section-{item.id}"
			name="section"
			label="Bagian Pekerjaan"
			options={sections}
			bind:selectedId={editSectionId}
			bind:text={editSectionName}
			error={edit.error('sectionName')}
		/>
		<Field
			id="edit-name-{item.id}"
			name="name"
			label="Nama Barang"
			bind:value={editName}
			error={edit.error('name')}
		/>
		<Field
			id="edit-expl-{item.id}"
			name="explanation"
			label="Penjelasan Kegunaan"
			multiline
			bind:value={editExplanation}
			error={edit.error('explanation')}
		/>
		<Field
			id="edit-unit-{item.id}"
			name="unit"
			label="Satuan"
			bind:value={editUnit}
			error={edit.error('unit')}
		/>
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<button type="button" class="btn-secondary" onclick={() => editDialog.close()}>Batal</button>
			<button class="btn-primary" disabled={edit.saving}>
				{edit.saving ? 'Menyimpan…' : 'Simpan Perubahan'}
			</button>
		</div>
	</form>
</dialog>
