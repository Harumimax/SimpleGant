---
name: visual-qa
description: Visually test web pages using a browser and screenshots. Use after frontend changes to identify layout problems and iterate until the UI meets quality requirements.
---

# Visual Quality Assurance

## Workflow
1. Identify the local development URL.
2. Start the application if needed and permitted.
3. Open the page using available browser automation.
4. Capture screenshots at desktop and mobile sizes.
5. Inspect screenshots for:
   - Alignment and spacing errors
   - Overflow and clipping
   - Inconsistent typography
   - Poor contrast
   - Broken images and icons
   - Unbalanced visual composition
   - Unexpected empty areas
6. Inspect browser console errors.
7. Fix identified issues.
8. Repeat screenshots after corrections.
9. Run relevant frontend tests.

## Rules
- Never claim visual verification without actual screenshots.
- Never claim browser testing if browser tools are unavailable.
- Do not modify unrelated functionality.
- Prefer real rendered output over assumptions from CSS.
- Check loading, error and empty states where possible.

## Completion Criteria
- No obvious visual regressions
- No unintended horizontal overflow
- Readable typography and usable controls
- Responsive layouts verified
- No new relevant console errors

Report tested pages, viewports and remaining issues.
