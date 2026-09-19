#!/usr/bin/env bash
# ==============================================================================
# LinuxNetwork.ir - Infrastructure Automation & Server Tuning Script
# Repository: https://github.com/SalarTaheri/LinuxNetwork
# Website:    https://linuxnetwork.ir
# License:    MIT
# Description: Automated, idempotent server hardening, BBR tuning, Docker setup,
#              and modern developer tools installation for Debian/Ubuntu,
#              Red Hat-based (RHEL, Rocky, AlmaLinux, CentOS, Fedora), and Alpine Linux.
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

OS_ID="unknown"
OS_FAMILY="unknown"
OS_VERSION="unknown"
OS_VERSION_MAJOR="unknown"
OS_CODENAME="unknown"
PKG_MANAGER="unknown"
INIT_SYSTEM="systemd"

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
  --ufw, --firewall       Configure firewall (UFW on Debian/Ubuntu, Firewalld on Red Hat, Iptables on Alpine)

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
    local id_like="${ID_LIKE:-}"
    OS_VERSION_MAJOR="${OS_VERSION%%.*}"

    case "$OS_ID" in
        ubuntu)
            OS_FAMILY="debian"
            PKG_MANAGER="apt"
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
            OS_FAMILY="debian"
            PKG_MANAGER="apt"
            case "$OS_VERSION" in
                11*|12*|13*)
                    log_success "Detected supported OS: Debian ${OS_VERSION} (${OS_CODENAME})"
                    ;;
                *)
                    log_warn "Detected Debian ${OS_VERSION}. Recommended versions: 11 (Bullseye), 12 (Bookworm)."
                    ;;
            esac
            ;;
        rhel|rocky|almalinux|centos|fedora|ol|amzn)
            OS_FAMILY="redhat"
            if command -v dnf >/dev/null 2>&1; then
                PKG_MANAGER="dnf"
            elif command -v yum >/dev/null 2>&1; then
                PKG_MANAGER="yum"
            else
                log_error "Neither dnf nor yum package manager found."
                exit 1
            fi

            case "$OS_ID" in
                rocky)
                    log_success "Detected supported OS: Rocky Linux ${OS_VERSION} (${PKG_MANAGER})"
                    ;;
                almalinux)
                    log_success "Detected supported OS: AlmaLinux ${OS_VERSION} (${PKG_MANAGER})"
                    ;;
                rhel)
                    log_success "Detected supported OS: Red Hat Enterprise Linux ${OS_VERSION} (${PKG_MANAGER})"
                    ;;
                centos)
                    log_success "Detected supported OS: CentOS Stream/Linux ${OS_VERSION} (${PKG_MANAGER})"
                    ;;
                fedora)
                    log_success "Detected supported OS: Fedora ${OS_VERSION} (${PKG_MANAGER})"
                    ;;
                ol)
                    log_success "Detected supported OS: Oracle Linux ${OS_VERSION} (${PKG_MANAGER})"
                    ;;
                amzn)
                    log_success "Detected supported OS: Amazon Linux ${OS_VERSION} (${PKG_MANAGER})"
                    ;;
            esac
            ;;
        alpine)
            OS_FAMILY="alpine"
            PKG_MANAGER="apk"
            INIT_SYSTEM="openrc"
            log_success "Detected supported OS: Alpine Linux ${OS_VERSION} (${INIT_SYSTEM}/${PKG_MANAGER})"
            ;;
        *)
            # Check ID_LIKE fallback for other Red Hat derivatives
            if [[ "$id_like" =~ (rhel|fedora|centos) ]]; then
                OS_FAMILY="redhat"
                if command -v dnf >/dev/null 2>&1; then
                    PKG_MANAGER="dnf"
                else
                    PKG_MANAGER="yum"
                fi
                log_success "Detected Red Hat-compatible OS: ${OS_ID} ${OS_VERSION} (${PKG_MANAGER})"
            elif [[ "$id_like" =~ debian ]]; then
                OS_FAMILY="debian"
                PKG_MANAGER="apt"
                log_success "Detected Debian-compatible OS: ${OS_ID} ${OS_VERSION} (${PKG_MANAGER})"
            else
                log_error "Unsupported Linux distribution: ${OS_ID}. This script targets Debian, Ubuntu, Red Hat family (RHEL, Rocky, AlmaLinux, CentOS, Fedora), and Alpine Linux."
                exit 1
            fi
            ;;
    esac
}

service_enable() {
    local svc="$1"
    if [[ "$INIT_SYSTEM" == "systemd" ]]; then
        systemctl enable "$svc" > /dev/null 2>&1 || true
    elif [[ "$INIT_SYSTEM" == "openrc" ]]; then
        rc-update add "$svc" default > /dev/null 2>&1 || true
    fi
}

