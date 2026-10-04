## 2026-09-19 - Quoted Heredoc Delimiters in Shell Generators
**Vulnerability:** Unquoted heredoc delimiters (`cat <<EOF`) in generated shell scripts permit variable substitution and command expansion when executed inside `bash -c '...'` or outer shell scripts.
**Learning:** Using unquoted heredoc tags causes the shell executing the script to process `$`, `` ` ``, and `\` inside the heredoc body, potentially evaluating unexpected parameters or expressions.
**Prevention:** Always quote heredoc delimiters (e.g. `cat <<"EOF"`) in shell script template generators to treat the heredoc body strictly as literal text.

## 2026-09-18 - WireGuard Generator Input Sanitization
**Vulnerability:** WireGuard generator functions accepted un-sanitized user inputs and interpolated them into single-quoted bash scripts (`sudo bash -c '...'`) and configuration directives, enabling arbitrary command injection and configuration directive injection.
**Learning:** Config generator tools that wrap output in executable shell one-liners or multi-line config files must sanitize all input fields (interface names, keys, IPs, ports, endpoints, DNS) using strict allowlists (e.g., regex `[^a-zA-Z0-9_.-]`) before template string interpolation.
**Prevention:** Always validate and sanitize all user-controllable settings before inserting into shell scripts or configuration templates.
