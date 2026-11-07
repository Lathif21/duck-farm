import { json, redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import {
	SESSION_COOKIE,
	clearSessionCookie,
	setSessionCookie,
	validateSession
} from '#lib/server/auth.js';

// Every route except /login requires a signed-in user (project-conventions: enforced here, not per page).
const PUBLIC_PATHS = new Set(['/login']);

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const session = await validateSession(token);
		if (session) {
			event.locals.user = session.user;
			if (session.renewedUntil) setSessionCookie(event.cookies, token, session.renewedUntil);
		} else {
			clearSessionCookie(event.cookies);
		}
	}

	const path = event.url.pathname;
	if (!event.locals.user && !PUBLIC_PATHS.has(path)) {
		if (path.startsWith('/api/') || path.startsWith('/nota/')) {
			return json({ message: 'Silakan masuk dulu.' }, { status: 401 });
		}
		redirect(303, '/login');
	}
	return resolve(event);
};
