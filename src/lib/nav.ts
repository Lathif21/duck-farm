import { goto } from '$app/navigation';
import { page } from '$app/state';

/**
 * Same-page navigation that only changes the query string (table filters, sort, page, ?edit=),
 * so reload/back keep the state (R-T5). Empty values remove the parameter.
 */
export function setQuery(
	changes: Record<string, string | null>,
	opts: { resetPage?: boolean; replace?: boolean; reset?: boolean } = {}
): Promise<void> {
	const url = new URL(page.url.href);
	for (const [k, v] of Object.entries(changes)) {
		if (v) url.searchParams.set(k, v);
		else url.searchParams.delete(k);
	}
	if (opts.resetPage) url.searchParams.delete('page');
	// The path is the current (already resolved) one; only the query changes.
	// eslint-disable-next-line svelte/no-navigation-without-resolve
	return goto(url, { replace: opts.replace ?? true, reset: opts.reset ?? false });
}