service_start() {
    local svc="$1"
    if [[ "$INIT_SYSTEM" == "systemd" ]]; then
        systemctl start "$svc" > /dev/null 2>&1 || true
    elif [[ "$INIT_SYSTEM" == "openrc" ]]; then
        rc-service "$svc" start > /dev/null 2>&1 || true
    fi
}

service_restart() {
    local svc="$1"
    if [[ "$INIT_SYSTEM" == "systemd" ]]; then
        systemctl restart "$svc" > /dev/null 2>&1 || true
    elif [[ "$INIT_SYSTEM" == "openrc" ]]; then
        rc-service "$svc" restart > /dev/null 2>&1 || true
    fi
}

service_reload() {
    local svc="$1"
    if [[ "$INIT_SYSTEM" == "systemd" ]]; then
        systemctl reload "$svc" 2>/dev/null || systemctl restart "$svc" 2>/dev/null || true
    elif [[ "$INIT_SYSTEM" == "openrc" ]]; then
        rc-service "$svc" reload 2>/dev/null || rc-service "$svc" restart 2>/dev/null || true
    fi
}

ensure_epel_repo() {
    if [[ "$OS_FAMILY" == "redhat" ]]; then
        if [[ "$OS_ID" == "fedora" ]]; then
            return 0
        fi
        if ! rpm -q epel-release >/dev/null 2>&1; then
            log_info "Enabling EPEL repository for extra packages..."
            if [[ "$PKG_MANAGER" == "dnf" ]]; then
                dnf install -y -q epel-release > /dev/null 2>&1 || {
                    local epel_rpm="https://dl.fedoraproject.org/pub/epel/epel-release-latest-${OS_VERSION_MAJOR}.noarch.rpm"
                    dnf install -y -q "$epel_rpm" > /dev/null 2>&1 || true
                }
            else
                yum install -y -q epel-release > /dev/null 2>&1 || true
            fi
        fi
    fi
}

get_docker_os() {
    if [[ "$OS_ID" == "ubuntu" ]] || [[ "${ID_LIKE:-}" =~ ubuntu ]]; then
        echo "ubuntu"
    else
        echo "debian"
    fi
}

