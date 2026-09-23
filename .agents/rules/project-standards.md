---
trigger: always_on
---

# LinuxNetwork Project Development Standards

## 1. Package Management
- Always use `pnpm` exclusively for this project (`pnpm test`, `pnpm lint`, `pnpm build`, `pnpm install`).
- Do NOT invoke `npm` or `npx` directly, as local binaries (such as `tsx` and `wrangler`) are linked through pnpm's virtual store.

## 2. Non-ASCII & Persian Text Editing
- When editing bilingual files (such as `src/data/seoConfig.ts`, `src/i18n/translations.ts`, or UI components containing Persian strings):
  - Persian text may contain zero-width non-joiners (ZWNJ, `\u200c` / نیم‌فاصله).
  - Always anchor replacement chunks around unambiguous ASCII boundaries (property keys, commas, brackets `],`, or curly braces `{`) rather than large multi-line Persian text blocks to prevent mismatch errors.

## 3. SEO & Route Synchronization
- Whenever a new tool, route, or feature is added to the toolbox:
  1. Add its entry with bidirectional `hreflang` tags (`fa` and `en`) in `public/sitemap.xml`.
  2. Define its bilingual SEO metadata (title, description, keywords, features) in `src/data/seoConfig.ts`.
  3. Keep `index.html` static `<noscript>` semantic fallback synchronized so search engine bots index the new tool.
  4. Ensure both SVG and PNG Open Graph banners exist if social share imagery is updated.
  5. Keep `public/llms.txt` synchronized with the new tool's link and description for LLM/AI crawlers.

## 4. Performance & Core Web Vitals (CLS & Asset Loading)
- **Canvas & Replaced Elements:**
  - Dynamic canvas backgrounds (such as `NetworkBackground.tsx`) and media overlays must always have explicit full-size CSS classes (`w-full h-full`) and style dimensions (`width: 100%; height: 100%; contain: strict`).
  - Never rely on default intrinsic canvas dimensions (300x150) before JavaScript initializes, as mutating `canvas.width` after mount causes severe layout shifts (`CLS = 1.0`).
- **Font Loading:**
  - External stylesheets (such as Google Fonts) must use asynchronous preloading (`rel="preload" as="style"` with `onload="this.onload=null;this.rel='stylesheet'"`) paired with a `<noscript>` stylesheet fallback to prevent render-blocking delays.

## 5. Accessibility (WCAG 2.1 AA Standards)
- **Label in Name (WCAG 2.5.3):**
  - Whenever an interactive element (button or link) has visible text, its `aria-label` or accessible name must include or begin with the exact visible text string (e.g. `aria-label="LinuxNetwork.ir - ..."` or `aria-label={`${t.switchLang} (...)`}`). Never use an `aria-label` that omits the visible text, as it breaks speech-to-text control.
- **Sequential Heading Hierarchy:**
  - Heading levels must descend sequentially without skipping levels (`h1` -> `h2` -> `h3` -> `h4`). Never jump directly from `h2` to `h4`.
- **Color Contrast:**
  - Text against dark surfaces (such as `#070b12` or `#090d16`) must maintain a minimum contrast ratio of 4.5:1. Use `text-slate-400` or lighter for readable text; do not use `text-slate-500` on deep dark backgrounds.
