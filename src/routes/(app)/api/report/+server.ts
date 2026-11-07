import { error, json } from '@sveltejs/kit';
import { isDateOnly } from '#lib/dates.js';
import { getReport } from '#lib/server/cash.js';
import type { RequestHandler } from './$types';

// JSON for the PDF report (08, PDF report). Auth is enforced in hooks.server.ts.
export const GET: RequestHandler = async ({ url, locals }) => {
	const from = url.searchParams.get('from') ?? '';
	const to = url.searchParams.get('to') ?? '';
	if (!isDateOnly(from) || !isDateOnly(to) || from > to) error(400, 'Tanggal tidak valid.');
	const report = await getReport(from, to);
	return json({ ...report, printedBy: locals.user!.name, printedAt: new Date().toISOString() });
};
