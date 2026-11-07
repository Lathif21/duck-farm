<script lang="ts">
	import { formatKg, formatRupiah } from '#lib/money.js';

	// Summary cards (R-C2, 06). Always all-time; refreshed after every save.
	type Props = {
		summary: {
			balance: number;
			otherIncome: number;
			totalExpense: number;
			stockGrams: number;
			stockHeads: number;
		};
	};
	let { summary }: Props = $props();
</script>

<section aria-label="Ringkasan" class="space-y-3">
	<div class="relative overflow-hidden rounded-card bg-primary p-5 text-ink shadow-card md:p-6">
		<span
			aria-hidden="true"
			class="pointer-events-none absolute -right-2 -bottom-6 font-display text-8xl font-extrabold text-ink/10 select-none md:text-9xl"
			>KAS</span
		>
		<h2 class="relative text-base font-bold text-ink md:text-lg">Saldo Kas</h2>
		<p
			class="tabular relative mt-1 font-display text-[32px] leading-tight font-extrabold break-words md:text-[40px]"
		>
			{formatRupiah(summary.balance)}
		</p>
	</div>
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
		<div class="card p-3 md:p-4">
			<h3 class="text-sm font-bold">Total Uang Masuk Lain</h3>
			<p class="tabular mt-1 text-lg font-extrabold break-words text-charcoal md:text-xl">
				{formatRupiah(summary.otherIncome)}
			</p>
		</div>
		<div class="card p-3 md:p-4">
			<h3 class="text-sm font-bold">Total Uang Keluar</h3>
			<p class="tabular mt-1 text-lg font-extrabold break-words text-charcoal md:text-xl">
				{formatRupiah(summary.totalExpense)}
			</p>
		</div>
		<div class="col-span-2 card p-3 sm:col-span-1 md:p-4">
			<h3 class="text-sm font-bold">Isi Gudang Bebek</h3>
			<p class="tabular mt-1 text-lg font-extrabold break-words text-charcoal md:text-xl">
				{formatKg(summary.stockGrams)}
				<span class="text-base font-bold">({summary.stockHeads} Ekor / Pak)</span>
			</p>
		</div>
	</div>
</section>
