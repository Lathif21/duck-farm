// Creates (or resets the password of) an admin account. No signup page exists (08, Auth).
// Usage: npm run create-admin -- --username tante --name "Tante"
import 'dotenv/config';
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline';
import { hash } from '@node-rs/argon2';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/lib/server/generated/prisma/client.ts';

const { values } = parseArgs({
	options: { username: { type: 'string' }, name: { type: 'string' } }
});
const username = values.username?.trim().toLowerCase();
const name = values.name?.trim();
if (!username || !name) {
	console.error('Usage: npm run create-admin -- --username tante --name "Tante"');
	process.exit(1);
}

// One readline for all prompts (a second interface would miss already-buffered lines).
// While `muted`, the terminal echo of typed characters is swallowed so passwords stay hidden.
const write = process.stdout.write.bind(process.stdout);
let muted = false;
process.stdout.write = ((chunk: string | Uint8Array, ...rest: never[]) =>
	muted ? true : write(chunk, ...rest)) as typeof process.stdout.write;
const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: !!process.stdin.isTTY
});
const lines = rl[Symbol.asyncIterator]();

async function askHidden(question: string): Promise<string> {
	write(question);
	muted = true;
	const next = await lines.next();
	muted = false;
	write('\n');
	if (next.done) throw new Error('No input.');
	return next.value;
}

async function main() {
	const password = await askHidden('Password (min. 8 characters): ');
	if (password.length < 8) throw new Error('Password must be at least 8 characters.');
	if ((await askHidden('Repeat password: ')) !== password)
		throw new Error('Passwords do not match.');
	rl.close();

	const url = process.env.DIRECT_URL;
	if (!url) throw new Error('DIRECT_URL is not set (see .env.example).');
	const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
	try {
		const passwordHash = await hash(password);
		await db.user.upsert({
			where: { username: username! },
			create: { username: username!, name: name!, passwordHash },
			update: { name, passwordHash }
		});
		console.log(`Admin "${username}" (${name}) is ready.`);
	} finally {
		await db.$disconnect();
	}
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : err);
	process.exitCode = 1;
});
