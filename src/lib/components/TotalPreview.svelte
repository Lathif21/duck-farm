<script lang="ts">
	import { formatDots } from '#lib/money.js';

	// Read-only "Total (Rp)" that updates live. The server recomputes it with the same helper.
	let {
		id,
		total,
		label = 'Total (Rp)'
	}: { id: string; total: number | null; label?: string } = $props();
</script>

<div>
	<label class="label" for={id}>{label}</label>
	<output
		{id}
		class="tabular flex input items-center justify-end bg-cream text-right"
		aria-live="polite"
	>
		Rp {total === null ? '0' : formatDots(total)}
	</output>
</div>
