import { defineEnvVars } from '@sveltejs/kit/env';

// DIRECT_URL (migrations) is read by prisma.config.ts only, not by the app.
export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Neon pooled connection string, used by the app at runtime.'
	},
	BLOB_READ_WRITE_TOKEN: {
		description: 'Vercel Blob (private store) token for receipts. Optional until the store exists.',
		schema: (value) => value || undefined
	}
});
