## 2026-09-18 - WireGuard Generator Input Sanitization
**Vulnerability:** WireGuard generator functions accepted un-sanitized user inputs and interpolated them into single-quoted bash scripts (`sudo bash -c '...'`) and configuration directives, enabling arbitrary command injection and configuration directive injection.
**Learning:** Config generator tools that wrap output in executable shell one-liners or multi-line config files must sanitize all input fields (interface names, keys, IPs, ports, endpoints, DNS) using strict allowlists (e.g., regex `[^a-zA-Z0-9_.-]`) before template string interpolation.
**Prevention:** Always validate and sanitize all user-controllable settings before inserting into shell scripts or configuration templates.

## 2026-09-18 - Context-Specific Routing Generator Sanitization
**Vulnerability:** The routing generator used a single catch-all `sanitize` function allowing `/` and `:` across all input fields. This allowed path traversal sequences (like `../proc/sys`) in network interface parameters rendered into `/sys/` or `/proc/sys/net/ipv4/conf/${interface}/` paths in generated bash scripts.
**Learning:** Generic input sanitizers that permit slashes or colons are insufficient when inputs are interpolated into file paths or specific CLI flag positions (e.g., ports, interface names, routing table names).
**Prevention:** Use context-aware, strict allowlist functions tailored specifically to the target field domain (`sanitizeInterface`, `sanitizePort`, `sanitizeTableName`, `sanitizeIpOrSubnet`).
