<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let saving = $state(false);
</script>

<svelte:head><title>Masuk — Pembukuan Cold Storage Bebek</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
	<div class="relative overflow-hidden rounded-card bg-primary p-6 text-ink shadow-card">
		<span
			aria-hidden="true"
			class="pointer-events-none absolute -right-2 -bottom-6 font-display text-8xl font-extrabold text-ink/10"
			>KAS</span
		>
		<p class="relative font-display text-sm font-bold tracking-wide uppercase">Selamat datang</p>
		<h1 class="relative font-display text-3xl leading-tight font-extrabold text-ink">
			Pembukuan Cold Storage Bebek
		</h1>
	</div>

	<form
		method="POST"
		class="mt-4 space-y-4 card p-5"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update();
				saving = false;
			};
		}}
	>
		<h2 class="text-2xl font-bold">Masuk</h2>
		{#if form?.message}
			<p class="alert" role="alert"><Icon name="alert" />{form.message}</p>
		{/if}
		<div>
			<label class="label" for="username">Nama Pengguna</label>
			<input
				id="username"
				name="username"
				class="input"
				autocomplete="username"
				autocapitalize="none"
				value={form?.username ?? ''}
				required
			/>
		</div>
		<div>
			<label class="label" for="password">Kata Sandi</label>
			<input
				id="password"
				name="password"
				type="password"
				class="input"
				autocomplete="current-password"
				required
			/>
		</div>
		<button class="btn-primary w-full" disabled={saving}>{saving ? 'Memeriksa…' : 'Masuk'}</button>
	</form>
</main>
