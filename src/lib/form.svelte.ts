import type { SubmitFunction } from '$app/forms';
import { toast } from './toast.svelte';

export type FormFailure = {
	message?: string;
	errors?: Record<string, string>;
	values?: Record<string, string>;
};

const SAVE_FAILED = 'Gagal menyimpan. Periksa sinyal internet lalu coba lagi.';
const OFFLINE = 'Tidak ada sinyal internet. Catatan belum bisa disimpan.';

/**
 * State for one enhanced form (07, Loading & errors):
 * - the submit button shows "saving" and repeat taps are ignored (no double entries),
 * - errors stay with this form, and typed values are kept (the form is never reset on failure),
 * - on success the page data reloads, so the summary cards refresh (R-C2).
 */
export function useForm(opts: { success?: string; onSuccess?: (data: unknown) => void } = {}) {
	let saving = $state(false);
	let failure = $state<FormFailure | null>(null);

	const enhance: SubmitFunction = ({ cancel }) => {
		if (saving) return cancel();
		if (!navigator.onLine) {
			failure = { message: OFFLINE };
			return cancel();
		}
		saving = true;
		failure = null;
		return async ({ result, update }) => {
			try {
				if (result.type === 'failure') {
					failure = (result.data as FormFailure | undefined) ?? { message: SAVE_FAILED };
				} else if (result.type === 'error') {
					failure = { message: SAVE_FAILED };
				} else {
					await update({ reset: false });
					if (result.type === 'success') {
						if (opts.success) toast.show(opts.success);
						opts.onSuccess?.(result.data);
					}
				}
			} finally {
				saving = false;
			}
		};
	};

	return {
		enhance,
		get saving() {
			return saving;
		},
		get message() {
			return failure?.message ?? null;
		},
		error(field: string): string | null {
			return failure?.errors?.[field] ?? null;
		},
		clear() {
			failure = null;
		}
	};
}
