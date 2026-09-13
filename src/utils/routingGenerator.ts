import { Language, RoutingSettings } from '../types';

/**
 * Sanitizes input strings to prevent shell injection or malformed iptables arguments.
 */
function sanitize(val: string, fallback: string): string {
  const cleaned = val.trim().replace(/[^a-zA-Z0-9_.:/-]/g, '');
  return cleaned || fallback;
}

/**
 * Generates classic iptables CLI commands with explanatory comments.
 */
export function generateIptablesRules(settings: RoutingSettings, lang: Language): string {
  const isFa = lang === 'fa';
  const wan = sanitize(settings.wanInterface, 'eth0');
  const lan = sanitize(settings.lanInterface, 'eth1');
  const lanSubnet = sanitize(settings.lanSubnet, '192.168.100.0/24');
  const staticIp = sanitize(settings.staticPublicIp, '203.0.113.10');

  switch (settings.scenario) {
    case 'nat_gateway': {
      const natRule =
        settings.natMode === 'snat'
          ? `sudo iptables -t nat -A POSTROUTING -o ${wan} -s ${lanSubnet} -j SNAT --to-source ${staticIp}`
          : `sudo iptables -t nat -A POSTROUTING -o ${wan} -s ${lanSubnet} -j MASQUERADE`;

      const mssRule = settings.enableMssClamping
        ? `\n# ${isFa ? 'جلوگیری از Packet Fragmentation و مشکل باز نشدن برخی سایت‌ها (MSS Clamping)' : 'MSS Clamping for PPPoE / Tunnel MTU Blackhole prevention'}\nsudo iptables -t mangle -A POSTROUTING -p tcp --tcp-flags SYN,RST SYN -o ${wan} -j TCPMSS --clamp-mss-to-pmtu\n`
        : '';

      const dnsRule = settings.enableDnsForwarding
        ? `\n# ${isFa ? 'اجازه عبور کوئری‌های DNS از ماشین‌های داخلی به Gateway' : 'Allow LAN clients to query DNS resolver on Gateway'}\nsudo iptables -A INPUT -i ${lan} -p udp --dport 53 -j ACCEPT\nsudo iptables -A INPUT -i ${lan} -p tcp --dport 53 -j ACCEPT\n`
        : '';

      return `# ================================================================
# ${isFa ? '🌐 پیکربندی Linux NAT Gateway و اشتراک اینترنت با iptables' : '🌐 Linux NAT Gateway & Internet Sharing Configuration'}
# ================================================================

# 1. ${isFa ? 'فعال‌سازی فورواردینگ پکت‌ها در کرنل لینوکس (ضروری)' : 'Enable IPv4 Packet Forwarding in Linux Kernel (Required)'}
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/99-ip-forward.conf
sudo sysctl -p /etc/sysctl.d/99-ip-forward.conf >/dev/null

# 2. ${isFa ? `قانون NAT در جدول nat (${settings.natMode.toUpperCase()})` : `NAT Outbound Rule (${settings.natMode.toUpperCase()})`}
${natRule}

# 3. ${isFa ? 'قوانین زنجیره FORWARD (عبور دوطرفه پکت‌های استیت‌فول)' : 'Stateful FORWARD Rules (Inbound & Outbound Traffic)'}
# ${isFa ? 'اجازه بازگشت پکت‌های متناظر با اتصالات برقرار شده' : 'Allow established and related packets to return to LAN'}
sudo iptables -A FORWARD -i ${wan} -o ${lan} -m state --state RELATED,ESTABLISHED -j ACCEPT

# ${isFa ? 'اجازه ارسال اتصالات جدید از شبکه داخلی به اینترنت' : 'Allow new outbound connections from internal LAN to WAN'}
sudo iptables -A FORWARD -i ${lan} -o ${wan} -j ACCEPT
${dnsRule}${mssRule}
# ${isFa ? 'قوانین با موفقیت اعمال شدند.' : 'Rules successfully applied.'}`;
    }

    case 'port_forward': {
      const extPort = sanitize(settings.externalPort, '8080');
      const intIp = sanitize(settings.internalIp, '192.168.100.15');
      const intPort = sanitize(settings.internalPort, '80');
      const proto = settings.protocol;

      const protocols = proto === 'both' ? ['tcp', 'udp'] : [proto];
      const dnatRules = protocols
        .map(
          (p) =>
            `sudo iptables -t nat -A PREROUTING -i ${wan} -p ${p} --dport ${extPort} -j DNAT --to-destination ${intIp}:${intPort}`
        )
        .join('\n');

      const fwdRules = protocols
        .map(
          (p) =>
            `sudo iptables -A FORWARD -p ${p} -d ${intIp} --dport ${intPort} -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT`
        )
        .join('\n');

      let hairpinComment = '';
      let hairpinRules = '';
      if (settings.enableHairpinNat) {
        hairpinComment = isFa
          ? `\n# 4. قانون Hairpin NAT (NAT Reflection)\n# این قانون حیاتی اجازه می‌دهد سیستم‌های درون شبکه محلی (${lanSubnet}) بتوانند از طریق IP پابلیک به همین پورت فوروارد شده دسترسی داشته باشند.`
          : `\n# 4. Hairpin NAT (NAT Reflection)\n# Allows internal machines on ${lanSubnet} to reach the forwarded port using the external IP without connection timeouts.`;

        hairpinRules =
          hairpinComment +
          '\n' +
          protocols
            .map(
              (p) =>
                `sudo iptables -t nat -A POSTROUTING -s ${lanSubnet} -d ${intIp} -p ${p} --dport ${intPort} -j MASQUERADE`
            )
            .join('\n');
      }

      return `# ================================================================
# 🔀 ${isFa ? 'پیکربندی Port Forwarding (DNAT) با iptables' : 'Port Forwarding (DNAT) Configuration'}
# ================================================================

# 1. ${isFa ? 'فعال‌سازی فورواردینگ در کرنل لینوکس' : 'Enable IPv4 Packet Forwarding'}
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/99-ip-forward.conf
sudo sysctl -p /etc/sysctl.d/99-ip-forward.conf >/dev/null

# 2. ${isFa ? 'تغییر آدرس مقصد پکت‌ها در زنجیره PREROUTING (جدول nat)' : 'DNAT Destination Translation (PREROUTING Chain)'}
${dnatRules}

# 3. ${isFa ? 'اجازه عبور ترافیک فوروارد شده در زنجیره FORWARD (جدول filter)' : 'Allow forwarded traffic in FORWARD filter chain (Crucial)'}
${fwdRules}${hairpinRules}

# ${isFa ? 'پورت فورواردینگ با موفقیت پیکربندی شد.' : 'Port forwarding rules configured successfully.'}`;
    }

    case 'docker_shield': {
      const port = sanitize(settings.dockerPort, '5432');
      const allowed = sanitize(settings.dockerAllowedSubnet, '10.8.0.0/24');
      const action = settings.dockerAction;

      return `# ================================================================
# 🐳 ${isFa ? 'ایمن‌سازی پورت‌های داکر با زنجیره DOCKER-USER در iptables' : 'Docker Port Isolation & Shield via DOCKER-USER Chain'}
# ================================================================
# ${isFa ? 'توضیح فنی: داکر زنجیره‌های استاندارد INPUT و UFW را دور می‌زند.' : 'Note: Docker injects rules into PREROUTING & FORWARD, bypassing UFW and INPUT.'}
# ${isFa ? 'تنها روش استاندارد و مورد تایید داکر، استفاده از زنجیره DOCKER-USER است.' : 'The official Docker-approved mechanism for firewall rules is the DOCKER-USER chain.'}

# 1. ${isFa ? 'اجازه به اتصالات موجود و استیت‌فول' : 'Allow established and related connections'}
sudo iptables -I DOCKER-USER -m state --state RELATED,ESTABLISHED -j ACCEPT

# 2. ${isFa ? `اجازه دسترسی به پورت ${port} فقط از آی‌پی / ساب‌نت مجاز (${allowed})` : `Allow access to port ${port} only from trusted subnet (${allowed})`}
sudo iptables -I DOCKER-USER -i ${wan} -p tcp --dport ${port} -s ${allowed} -j ACCEPT

# 3. ${isFa ? `مسدودسازی (${action}) دسترسی سایر آی‌پی‌های اینترنت به پورت ${port}` : `Block (${action}) all other public incoming traffic to port ${port}`}
sudo iptables -A DOCKER-USER -i ${wan} -p tcp --dport ${port} -j ${action}

# 4. ${isFa ? 'اجازه عبور به سایر ترافیک‌های داخلی کانتینرها' : 'Return default processing for remaining internal Docker traffic'}
sudo iptables -A DOCKER-USER -j RETURN

# ${isFa ? 'کانتینر داکر اکنون کاملاً امن و محدود به آی‌پی مجاز شد.' : 'Docker port successfully secured.'}`;
    }

    case 'pbr_multiwan': {
      const secIf = sanitize(settings.secondaryInterface, 'eth1');
      const secIp = sanitize(settings.secondaryIp, '192.168.2.100');
      const secGw = sanitize(settings.secondaryGateway, '192.168.2.1');
      const tableNum = settings.pbrTableNumber || 200;
      const tableName = sanitize(settings.pbrTableName, 'isp2');

      const rpFilterRules = settings.enableLooseRpFilter
        ? `\n# ${isFa ? 'غیرفعال‌سازی استعلام سخت‌گیرانه مسیر معکوس (Loose Reverse Path Filter)' : 'Set loose reverse path filtering (rp_filter=2) to prevent dropping asymmetric packets'}
sudo sysctl -w net.ipv4.conf.all.rp_filter=2
sudo sysctl -w net.ipv4.conf.default.rp_filter=2
sudo sysctl -w net.ipv4.conf.${secIf}.rp_filter=2
cat <<EOF | sudo tee /etc/sysctl.d/99-rp-filter.conf
net.ipv4.conf.all.rp_filter = 2
net.ipv4.conf.default.rp_filter = 2
net.ipv4.conf.${secIf}.rp_filter = 2
EOF
sudo sysctl -p /etc/sysctl.d/99-rp-filter.conf >/dev/null\n`
        : '';

      return `# ================================================================
# 🛣️ ${isFa ? 'مسیریابی پیشرفته بر پایه پالیسی (PBR) و مالتی‌ون در لینوکس' : 'Linux Policy-Based Routing (PBR) & Multi-WAN'}
# ================================================================
# ${isFa ? 'هدف: پکت‌هایی که از اینترفیس ثانویه وارد می‌شوند، از همان اینترفیس پاسخ داده شوند.' : 'Goal: Traffic entering secondary interface must reply via the same interface (prevent asymmetric drops).'}

# 1. ${isFa ? `تعریف جدول مسیریابی اختصاصی (${tableName} / ID: ${tableNum})` : `Define custom routing table in rt_tables (${tableName})`}
grep -q "^${tableNum}[[:space:]]" /etc/iproute2/rt_tables || echo "${tableNum} ${tableName}" | sudo tee -a /etc/iproute2/rt_tables

# 2. ${isFa ? `افزودن دیفالت روت در جدول اختصاصی ${tableName}` : `Add default gateway in table ${tableName}`}
sudo ip route replace default via ${secGw} dev ${secIf} table ${tableName}
sudo ip route replace ${secGw}/32 dev ${secIf} src ${secIp} table ${tableName}

# 3. ${isFa ? `افزودن رول مسیریابی (پکت‌های با مبدا ${secIp} از جدول ${tableName} عبور کنند)` : `Add ip rule for packets with source ${secIp}`}
sudo ip rule del from ${secIp} table ${tableName} 2>/dev/null || true
sudo ip rule add from ${secIp} table ${tableName} priority 1000
${rpFilterRules}
# ${isFa ? 'تست و بررسی جداول مسیریابی:' : 'Inspection command:'}
ip rule list
ip route show table ${tableName}`;
    }

    case 'rate_limit': {
      const port = sanitize(settings.rateLimitPort, '22');
      const maxHits = settings.rateLimitMaxHits || 4;
      const winSec = settings.rateLimitWindowSeconds || 60;
      const blockSec = settings.rateLimitBlockSeconds || 300;

      return `# ================================================================
# 🛡️ ${isFa ? 'محدودسازی سخت‌گیرانه نرخ اتصالات و مقابله با Brute-Force با ماژول xt_recent' : 'Kernel Rate-Limiting & Anti-Brute-Force Shield (xt_recent)'}
# ================================================================
# ${isFa ? `سیاست: اگر آی‌پی بیش از ${maxHits} اتصال در ${winSec} ثانیه به پورت ${port} ثبت کند، برای ${blockSec} ثانیه بلاک می‌شود.` : `Policy: More than ${maxHits} new connections within ${winSec}s to port ${port} triggers a ${blockSec}s temporary ban.`}

# 1. ${isFa ? 'بررسی آی‌پی‌های خاطی و دراپ فوری' : 'Check blacklisted offenders and immediately drop'}
sudo iptables -A INPUT -p tcp --dport ${port} -m state --state NEW -m recent --update --seconds ${blockSec} --name BRUTEFORCE_${port} --rsource -j DROP

# 2. ${isFa ? 'ثبت اتصال جدید در حافظه کرنل' : 'Record new connection attempt into kernel tracking memory'}
sudo iptables -A INPUT -p tcp --dport ${port} -m state --state NEW -m recent --set --name BRUTEFORCE_${port} --rsource

# 3. ${isFa ? `بررسی آستانه تجاوز (بیش از ${maxHits} تلاش در ${winSec} ثانیه)` : `Check hit threshold (over ${maxHits} hits in ${winSec}s)`}
sudo iptables -A INPUT -p tcp --dport ${port} -m state --state NEW -m recent --rcheck --seconds ${winSec} --hitcount ${maxHits} --name BRUTEFORCE_${port} --rsource -j DROP

# 4. ${isFa ? 'اجازه به اتصالات عادی و مجاز' : 'Accept legitimate new connections'}
sudo iptables -A INPUT -p tcp --dport ${port} -m state --state NEW -j ACCEPT

# ${isFa ? 'فایروال نرخ اتصالات با موفقیت فعال شد.' : 'Rate-limit shield activated.'}`;
    }
  }
}

