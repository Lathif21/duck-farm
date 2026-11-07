import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
	// Unpooled URL, for migrate/seed. Read as optional (not `env()`, which throws)
	// so `prisma generate` works in builds that have no database URL.
	datasource: { url: process.env.DIRECT_URL ?? '' }
});
