import { PrismaNeon } from '@prisma/adapter-neon';
import { DATABASE_URL } from '$app/env/private';
import { PrismaClient } from './generated/prisma/client';

const globalForDb = globalThis as unknown as { db?: PrismaClient };

// One client per server process; reused across dev HMR reloads.
export const db =
	globalForDb.db ??
	new PrismaClient({ adapter: new PrismaNeon({ connectionString: DATABASE_URL }) });

globalForDb.db = db;

export type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/** Lower-case trimmed key for case-insensitive uniqueness (R-C5, R-SH7, R-S4). */
export function nameKey(name: string): string {
	return name.trim().replace(/\s+/g, ' ').toLowerCase();
}