/**
 * Generates modern nftables syntax (/etc/nftables.conf).
 */
export function generateNftablesRules(settings: RoutingSettings, lang: Language): string {
  const isFa = lang === 'fa';
  const wan = sanitize(settings.wanInterface, 'eth0');
  const lan = sanitize(settings.lanInterface, 'eth1');
  const lanSubnet = sanitize(settings.lanSubnet, '192.168.100.0/24');
  const staticIp = sanitize(settings.staticPublicIp, '203.0.113.10');

  switch (settings.scenario) {
    case 'nat_gateway': {
      const natStatement =
        settings.natMode === 'snat'
          ? `oifname "${wan}" ip saddr ${lanSubnet} snat to ${staticIp}`
          : `oifname "${wan}" ip saddr ${lanSubnet} masquerade`;

      const mssStatement = settings.enableMssClamping
        ? `\n        oifname "${wan}" tcp flags syn tcp option maxseg size set rt mtu`
        : '';

      const dnsStatement = settings.enableDnsForwarding
        ? `\n        iifname "${lan}" udp dport 53 accept\n        iifname "${lan}" tcp dport 53 accept`
        : '';

      return `#!/usr/sbin/nft -f
# ================================================================
# ${isFa ? '🌐 فایل پیکربندی مدرن nftables برای NAT Gateway' : '🌐 Modern nftables NAT Gateway Configuration (/etc/nftables.conf)'}
# ================================================================

flush ruleset

table inet filter {
    chain input {
        type filter hook input priority filter; policy drop;
        ct state established,related accept
        iif "lo" accept${dnsStatement}
    }

    chain forward {
        type filter hook forward priority filter; policy drop;
        ct state established,related accept
        iifname "${lan}" oifname "${wan}" ip saddr ${lanSubnet} accept${mssStatement}
    }

    chain output {
        type filter hook output priority filter; policy accept;
    }
}

table ip nat {
    chain postrouting {
        type nat hook postrouting priority srcnat; policy accept;
        ${natStatement}
    }
}
`;
    }

    case 'port_forward': {
      const extPort = sanitize(settings.externalPort, '8080');
      const intIp = sanitize(settings.internalIp, '192.168.100.15');
      const intPort = sanitize(settings.internalPort, '80');
      const proto = settings.protocol;
      const protocols = proto === 'both' ? ['tcp', 'udp'] : [proto];

      const dnatStatements = protocols
        .map((p) => `        iifname "${wan}" ${p} dport ${extPort} dnat to ${intIp}:${intPort}`)
        .join('\n');

      const fwdStatements = protocols
        .map((p) => `        ip daddr ${intIp} ${p} dport ${intPort} ct state new,established,related accept`)
        .join('\n');

      const hairpinStatement = settings.enableHairpinNat
        ? `\n        # Hairpin NAT for local clients\n` +
          protocols
            .map((p) => `        ip saddr ${lanSubnet} ip daddr ${intIp} ${p} dport ${intPort} masquerade`)
            .join('\n')
        : '';

      return `#!/usr/sbin/nft -f
# ================================================================
# 🔀 ${isFa ? 'پیکربندی Port Forwarding در nftables' : 'nftables Port Forwarding (DNAT)'}
# ================================================================

flush ruleset

table ip nat {
    chain prerouting {
        type nat hook prerouting priority dstnat; policy accept;
${dnatStatements}
    }

    chain postrouting {
        type nat hook postrouting priority srcnat; policy accept;${hairpinStatement}
    }
}

table inet filter {
    chain forward {
        type filter hook forward priority filter; policy drop;
        ct state established,related accept
${fwdStatements}
    }
}
`;
    }

    case 'docker_shield': {
      const port = sanitize(settings.dockerPort, '5432');
      const allowed = sanitize(settings.dockerAllowedSubnet, '10.8.0.0/24');
      const action = settings.dockerAction.toLowerCase();

      return `#!/usr/sbin/nft -f
# ================================================================
# 🐳 ${isFa ? 'محافظت از پورت‌های کانتینر در nftables' : 'Docker Port Protection in nftables'}
# ================================================================

table inet filter {
    chain docker_shield {
        type filter hook forward priority -1; policy accept;
        iifname "${wan}" tcp dport ${port} ip saddr ${allowed} accept
        iifname "${wan}" tcp dport ${port} ${action}
    }
}
`;
    }

    case 'pbr_multiwan': {
      return `# nftables works in conjunction with Linux kernel iproute2 for PBR.
# Apply the iproute2 routing rules shown in the iptables/CLI tab,
# then use nftables for state tracking and interface filtering if required.`;
    }

    case 'rate_limit': {
      const port = sanitize(settings.rateLimitPort, '22');
      const maxHits = settings.rateLimitMaxHits || 4;

      return `#!/usr/sbin/nft -f
# ================================================================
# 🛡️ ${isFa ? 'محدودسازی نرخ اتصالات با meter در nftables' : 'nftables Connection Rate Limiting (Meter)'}
# ================================================================

flush ruleset

table inet filter {
    set denylist {
        type ipv4_addr
        flags timeout
    }

    chain input {
        type filter hook input priority filter; policy accept;

        # Check banned IPs
        ip saddr @denylist drop

        # Add to denylist if rate exceeded
        tcp dport ${port} ct state new meter ssh_meter { ip saddr limit rate over ${maxHits}/minute burst ${maxHits} packets } add @denylist { ip saddr timeout ${settings.rateLimitBlockSeconds || 300}s } drop

        # Accept valid SSH
        tcp dport ${port} ct state new accept
    }
}
`;
    }
  }
}