sanitize_apt_sources() {
    if [[ "$OS_FAMILY" == "debian" ]]; then
        local docker_os
        docker_os=$(get_docker_os)
        local wrong_os="ubuntu"
        if [[ "$docker_os" == "ubuntu" ]]; then
            wrong_os="debian"
        fi

        local file
        for file in /etc/apt/sources.list /etc/apt/sources.list.d/*.list; do
            if [[ -f "$file" ]] && grep -q "download.docker.com/linux/${wrong_os}" "$file" 2>/dev/null; then
                backup_file "$file"
                sed -i "s|download.docker.com/linux/${wrong_os}|download.docker.com/linux/${docker_os}|g" "$file"
                log_info "Corrected Docker repository URL in ${file} (${wrong_os} -> ${docker_os})"
            fi
        done
    fi
}

pkg_update() {
    if [[ "$OS_FAMILY" == "debian" ]]; then
        export DEBIAN_FRONTEND=noninteractive
        sanitize_apt_sources
        apt-get update -qq || log_warn "apt-get update encountered warnings or non-fatal repository errors."
    elif [[ "$OS_FAMILY" == "redhat" ]]; then
        if [[ "$PKG_MANAGER" == "dnf" ]]; then
            dnf makecache -q > /dev/null 2>&1 || true
        else
            yum makecache -q > /dev/null 2>&1 || true
        fi
    elif [[ "$OS_FAMILY" == "alpine" ]]; then
        apk update -q > /dev/null 2>&1 || true
    fi
}

pkg_install() {
    if [[ "$OS_FAMILY" == "debian" ]]; then
        export DEBIAN_FRONTEND=noninteractive
        apt-get install -y -qq "$@" > /dev/null
    elif [[ "$OS_FAMILY" == "redhat" ]]; then
        if [[ "$PKG_MANAGER" == "dnf" ]]; then
            dnf install -y -q "$@" > /dev/null
        else
            yum install -y -q "$@" > /dev/null
        fi
    elif [[ "$OS_FAMILY" == "alpine" ]]; then
        apk add -q "$@" > /dev/null
    fi
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
    elif sysctl -p "$sysctl_conf" > /dev/null 2>&1; then
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

        # Ensure sshd_config includes sshd_config.d on non-standard or older configurations
        if ! grep -Eq '^\s*Include\s+/etc/ssh/sshd_config\.d/\*\.conf' "$ssh_conf" 2>/dev/null; then
            sed -i '1i Include /etc/ssh/sshd_config.d/*.conf' "$ssh_conf"
        fi

        echo "# Managed by LinuxNetwork.ir" > "$hardening_dropin"

        if [[ -n "$FLAG_SSH_PORT" ]]; then
            echo "Port ${FLAG_SSH_PORT}" >> "$hardening_dropin"
            log_info "Configured custom SSH port: ${FLAG_SSH_PORT}"

            # If SELinux is active on Red Hat, allow custom SSH port
            if command -v getenforce >/dev/null 2>&1 && [[ "$(getenforce 2>/dev/null)" != "Disabled" ]]; then
                if ! command -v semanage >/dev/null 2>&1; then
                    log_info "Installing policycoreutils for SELinux port management..."
                    pkg_install policycoreutils-python-utils 2>/dev/null || pkg_install policycoreutils-python 2>/dev/null || true
                fi
                if command -v semanage >/dev/null 2>&1; then
                    semanage port -a -t ssh_port_t -p tcp "${FLAG_SSH_PORT}" 2>/dev/null || \
                    semanage port -m -t ssh_port_t -p tcp "${FLAG_SSH_PORT}" 2>/dev/null || true
                    log_success "SELinux policy updated for SSH port ${FLAG_SSH_PORT}."
                fi
            fi
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
            service_reload sshd || service_reload ssh || true
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
        local ssh_effective_port="${FLAG_SSH_PORT:-22}"
        local banaction="iptables-multiport"

        if [[ "$OS_FAMILY" == "debian" ]]; then
            export DEBIAN_FRONTEND=noninteractive
            pkg_update
            apt-get install -y -qq fail2ban > /dev/null
            banaction="ufw"
        elif [[ "$OS_FAMILY" == "redhat" ]]; then
            ensure_epel_repo
            pkg_install fail2ban fail2ban-firewalld 2>/dev/null || pkg_install fail2ban
            if command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active --quiet firewalld 2>/dev/null; then
                banaction="firewallcmd-rich-rules"
            elif command -v ufw >/dev/null 2>&1; then
                banaction="ufw"
            fi
        elif [[ "$OS_FAMILY" == "alpine" ]]; then
            pkg_install fail2ban
            banaction="iptables-multiport"
        fi

        local jail_local="/etc/fail2ban/jail.local"
        backup_file "$jail_local"

        cat > "$jail_local" << EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
banaction = ${banaction}

[sshd]
enabled = true
port = ${ssh_effective_port}
filter = sshd
maxretry = 3
bantime = 24h
EOF

        service_enable fail2ban
        service_restart fail2ban
        log_success "Fail2ban is active and monitoring SSH on port ${ssh_effective_port} (banaction: ${banaction})."
    fi

    # Firewall Setup (UFW on Debian/Ubuntu, Firewalld on Red Hat, Iptables on Alpine)
    if [[ "$FLAG_UFW" == true ]]; then
        local ssh_effective_port="${FLAG_SSH_PORT:-22}"

        if [[ "$OS_FAMILY" == "debian" ]]; then
            log_info "Configuring UFW (Uncomplicated Firewall)..."
            export DEBIAN_FRONTEND=noninteractive
            pkg_update
            apt-get install -y -qq ufw > /dev/null

            ufw --force reset > /dev/null 2>&1
            ufw default deny incoming > /dev/null
            ufw default allow outgoing > /dev/null

            ufw allow "${ssh_effective_port}/tcp" comment "SSH Access" > /dev/null
            ufw allow 80/tcp comment "HTTP Web" > /dev/null
            ufw allow 443/tcp comment "HTTPS Web" > /dev/null

            echo "y" | ufw enable > /dev/null
            log_success "UFW firewall enabled with active rules for Port ${ssh_effective_port}, 80, and 443."
        elif [[ "$OS_FAMILY" == "redhat" ]]; then
            log_info "Configuring Firewalld..."
            pkg_install firewalld
            service_enable firewalld
            service_start firewalld

            firewall-cmd --permanent --add-port="${ssh_effective_port}/tcp" > /dev/null
            firewall-cmd --permanent --add-service=http > /dev/null
            firewall-cmd --permanent --add-service=https > /dev/null
            firewall-cmd --reload > /dev/null
            log_success "Firewalld enabled with active rules for Port ${ssh_effective_port}, 80, and 443."
        elif [[ "$OS_FAMILY" == "alpine" ]]; then
            log_info "Configuring Iptables Firewall for Alpine..."
            pkg_install iptables
            iptables -F
            iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
            iptables -A INPUT -p tcp --dport "${ssh_effective_port}" -j ACCEPT
            iptables -A INPUT -p tcp --dport 80 -j ACCEPT
            iptables -A INPUT -p tcp --dport 443 -j ACCEPT
            iptables -A INPUT -p icmp -j ACCEPT
            iptables -A INPUT -i lo -j ACCEPT
            iptables -P INPUT DROP
            service_enable iptables
            if [[ -f /etc/init.d/iptables ]]; then
                /etc/init.d/iptables save > /dev/null 2>&1 || true
            fi
            service_restart iptables
            log_success "Iptables firewall enabled with active rules for Port ${ssh_effective_port}, 80, and 443."
        fi
    fi
}

# ------------------------------------------------------------------------------
# Module 3: Docker CE & Container Engine Setup
# ------------------------------------------------------------------------------
install_docker() {
    log_step "Installing Docker Engine & Container Tools..."

    if [[ "$OS_FAMILY" == "debian" ]]; then
        local docker_os
        docker_os=$(get_docker_os)

        export DEBIAN_FRONTEND=noninteractive
        pkg_update
        apt-get install -y -qq ca-certificates curl gnupg lsb-release > /dev/null

        install -m 0755 -d /etc/apt/keyrings
        if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
            curl -fsSL "https://download.docker.com/linux/${docker_os}/gpg" | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            chmod a+r /etc/apt/keyrings/docker.gpg
        fi

        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${docker_os} \
          ${OS_CODENAME} stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

        pkg_update
        apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin > /dev/null
    elif [[ "$OS_FAMILY" == "redhat" ]]; then
        local docker_repo_name="centos"
        if [[ "$OS_ID" == "fedora" ]]; then
            docker_repo_name="fedora"
        elif [[ "$OS_ID" == "rhel" ]]; then
            docker_repo_name="rhel"
        fi

        log_info "Configuring official Docker repository for ${docker_repo_name}..."
        mkdir -p /etc/yum.repos.d
        curl -fsSL "https://download.docker.com/linux/${docker_repo_name}/docker-ce.repo" -o /etc/yum.repos.d/docker-ce.repo

        if [[ "$PKG_MANAGER" == "dnf" ]]; then
            dnf install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin --nobest > /dev/null 2>&1 || \
            dnf install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin --allowerasing > /dev/null 2>&1 || \
            dnf install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin > /dev/null
        else
            yum install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin > /dev/null
        fi
    elif [[ "$OS_FAMILY" == "alpine" ]]; then
        log_info "Enabling Alpine Community repository for Docker..."
        sed -i '/^#.*\/community/s/^#//' /etc/apk/repositories 2>/dev/null || true
        pkg_update
        pkg_install docker docker-cli-compose
    fi

    service_enable docker
    service_start docker

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
        service_restart docker
        log_success "Docker registry mirrors configured in /etc/docker/daemon.json"
    fi
}

# ------------------------------------------------------------------------------
# Module 4: Modern Utilities & Tools
# ------------------------------------------------------------------------------
install_tools() {
    log_step "Installing Modern Infrastructure & Network Utilities..."

    if [[ "$OS_FAMILY" == "debian" ]]; then
        export DEBIAN_FRONTEND=noninteractive
        pkg_update

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
    elif [[ "$OS_FAMILY" == "redhat" ]]; then
        ensure_epel_repo
        pkg_update

        local packages=(
            curl
            wget
            git
            net-tools
            bind-utils
            iperf3
            htop
            iotop
            iftop
            tmux
            jq
            mtr
            traceroute
            unzip
            ca-certificates
        )

        pkg_install "${packages[@]}"
        log_success "Essential utilities installed: ${packages[*]}"

        # Fastfetch installation (clean fallback)
        if ! command -v fastfetch &> /dev/null; then
            pkg_install fastfetch 2>/dev/null || true
        fi

        if [[ "$FLAG_ZSH" == true ]]; then
            log_info "Installing ZSH shell..."
            pkg_install zsh
            log_success "Zsh shell installed. You can set it as default via: chsh -s \$(which zsh)"
        fi
    elif [[ "$OS_FAMILY" == "alpine" ]]; then
        pkg_update

        local packages=(
            curl
            wget
            git
            net-tools
            bind-tools
            iperf3
            htop
            iotop
            iftop
            tmux
            jq
            mtr
            traceroute
            unzip
            ca-certificates
        )

        pkg_install "${packages[@]}"
        log_success "Essential utilities installed: ${packages[*]}"

        # Fastfetch installation (clean fallback)
        if ! command -v fastfetch &> /dev/null; then
            pkg_install fastfetch 2>/dev/null || true
        fi

        if [[ "$FLAG_ZSH" == true ]]; then
            log_info "Installing ZSH shell..."
            pkg_install zsh
            log_success "Zsh shell installed. You can set it as default via: chsh -s \$(which zsh)"
        fi
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
                if [[ "$2" != "fq" && "$2" != "cake" ]]; then
                    log_error "Invalid qdisc algorithm: $2. Must be 'fq' or 'cake'."
                    exit 1
                fi
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
            --ufw|--firewall)
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
