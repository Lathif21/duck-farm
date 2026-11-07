# CLAUDE.md — Pembukuan Cold Storage Bebek

Cash book, construction shopping list and duck-meat warehouse app for a family cold-storage business. Stack: SvelteKit (Svelte 5) + TypeScript + Prisma + Neon Postgres + Tailwind, deployed on Vercel, receipts on Vercel Blob.

## Read before working

- `.claude/rules/` — always-on rules. Start with `karpathy-guidelines.md`, then the project rules.
- `.claude/docs/README.md` — index of the project plan (business context, rules, data model, screens, tasks).
- `.claude/docs/11-open-questions-and-proposals.md` — anything marked **TBD** or **PROPOSAL** is not decided. Stop and ask the project owner before building it.

## Skills

- `data-table` — building any list/table screen.
- `linked-cash-transaction` — any record that creates, edits or deletes money in the cash book.
- `prisma-migration` — any change to `prisma/schema.prisma`.

## Language

- UI text: Bahasa Indonesia (everyday words, no accounting jargon).
- Code, comments, commit messages, docs: English.