/**
 * Generates an automated, resilient Bash one-liner script that applies rules and sets up persistence
 * across Debian, Ubuntu, RHEL, Rocky, AlmaLinux, and Alpine Linux.
 */
export function generateRoutingOneLiner(settings: RoutingSettings, lang: Language): string {
  const rawIptables = generateIptablesRules(settings, lang);

  return `sudo bash -c '
set -e
echo "==> [LinuxNetwork.ir] Applying Firewall & Routing Configuration..."

# 1. Apply kernel & firewall rules
${rawIptables.replace(/^sudo /gm, '')}

# 2. Configure Persistence across Distributions
if command -v apt-get >/dev/null 2>&1; then
    echo "==> Configuring persistence via iptables-persistent (Debian/Ubuntu)..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq && apt-get install -y -qq iptables-persistent netfilter-persistent
    netfilter-persistent save
elif command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
    echo "==> Configuring persistence via iptables-services (RHEL/Rocky/AlmaLinux)..."
    PKG_MGR=$(command -v dnf || command -v yum)
    $PKG_MGR install -y -q iptables-services
    systemctl enable --now iptables
    iptables-save > /etc/sysconfig/iptables
elif command -v apk >/dev/null 2>&1; then
    echo "==> Configuring persistence on Alpine Linux..."
    apk add --no-cache iptables
    /etc/init.d/iptables save 2>/dev/null || /sbin/iptables-save > /etc/iptables/rules-save
    rc-update add iptables default 2>/dev/null || true
fi

echo "==> [LinuxNetwork.ir] Done! All rules are active and persistent across reboots."
'`;
}

