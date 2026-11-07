import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, clearSessionCookie, logout } from '#lib/server/auth.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get(SESSION_COOKIE);
	if (token) await logout(token);
	clearSessionCookie(cookies);
	redirect(303, '/login');
};
