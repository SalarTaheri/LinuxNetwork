## 2025-05-20 - Keyboard Accessibility for Scrollable Code Output Panels
**Learning:** Scrollable code panels using `overflow-auto` with `<pre><code>` blocks are inaccessible to keyboard-only users unless explicitly focusable. Adding `tabIndex={0}`, `role="region"`, and an `aria-label` enables arrow key scrolling and proper screen reader region announcements.
**Action:** Always include `tabIndex={0}`, `role="region"`, and descriptive `aria-label` on custom scrollable code containers in code generator components.
