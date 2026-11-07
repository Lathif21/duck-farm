# UI Rules

- Mobile-first. Design at 375px width first, then laptop. Zero horizontal page scroll at any width.
- Lists and tables: use the shared `DataTable` (skill `data-table`). On phones every row renders as a vertical card; on laptop as a table.
- Inputs: font-size at least 17px and bold, so iOS/Android never auto-zoom.
- Touch targets at least 44×44px.
- Long text (item explanations, notes) wraps fully; never truncate with ellipsis.
- Colors only from the tokens in `docs/06-design-system.md`. Text on the primary orange uses `ink` (dark), never white.
- Every destructive action (delete) asks for confirmation and states what else changes ("Catatan di Buku Uang Kas juga akan dihapus").
- Every money change refreshes the summary cards immediately after save.
