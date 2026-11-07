// Runs the integration tests against a throwaway Neon branch (doc 10: never `main`, never dev).
// Usage: set TEST_DATABASE_URL in .env (or the shell), then `npm run test:integration`.
// The tests EMPTY every table first, so this refuses to run against DATABASE_URL / DIRECT_URL.
import 'dotenv/config';
import { spawnSync } from 'node:child_process';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
	console.error('TEST_DATABASE_URL is not set. Point it at a throwaway Neon branch.');
	process.exit(1);
}
if (testUrl === process.env.DATABASE_URL || testUrl === process.env.DIRECT_URL) {
	console.error('TEST_DATABASE_URL must not be the dev/production database: the tests wipe it.');
	process.exit(1);
}

const run = (cmd, env) => {
	const r = spawnSync(cmd, { stdio: 'inherit', shell: true, env: { ...process.env, ...env } });
	if (r.status !== 0) process.exit(r.status ?? 1);
};
run('npx prisma migrate deploy', { DIRECT_URL: testUrl });
run('npx vitest --run --project integration', { DATABASE_URL: testUrl, RUN_INTEGRATION: '1' });
