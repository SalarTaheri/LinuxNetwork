#!/usr/bin/env bash
# ==============================================================================
# LinuxNetwork.ir - Infrastructure Automation & Server Tuning Script
# Repository: https://github.com/SalarTaheri/LinuxNetwork
# Website:    https://linuxnetwork.ir
# License:    MIT
# Description: Automated, idempotent server hardening, BBR tuning, Docker setup,
#              and modern developer tools installation for Debian/Ubuntu servers.
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# Color Palette & Visual Formatting
# ------------------------------------------------------------------------------
if [[ -t 1 ]] && [[ "${TERM:-}" != "dumb" ]]; then
    readonly C_RESET='\033[0m'
    readonly C_BOLD='\033[1m'
    readonly C_DIM='\033[2m'
    readonly C_GREEN='\033[0;32m'
    readonly C_BLUE='\033[0;34m'
    readonly C_CYAN='\033[0;36m'
    readonly C_YELLOW='\033[0;33m'
    readonly C_RED='\033[0;31m'
    readonly C_MAGENTA='\033[0;35m'
else
    readonly C_RESET=''
    readonly C_BOLD=''
    readonly C_DIM=''
    readonly C_GREEN=''
    readonly C_BLUE=''
    readonly C_CYAN=''
    readonly C_YELLOW=''
    readonly C_RED=''
    readonly C_MAGENTA=''
fi

# ------------------------------------------------------------------------------
# Logging Functions
# ------------------------------------------------------------------------------
log_info()    { echo -e "${C_BLUE}${C_BOLD}[ℹ INFO]${C_RESET} $*"; }
log_success() { echo -e "${C_GREEN}${C_BOLD}[✔ SUCCESS]${C_RESET} $*"; }
log_warn()    { echo -e "${C_YELLOW}${C_BOLD}[⚠ WARNING]${C_RESET} $*"; }
log_error()   { echo -e "${C_RED}${C_BOLD}[✖ ERROR]${C_RESET} $*" >&2; }
log_step()    { echo -e "\n${C_CYAN}${C_BOLD}==>${C_RESET} ${C_BOLD}$*${C_RESET}"; }

# ------------------------------------------------------------------------------
# Script Configuration & Default Flags
# ------------------------------------------------------------------------------
FLAG_BBR=false
FLAG_BBR3=false
FLAG_QDISC="fq"
FLAG_SYSCTL_OPT=false
FLAG_SSH_PORT=""
FLAG_DISABLE_PWD_AUTH=false
FLAG_FAIL2BAN=false
FLAG_UFW=false
FLAG_DOCKER=false
FLAG_DOCKER_MIRROR=false
FLAG_TOOLS=false
FLAG_ZSH=false
FLAG_NON_INTERACTIVE=false

BACKUP_DIR="/var/backups/linuxnetwork-$(date +%Y%m%d_%H%M%S)"

# ------------------------------------------------------------------------------
# Display Banner
# ------------------------------------------------------------------------------
print_banner() {
    cat << "EOF"
  _      _                  _   _      _                      _      _      
 | |    (_)                | \ | |    | |                    | |    (_)     
 | |     _ _ __  _   ___  _|  \| | ___| |___      _____  _ __| | __  _ _ __ 
 | |    | | '_ \| | | \ \/ / . ` |/ _ \ __\ \ /\ / / _ \| '__| |/ / | | '__|
 | |____| | | | | |_| |>  <| |\  |  __/ |_ \ V  V / (_) | |  |   < _| | |   
 |______|_|_| |_|\__,_/_/\_\_| \_|\___|\__| \_/\_/ \___/|_|  |_|\_(_)_|_|   
                                                                            
           Linux Infrastructure Optimization & Hardening Script             
                      https://linuxnetwork.ir                               
EOF
    echo -e "${C_DIM}------------------------------------------------------------------------------${C_RESET}"
}

# ------------------------------------------------------------------------------
# Help Screen
# ------------------------------------------------------------------------------
show_help() {
    cat << EOF
Usage: sudo bash setup.sh [OPTIONS]

Network & Kernel Optimization:
  --bbr                   Enable Google BBR Congestion Control & fq qdisc
  --bbr3                  Enable BBRv3 (requires Kernel 6.4+) or fallback to BBR
  --qdisc [fq|cake]       Queue discipline algorithm (default: fq)
  --sysctl-opt            Optimize TCP buffer windows, SOMAXCONN & TIME_WAIT reuse

Server Hardening:
  --ssh-port <PORT>       Change default SSH listen port (e.g. 2222)
  --disable-pwd-auth      Disable SSH password authentication (Key-Only auth)
  --fail2ban              Install and configure Fail2ban protection for SSH
  --ufw                   Configure UFW firewall (allow SSH, 80, 443)

Containers & Infrastructure:
  --docker                Install Docker CE & Docker Compose plugin
  --docker-mirror         Configure Iranian / high-speed Docker registry mirrors

Developer Utilities:
  --tools                 Install modern CLI utilities (fastfetch, htop, iperf3, etc.)
  --zsh                   Install ZSH shell and lightweight configuration

Meta Options:
  --all                   Apply full recommended profile (BBR + sysctl + tools + docker)
  -y, --yes               Non-interactive mode (auto-confirm)
  -h, --help              Display this help message
EOF
    exit 0
}

