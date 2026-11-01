## 2025-05-20 - Keyboard Accessibility for Scrollable Code Output Panels
**Learning:** Scrollable code panels using `overflow-auto` with `<pre><code>` blocks are inaccessible to keyboard-only users unless explicitly focusable. Adding `tabIndex={0}`, `role="region"`, and an `aria-label` enables arrow key scrolling and proper screen reader region announcements.
**Action:** Always include `tabIndex={0}`, `role="region"`, and descriptive `aria-label` on custom scrollable code containers in code generator components.

## 2025-05-21 - Line Number Screen Reader Isolation and Focus-Visible Ring Polish
**Learning:** In code preview components, screen readers read line numbers sequentially as body text unless line number blocks have `aria-hidden="true"`. Furthermore, modal dialogs must lock background scrolling with `document.body.style.overflow = 'hidden'` and maintain clear `focus-visible:ring-2` focus rings across all interactive controls.
**Action:** Always apply `aria-hidden="true"` to line number columns in code view panels and enforce explicit `focus-visible:ring-2` on all buttons, range sliders, and inputs.

## 2025-05-22 - Bidirectional Roving Tabindex for W3C ARIA Tablists
**Learning:** In tablists (`role="tablist"`), keyboard accessibility standard requires roving tabindex: only the active tab should receive `tabIndex={0}` while all other tabs receive `tabIndex={-1}`. When supporting RTL languages (such as Persian), horizontal arrow key semantics must be inverted (`ArrowLeft` navigates forward and `ArrowRight` navigates backward in RTL) alongside `Home`/`End` shortcuts so keyboard users can seamlessly navigate without tabbing through every tab.
**Action:** Always implement roving tabindex (`tabIndex={active ? 0 : -1}`) and directionality-aware arrow key listeners (`isFa ? ArrowLeft : ArrowRight`) on horizontal tablist elements.
