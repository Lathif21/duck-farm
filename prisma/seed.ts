// Idempotent seed (skill prisma-migration): re-running never duplicates anything.
// 1. Initial capital (R-C3). 2. Work sections + starter items (doc 12). No categories, no duck types.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/lib/server/generated/prisma/client.ts';

type SeedData = {
	sections: { number: number; name: string }[];
	items: { number: number; section: number; name: string; unit: string; explanation: string }[];
};

const url = process.env.DIRECT_URL;
if (!url) throw new Error('DIRECT_URL is not set (see .env.example).');
const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });

// Date of the initial capital entry. Open question T1 (doc 11): the owner hasn't given the
// project start date yet. Set CAPITAL_DATE=YYYY-MM-DD; defaults to today in Jakarta.
const capitalDate =
	process.env.CAPITAL_DATE ??
	new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

const key = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

async function main() {
	const capital = await db.cashEntry.findFirst({ where: { source: 'INITIAL_CAPITAL' } });
	if (!capital) {
		await db.cashEntry.create({
			data: {
				date: new Date(`${capitalDate}T00:00:00Z`),
				direction: 'IN',
				source: 'INITIAL_CAPITAL',
				description: 'Uang Tunai dari Tante untuk Modal Pembangunan Cold Storage',
				total: 70_000_000
			}
		});
		console.log(`Initial capital Rp 70.000.000 created, dated ${capitalDate}.`);
	}

	const data = JSON.parse(
		readFileSync(new URL('./seed-data.json', import.meta.url), 'utf8')
	) as SeedData;
	const sectionIds = new Map<number, string>();
	for (const s of data.sections) {
		const section = await db.workSection.upsert({
			where: { nameKey: key(s.name) },
			create: { number: s.number, name: s.name, nameKey: key(s.name) },
			update: {}
		});
		sectionIds.set(s.number, section.id);
	}
	for (const it of data.items) {
		await db.shoppingItem.upsert({
			where: { number: it.number },
			create: {
				number: it.number,
				name: it.name,
				unit: it.unit,
				explanation: it.explanation,
				sectionId: sectionIds.get(it.section)!,
				isSeed: true
			},
			update: {} // admin edits win; never overwrite them (R-SH1)
		});
	}
	// Move the number sequence past seeded numbers without ever moving it back (R-SH2).
	await db.$executeRaw`
		SELECT setval('shopping_item_number_seq', GREATEST(
			(SELECT COALESCE(MAX(number), 1) FROM "ShoppingItem"),
			(SELECT last_value FROM shopping_item_number_seq)))`;
	console.log(`Seeded ${data.sections.length} sections and ${data.items.length} starter items.`);
}

main()
	.catch((err) => {
		console.error(err);
		process.exitCode = 1;
	})
	.finally(() => db.$disconnect());