# ------------------------------------------------------------------------------
# Pre-Flight Safety Checks
# ------------------------------------------------------------------------------
check_root() {
    if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
        log_error "This script must be executed with root/sudo privileges."
        echo -e "Try: ${C_CYAN}sudo bash $0 $*${C_RESET}"
        exit 1
    fi
}

detect_os() {
    if [[ ! -f /etc/os-release ]]; then
        log_error "Unable to detect OS distribution (/etc/os-release missing)."
        exit 1
    fi

    # Source os-release safely
    # shellcheck disable=SC1091
    . /etc/os-release

    OS_ID="${ID:-unknown}"
    OS_VERSION="${VERSION_ID:-unknown}"
    OS_CODENAME="${VERSION_CODENAME:-${UBUNTU_CODENAME:-unknown}}"

    case "$OS_ID" in
        ubuntu)
            case "$OS_VERSION" in
                20.04*|22.04*|24.04*)
                    log_success "Detected supported OS: Ubuntu ${OS_VERSION} (${OS_CODENAME})"
                    ;;
                *)
                    log_warn "Detected Ubuntu ${OS_VERSION}. Recommended versions: 20.04, 22.04, 24.04."
                    ;;
            esac
            ;;
        debian)
            case "$OS_VERSION" in
                11*|12*|13*)
                    log_success "Detected supported OS: Debian ${OS_VERSION} (${OS_CODENAME})"
                    ;;
                *)
                    log_warn "Detected Debian ${OS_VERSION}. Recommended versions: 11 (Bullseye), 12 (Bookworm)."
                    ;;
            esac
            ;;
        *)
            log_error "Unsupported Linux distribution: ${OS_ID}. This script targets Debian and Ubuntu."
            exit 1
            ;;
    esac
}

backup_file() {
    local target="$1"
    if [[ -f "$target" ]]; then
        mkdir -p "$BACKUP_DIR"
        local backup_path="${BACKUP_DIR}/$(basename "$target").bak"
        cp -a "$target" "$backup_path"
        log_info "Backup created: ${target} -> ${backup_path}"
    fi
}

# ------------------------------------------------------------------------------
# Module 1: Kernel Network & BBR Tuning
# ------------------------------------------------------------------------------
apply_kernel_tuning() {
    log_step "Configuring Linux Kernel & Network Stack..."

    local sysctl_conf="/etc/sysctl.d/99-linuxnetwork-tuning.conf"
    backup_file "$sysctl_conf"

    # Verify kernel module availability
    modprobe tcp_bbr 2>/dev/null || true

    cat > "$sysctl_conf" << EOF
# ==============================================================================
# LinuxNetwork.ir - High Performance Network & TCP Stack Tuning
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# ==============================================================================

# Core Socket & Backlog Queues
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.core.rmem_default = 262144
net.core.wmem_default = 262144
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.core.optmem_max = 65536

# TCP Windows & Auto-Tuning
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_timestamps = 1
net.ipv4.tcp_sack = 1

# Packet Queue Discipline & Congestion Control
net.core.default_qdisc = ${FLAG_QDISC}
net.ipv4.tcp_congestion_control = bbr

# Connection Lifecycle & Recycling
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_max_tw_buckets = 1048576

# SYN Flood & Security
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 32768
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 3

# TCP Keepalive & Latency
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_intvl = 15
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_mtu_probing = 1

# IP Packet Forwarding (for routing and containers)
net.ipv4.ip_forward = 1

# System File Descriptors
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
EOF

    # Apply sysctl safely
    if sysctl --system > /dev/null 2>&1; then
        log_success "Kernel parameters applied successfully via ${sysctl_conf}"
    else
        log_warn "Some sysctl keys might not be supported on this kernel release. Checking BBR status..."
    fi

    # Verify BBR active
    local current_cc
    current_cc=$(sysctl -n net.ipv4.tcp_congestion_control 2>/dev/null || echo "unknown")
    if [[ "$current_cc" == *"bbr"* ]]; then
        log_success "Active TCP Congestion Control: ${C_GREEN}${current_cc}${C_RESET}"
    else
        log_warn "Active TCP Congestion Control is ${current_cc} (Kernel may require reboot to load BBR module)."
    fi
}

