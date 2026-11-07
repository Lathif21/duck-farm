<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Combobox from '#lib/components/Combobox.svelte';
	import Field from '#lib/components/Field.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import MoneyInput from '#lib/components/MoneyInput.svelte';
	import ReceiptField from '#lib/components/ReceiptField.svelte';
	import TotalPreview from '#lib/components/TotalPreview.svelte';
	import { useForm } from '#lib/form.svelte.js';
	import {
		formatDots,
		lineTotal,
		parseQuantity,
		parseRupiah,
		quantityToInput
	} from '#lib/money.js';

	// Manual income/expense form (UC06, 07 /kas). Also used to edit a manual row (UC08).
	type Category = { id: string; name: string };
	type Entry = {
		id: string;
		date: string;
		categoryId: string | null;
		categoryLabel: string;
		description: string;
		quantity: number | null;
		unitPrice: number | null;
		hasReceipt: boolean;
	};
	type Props = {
		direction: 'IN' | 'OUT';
		categories: Category[];
		today: string;
		entry?: Entry | null;
		onDone: () => void;
	};
	let { direction, categories, today, entry = null, onDone }: Props = $props();

	const isOut = $derived(direction === 'OUT');
	// The form is remounted ({#key}) for each entry, so reading the initial values once is intended.
	const initial = untrack(() => entry);
	const defaultDate = untrack(() => today);
	let date = $state(initial?.date ?? defaultDate);
	let categoryId = $state(initial?.categoryId ?? '');
	let categoryName = $state(initial?.categoryLabel ?? '');
	let description = $state(initial?.description ?? '');
	let quantity = $state(initial?.quantity ? quantityToInput(initial.quantity) : '1');
	let unitPrice = $state(initial?.unitPrice ? formatDots(initial.unitPrice) : '');

	const total = $derived.by(() => {
		const q = parseQuantity(quantity);
		const p = parseRupiah(unitPrice);
		return q && p ? lineTotal(q, p) : null;
	});

	const f = useForm({ success: 'Catatan disimpan.', onSuccess: () => onDone() });
</script>

<form
	method="POST"
	action={entry ? '?/update' : '?/create'}
	enctype="multipart/form-data"
	use:enhance={f.enhance}
	class="space-y-4 card border-t-8 p-4 md:p-6 {isOut ? 'border-danger' : 'border-success'}"
>
	<h2 class="text-xl font-bold">
		{entry ? 'Ubah Catatan' : isOut ? 'Catat Uang Keluar' : 'Catat Uang Masuk'}
	</h2>
	{#if f.message}<p class="alert" role="alert"><Icon name="alert" />{f.message}</p>{/if}

	<input type="hidden" name="direction" value={direction} />
	{#if entry}<input type="hidden" name="id" value={entry.id} />{/if}

	<div class="grid gap-4 md:grid-cols-2">
		<Field
			id="entry-date"
			name="date"
			label="Tanggal"
			type="date"
			bind:value={date}
			error={f.error('date')}
		/>
		<Combobox
			id="entry-category"
			name="category"
			label="Kelompok Keperluan"
			options={categories}
			bind:selectedId={categoryId}
			bind:text={categoryName}
			error={f.error('categoryName')}
		/>
	</div>
	<Field
		id="entry-description"
		name="description"
		label="Nama Barang / Catatan"
		bind:value={description}
		error={f.error('description')}
	/>
	<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
		<Field
			id="entry-quantity"
			name="quantity"
			label="Jumlah"
			inputmode="decimal"
			bind:value={quantity}
			error={f.error('quantity')}
		/>
		<MoneyInput
			id="entry-price"
			name="unitPrice"
			label="Harga (Rp)"
			bind:value={unitPrice}
			error={f.error('unitPrice')}
		/>
		<div class="col-span-2 md:col-span-1">
			<TotalPreview id="entry-total" {total} />
		</div>
	</div>
	{#if isOut}
		<ReceiptField id="entry-receipt" receiptEntryId={entry?.hasReceipt ? entry.id : null} />
	{/if}

	<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
		<button type="button" class="btn-secondary" onclick={onDone}>Batal</button>
		<button class="btn-primary" disabled={f.saving}>
			{#if f.saving}Menyimpan…{:else if entry}Simpan Perubahan{:else if isOut}Simpan Pengeluaran
				Uang{:else}Simpan Pemasukan Uang{/if}
		</button>
	</div>
</form>
