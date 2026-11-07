import { fail, redirect } from '@sveltejs/kit';
import { login, setSessionCookie } from '#lib/server/auth.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/kas');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');
		if (!username || !password) {
			return fail(400, { username, message: 'Isi nama pengguna dan kata sandi.' });
		}
		const result = await login(username, password);
		if (!result.ok) {
			const message =
				result.reason === 'rate_limited'
					? 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.'
					: 'Nama pengguna atau kata sandi salah.';
			return fail(400, { username, message });
		}
		setSessionCookie(cookies, result.token, result.expiresAt);
		redirect(303, '/kas');
	}
};