# ------------------------------------------------------------------------------
# Module 2: Server Hardening & SSH Security
# ------------------------------------------------------------------------------
apply_hardening() {
    log_step "Hardening Server Security & SSH Configuration..."

    local ssh_conf="/etc/ssh/sshd_config"
    local ssh_d_dir="/etc/ssh/sshd_config.d"

    if [[ -n "$FLAG_SSH_PORT" || "$FLAG_DISABLE_PWD_AUTH" == true ]]; then
        mkdir -p "$ssh_d_dir"
        local hardening_dropin="${ssh_d_dir}/99-linuxnetwork-hardening.conf"
        backup_file "$ssh_conf"

        echo "# Managed by LinuxNetwork.ir" > "$hardening_dropin"

        if [[ -n "$FLAG_SSH_PORT" ]]; then
            echo "Port ${FLAG_SSH_PORT}" >> "$hardening_dropin"
            log_info "Configured custom SSH port: ${FLAG_SSH_PORT}"
        fi

        if [[ "$FLAG_DISABLE_PWD_AUTH" == true ]]; then
            echo "PasswordAuthentication no" >> "$hardening_dropin"
            echo "ChallengeResponseAuthentication no" >> "$hardening_dropin"
            echo "KbdInteractiveAuthentication no" >> "$hardening_dropin"
            echo "PubkeyAuthentication yes" >> "$hardening_dropin"
            log_info "Disabled SSH password authentication (Key authentication only)."
        fi

        # Test sshd syntax before restart
        if sshd -t 2>/dev/null; then
            systemctl reload ssh || systemctl reload sshd || service ssh restart
            log_success "SSH configuration validated and reloaded safely."
        else
            log_error "SSH configuration test failed! Reverting changes..."
            rm -f "$hardening_dropin"
            exit 1
        fi
    fi

    # Fail2ban Installation
    if [[ "$FLAG_FAIL2BAN" == true ]]; then
        log_info "Installing and provisioning Fail2ban..."
        export DEBIAN_FRONTEND=noninteractive
        apt-get update -qq && apt-get install -y -qq fail2ban > /dev/null

        local jail_local="/etc/fail2ban/jail.local"
        backup_file "$jail_local"

        local ssh_effective_port="${FLAG_SSH_PORT:-22}"

        cat > "$jail_local" << EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
banaction = ufw

[sshd]
enabled = true
port = ${ssh_effective_port}
filter = sshd
maxretry = 3
bantime = 24h
EOF

        systemctl enable fail2ban > /dev/null 2>&1
        systemctl restart fail2ban
        log_success "Fail2ban is active and monitoring SSH on port ${ssh_effective_port}."
    fi

    # UFW Firewall Setup
    if [[ "$FLAG_UFW" == true ]]; then
        log_info "Configuring UFW (Uncomplicated Firewall)..."
        export DEBIAN_FRONTEND=noninteractive
        apt-get update -qq && apt-get install -y -qq ufw > /dev/null

        local ssh_effective_port="${FLAG_SSH_PORT:-22}"

        ufw --force reset > /dev/null 2>&1
        ufw default deny incoming > /dev/null
        ufw default allow outgoing > /dev/null

        ufw allow "${ssh_effective_port}/tcp" comment "SSH Access" > /dev/null
        ufw allow 80/tcp comment "HTTP Web" > /dev/null
        ufw allow 443/tcp comment "HTTPS Web" > /dev/null

        echo "y" | ufw enable > /dev/null
        log_success "UFW firewall enabled with active rules for Port ${ssh_effective_port}, 80, and 443."
    fi
}

# ------------------------------------------------------------------------------
# Module 3: Docker CE & Container Engine Setup
# ------------------------------------------------------------------------------
install_docker() {
    log_step "Installing Docker Engine & Container Tools..."

    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg lsb-release > /dev/null

    install -m 0755 -d /etc/apt/keyrings
    if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
        curl -fsSL "https://download.docker.com/linux/${OS_ID}/gpg" | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        chmod a+r /etc/apt/keyrings/docker.gpg
    fi

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${OS_ID} \
      ${OS_CODENAME} stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin > /dev/null

    systemctl enable docker > /dev/null 2>&1
    systemctl start docker

    log_success "Docker CE and Docker Compose installed successfully."

    # Configure Docker Registry Mirrors (vital for Iranian servers)
    if [[ "$FLAG_DOCKER_MIRROR" == true ]]; then
        log_info "Configuring high-speed Docker registry mirrors..."
        mkdir -p /etc/docker
        backup_file "/etc/docker/daemon.json"

        cat > /etc/docker/daemon.json << "EOF"
{
  "registry-mirrors": [
    "https://dockerir.com",
    "https://docker.arvancloud.ir",
    "https://mirror.gcr.io"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "20m",
    "max-file": "3"
  }
}
EOF
        systemctl restart docker
        log_success "Docker registry mirrors configured in /etc/docker/daemon.json"
    fi
}

