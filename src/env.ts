import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

// DIRECT_URL (migrations) is read by prisma.config.ts only, not by the app.
// Receipt storage uses S3_* names, not the AWS_* names Neon prints: Vercel reserves
// AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION for its own runtime.
export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Neon pooled connection string, used by the app at runtime.'
	},
	S3_ENDPOINT: {
		description: 'Neon Object Storage endpoint of the branch. Receipts are optional until set.',
		schema: optional
	},
	S3_REGION: { description: 'Neon Object Storage region, e.g. us-east-2.', schema: optional },
	S3_BUCKET: { description: 'Private bucket for receipts.', schema: optional },
	S3_ACCESS_KEY_ID: { description: 'Neon Object Storage access key id.', schema: optional },
	S3_SECRET_ACCESS_KEY: { description: 'Neon Object Storage secret key.', schema: optional }
});
