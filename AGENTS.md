# SimpleGant Engineering Guidelines

## Source Of Truth

Read `docs/architecture.md` before making architectural or product decisions. It defines the MVP scope, entities, business rules, modules, API direction, and delivery order.

If a requested change conflicts with the documented architecture, identify the conflict before implementation. Update `docs/architecture.md` when a task changes persisted entities, API contracts, module ownership, security assumptions, or MVP scope.

## Product

SimpleGant is a Russian-language, desktop-first web application for creating Excel-like Gantt charts. A registered owner edits a project, while anyone with its unguessable public link can view it without registration.

Core MVP rules:

- A project has exactly one owner; only that owner can modify it.
- Public access is read-only and must not expose private user or session data.
- A project has required start and end dates.
- A project chooses at creation whether task duration excludes weekends and its manually marked non-working days. This setting is project-wide and immutable in the MVP.
- The task table supports at most 10 project-specific columns.
- Default columns are `Название`, `Тип работ`, `Исполнитель`, `Оценка`, and `Статус`.
- Custom columns are text-only in the MVP.
- Fixed statuses are `Ожидает`, `В работе`, `На паузе`, `Завершено`, and `Заблокировано`.
- Tasks support at most five nesting levels. Cycles and cross-project parents are invalid.
- Parent dates are derived from descendants and are not manually editable while children exist.
- Task dates have day precision. Store `startDate` and `endDate`; derive duration.
- When the project calendar policy is enabled, derived task duration excludes weekends and project non-working days, including for explicit ranges and after drag/resize. Dragging or resizing still sets dates directly without shifting the chosen range. A range containing no working days has duration zero.
- Milestones are named project-wide vertical timeline markers.
- Task colors must come from a fixed soft palette.
- Editing happens in local draft state and is persisted by debounced sequential autosave; stale responses must never overwrite a newer draft.
- Editing and public viewing are desktop-first; a mobile interface is outside the MVP.

Out of scope for the MVP: real-time collaboration, edit roles, history, dependencies, export, undo/redo, editable status lists, OAuth, password-protected public links, and comment stickers.

## Stack

Frontend:

- React
- TypeScript
- Vite
- TanStack Query for server state
- Zustand for the editable Gantt draft and dirty state
- dnd-kit for reordering and reparenting
- date-fns for calendar calculations
- Tailwind CSS

Backend:

- NestJS
- TypeScript
- PostgreSQL
- Prisma and Prisma migrations
- bcrypt for password hashing
- Secure HTTP-only cookie sessions or the documented authentication approach already established in the codebase
- Local PostgreSQL for development; Docker Compose may be added later as an optional reproducible environment

Inspect the actual project before assuming a dependency or convention already exists. Do not introduce another application framework without approval.

## Architecture Boundaries

Frontend:

- TanStack Query owns loading, caching, and autosave mutation lifecycle for server data.
- Zustand owns unsaved editor state and coordinated table/timeline interactions.
- The table and timeline must use one shared flattened visible-row model and stable row dimensions.
- Calendar and coordinate calculations should be pure, testable functions.
- Reuse read-only presentation components in the public viewer, but exclude mutation controls and handlers by construction.

Backend:

- Controllers validate transport input and delegate business behavior to services.
- Services enforce ownership, hierarchy, ordering, date rules, and parent-date recalculation.
- Prisma is the persistence boundary; schema changes require migrations.
- Multi-entity Gantt saves must be atomic and use database transactions.
- Never trust client-supplied ownership, project membership, hierarchy level, parent dates, duration, status, or color values.

## API Direction

The editor loads one aggregate containing the project, columns, tasks, milestones, and non-working days:

- `GET /projects/:id/gantt`
- `PUT /projects/:id/gantt`
- `GET /public/projects/:publicToken/gantt`

Keep public endpoints read-only. Validate the complete aggregate before committing a save, and reject invalid submissions atomically.

## Frontend Quality

Treat frontend work as both engineering and product design work.

For substantial UI changes:

1. Understand the user journey and inspect existing components and tokens.
2. Choose a restrained, work-focused visual direction suited to a planning tool.
3. Build reusable, responsive components with accessible interaction states.
4. Keep the task table and timeline visually aligned during scrolling, dragging, resizing, and collapsing.
5. Verify the result in a browser at supported desktop sizes.
6. Refine visible layout, overflow, contrast, and interaction problems before finishing.

Avoid marketing-style layouts, oversized decorative elements, nested cards, generic dashboard decoration, and visual effects that reduce information density or timeline readability.

## Security

- Hash passwords with bcrypt and never log or return credentials or password hashes.
- Use unguessable public tokens.
- Enforce project ownership on every authenticated mutation.
- Protect cookie-authenticated state-changing requests against CSRF.
- Validate IDs and project relationships server-side.
- Do not commit `.env`, secrets, database dumps, session data, or private keys.
- Add rate limiting to authentication and public-token endpoints when that infrastructure is introduced.

## Testing

Add or update tests for changed behavior. Prioritize:

- authentication, ownership, and public read-only access;
- hierarchy depth, cycles, reparenting, and deterministic ordering;
- automatic parent date ranges;
- weekend and non-working-day calculations;
- atomic aggregate saving and rollback;
- day, week, and month timeline calculations;
- table/timeline row alignment and collapsed visibility;
- desktop public viewing without mutation controls;
- UTF-8 handling of Russian text.

Run focused tests first, then broader checks when shared contracts change. For frontend work, verify in a browser and use screenshots when possible.

## Skills

Use relevant installed repository skills:

- `feature-workflow` for product implementation
- `review-before-apply` for non-trivial or multi-file changes
- `safe-git-workflow` before repository modifications
- `frontend-design` for new screens or major visual direction
- `design-system` for shared visual tokens and components
- `responsive-design` for adaptive layouts
- `ux-review` for usability audits
- `visual-qa` for browser and screenshot verification
- `frontend-polish` for refining an existing interface

## Working Constraints

- Prefer small, complete, reviewable feature slices.
- Preserve existing conventions and unrelated user changes.
- Do not add dependencies without a concrete need.
- Do not refactor unrelated code.
- Keep Russian source and interface text in UTF-8 without mojibake.
- Do not implement deferred features unless the user explicitly expands the MVP scope.

## Reporting

After changes, summarize:

- what changed;
- what user-visible behavior was delivered;
- what was tested and the results;
- migrations, setup, or manual steps;
- remaining limitations or risks.
