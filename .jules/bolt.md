## 2025-05-18 - Nginx Config Memoization in React Tool
**Learning:** Config generator functions produce multi-line strings via array concatenation and conditionals. When React components re-render (e.g. state/prop updates or parent re-renders), recalculating these generator functions on every render frame creates garbage collection pressure and unnecessary thread processing.
**Action:** Wrap config generator function calls and derived bash one-liners in `useMemo([settings, lang])` in all generator tool components.

## 2025-05-19 - Pre-computed CIDR Cache for Subnet Calculations
**Learning:** For bounded domain parameters (such as IPv4 CIDR prefix lengths 0..32), netmask-derived string representations, binary forms, and host counts are constant. Recomputing netmask string conversions, bitwise operations, and hex padding during interactive calculation introduces unnecessary CPU cycles and allocations.
**Action:** Pre-compute static lookup tables for bounded mathematical ranges (e.g., CIDR prefixes 0..32) at module load time to make sub-millisecond calculation loops ~2.6x faster.

## 2025-05-20 - Batched Alpha Bucketing for Canvas Edge Rendering
**Learning:** In 60 FPS Canvas background animations, issuing individual `beginPath()`, `stroke()`, and `rgba(...)` string allocations per edge creates thousands of Canvas engine context switches and CSS color parsing operations per second.
**Action:** Group canvas paths into discrete alpha buckets to batch multiple line drawing operations into a single `beginPath()`/`stroke()` call per opacity level, eliminating string allocations and reducing canvas draw calls by up to 95%.

## 2026-09-26 - Zero-Allocation Canvas Animation Frame Buckets
**Learning:** In continuous 60 FPS requestAnimationFrame loops, allocating bucket arrays and temporary objects on each animation tick creates steady V8 heap churn and garbage collection pauses. Furthermore, benchmarks measuring canvas drawing optimizations must simulate Canvas context method calls (`stroke()`, `beginPath()`) to account for native engine call overhead rather than just tracking numeric counts.
**Action:** Declare bucket collections outside the render loop and reset array lengths (`bucket.length = 0`) each frame for zero-allocation 60 FPS animation.
