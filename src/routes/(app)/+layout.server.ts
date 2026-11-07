import { getSummary } from '#lib/server/cash.js';
import type { LayoutServerLoad } from './$types';

// Re-runs after every form action (enhance refreshes all data), so the cards stay current (R-C2).
export const load: LayoutServerLoad = async ({ locals }) => {
	return { user: locals.user!, summary: await getSummary() };
};
