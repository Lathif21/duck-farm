<script lang="ts">
	// "Foto / File Nota (opsional)" (UC09). Photos are resized to max 1600px and re-encoded as
	// JPEG 0,8 in the browser before upload; PDFs over 4 MB are rejected (08, Receipts).
	import { resolve } from '$app/paths';

	/** `receiptEntryId`: the cash entry whose receipt is already stored, if any. */
	type Props = { id: string; receiptEntryId?: string | null };
	let { id, receiptEntryId = null }: Props = $props();

	const MAX_BYTES = 4 * 1024 * 1024;
	const MAX_SIDE = 1600;

	let input: HTMLInputElement;
	let fileName = $state<string | null>(null);
	let busy = $state(false);
	let error = $state<string | null>(null);
	let remove = $state(false);

	async function compress(file: File): Promise<File> {
		const bitmap = await createImageBitmap(file);
		const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(bitmap.width * scale);
		canvas.height = Math.round(bitmap.height * scale);
		canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();
		const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.8));
		if (!blob) throw new Error('encode failed');
		return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
	}

	function clear() {
		input.value = '';
		fileName = null;
	}

	async function onChange() {
		error = null;
		const file = input.files?.[0];
		if (!file) return clear();
		try {
			busy = true;
			let final = file;
			if (file.type.startsWith('image/')) {
				final = await compress(file);
			} else if (file.type !== 'application/pdf') {
				error = 'Nota harus berupa foto atau PDF.';
				return clear();
			}
			if (final.size > MAX_BYTES) {
				error = 'File terlalu besar (maks. 4 MB).';
				return clear();
			}
			const dt = new DataTransfer();
			dt.items.add(final);
			input.files = dt.files;
			fileName = final.name;
			remove = false;
		} catch {
			error = 'Foto ini tidak bisa dibaca. Coba foto lain atau kirim sebagai PDF.';
			clear();
		} finally {
			busy = false;
		}
	}
</script>

<div>
	<label class="label" for={id}>Foto / File Nota (opsional)</label>
	{#if receiptEntryId && !fileName}
		<div class="mb-2 flex flex-wrap items-center gap-2">
			<a
				class="btn-ghost px-0"
				href={resolve('/nota/[entryId]', { entryId: receiptEntryId })}
				target="_blank"
				rel="noopener">Lihat nota</a
			>
			<label class="flex min-h-11 items-center gap-2 font-bold text-danger">
				<input
					type="checkbox"
					name="removeReceipt"
					value="1"
					bind:checked={remove}
					class="size-5"
				/>
				Hapus nota ini
			</label>
		</div>
	{/if}
	<input
		bind:this={input}
		{id}
		name="receipt"
		type="file"
		accept="image/*,application/pdf"
		class="block w-full rounded-xl border-2 border-dashed border-line bg-white p-2 text-base font-semibold file:mr-3 file:min-h-11 file:rounded-pill file:border-0 file:bg-cream file:px-4 file:font-bold file:text-brown"
		onchange={onChange}
	/>
	{#if busy}<p class="mt-1 text-sm font-semibold">Mengecilkan foto…</p>{/if}
	{#if fileName}
		<p class="mt-1 flex items-center gap-2 text-sm font-semibold break-all">
			Siap diunggah: {fileName}
			<button type="button" class="btn-ghost min-h-11 px-2" onclick={clear}>Batal</button>
		</p>
	{/if}
	{#if error}<p class="field-error">{error}</p>{/if}
</div>
