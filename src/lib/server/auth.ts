import { createHash, randomBytes } from 'node:crypto';
import { verify } from '@node-rs/argon2';
import type { Cookies } from '@sveltejs/kit';
import { db, nameKey } from './db';

// Auth (08): username + password, DB sessions, 30 days, renewed when < 15 days remain.
export const SESSION_COOKIE = 'session';
const DAY = 24 * 60 * 60 * 1000;
const SESSION_DAYS = 30;
const RENEW_BELOW_DAYS = 15;
const MAX_FAILED = 5;
const FAILED_WINDOW_MS = 15 * 60 * 1000;

export type SessionUser = { id: string; username: string; name: string };

function sessionId(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export type LoginResult =
	{ ok: true; token: string; expiresAt: Date } | { ok: false; reason: 'invalid' | 'rate_limited' };

export async function login(username: string, password: string): Promise<LoginResult> {
	const key = nameKey(username);
	const since = new Date(Date.now() - FAILED_WINDOW_MS);
	const failed = await db.loginAttempt.count({
		where: { usernameKey: key, createdAt: { gt: since } }
	});
	if (failed >= MAX_FAILED) return { ok: false, reason: 'rate_limited' };

	const user = await db.user.findUnique({ where: { username: key } });
	const valid = user ? await verify(user.passwordHash, password) : false;
	if (!user || !valid) {
		await db.loginAttempt.create({ data: { usernameKey: key } });
		return { ok: false, reason: 'invalid' };
	}

	await db.loginAttempt.deleteMany({ where: { usernameKey: key } });
	const token = randomBytes(20).toString('base64url');
	const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
	await db.session.create({ data: { id: sessionId(token), userId: user.id, expiresAt } });
	return { ok: true, token, expiresAt };
}

/** Returns the user for a session token, renewing the session when it is getting old. */
export async function validateSession(
	token: string
): Promise<{ user: SessionUser; renewedUntil: Date | null } | null> {
	const id = sessionId(token);
	const session = await db.session.findUnique({
		where: { id },
		include: { user: { select: { id: true, username: true, name: true } } }
	});
	if (!session) return null;

	const now = Date.now();
	if (session.expiresAt.getTime() <= now) {
		await db.session.delete({ where: { id } });
		return null;
	}

	let renewedUntil: Date | null = null;
	if (session.expiresAt.getTime() - now < RENEW_BELOW_DAYS * DAY) {
		renewedUntil = new Date(now + SESSION_DAYS * DAY);
		await db.session.update({ where: { id }, data: { expiresAt: renewedUntil } });
	}
	return { user: session.user, renewedUntil };
}

export async function logout(token: string): Promise<void> {
	await db.session.deleteMany({ where: { id: sessionId(token) } });
}

export function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date): void {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		expires: expiresAt
	});
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
