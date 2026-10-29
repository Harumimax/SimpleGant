---
name: feature-workflow
description: Implement or change SimpleGant product features across the React frontend, NestJS API, Prisma/PostgreSQL schema, authentication, Gantt editor, public viewer, tests, and local runtime setup. Do not use for pure Git-only or documentation-only tasks.
---

# SimpleGant Feature Workflow

Use `docs/architecture.md` as the product and architecture source of truth. Read the relevant sections before making design decisions. If the requested behavior conflicts with that document, call out the conflict instead of silently changing the product model.

## Stack

- Frontend: React, TypeScript, Vite, TanStack Query, Zustand, dnd-kit, date-fns, Tailwind CSS.
- Backend: NestJS and TypeScript.
- Persistence: PostgreSQL and Prisma migrations.
- Authentication: email/password with bcrypt; use secure HTTP-only cookies for sessions unless the implemented codebase has already standardized on another documented approach.
- Runtime: local PostgreSQL for current development; Docker Compose is optional and may be added later for a reproducible environment.

Prefer the conventions already present in the repository when implementation has begun. Do not add a dependency when the current stack or a small local implementation is sufficient.

## Workflow

1. Inspect the affected code, tests, and relevant architecture sections.
2. State the intended behavior and identify the smallest complete feature slice.
3. List the files expected to change before editing.
4. Implement within existing module boundaries; avoid unrelated refactors.
5. Add or update tests in proportion to the behavioral risk.
6. Run the narrowest relevant checks first, then broader checks when shared contracts changed.
7. Summarize the behavior delivered, verification performed, and any manual or migration steps.

If architecture, security assumptions, persisted entities, API contracts, or module ownership changes, update `docs/architecture.md` in the same task.

## Product Invariants

- A project has one registered owner. Only the owner can mutate it.
- Public access uses an unguessable project token and is read-only without registration.
- Public responses expose only project data intended for the viewer; never expose owner credentials, password hashes, internal session data, or other private records.
- A project has a required start and end date and is loaded as one Gantt aggregate: project, columns, tasks, milestones, and non-working days.
- A project-wide setting chosen at creation controls whether derived task duration excludes weekends and project non-working days. It is immutable in the MVP.
- A project supports at most 10 task columns. Custom columns are text-only in the MVP and belong to one project.
- Default columns are `Название`, `Тип работ`, `Исполнитель`, `Длительность`, and `Статус`.
- Task statuses are fixed: `Ожидает`, `В работе`, `На паузе`, `Завершено`, and `Заблокировано`.
- Task dates have day precision. Persist `startDate` and `endDate`; derive duration instead of storing an independent duration value.
- When only one boundary date is supplied during task creation, calculate the other from the explicit duration or the default two-week duration using the project calendar policy. Two explicit boundaries take precedence and are not recalculated.
- Derive duration from the explicit date range using the project calendar policy. When exclusions are enabled, count only working days and allow zero for a range containing no working days.
- Dragging or resizing a task bar sets its dates directly. Do not shift the selected range around weekends or non-working days, but recompute its displayed duration using the project calendar policy.
- Task nesting is limited to five levels. Prevent cycles and cross-project parent references.
- Parent task dates are derived from descendants and cannot be edited directly while the task has children.
- Reordering and reparenting must preserve deterministic sibling order and valid nesting.
- Collapsing a parent hides descendants in both the task table and timeline presentation.
- Milestones belong to the project and render as named vertical lines across the timeline.
- Non-working days are project-specific and selected one date at a time in the MVP.
- Task colors come from the fixed soft palette; validate the palette value on the server rather than trusting arbitrary client input.
- Editing uses local frontend draft state and debounced sequential autosave. Never let an older save response overwrite a newer local revision.
- Editing and public viewing are desktop-first; a mobile interface is outside the MVP.
- Real-time collaboration, history, dependencies, export, undo/redo, editable status lists, OAuth, and password-protected public links are outside the MVP.

## Frontend Boundaries

- TanStack Query owns server data fetching and mutation lifecycle.
- Zustand owns the editable local Gantt draft, dirty state, and coordinated table/timeline interactions.
- Keep the task table and timeline aligned through a shared flattened visible-row model; do not maintain competing row-order calculations.
- Keep calendar calculations in testable pure functions using `date-fns`.
- Ensure table and timeline use stable row dimensions so scrolling, drag previews, and task bars stay aligned.
- The public viewer must reuse read-only presentation components where practical, with editing controls and mutations unavailable by construction.

## Backend Boundaries

- Controllers validate transport input and delegate business rules to services.
- Services enforce ownership, hierarchy, date rules, ordering, and parent-date recalculation.
- Prisma is the persistence boundary; schema changes require a migration.
- Use database transactions when a save changes multiple related rows or recalculates hierarchy data.
- The aggregate save endpoint must validate the complete submitted state before committing it. Reject invalid hierarchy, dates, column limits, status values, colors, and references atomically.
- Do not trust `ownerId`, `projectId`, hierarchy level, parent dates, or derived duration supplied by the client.
- Protect authenticated state-changing requests against CSRF when cookie-based authentication is used.
- Apply rate limiting to authentication and public-token endpoints when infrastructure for it is introduced.

## Verification Priorities

Prioritize tests for:

- ownership and public read-only authorization;
- password and session handling;
- task hierarchy depth, cycles, and reparenting;
- automatic parent date ranges;
- weekend and non-working-day date calculation;
- deterministic task ordering;
- atomic aggregate saves and rollback on invalid input;
- task bar date calculations at day, week, and month zoom levels;
- synchronized visibility and row alignment between the table and timeline;
- public viewer behavior without edit capabilities;
- UTF-8 handling of Russian interface text.
