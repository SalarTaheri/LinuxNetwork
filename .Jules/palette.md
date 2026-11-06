## 2025-05-20 - Keyboard Accessibility for Scrollable Code Output Panels
**Learning:** Scrollable code panels using `overflow-auto` with `<pre><code>` blocks are inaccessible to keyboard-only users unless explicitly focusable. Adding `tabIndex={0}`, `role="region"`, and an `aria-label` enables arrow key scrolling and proper screen reader region announcements.
**Action:** Always include `tabIndex={0}`, `role="region"`, and descriptive `aria-label` on custom scrollable code containers in code generator components.

## 2025-05-21 - Line Number Screen Reader Isolation and Focus-Visible Ring Polish
**Learning:** In code preview components, screen readers read line numbers sequentially as body text unless line number blocks have `aria-hidden="true"`. Furthermore, modal dialogs must lock background scrolling with `document.body.style.overflow = 'hidden'` and maintain clear `focus-visible:ring-2` focus rings across all interactive controls.
**Action:** Always apply `aria-hidden="true"` to line number columns in code view panels and enforce explicit `focus-visible:ring-2` on all buttons, range sliders, and inputs.

## 2025-05-22 - Bilingual Skip to Main Content Bypass Blocks with RTL/LTR Positioning
**Learning:** In bilingual RTL/LTR single-page web applications with dense header toolbars (privacy banner, branding, navigation switcher, GitHub link, language switcher), keyboard and screen reader users must tab through multiple interactive elements on every page load. Providing a `sr-only focus:not-sr-only` skip link with localized strings and directional positioning (`focus:left-3 rtl:focus:left-auto rtl:focus:right-3`) targeting `<main id="main-content" tabIndex={-1}>` satisfies WCAG 2.4.1 Bypass Blocks without visual intrusion for pointer users.
**Action:** Always pair skip-to-content links with `tabIndex={-1}` on target `<main>` and include RTL-aware focus positioning (`rtl:focus:left-auto rtl:focus:right-3`).
