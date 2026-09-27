## 2026-09-18 - WireGuard Generator Input Sanitization
**Vulnerability:** WireGuard generator functions accepted un-sanitized user inputs and interpolated them into single-quoted bash scripts (`sudo bash -c '...'`) and configuration directives, enabling arbitrary command injection and configuration directive injection.
**Learning:** Config generator tools that wrap output in executable shell one-liners or multi-line config files must sanitize all input fields (interface names, keys, IPs, ports, endpoints, DNS) using strict allowlists (e.g., regex `[^a-zA-Z0-9_.-]`) before template string interpolation.
**Prevention:** Always validate and sanitize all user-controllable settings before inserting into shell scripts or configuration templates.

## 2026-09-19 - Heredoc Delimiter Breakout in Bash One-Liners
**Vulnerability:** Shell script generators wrapping multi-line configurations inside `cat << "EOF"` blocks in single-quoted bash commands (`sudo bash -c '...'`) were vulnerable to heredoc breakout if config text contained standalone `EOF` lines, allowing arbitrary shell command execution as root.
**Learning:** Inserting multiline text into shell heredocs without neutralizing standalone delimiter lines (`/^\s*EOF\s*$/gm`) allows early heredoc termination and command injection when parsed by bash.
**Prevention:** Neutralize heredoc delimiters in interpolated config text (e.g. replacing `^EOF$` with `# EOF`) and quote heredoc delimiters (`cat << 'EOF'`) to disable parameter expansion.
