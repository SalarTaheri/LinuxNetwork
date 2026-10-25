## 2025-05-20 - Keyboard Accessibility for Scrollable Code Output Panels
**Learning:** Scrollable code panels using `overflow-auto` with `<pre><code>` blocks are inaccessible to keyboard-only users unless explicitly focusable. Adding `tabIndex={0}`, `role="region"`, and an `aria-label` enables arrow key scrolling and proper screen reader region announcements.
**Action:** Always include `tabIndex={0}`, `role="region"`, and descriptive `aria-label` on custom scrollable code containers in code generator components.

## 2025-05-21 - Line Number Screen Reader Isolation and Focus-Visible Ring Polish
**Learning:** In code preview components, screen readers read line numbers sequentially as body text unless line number blocks have `aria-hidden="true"`. Furthermore, modal dialogs must lock background scrolling with `document.body.style.overflow = 'hidden'` and maintain clear `focus-visible:ring-2` focus rings across all interactive controls.
**Action:** Always apply `aria-hidden="true"` to line number columns in code view panels and enforce explicit `focus-visible:ring-2` on all buttons, range sliders, and inputs.

## 2025-05-22 - WAI-ARIA Roving Tabindex and RTL Arrow Navigation in Tablists
**Learning:** Standard `<button>` elements inside `role="tablist"` require roving `tabIndex={active ? 0 : -1}` to ensure the tablist is a single Tab stop for keyboard navigation. When `lang === 'fa'` (RTL), ArrowRight and ArrowLeft must invert directions so ArrowRight navigates to the visual previous tab and ArrowLeft to the visual next tab, while Home/End keys navigate to boundary tabs.
**Action:** Always apply `tabIndex={active ? 0 : -1}` on `role="tab"` buttons and include RTL-aware Arrow, Home, and End key navigation.
