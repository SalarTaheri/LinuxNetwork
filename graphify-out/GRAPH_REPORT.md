# Graph Report - LinuxNetwork  (2026-09-12)

## Corpus Check
- 52 files · ~48,184 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 346 nodes · 489 edges · 33 communities (24 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fd63f566`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- types.ts
- devDependencies
- dependencies
- compilerOptions
- WireGuardTool.tsx
- setup.sh
- scripts
- subnetCalculator.ts
- What You Must Do When Invoked
- vite.config.ts
- What You Must Do When Invoked
- 🌐 LinuxNetwork.ir
- راهنمای جامع دیپلوی روی Cloudflare Pages (linuxnetwork.ir)
- graphify reference: extra exports and benchmark
- graphify reference: extra exports and benchmark
- graphify reference: query, path, explain
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native AGENTS.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- .agents/skills/graphify/references/extraction-spec.md
- CLAUDE.md
- .claude/CLAUDE.md
- .claude/skills/graphify/references/extraction-spec.md

## God Nodes (most connected - your core abstractions)
1. `Language` - 21 edges
2. `compilerOptions` - 15 edges
3. `What You Must Do When Invoked` - 12 edges
4. `What You Must Do When Invoked` - 12 edges
5. `main()` - 11 edges
6. `calculateSubnet()` - 11 edges
7. `/graphify` - 10 edges
8. `/graphify` - 10 edges
9. `scripts` - 9 edges
10. `apply_hardening()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `WireGuardToolProps` --references--> `Language`  [EXTRACTED]
  src/components/WireGuardTool.tsx → src/types.ts
- `CodeOutputPanelProps` --references--> `Language`  [EXTRACTED]
  src/components/CodeOutputPanel.tsx → src/types.ts
- `DistroBadgesProps` --references--> `Language`  [EXTRACTED]
  src/components/DistroBadges.tsx → src/types.ts
- `HeaderProps` --references--> `Language`  [EXTRACTED]
  src/components/Header.tsx → src/types.ts
- `NginxToolProps` --references--> `Language`  [EXTRACTED]
  src/components/NginxTool.tsx → src/types.ts

## Import Cycles
- None detected.

## Communities (33 total, 9 thin omitted)

### Community 0 - "types.ts"
Cohesion: 0.09
Nodes (39): App(), VALID_TABS, CodeOutputPanel(), CodeOutputPanelProps, DistroBadges(), DistroBadgesProps, DistroInfo, DISTROS (+31 more)

### Community 1 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, esbuild, devDependencies, autoprefixer, esbuild, tailwindcss, tsx, @types/express (+11 more)

### Community 2 - "dependencies"
Cohesion: 0.11
Nodes (19): dotenv, express, @google/genai, lucide-react, motion, dependencies, dotenv, express (+11 more)

### Community 3 - "compilerOptions"
Cohesion: 0.11
Nodes (18): DOM, DOM.Iterable, ES2022, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules (+10 more)

### Community 4 - "WireGuardTool.tsx"
Cohesion: 0.19
Nodes (16): RFC-7748, WireGuardTool(), WireGuardToolProps, WireGuardSettings, decodeLittleEndian(), encodeLittleEndian(), generateWireGuardKeyPair(), modInverse() (+8 more)

### Community 5 - "setup.sh"
Cohesion: 0.28
Nodes (20): apply_hardening(), apply_kernel_tuning(), backup_file(), check_root(), detect_os(), ensure_epel_repo(), install_docker(), install_tools() (+12 more)

### Community 6 - "scripts"
Cohesion: 0.12
Nodes (15): engines, node, name, private, scripts, build, clean, deploy (+7 more)

### Community 7 - "subnetCalculator.ts"
Cohesion: 0.36
Nodes (11): RFC-3021, SubnetTool(), calculateSubnet(), cidrToNetmaskInt(), getIpClass(), getIpScope(), intToBinary(), intToIp() (+3 more)

### Community 8 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native AGENTS.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 11 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 12 - "🌐 LinuxNetwork.ir"
Cohesion: 0.08
Nodes (23): Build & Production Test, Cloudflare Direct Deployment, 🤝 Contributing, ✨ Features, 📄 License, 🌐 LinuxNetwork.ir, 🚀 Local Development, Prerequisites (+15 more)

### Community 13 - "راهنمای جامع دیپلوی روی Cloudflare Pages (linuxnetwork.ir)"
Cohesion: 0.20
Nodes (9): راهنمای جامع دیپلوی روی Cloudflare Pages (linuxnetwork.ir), ۱. تنظیم سکرت‌ها در گیت‌هاب (Repository Secrets), ۱. تنظیمات اعمال‌شده در پروژه, ۲. دیپلوی خودکار نسخه‌بندی‌شده با GitHub Actions (بر اساس Tag), ۲. غیرفعال‌سازی بیلد خودکار در داشبورد کلودفلر (جهت جلوگیری از تداخل), ۳. روش دستی از طریق داشبورد گیت‌هاب / گیت‌لب (Cloudflare Pages Git Integration), ۳. روش دوم: دیپلوی مستقیم با CLI (Wrangler), ۳. نحوه ایجاد و انتشار نسخه جدید (+1 more)

### Community 14 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 15 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 16 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 17 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 18 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 19 - "graphify reference: commit hook and native AGENTS.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native AGENTS.md integration, graphify reference: commit hook and native AGENTS.md integration

### Community 20 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 21 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 22 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 23 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

## Knowledge Gaps
- **167 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+162 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `Language` connect `types.ts` to `WireGuardTool.tsx`, `subnetCalculator.ts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _167 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0899854862119013 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._