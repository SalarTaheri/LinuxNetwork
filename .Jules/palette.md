## 2025-05-20 - Keyboard Accessibility for Scrollable Code Output Panels
**Learning:** Scrollable code panels using `overflow-auto` with `<pre><code>` blocks are inaccessible to keyboard-only users unless explicitly focusable. Adding `tabIndex={0}`, `role="region"`, and an `aria-label` enables arrow key scrolling and proper screen reader region announcements.
**Action:** Always include `tabIndex={0}`, `role="region"`, and descriptive `aria-label` on custom scrollable code containers in code generator components.

## 2025-05-21 - Line Number Screen Reader Isolation and Focus-Visible Ring Polish
**Learning:** In code preview components, screen readers read line numbers sequentially as body text unless line number blocks have `aria-hidden="true"`. Furthermore, modal dialogs must lock background scrolling with `document.body.style.overflow = 'hidden'` and maintain clear `focus-visible:ring-2` focus rings across all interactive controls.
**Action:** Always apply `aria-hidden="true"` to line number columns in code view panels and enforce explicit `focus-visible:ring-2` on all buttons, range sliders, and inputs.

## 2025-05-22 - Bilingual RTL/LTR Skip-to-Content Pattern
**Learning:** Applications with top header bars, banners, and tool navigation create tedious repetitive tab stops for keyboard and screen-reader users. A skip-to-content link must be positioned as the first child of the app wrapper, use CSS logical properties (`focus:start-3`) to support both RTL (Persian) and LTR (English) seamlessly, and target `<main id="main-content" tabIndex={-1}>` with `focus:outline-none`.
**Action:** Always provide a bilingual skip link using Tailwind's `sr-only focus:not-sr-only` and `start-*` logical properties at the root app level.
