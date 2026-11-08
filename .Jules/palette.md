## 2025-05-20 - Keyboard Accessibility for Scrollable Code Output Panels
**Learning:** Scrollable code panels using `overflow-auto` with `<pre><code>` blocks are inaccessible to keyboard-only users unless explicitly focusable. Adding `tabIndex={0}`, `role="region"`, and an `aria-label` enables arrow key scrolling and proper screen reader region announcements.
**Action:** Always include `tabIndex={0}`, `role="region"`, and descriptive `aria-label` on custom scrollable code containers in code generator components.

## 2025-05-21 - Line Number Screen Reader Isolation and Focus-Visible Ring Polish
**Learning:** In code preview components, screen readers read line numbers sequentially as body text unless line number blocks have `aria-hidden="true"`. Furthermore, modal dialogs must lock background scrolling with `document.body.style.overflow = 'hidden'` and maintain clear `focus-visible:ring-2` focus rings across all interactive controls.
**Action:** Always apply `aria-hidden="true"` to line number columns in code view panels and enforce explicit `focus-visible:ring-2` on all buttons, range sliders, and inputs.

## 2025-05-22 - Bilingual Skip-to-Content Navigation with Logical Positioning
**Learning:** In bilingual apps supporting both LTR (English) and RTL (Persian) directions, skip links must use logical directional positioning (`start-3` instead of `left-3`) combined with `focus:fixed focus:z-50 focus:not-sr-only` to ensure proper positioning regardless of language, and the target container (`<main id="main-content">`) must have `tabIndex={-1}` and `focus:outline-none` for consistent cross-browser programmatic focus.
**Action:** Always use logical positioning (`start-*`) and pair `<a href="#main-content">` with `<main id="main-content" tabIndex={-1}>` on root layouts.
