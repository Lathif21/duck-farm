<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Icon from '#lib/components/Icon.svelte';
	import SummaryCards from '#lib/components/SummaryCards.svelte';
	import { toast } from '#lib/toast.svelte.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const nav = [
		{ path: 'kas', short: '1. Uang Kas', long: 'Buku Uang Kas', icon: 'wallet' },
		{ path: 'gudang', short: '2. Stok Bebek', long: 'Gudang Daging Bebek', icon: 'duck' },
		{ path: 'belanja', short: '3. Daftar Belanja', long: 'Daftar Belanja Bangunan', icon: 'list' }
	] as const;
	const isActive = (path: string) => page.url.pathname.startsWith(`/${path}`);

	// Interim offline behaviour until T4 is decided (08, Offline).
	let online = $state(true);
	$effect(() => {
		online = navigator.onLine;
		const set = () => (online = navigator.onLine);
		window.addEventListener('online', set);
		window.addEventListener('offline', set);
		return () => {
			window.removeEventListener('online', set);
			window.removeEventListener('offline', set);
		};
	});
</script>

<header class="bg-brown text-white">
	<div class="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-8">
		<a
			href={resolve('kas')}
			class="font-display text-lg leading-tight font-extrabold text-white md:text-xl"
		>
			Pembukuan Cold Storage Bebek
		</a>
		<nav class="hidden flex-1 gap-1 md:flex" aria-label="Menu utama">
			{#each nav as n (n.path)}
				<a
					href={resolve(n.path)}
					class="flex min-h-11 items-center rounded-pill px-4 font-bold {isActive(n.path)
						? 'bg-primary text-ink'
						: 'text-white hover:bg-white/10'}"
					aria-current={isActive(n.path) ? 'page' : undefined}>{n.long}</a
				>
			{/each}
		</nav>
		<div class="ml-auto flex items-center gap-2">
			<span class="font-semibold">{data.user.name}</span>
			<form method="POST" action="/logout">
				<button
					class="flex min-h-11 items-center gap-1 rounded-pill px-3 font-bold text-white hover:bg-white/10"
				>
					<Icon name="logout" size={20} />Keluar
				</button>
			</form>
		</div>
	</div>
</header>

{#if !online}
	<div class="bg-danger px-4 py-2 text-center font-bold text-white" role="status">
		<span class="inline-flex items-center gap-2">
			<Icon name="wifiOff" size={20} />Tidak ada sinyal internet. Catatan belum bisa disimpan.
		</span>
	</div>
{/if}

<main class="mx-auto max-w-[1200px] space-y-6 px-4 pt-4 pb-32 md:px-8 md:pt-6 md:pb-12">
	<SummaryCards summary={data.summary} />
	{@render children()}
</main>

<!-- Phone: floating bottom bar (06) -->
<nav
	class="fixed inset-x-3 bottom-3 z-40 rounded-pill bg-charcoal p-1.5 shadow-card md:hidden"
	aria-label="Menu utama"
>
	<ul class="grid grid-cols-3 gap-1">
		{#each nav as n (n.path)}
			<li>
				<a
					href={resolve(n.path)}
					class="flex min-h-14 flex-col items-center justify-center rounded-pill px-1 text-center text-xs leading-tight font-extrabold {isActive(
						n.path
					)
						? 'bg-primary text-ink'
						: 'text-white'}"
					aria-current={isActive(n.path) ? 'page' : undefined}
				>
					<Icon name={n.icon} size={22} />
					{n.short}
				</a>
			</li>
		{/each}
	</ul>
</nav>

{#if toast.message}
	<div
		class="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center gap-2 rounded-xl bg-success px-4 py-3 font-bold text-white shadow-card md:bottom-6"
		role="status"
	>
		<Icon name="check" />{toast.message}
	</div>
{/if}
