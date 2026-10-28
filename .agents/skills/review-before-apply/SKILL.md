---
name: review-before-apply
description: Make non-trivial SimpleGant changes reviewable before implementation. Use for multi-file work, schema or API changes, authentication, Gantt interaction logic, hierarchy changes, refactors, or external integrations.
---

# Review Before Apply

For non-trivial work, first inspect `docs/architecture.md` and the affected implementation. Then present a compact pre-edit review containing:

- the user-visible goal;
- assumptions and any architecture conflicts;
- the smallest complete implementation slice;
- files expected to change;
- verification planned.

Call out only risks that apply. Typical SimpleGant risks are:

- authentication, project ownership, public-token leakage, CSRF, and password handling;
- data migration, transaction boundaries, partial aggregate saves, and stale client state;
- invalid task hierarchy, cycles, depth above five levels, or incorrect parent date ranges;
- table/timeline row drift, date rounding, zoom calculations, drag/resize behavior, and performance near 150 tasks;
- breaking the desktop read-only public viewer or exposing editing operations through a public link.

After the review, implement the agreed scope unless the user explicitly asked for review only. Prefer one coherent feature slice over a broad rewrite.

After implementation, report:

- what changed;
- exact checks run and their outcome;
- migration or deployment steps;
- a rollback approach when the change affects persisted data or authentication.
