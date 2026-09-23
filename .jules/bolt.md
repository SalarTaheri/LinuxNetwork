## 2025-05-18 - Nginx Config Memoization in React Tool
**Learning:** Config generator functions produce multi-line strings via array concatenation and conditionals. When React components re-render (e.g. state/prop updates or parent re-renders), recalculating these generator functions on every render frame creates garbage collection pressure and unnecessary thread processing.
**Action:** Wrap config generator function calls and derived bash one-liners in `useMemo([settings, lang])` in all generator tool components.

## 2025-05-19 - Pre-computed CIDR Cache for Subnet Calculations
**Learning:** For bounded domain parameters (such as IPv4 CIDR prefix lengths 0..32), netmask-derived string representations, binary forms, and host counts are constant. Recomputing netmask string conversions, bitwise operations, and hex padding during interactive calculation introduces unnecessary CPU cycles and allocations.
**Action:** Pre-compute static lookup tables for bounded mathematical ranges (e.g., CIDR prefixes 0..32) at module load time to make sub-millisecond calculation loops ~2.6x faster.

## 2025-05-20 - Pre-Formatted Line Numbers String in Code Viewers
**Learning:** Rendering code line numbers via `Array.from().map()` creates N VDOM element descriptors and N DOM div nodes on every render pass. Replacing individual line-number elements with a single memoized newline-separated string rendered in a <pre> element reduces DOM node allocations from O(N) to O(1) while maintaining pixel-perfect line-height alignment.
**Action:** Use a single memoized newline-delimited string in a <pre> block with leading-* line height for code viewer line numbers instead of mapping element arrays.
