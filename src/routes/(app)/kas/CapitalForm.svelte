<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Field from '#lib/components/Field.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import MoneyInput from '#lib/components/MoneyInput.svelte';
	import { useForm } from '#lib/form.svelte.js';
	import { formatDots } from '#lib/money.js';

	// Edit form for the initial capital row (R-C3): date, amount and note. No delete.
	type Entry = { id: string; date: string; description: string; total: number };
	type Props = { entry: Entry; onDone: () => void };
	let { entry, onDone }: Props = $props();

	// The form is remounted ({#key}) for each entry, so reading the initial values once is intended.
	const initial = untrack(() => entry);
	let date = $state(initial.date);
	let description = $state(initial.description);
	let total = $state(formatDots(initial.total));

	const f = useForm({ success: 'Modal Awal disimpan.', onSuccess: () => onDone() });
</script>

<form
	method="POST"
	action="?/updateCapital"
	use:enhance={f.enhance}
	class="space-y-4 card border-t-8 border-success p-4 md:p-6"
>
	<h2 class="text-xl font-bold">Ubah Modal Awal</h2>
	{#if f.message}<p class="alert" role="alert"><Icon name="alert" />{f.message}</p>{/if}

	<input type="hidden" name="id" value={entry.id} />

	<div class="grid gap-4 md:grid-cols-2">
		<Field
			id="capital-date"
			name="date"
			label="Tanggal"
			type="date"
			bind:value={date}
			error={f.error('date')}
		/>
		<MoneyInput
			id="capital-total"
			name="total"
			label="Jumlah Modal (Rp)"
			bind:value={total}
			error={f.error('total')}
		/>
	</div>
	<Field
		id="capital-description"
		name="description"
		label="Catatan"
		bind:value={description}
		error={f.error('description')}
	/>

	<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
		<button type="button" class="btn-secondary" onclick={onDone}>Batal</button>
		<button class="btn-primary" disabled={f.saving}>
			{f.saving ? 'Menyimpan…' : 'Simpan Perubahan'}
		</button>
	</div>
</form>
