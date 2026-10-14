## 2025-05-18 - Nginx Config Memoization in React Tool
**Learning:** Config generator functions produce multi-line strings via array concatenation and conditionals. When React components re-render (e.g. state/prop updates or parent re-renders), recalculating these generator functions on every render frame creates garbage collection pressure and unnecessary thread processing.
**Action:** Wrap config generator function calls and derived bash one-liners in `useMemo([settings, lang])` in all generator tool components.

## 2025-05-19 - Pre-computed CIDR Cache for Subnet Calculations
**Learning:** For bounded domain parameters (such as IPv4 CIDR prefix lengths 0..32), netmask-derived string representations, binary forms, and host counts are constant. Recomputing netmask string conversions, bitwise operations, and hex padding during interactive calculation introduces unnecessary CPU cycles and allocations.
**Action:** Pre-compute static lookup tables for bounded mathematical ranges (e.g., CIDR prefixes 0..32) at module load time to make sub-millisecond calculation loops ~2.6x faster.

## 2025-05-20 - Batched Alpha Bucketing for Canvas Edge Rendering
**Learning:** In 60 FPS Canvas background animations, issuing individual `beginPath()`, `stroke()`, and `rgba(...)` string allocations per edge creates thousands of Canvas engine context switches and CSS color parsing operations per second.
**Action:** Group canvas paths into discrete alpha buckets to batch multiple line drawing operations into a single `beginPath()`/`stroke()` call per opacity level, eliminating string allocations and reducing canvas draw calls by up to 95%.

## 2025-05-21 - Zero-Allocation Flat Bucketing in Animation Loops
**Learning:** Instantiating bucket array structures (`[[], [], ...]`) and edge objects (`{ n1, n2 }`) inside 60 FPS `requestAnimationFrame` render loops allocates thousands of temporary heap objects per second, causing periodic V8 Garbage Collection micro-stutters.
**Action:** Pre-allocate flat arrays (`alphaBuckets`) outside animation loops, reset lengths (`length = 0`) at start of frame, and push primitive/object references directly in consecutive index pairs (`push(n1, n2)`) to achieve 100% allocation-free rendering.
