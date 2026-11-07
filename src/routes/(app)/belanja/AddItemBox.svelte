<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Combobox from '#lib/components/Combobox.svelte';
	import Field from '#lib/components/Field.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { useForm } from '#lib/form.svelte.js';
	import { toast } from '#lib/toast.svelte.js';
	import PurchaseFields from './PurchaseFields.svelte';

	// UC03: "Tambah Barang / Biaya yang Belum Ada di Daftar" (collapsible on phone).
	type Props = { sections: { id: string; name: string }[]; today: string };
	let { sections, today }: Props = $props();

	const startDate = untrack(() => today);
	let open = $state(false);
	let sectionId = $state('');
	let sectionName = $state('');
	let name = $state('');
	let explanation = $state('');
	let unit = $state('');
	let date = $state(startDate);
	let quantity = $state('');
	let unitPrice = $state('');
	let formKey = $state(0);

	const f = useForm({
		onSuccess: (data) => {
			const number = (data as { result?: { number?: number } } | undefined)?.result?.number;
			toast.show(`Barang Nomor ${number} ditambahkan.`);
			sectionId = sectionName = name = explanation = unit = quantity = unitPrice = '';
			date = startDate;
			formKey++;
			open = false;
		}
	});
</script>

<section class="overflow-hidden card">
	<button
		type="button"
		class="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left md:px-6"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<h2 class="text-lg font-bold">Tambah Barang / Biaya yang Belum Ada di Daftar</h2>
		<span
			class="flex size-11 shrink-0 items-center justify-center rounded-full bg-cream text-brown"
		>
			<Icon name={open ? 'close' : 'plus'} />
		</span>
	</button>
	{#if open}
		<form
			method="POST"
			action="?/addItem"
			enctype="multipart/form-data"
			use:enhance={f.enhance}
			class="space-y-4 border-t-2 border-cream px-4 pt-4 pb-5 md:px-6"
		>
			{#if f.message}<p class="alert" role="alert"><Icon name="alert" />{f.message}</p>{/if}
			<div class="grid gap-4 md:grid-cols-2">
				<Combobox
					id="new-section"
					name="section"
					label="Bagian Pekerjaan"
					options={sections}
					bind:selectedId={sectionId}
					bind:text={sectionName}
					error={f.error('sectionName')}
				/>
				<Field
					id="new-name"
					name="name"
					label="Nama Barang Baru"
					bind:value={name}
					error={f.error('name')}
				/>
			</div>
			<Field
				id="new-explanation"
				name="explanation"
				label="Penjelasan Kegunaan"
				multiline
				bind:value={explanation}
				error={f.error('explanation')}
			/>
			<Field id="new-unit" name="unit" label="Satuan" bind:value={unit} error={f.error('unit')} />
			{#key formKey}
				<PurchaseFields
					prefix="new"
					{unit}
					bind:date
					bind:quantity
					bind:unitPrice
					error={f.error}
				/>
			{/key}
			<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
				<button class="btn-secondary" name="withPurchase" value="0" disabled={f.saving}>
					Tambahkan ke Daftar Saja
				</button>
				<button class="btn-success" name="withPurchase" value="1" disabled={f.saving}>
					{f.saving ? 'Menyimpan…' : 'Tambahkan & Catat ke Buku Uang Kas'}
				</button>
			</div>
		</form>
	{/if}
</section>
