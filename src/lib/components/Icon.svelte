<script lang="ts">
	// Small inline icon set (stroke icons, 24×24 viewBox). Decorative unless `label` is given.
	const PATHS = {
		wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Zm13 6h2',
		duck: 'M8 7a3 3 0 1 1 5.5 1.7L12 11h5a3 3 0 0 1 3 3 5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-1l4-2V7Zm2 0h.01M14 7.5l2.5-.5',
		list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
		receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6M9 16h3',
		sortAsc: 'M12 5l-5 6h10l-5-6Z',
		sortDesc: 'M12 19l5-6H7l5 6Z',
		sortNone: 'M12 4l-4 5h8l-4-5Zm0 16l4-5H8l4 5Z',
		alert:
			'M12 9v4m0 4h.01M10.3 3.9 2.6 17.4A2 2 0 0 0 4.3 20.4h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
		check: 'M5 12.5l4.5 4.5L19 7.5',
		close: 'M6 6l12 12M18 6 6 18',
		search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5-2 4 4',
		plus: 'M12 5v14M5 12h14',
		dots: 'M5 12h.01M12 12h.01M19 12h.01',
		logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10',
		download: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14',
		chevronLeft: 'M15 6l-6 6 6 6',
		chevronRight: 'M9 6l6 6-6 6',
		wifiOff:
			'M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 4.2-2.4M19 12.9a10 10 0 0 0-2.3-1.6M2 9a15 15 0 0 1 4.5-2.8M22 9a15 15 0 0 0-11-4M12 20h.01'
	} as const;

	type Props = { name: keyof typeof PATHS; size?: number; class?: string; label?: string };
	let { name, size = 22, class: cls = '', label }: Props = $props();
	const filled = $derived(name.startsWith('sort'));
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={filled ? 'currentColor' : 'none'}
	stroke={filled ? 'none' : 'currentColor'}
	stroke-width="2.2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class="shrink-0 {cls}"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>
	<path d={PATHS[name]} />
</svg>
