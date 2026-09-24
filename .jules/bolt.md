## 2025-05-18 - Nginx Config Memoization in React Tool
**Learning:** Config generator functions produce multi-line strings via array concatenation and conditionals. When React components re-render (e.g. state/prop updates or parent re-renders), recalculating these generator functions on every render frame creates garbage collection pressure and unnecessary thread processing.
**Action:** Wrap config generator function calls and derived bash one-liners in `useMemo([settings, lang])` in all generator tool components.

## 2025-05-19 - Pre-computed CIDR Cache for Subnet Calculations
**Learning:** For bounded domain parameters (such as IPv4 CIDR prefix lengths 0..32), netmask-derived string representations, binary forms, and host counts are constant. Recomputing netmask string conversions, bitwise operations, and hex padding during interactive calculation introduces unnecessary CPU cycles and allocations.
**Action:** Pre-compute static lookup tables for bounded mathematical ranges (e.g., CIDR prefixes 0..32) at module load time to make sub-millisecond calculation loops ~2.6x faster.

## 2025-05-20 - Canvas 2D Numeric Opacity vs Dynamic String Allocations in 60FPS Loops
**Learning:** Constructing dynamic RGBA string templates inside high-frequency `requestAnimationFrame` loops (60+ FPS) forces V8 string generation, heap allocations, and browser CSS color parsing on every frame. Using static hex color constants combined with the primitive numeric `ctx.globalAlpha` property bypasses string parsing and GC pressure, speeding up node drawing by ~53.6%.
**Action:** In Canvas 2D animation loops, set static color fills once and modulate opacity via numeric `ctx.globalAlpha` rather than allocating dynamic `rgba(...)` string templates per element.
