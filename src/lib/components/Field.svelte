<script lang="ts">
	// Plain text / date / decimal input with label, optional suffix (e.g. unit) and error.
	type Props = {
		id: string;
		name: string;
		label: string;
		value?: string;
		type?: 'text' | 'date';
		inputmode?: 'text' | 'decimal';
		suffix?: string;
		multiline?: boolean;
		error?: string | null;
		autocomplete?: 'off' | 'username' | 'current-password';
		password?: boolean;
	};
	let {
		id,
		name,
		label,
		value = $bindable(''),
		type = 'text',
		inputmode = 'text',
		suffix,
		multiline = false,
		error = null,
		autocomplete = 'off',
		password = false
	}: Props = $props();
	const describedBy = $derived(error ? `${id}-error` : undefined);
</script>

<div>
	<label class="label" for={id}>{label}</label>
	{#if multiline}
		<textarea
			{id}
			{name}
			bind:value
			rows="3"
			class="input resize-y leading-snug"
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}></textarea>
	{:else}
		<div class="relative">
			<input
				{id}
				{name}
				bind:value
				type={password ? 'password' : type}
				{inputmode}
				{autocomplete}
				class="input {suffix ? 'pr-20' : ''} {inputmode === 'decimal' ? 'tabular text-right' : ''}"
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={describedBy}
			/>
			{#if suffix}
				<span
					class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[17px] font-bold text-brown"
					>{suffix}</span
				>
			{/if}
		</div>
	{/if}
	{#if error}<p class="field-error" id="{id}-error">{error}</p>{/if}
</div>
