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
