## 2025-05-20 - Keyboard Accessibility for Scrollable Code Output Panels
**Learning:** Scrollable code panels using `overflow-auto` with `<pre><code>` blocks are inaccessible to keyboard-only users unless explicitly focusable. Adding `tabIndex={0}`, `role="region"`, and an `aria-label` enables arrow key scrolling and proper screen reader region announcements.
**Action:** Always include `tabIndex={0}`, `role="region"`, and descriptive `aria-label` on custom scrollable code containers in code generator components.

## 2025-05-21 - Line Number Screen Reader Isolation and Focus-Visible Ring Polish
**Learning:** In code preview components, screen readers read line numbers sequentially as body text unless line number blocks have `aria-hidden="true"`. Furthermore, modal dialogs must lock background scrolling with `document.body.style.overflow = 'hidden'` and maintain clear `focus-visible:ring-2` focus rings across all interactive controls.
**Action:** Always apply `aria-hidden="true"` to line number columns in code view panels and enforce explicit `focus-visible:ring-2` on all buttons, range sliders, and inputs.

## 2025-05-22 - Bilingual RTL/LTR Skip-to-Content Landmark Navigation
**Learning:** In bilingual Single Page Apps with sticky top headers and privacy banners, keyboard and screen reader users must tab through repeated header navigation links on every page view unless an accessible skip-to-content link is provided. When switching document direction between RTL (`fa`) and LTR (`en`), skip links positioned with `focus:left-*` overlap brand logos unless mirrored with `rtl:focus:left-auto rtl:focus:right-*`.
**Action:** Always pair `href="#main-content"` with `tabIndex={-1}` and `focus:outline-none` on `<main>`, and use directional responsive utility classes (`focus:left-4 rtl:focus:left-auto rtl:focus:right-4`) for floating skip-link components.