/**
 * Generates live troubleshooting and verification commands.
 */
export function generateVerificationCommands(settings: RoutingSettings, lang: Language): string {
  const isFa = lang === 'fa';
  const wan = sanitize(settings.wanInterface, 'eth0');
  const port =
    settings.scenario === 'port_forward'
      ? sanitize(settings.externalPort, '8080')
      : settings.scenario === 'docker_shield'
      ? sanitize(settings.dockerPort, '5432')
      : sanitize(settings.rateLimitPort, '22');

  return `# ================================================================
# 🔍 ${isFa ? 'دستورات بررسی وضعیت، مانیتورینگ زنده و عیب‌یابی پکت‌ها' : 'Live Verification, Packet Monitoring & Diagnostic Commands'}
# ================================================================

# 1. ${isFa ? 'مشاهده قوانین جدول NAT به همراه تعداد پکت‌ها و بایت‌های عبوری' : 'Inspect NAT table rules with packet/byte counters'}
sudo iptables -t nat -nvL --line-numbers

# 2. ${isFa ? 'مشاهده قوانین زنجیره FORWARD فایروال' : 'Inspect FORWARD chain traffic status'}
sudo iptables -nvL FORWARD --line-numbers

# 3. ${isFa ? 'بررسی فعال بودن فورواردینگ کرنل (باید عدد ۱ باشد)' : 'Verify Kernel IPv4 Forwarding status (must be 1)'}
cat /proc/sys/net/ipv4/ip_forward

# 4. ${isFa ? `شنود زنده پکت‌های شبکه با tcpdump روی اینترفیس ${wan}` : `Live packet capture on interface ${wan}`}
sudo tcpdump -ni ${wan} port ${port} -vv -nn

# 5. ${isFa ? 'بررسی وضعیت اتصالات و ترجمه آدرس‌ها در حافظه Conntrack' : 'Inspect active NAT connections in conntrack table'}
sudo conntrack -L 2>/dev/null || sudo ss -tulpn
`;
}

