# Project Conventions

## Decisions live in the docs

- The plan in `.claude/docs/` is the source of truth. When code and docs disagree, stop and ask; the owner decides which one changes.
- Items marked **TBD** or **PROPOSAL** in `docs/11-open-questions-and-proposals.md` are undecided. Build only what is decided; ask the project owner about the rest.

## Language

- UI text in Bahasa Indonesia, written as everyday speech ("Uang Masuk", "Sisa Uang Tunai Tante"), never accounting jargon ("debit", "kredit", "jurnal").
- Code identifiers, comments, commits and docs in English.
- Keep all UI strings for a screen in that screen's component; no i18n framework (single language app).

## Stack

- SvelteKit with Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`). Use runes only, not Svelte 4 stores or `export let`.
- TypeScript `strict: true`. No `any`.
- Prisma ORM on Neon Postgres. All DB access in `src/lib/server/`; never import Prisma into client code.
- Mutations through SvelteKit form actions with server-side validation (zod). Client-side checks are for convenience only.
- Tailwind CSS using the design tokens in `docs/06-design-system.md`. Use tokens, not raw hex values, in components.

## Auth

- Every route except `/login` requires a signed-in user. Enforce in `hooks.server.ts`, not per page.
- Only the `ADMIN` role exists for now.
