## 2026-09-18 - WireGuard Generator Input Sanitization
**Vulnerability:** WireGuard generator functions accepted un-sanitized user inputs and interpolated them into single-quoted bash scripts (`sudo bash -c '...'`) and configuration directives, enabling arbitrary command injection and configuration directive injection.
**Learning:** Config generator tools that wrap output in executable shell one-liners or multi-line config files must sanitize all input fields (interface names, keys, IPs, ports, endpoints, DNS) using strict allowlists (e.g., regex `[^a-zA-Z0-9_.-]`) before template string interpolation.
**Prevention:** Always validate and sanitize all user-controllable settings before inserting into shell scripts or configuration templates.

## 2026-11-05 - Setup Script Backup Directory and File Permissions
**Vulnerability:** `public/setup.sh` backed up system-critical configuration files (such as `/etc/ssh/sshd_config` and `/etc/fail2ban/jail.local`) into `/var/backups/linuxnetwork-*` using `mkdir -p` and `cp -a` without restricting directory or file permissions. Under default umask settings (e.g. 0002 or 0022), unprivileged local server users could read the backup directory and inspect backed-up SSH or service configurations.
**Learning:** System automation scripts running as root that backup sensitive files must explicitly restrict the backup folder permissions (`0700`) and the copied file permissions (`0600`) to enforce least privilege and avoid information disclosure to local unprivileged users.
**Prevention:** When creating backup paths or copying configuration files in automation shell scripts, always explicitly set `mkdir -p -m 0700 "$BACKUP_DIR"` and `chmod 0600 "$backup_path"`.