/**
 * Generates safe rollback and flushing commands.
 */
export function generateRollbackCommands(settings: RoutingSettings, lang: Language): string {
  const isFa = lang === 'fa';

  return `# ================================================================
# ⚠️ ${isFa ? 'دستورات بازگشت به عقب و پاک‌سازی کامل قوانین فایروال' : 'Firewall Rollback & Clean-Up Commands'}
# ================================================================

# ${isFa ? 'هشدار: دستورات زیر تمام رول‌های سفارشی جدول filter و nat را پاک می‌کنند.' : 'Caution: The following commands flush all custom rules in filter and nat tables.'}

# 1. ${isFa ? 'ریست کردن پیش‌فرض سیاست‌ها به ACCEPT برای جلوگیری از قفل شدن دسترسی' : 'Reset default policies to ACCEPT to prevent accidental lockout'}
sudo iptables -P INPUT ACCEPT
sudo iptables -P FORWARD ACCEPT
sudo iptables -P OUTPUT ACCEPT

# 2. ${isFa ? 'پاک‌سازی تمام رول‌های جدول filter و nat و mangle' : 'Flush all chains in filter, nat, and mangle tables'}
sudo iptables -F
sudo iptables -t nat -F
sudo iptables -t mangle -F
sudo iptables -X
sudo iptables -t nat -X

# 3. ${isFa ? 'ذخیره وضعیت پاک‌شده در سرویس پرسیستنس' : 'Save clean state to persistence service'}
if command -v netfilter-persistent >/dev/null 2>&1; then
    sudo netfilter-persistent save
fi

echo "${isFa ? 'تمام قوانین فایروال با موفقیت پاک شدند.' : 'All firewall rules successfully cleared.'}"
`;
}
