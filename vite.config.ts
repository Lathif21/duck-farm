import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Functions next to the Neon project in Singapore (08, Regions).
			adapter: adapter({ regions: ['sin1'] })
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/**/*.int.spec.ts']
				}
			},
			{
				// Real Postgres; run only via `npm run test:integration` (scripts/test-integration.mjs).
				extends: './vite.config.ts',
				test: {
					name: 'integration',
					environment: 'node',
					include: ['src/**/*.int.spec.ts'],
					fileParallelism: false,
					testTimeout: 30_000,
					hookTimeout: 30_000
				}
			}
		]
	}
});
