<script lang="ts">
	import { formatMoneyTyping } from '#lib/money.js';

	// Rupiah input: dots appear live while typing and the caret stays put (R-F1).
	type Props = {
		id: string;
		name: string;
		label: string;
		value?: string;
		error?: string | null;
	};
	let { id, name, label, value = $bindable(''), error = null }: Props = $props();

	function onInput(e: Event & { currentTarget: HTMLInputElement }) {
		const el = e.currentTarget;
		const { text, caret } = formatMoneyTyping(el.value, el.selectionStart ?? el.value.length);
		value = text;
		el.value = text;
		el.setSelectionRange(caret, caret);
	}
</script>

<div>
	<label class="label" for={id}>{label}</label>
	<div class="relative">
		<span
			class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[17px] font-bold text-brown"
			>Rp</span
		>
		<input
			{id}
			{name}
			{value}
			class="tabular input pl-11 text-right"
			inputmode="numeric"
			autocomplete="off"
			placeholder="0"
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? `${id}-error` : undefined}
			oninput={onInput}
		/>
	</div>
	{#if error}<p class="field-error" id="{id}-error">{error}</p>{/if}
</div>
