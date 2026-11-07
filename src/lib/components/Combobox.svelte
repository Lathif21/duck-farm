<script lang="ts">
	// "Pick or add new" dropdown (UC11): searchable list, last row "+ Tambah "{text}"".
	// Submits `{name}Id` (picked option) and `{name}Name` (typed text); the server picks the
	// existing row by id or creates/matches by name case-insensitively (R-C5, R-SH7).
	type Option = { id: string; name: string };
	type Props = {
		id: string;
		name: string;
		label: string;
		options: Option[];
		selectedId?: string;
		text?: string;
		error?: string | null;
	};
	let {
		id,
		name,
		label,
		options,
		selectedId = $bindable(''),
		text = $bindable(''),
		error = null
	}: Props = $props();

	let open = $state(false);
	let active = $state(0);
	const listId = $derived(`${id}-list`);

	const query = $derived(text.trim().toLowerCase());
	const matches = $derived(
		query ? options.filter((o) => o.name.toLowerCase().includes(query)) : options
	);
	const exact = $derived(options.some((o) => o.name.toLowerCase() === query));
	const showAdd = $derived(query.length > 0 && !exact);
	const rowCount = $derived(matches.length + (showAdd ? 1 : 0));

	function pick(o: Option) {
		selectedId = o.id;
		text = o.name;
		open = false;
	}
	function addNew() {
		selectedId = '';
		text = text.trim();
		open = false;
	}
	function onInput() {
		selectedId = '';
		open = true;
		active = 0;
	}
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			open = true;
			active = Math.min(active + 1, rowCount - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = Math.max(active - 1, 0);
		} else if (e.key === 'Enter' && open && rowCount > 0) {
			e.preventDefault();
			if (active < matches.length) pick(matches[active]);
			else addNew();
		} else if (e.key === 'Escape') {
			open = false;
		}
	}
</script>

<div class="relative">
	<label class="label" for={id}>{label}</label>
	<input type="hidden" name="{name}Id" value={selectedId} />
	<input
		{id}
		name="{name}Name"
		bind:value={text}
		class="input"
		role="combobox"
		autocomplete="off"
		aria-expanded={open}
		aria-controls={listId}
		aria-autocomplete="list"
		aria-activedescendant={open && rowCount ? `${id}-opt-${active}` : undefined}
		aria-invalid={error ? 'true' : undefined}
		placeholder="Pilih atau ketik baru…"
		oninput={onInput}
		onfocus={() => (open = true)}
		onblur={() => (open = false)}
		onkeydown={onKeydown}
	/>
	{#if open && rowCount > 0}
		<ul
			id={listId}
			role="listbox"
			class="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border-2 border-line bg-white py-1 shadow-card"
		>
			{#each matches as o, i (o.id)}
				<li
					id="{id}-opt-{i}"
					role="option"
					aria-selected={o.id === selectedId}
					class="flex min-h-11 cursor-pointer items-center px-3 py-2 font-bold text-ink {i ===
					active
						? 'bg-cream'
						: ''}"
					onpointerdown={(e) => {
						e.preventDefault();
						pick(o);
					}}
				>
					{o.name}
				</li>
			{/each}
			{#if showAdd}
				<li
					id="{id}-opt-{matches.length}"
					role="option"
					aria-selected="false"
					class="flex min-h-11 cursor-pointer items-center px-3 py-2 font-extrabold text-primary-deep {active ===
					matches.length
						? 'bg-cream'
						: ''}"
					onpointerdown={(e) => {
						e.preventDefault();
						addNew();
					}}
				>
					+ Tambah "{text.trim()}"
				</li>
			{/if}
		</ul>
	{/if}
	{#if error}<p class="field-error">{error}</p>{/if}
</div>
