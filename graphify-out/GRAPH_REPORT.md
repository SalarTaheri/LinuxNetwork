# Graph Report - LinuxNetwork  (2026-09-12)

## Corpus Check
- 30 files · ~22,824 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 175 nodes · 326 edges · 11 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- React UI Components
- Development Tools & Build Dependencies
- Runtime Server & AI Dependencies
- TypeScript Configuration
- WireGuard Cryptography Tool
- Linux Server Setup Script
- Package Manifest & Scripts
- Subnet & CIDR Calculator Tool
- Nginx Generator & Component

## God Nodes (most connected - your core abstractions)
1. `Language` - 19 edges
2. `compilerOptions` - 15 edges
3. `calculateSubnet()` - 11 edges
4. `main()` - 11 edges
5. `translations` - 9 edges
6. `scripts` - 9 edges
7. `apply_hardening()` - 7 edges
8. `CodeOutputPanel()` - 6 edges
9. `WireGuardTool()` - 6 edges
10. `apply_kernel_tuning()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `NginxToolProps` --references--> `Language`  [EXTRACTED]
  src/components/NginxTool.tsx → src/types.ts
- `CodeOutputPanelProps` --references--> `Language`  [EXTRACTED]
  src/components/CodeOutputPanel.tsx → src/types.ts
- `HeaderProps` --references--> `Language`  [EXTRACTED]
  src/components/Header.tsx → src/types.ts
- `SetupScriptToolProps` --references--> `Language`  [EXTRACTED]
  src/components/SetupScriptTool.tsx → src/types.ts
- `SubnetToolProps` --references--> `Language`  [EXTRACTED]
  src/components/SubnetTool.tsx → src/types.ts

## Import Cycles
- None detected.

## Communities (11 total, 0 thin omitted)

### Community 0 - "React UI Components"
Cohesion: 0.12
Nodes (30): App(), VALID_TABS, CodeOutputPanel(), CodeOutputPanelProps, Header(), HeaderProps, SEOHead(), SEOHeadProps (+22 more)

### Community 1 - "Development Tools & Build Dependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, esbuild, devDependencies, autoprefixer, esbuild, tailwindcss, tsx, @types/express (+11 more)

### Community 2 - "Runtime Server & AI Dependencies"
Cohesion: 0.11
Nodes (19): dotenv, express, @google/genai, lucide-react, motion, dependencies, dotenv, express (+11 more)

### Community 3 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): DOM, DOM.Iterable, ES2022, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules (+10 more)

### Community 4 - "WireGuard Cryptography Tool"
Cohesion: 0.22
Nodes (14): RFC-7748, WireGuardTool(), WireGuardSettings, decodeLittleEndian(), encodeLittleEndian(), generateWireGuardKeyPair(), modInverse(), modPow() (+6 more)

### Community 5 - "Linux Server Setup Script"
Cohesion: 0.33
Nodes (17): apply_hardening(), apply_kernel_tuning(), backup_file(), check_root(), detect_os(), install_docker(), install_tools(), log_error() (+9 more)

### Community 6 - "Package Manifest & Scripts"
Cohesion: 0.12
Nodes (15): engines, node, name, private, scripts, build, clean, deploy (+7 more)

### Community 7 - "Subnet & CIDR Calculator Tool"
Cohesion: 0.33
Nodes (12): RFC-3021, SubnetTool(), SubnetCalculation, calculateSubnet(), cidrToNetmaskInt(), getIpClass(), getIpScope(), intToBinary() (+4 more)

### Community 8 - "Nginx Generator & Component"
Cohesion: 0.52
Nodes (5): NginxTool(), NginxToolProps, NginxSettings, generateNginxConfig(), generateNginxOneLiner()

## Knowledge Gaps
- **54 isolated node(s):** `WireGuardKeyPair`, `VALID_TABS`, `BANDWIDTH_TIERS`, `RAM_SIZES`, `SERVER_PROFILES` (+49 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Development Tools & Build Dependencies` to `Package Manifest & Scripts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Server & AI Dependencies` to `Package Manifest & Scripts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `Language` connect `React UI Components` to `Nginx Generator & Component`, `WireGuard Cryptography Tool`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `WireGuardKeyPair`, `VALID_TABS`, `BANDWIDTH_TIERS` to the rest of the system?**
  _54 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `React UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.1173054587688734 - nodes in this community are weakly interconnected._
- **Should `Development Tools & Build Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Runtime Server & AI Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._