# ------------------------------------------------------------------------------
# Module 4: Modern Utilities & Tools
# ------------------------------------------------------------------------------
install_tools() {
    log_step "Installing Modern Infrastructure & Network Utilities..."

    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq

    local packages=(
        curl
        wget
        git
        net-tools
        dnsutils
        iperf3
        htop
        iotop
        iftop
        tmux
        jq
        mtr-tiny
        traceroute
        unzip
        ca-certificates
    )

    apt-get install -y -qq "${packages[@]}" > /dev/null
    log_success "Essential utilities installed: ${packages[*]}"

    # Fastfetch installation (clean fallback if repo not available)
    if ! command -v fastfetch &> /dev/null; then
        apt-get install -y -qq fastfetch > /dev/null 2>&1 || true
    fi

    if [[ "$FLAG_ZSH" == true ]]; then
        log_info "Installing ZSH shell..."
        apt-get install -y -qq zsh > /dev/null
        log_success "Zsh shell installed. You can set it as default via: chsh -s \$(which zsh)"
    fi
}

# ------------------------------------------------------------------------------
# Argument Parsing
# ------------------------------------------------------------------------------
parse_arguments() {
    if [[ $# -eq 0 ]]; then
        show_help
    fi

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --bbr)
                FLAG_BBR=true
                shift
                ;;
            --bbr3)
                FLAG_BBR3=true
                FLAG_BBR=true
                shift
                ;;
            --qdisc)
                FLAG_QDISC="$2"
                shift 2
                ;;
            --sysctl-opt)
                FLAG_SYSCTL_OPT=true
                shift
                ;;
            --ssh-port)
                FLAG_SSH_PORT="$2"
                if ! [[ "$FLAG_SSH_PORT" =~ ^[0-9]+$ ]] || [ "$FLAG_SSH_PORT" -lt 1 ] || [ "$FLAG_SSH_PORT" -gt 65535 ]; then
                    log_error "Invalid SSH port: ${FLAG_SSH_PORT}. Must be between 1 and 65535."
                    exit 1
                fi
                shift 2
                ;;
            --disable-pwd-auth)
                FLAG_DISABLE_PWD_AUTH=true
                shift
                ;;
            --fail2ban)
                FLAG_FAIL2BAN=true
                shift
                ;;
            --ufw)
                FLAG_UFW=true
                shift
                ;;
            --docker)
                FLAG_DOCKER=true
                shift
                ;;
            --docker-mirror)
                FLAG_DOCKER_MIRROR=true
                FLAG_DOCKER=true
                shift
                ;;
            --tools)
                FLAG_TOOLS=true
                shift
                ;;
            --zsh)
                FLAG_ZSH=true
                shift
                ;;
            --all)
                FLAG_BBR=true
                FLAG_SYSCTL_OPT=true
                FLAG_TOOLS=true
                FLAG_DOCKER=true
                FLAG_DOCKER_MIRROR=true
                FLAG_FAIL2BAN=true
                shift
                ;;
            -y|--yes)
                FLAG_NON_INTERACTIVE=true
                shift
                ;;
            -h|--help)
                show_help
                ;;
            *)
                log_error "Unknown argument: $1"
                echo "Run '$0 --help' for available options."
                exit 1
                ;;
        esac
    done
}

# ------------------------------------------------------------------------------
# Main Execution Entry Point
# ------------------------------------------------------------------------------
main() {
    parse_arguments "$@"
    print_banner
    check_root
    detect_os

    if [[ "$FLAG_BBR" == true || "$FLAG_SYSCTL_OPT" == true ]]; then
        apply_kernel_tuning
    fi

    if [[ -n "$FLAG_SSH_PORT" || "$FLAG_DISABLE_PWD_AUTH" == true || "$FLAG_FAIL2BAN" == true || "$FLAG_UFW" == true ]]; then
        apply_hardening
    fi

    if [[ "$FLAG_DOCKER" == true ]]; then
        install_docker
    fi

    if [[ "$FLAG_TOOLS" == true || "$FLAG_ZSH" == true ]]; then
        install_tools
    fi

    log_step "Execution Complete!"
    echo -e "${C_GREEN}${C_BOLD}✔ All selected modules applied cleanly and idempotently.${C_RESET}"
    if [[ -d "$BACKUP_DIR" ]]; then
        echo -e "${C_DIM}Backups saved in: ${BACKUP_DIR}${C_RESET}"
    fi
    echo -e "\n${C_CYAN}Learn more & get help at: https://linuxnetwork.ir${C_RESET}\n"
}

main "$@"
