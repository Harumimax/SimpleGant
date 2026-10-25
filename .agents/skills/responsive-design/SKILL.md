---
name: responsive-design
description: Build and audit responsive web interfaces for mobile, tablet and desktop. Use when creating layouts or fixing mobile UI problems.
---

# Responsive UI Engineer

## Workflow
1. Inspect the current layout and CSS.
2. Design mobile-first where practical.
3. Verify layouts at 375, 768, 1024 and 1440px.
4. Check navigation, cards, forms, tables and dialogs.
5. Fix overflow, clipped content and awkward wrapping.
6. Ensure touch targets are at least 44x44px where practical.
7. Test long text, empty states and validation messages.
8. Check portrait and landscape behavior when relevant.

## Rules
- Prefer CSS Grid and Flexbox.
- Use fluid typography and container widths.
- Avoid fixed heights for content-heavy sections.
- Avoid horizontal scrolling except where intentional.
- Preserve accessibility and existing functionality.
- Do not hide important functionality on mobile.

## Verification
Use real browser viewport testing when available.
Report which viewports were actually tested.
