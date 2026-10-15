## 2025-05-20 - Keyboard Accessibility for Scrollable Code Output Panels
**Learning:** Scrollable code panels using `overflow-auto` with `<pre><code>` blocks are inaccessible to keyboard-only users unless explicitly focusable. Adding `tabIndex={0}`, `role="region"`, and an `aria-label` enables arrow key scrolling and proper screen reader region announcements.
**Action:** Always include `tabIndex={0}`, `role="region"`, and descriptive `aria-label` on custom scrollable code containers in code generator components.

## 2025-05-21 - Line Number Screen Reader Isolation and Focus-Visible Ring Polish
**Learning:** In code preview components, screen readers read line numbers sequentially as body text unless line number blocks have `aria-hidden="true"`. Furthermore, modal dialogs must lock background scrolling with `document.body.style.overflow = 'hidden'` and maintain clear `focus-visible:ring-2` focus rings across all interactive controls.
**Action:** Always apply `aria-hidden="true"` to line number columns in code view panels and enforce explicit `focus-visible:ring-2` on all buttons, range sliders, and inputs.

## 2025-05-22 - Form Input Label Click-to-Focus and Screen Reader Association
**Learning:** Form input controls lacking explicit `htmlFor` on `<label>` elements and matching `id` on `<input>` elements impede both screen reader field announcements and click-to-focus mouse/touch accessibility. Adding matching `htmlFor` and `id` attributes alongside `cursor-pointer` on labels enables instant focus delegation upon label interaction.
**Action:** Always pair `<label htmlFor="...">` with `<input id="...">` and include `cursor-pointer` on labels across configuration generator forms.
