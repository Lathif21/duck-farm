# 01 — Business Context

## The business

A family is building a **cold storage room** (−18 °C to −20 °C) for **duck meat**, funded by **Rp 70.000.000 cash from Tante**. The business runs in two connected phases:

- **Phase 1 — Construction (CAPEX).** The cash pays for building the cold room. Budgets usually leak through small technical items (anti-mold sealant, door rubber heater, breather valve, under-floor air pipe, control cable, workers' daily wages) that are forgotten or recorded on scattered paper receipts.
- **Phase 2 — Duck meat trading (OPEX).** The family buys duck carcasses from farmers/slaughterhouses (cash out → stock in) and sells to restaurants/markets (stock out → cash in).

## Users

### Tante — owner of the capital, main treasurer

- **Pains:** money "leaks" in small amounts unnoticed; misreads zeros when typing big numbers on a phone (1500000 = 150 rb or 1,5 jt?); tiny tables that need sideways scrolling; doesn't understand contractor terms ("Breather Valve", "Styrofoam XPS").
- **Needs:** a big "Saldo Kas" box at the top; automatic thousand separators while typing; a plain-language explanation for every shopping-list item, shown in full.

### Family members — site supervisors & warehouse managers

- **Pains:** forgetting vital cold-storage parts; recording the same transaction twice (warehouse book + cash book); ducks counted in heads (ekor/pak) but priced per kg; many unplanned purchases.
- **Needs:** a guide shopping list plus a form for unlisted items; one-click link from shopping list / warehouse to the cash book; recording ekor and kg together with automatic `kg × price/kg`.

## Success metrics (from PRD)

- **Zero confusion for Tante:** she can read the balance, construction spending and item explanations without asking or scrolling sideways.
- **Zero discrepancy:** app balance equals physical cash.
- **< 15 seconds per transaction**, in 3 short steps, with automatic multiplication and thousand separators.

## Goal of the cash book (from the team, Nov 2026)

Break down **every** income and expense in detail, easy to track, and make it obvious at a glance what adds (+) and what reduces (−) the balance.
