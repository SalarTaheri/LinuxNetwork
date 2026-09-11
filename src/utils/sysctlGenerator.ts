import { SysctlSettings } from '../types';

export function generateSysctlConfig(settings: SysctlSettings, lang: 'fa' | 'en'): string {
  const isFa = lang === 'fa';

  // Compute buffers based on RAM and Bandwidth
  let rmemMax = 16777216; // 16MB default
  let wmemMax = 16777216;
  let tcpRmemMax = 16777216;
  let tcpWmemMax = 16777216;
  let somaxconn = 32768;
  let netdevBacklog = 16384;
  let maxSynBacklog = 16384;
  let fileMax = 1048576;
  let tcpMaxTwBuckets = 524288;

  switch (settings.ram) {
    case '1GB':
      rmemMax = 8388608; // 8MB
      wmemMax = 8388608;
      tcpRmemMax = 8388608;
      tcpWmemMax = 8388608;
      somaxconn = 8192;
      netdevBacklog = 4096;
      maxSynBacklog = 4096;
      fileMax = 262144;
      tcpMaxTwBuckets = 131072;
      break;
    case '2GB':
      rmemMax = 16777216; // 16MB
      wmemMax = 16777216;
      tcpRmemMax = 16777216;
      tcpWmemMax = 16777216;
      somaxconn = 16384;
      netdevBacklog = 8192;
      maxSynBacklog = 8192;
      fileMax = 524288;
      tcpMaxTwBuckets = 262144;
      break;
    case '4GB':
      rmemMax = 33554432; // 32MB
      wmemMax = 33554432;
      tcpRmemMax = 33554432;
      tcpWmemMax = 33554432;
      somaxconn = 32768;
      netdevBacklog = 16384;
      maxSynBacklog = 16384;
      fileMax = 1048576;
      tcpMaxTwBuckets = 524288;
      break;
    case '8GB':
    case '16GB':
    case '32GB':
    case '64GB':
      rmemMax = 67108864; // 64MB
      wmemMax = 67108864;
      tcpRmemMax = 67108864;
      tcpWmemMax = 67108864;
      somaxconn = 65535;
      netdevBacklog = 65535;
      maxSynBacklog = 32768;
      fileMax = 2097152;
      tcpMaxTwBuckets = 1048576;
      break;
  }

  // Adjust for 10G bandwidth
  if (settings.bandwidth === '10G') {
    rmemMax = Math.max(rmemMax, 67108864);
    wmemMax = Math.max(wmemMax, 67108864);
    tcpRmemMax = Math.max(tcpRmemMax, 67108864);
    tcpWmemMax = Math.max(tcpWmemMax, 67108864);
    netdevBacklog = 65535;
  }

  const lines: string[] = [
    '# ==========================================================================',
    '# LinuxNetwork.ir - High-Performance Kernel & Network Tuning',
    `# Target Profile: ${settings.profile.toUpperCase()} | RAM: ${settings.ram} | Bandwidth: ${settings.bandwidth}`,
    '# File Location: /etc/sysctl.d/99-network-tuning.conf',
    '# Generated automatically with zero telemetry in-browser',
    '# ==========================================================================',
    '',
  ];

  // IP Forwarding
  lines.push(
    isFa
      ? '# --- قابلیت فوروارد بستههای شبکه (IP Forwarding) ---'
      : '# --- Packet Forwarding & Routing ---'
  );
  if (settings.enableIpForward || settings.profile === 'proxy') {
    lines.push('net.ipv4.ip_forward = 1');
    lines.push('net.ipv4.conf.all.forwarding = 1');
    lines.push('net.ipv4.conf.default.forwarding = 1');
  } else {
    lines.push('net.ipv4.ip_forward = 0');
  }
  lines.push('');

  // Queue and Socket Buffers
  lines.push(
    isFa
      ? `# --- بهینهسازی بافر سوکتها و صفهای ورودی (RAM: ${settings.ram}) ---`
      : `# --- Core Socket & Backlog Queue Tuning (RAM: ${settings.ram}) ---`
  );
  lines.push(`net.core.somaxconn = ${somaxconn}`);
  lines.push(`net.core.netdev_max_backlog = ${netdevBacklog}`);
  lines.push(`net.core.rmem_default = 262144`);
  lines.push(`net.core.wmem_default = 262144`);
  lines.push(`net.core.rmem_max = ${rmemMax}`);
  lines.push(`net.core.wmem_max = ${wmemMax}`);
  lines.push(`net.core.optmem_max = 65536`);
  lines.push('');

  // TCP Windows & Memory
  lines.push(
    isFa
      ? '# --- تنظیمات حافظه و پنجرههای TCP (TCP Memory Buffers) ---'
      : '# --- TCP Memory & Window Auto-Tuning ---'
  );
  lines.push(`net.ipv4.tcp_rmem = 4096 87380 ${tcpRmemMax}`);
  lines.push(`net.ipv4.tcp_wmem = 4096 65536 ${tcpWmemMax}`);
  lines.push('net.ipv4.tcp_window_scaling = 1');
  lines.push('net.ipv4.tcp_timestamps = 1');
  lines.push('net.ipv4.tcp_sack = 1');
  lines.push('');

  // BBR Congestion Control
  if (settings.enableBbr) {
    lines.push(
      isFa
        ? '# --- کنترل ازدحام BBR گوگل و الگوریتم صفی FQ (Google BBR) ---'
        : '# --- Google BBR Congestion Control & Fair Queueing ---'
    );
    lines.push('net.core.default_qdisc = fq');
    lines.push('net.ipv4.tcp_congestion_control = bbr');
    lines.push('');
  }

  // SYN Cookies & Protection
  lines.push(
    isFa
      ? '# --- محافظت در برابر حملات SYN Flood و اتصالات ناقص ---'
      : '# --- SYN Flood Protection & Connection Hardening ---'
  );
  lines.push(`net.ipv4.tcp_syncookies = ${settings.enableSynCookies ? 1 : 0}`);
  lines.push(`net.ipv4.tcp_max_syn_backlog = ${maxSynBacklog}`);
  lines.push('net.ipv4.tcp_synack_retries = 2');
  lines.push('net.ipv4.tcp_syn_retries = 3');
  lines.push('');

  // TIME_WAIT & Connection Recycling
  lines.push(
    isFa
      ? '# --- مدیریت چرخه حیات سوکتها و TIME_WAIT ---'
      : '# --- TIME_WAIT Recycling & Socket Cleanup ---'
  );
  lines.push(`net.ipv4.tcp_tw_reuse = ${settings.enableTwReuse ? 1 : 0}`);
  lines.push('net.ipv4.tcp_fin_timeout = 15');
  lines.push(`net.ipv4.tcp_max_tw_buckets = ${tcpMaxTwBuckets}`);
  lines.push('');

  // Keepalives
  lines.push(
    isFa
      ? '# --- تشخیص قطعی ارتباط و ارسال سیگنال Keepalive سریعتر ---'
      : '# --- TCP Keepalive Timers ---'
  );
  lines.push('net.ipv4.tcp_keepalive_time = 300');
  lines.push('net.ipv4.tcp_keepalive_intvl = 15');
  lines.push('net.ipv4.tcp_keepalive_probes = 5');
  lines.push('');

  // Fast Open
  if (settings.enableFastOpen) {
    lines.push(
      isFa
        ? '# --- فعالسازی TCP Fast Open برای کاهش لیتنسی هندرشیک ---'
        : '# --- TCP Fast Open (Client & Server) ---'
    );
    lines.push('net.ipv4.tcp_fastopen = 3');
    lines.push('');
  }

  // MTU Probing
  if (settings.enableMtuProbing) {
    lines.push(
      isFa
        ? '# --- حل مشکل Path MTU Blackhole (بسیار مفید برای تانلها و اینترنت ایران) ---'
        : '# --- Path MTU Probing (Avoid Blackhole drops over tunnels) ---'
    );
    lines.push('net.ipv4.tcp_mtu_probing = 1');
    lines.push('net.ipv4.tcp_base_mss = 1024');
    lines.push('');
  }

  // Low latency specific
  if (settings.profile === 'lowlatency') {
    lines.push(
      isFa
        ? '# --- بهینهسازی اختصاصی لیتنسی و کاهش تاخیر بافر (Low Latency) ---'
        : '# --- Low-Latency & Interactive Pacing ---'
    );
    lines.push('net.ipv4.tcp_low_latency = 1');
    lines.push('net.ipv4.tcp_slow_start_after_idle = 0');
    lines.push('net.ipv4.tcp_notsent_lowat = 16384');
    lines.push('');
  }

  // File limits & system watches
  if (settings.increaseFileLimits) {
    lines.push(
      isFa
        ? '# --- افزایش محدودیت باز کردن فایلهای سیستم (File Descriptors & Epoll) ---'
        : '# --- File Descriptor & Inotify Capacity ---'
    );
    lines.push(`fs.file-max = ${fileMax}`);
    lines.push('fs.inotify.max_user_watches = 524288');
    lines.push('fs.inotify.max_user_instances = 8192');
    lines.push('');
  }

  // IPv6
  if (settings.disableIpv6) {
    lines.push(
      isFa
        ? '# --- غیرفعالسازی IPv6 در صورت عدم نیاز سرور ---'
        : '# --- Disable IPv6 Subsystem ---'
    );
    lines.push('net.ipv6.conf.all.disable_ipv6 = 1');
    lines.push('net.ipv6.conf.default.disable_ipv6 = 1');
    lines.push('net.ipv6.conf.lo.disable_ipv6 = 1');
    lines.push('');
  }

  return lines.join('\n');
}

export function generateSysctlOneLiner(configText: string): string {
  return `sudo bash -c 'cat << "EOF" > /etc/sysctl.d/99-network-tuning.conf
${configText.trim()}
EOF
sysctl --system'`;
}
