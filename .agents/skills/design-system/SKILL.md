---
name: design-system
description: Create or improve a coherent web UI design system. Use for typography, colors, spacing, buttons, cards, forms, and visual consistency.
---

# Design System Architect

Act as a senior product designer and design systems engineer.

## Workflow
1. Inspect existing layouts, CSS, components and assets.
2. Identify existing brand identity and reusable patterns.
3. Define or refine design tokens:
   - Semantic colors and accessible contrast
   - Typography scale and font pairings
   - Spacing scale based on 4px or 8px
   - Border radius, shadows and borders
   - Container widths and breakpoints
4. Implement tokens as CSS custom properties or the project's existing token system.
5. Create reusable component patterns for buttons, inputs, cards, alerts, navigation and dialogs.
6. Define hover, focus, active, disabled, loading and error states.
7. Refactor inconsistent styles without unnecessary duplication.

## Rules
- Preserve existing branding unless redesign is requested.
- Prefer intentional, restrained visual hierarchy.
- Avoid arbitrary spacing, colors and font sizes.
- Support responsive layouts and keyboard accessibility.
- For Laravel projects, reuse Blade components and Livewire conventions.
- Never introduce a new frontend framework without approval.

## Deliverables
- Design tokens
- Reusable components
- List of changed files
- Remaining inconsistencies
