<script lang="ts">
	import Field from '#lib/components/Field.svelte';
	import MoneyInput from '#lib/components/MoneyInput.svelte';
	import ReceiptField from '#lib/components/ReceiptField.svelte';
	import TotalPreview from '#lib/components/TotalPreview.svelte';
	import { lineTotal, parseQuantity, parseRupiah } from '#lib/money.js';

	// Purchase fields shared by the item card, the "add item" box and the edit form (R-SH5).
	type Props = {
		prefix: string;
		unit: string;
		date: string;
		quantity: string;
		unitPrice: string;
		receiptEntryId?: string | null;
		error: (field: string) => string | null;
	};
	let {
		prefix,
		unit,
		date = $bindable(),
		quantity = $bindable(),
		unitPrice = $bindable(),
		receiptEntryId = null,
		error
	}: Props = $props();

	const total = $derived.by(() => {
		const q = parseQuantity(quantity);
		const p = parseRupiah(unitPrice);
		return q && p ? lineTotal(q, p) : null;
	});
</script>

<div class="grid grid-cols-2 gap-3">
	<Field
		id="{prefix}-qty"
		name="quantity"
		label="Jumlah"
		inputmode="decimal"
		suffix={unit}
		bind:value={quantity}
		error={error('quantity')}
	/>
	<MoneyInput
		id="{prefix}-price"
		name="unitPrice"
		label="Harga Satuan (Rp)"
		bind:value={unitPrice}
		error={error('unitPrice')}
	/>
	<TotalPreview id="{prefix}-total" {total} />
	<Field
		id="{prefix}-date"
		name="date"
		label="Tanggal"
		type="date"
		bind:value={date}
		error={error('date')}
	/>
	<div class="col-span-2">
		<ReceiptField id="{prefix}-receipt" {receiptEntryId} />
	</div>
</div>
