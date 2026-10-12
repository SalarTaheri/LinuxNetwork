## 2026-09-19 - Order of Operations in Path Traversal Sanitization
**Vulnerability:** Naive sanitization of file path inputs where character allowlisting runs after removing `..` sequences allows attackers to bypass path traversal filters using interspersed disallowed characters (e.g., `.!..!./etc/passwd`).
**Learning:** Removing `..` before stripping non-allowed characters allows payloads that reconstruct `..` after invalid characters are stripped. Sanitization must first filter allowed characters and then recursively strip `..` sequences until none remain.
**Prevention:** Always strip disallowed characters prior to directory traversal checks and use a loop to eliminate nested `..` occurrences.

## 2026-09-18 - WireGuard Generator Input Sanitization
**Vulnerability:** WireGuard generator functions accepted un-sanitized user inputs and interpolated them into single-quoted bash scripts (`sudo bash -c '...'`) and configuration directives, enabling arbitrary command injection and configuration directive injection.
**Learning:** Config generator tools that wrap output in executable shell one-liners or multi-line config files must sanitize all input fields (interface names, keys, IPs, ports, endpoints, DNS) using strict allowlists (e.g., regex `[^a-zA-Z0-9_.-]`) before template string interpolation.
**Prevention:** Always validate and sanitize all user-controllable settings before inserting into shell scripts or configuration templates.
