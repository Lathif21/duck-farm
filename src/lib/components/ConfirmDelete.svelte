<script lang="ts">
	import { enhance } from '$app/forms';
	import { useForm } from '#lib/form.svelte.js';
	import Icon from './Icon.svelte';

	// Delete button + confirmation that names the side effect (ui-rules, 07: Delete confirmations).
	type Props = {
		action: string;
		id: string;
		message: string;
		label?: string;
		success?: string;
	};
	let { action, id, message, label = 'Hapus', success = 'Catatan dihapus.' }: Props = $props();

	let dialog: HTMLDialogElement;
	const f = useForm({
		get success() {
			return success;
		},
		// The deleted row (and this component) may already be gone after the data refresh.
		onSuccess: () => dialog?.close()
	});
</script>

<button type="button" class="btn-danger min-h-11 px-4 py-1" onclick={() => dialog.showModal()}>
	{label}
</button>

<dialog
	bind:this={dialog}
	class="m-auto w-[calc(100%-2rem)] max-w-md rounded-card bg-white p-5 text-charcoal shadow-card backdrop:bg-ink/50"
	onclose={() => f.clear()}
>
	<h2 class="text-xl font-bold">Hapus catatan?</h2>
	<p class="mt-2 font-semibold">{message}</p>
	{#if f.message}
		<p class="mt-3 alert" role="alert"><Icon name="alert" />{f.message}</p>
	{/if}
	<form
		method="POST"
		{action}
		use:enhance={f.enhance}
		class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
	>
		<input type="hidden" name="id" value={id} />
		<button type="button" class="btn-secondary w-full sm:w-auto" onclick={() => dialog.close()}
			>Batal</button
		>
		<button class="btn-danger-fill w-full sm:w-auto" disabled={f.saving}>
			{f.saving ? 'Menghapus…' : 'Ya, Hapus'}
		</button>
	</form>
</dialog>
