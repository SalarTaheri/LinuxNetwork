import { WireGuardSettings } from '../types';

/**
 * Sanitizes input parameters to prevent command injection, script breakout,
 * and WireGuard configuration file directive injection.
 */
function sanitizeInterface(val: string | undefined | null, fallback: string): string {
  const cleaned = (val || '').trim().replace(/[^a-zA-Z0-9_.-]/g, '');
  return cleaned || fallback;
}

function sanitizeIp(val: string | undefined | null, fallback: string): string {
  const cleaned = (val || '').trim().replace(/[^a-zA-Z0-9.:/-]/g, '');
  return cleaned || fallback;
}

function sanitizeKey(val: string | undefined | null, fallback: string): string {
  const cleaned = (val || '').trim().replace(/[^a-zA-Z0-9+/=]/g, '');
  return cleaned || fallback;
}

function sanitizeEndpoint(val: string | undefined | null, fallback: string): string {
  const cleaned = (val || '').trim().replace(/[^a-zA-Z0-9.:_-]/g, '');
  return cleaned || fallback;
}

function sanitizeAllowedIps(val: string | undefined | null, fallback: string): string {
  const cleaned = (val || '').trim().replace(/[^a-zA-Z0-9.:/ ,-]/g, '');
  return cleaned || fallback;
}

function sanitizeDns(val: string | undefined | null, fallback: string): string {
  const cleaned = (val || '').trim().replace(/[^a-zA-Z0-9.:/ ,-]/g, '');
  return cleaned || fallback;
}

function sanitizePort(val: number | string | undefined | null, fallback: number): number {
  const parsed = typeof val === 'number' ? val : parseInt(String(val || ''), 10);
  if (isNaN(parsed) || parsed <= 0 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}

function sanitizeNumber(val: number | string | undefined | null, fallback: number, min = 0, max = 65535): number {
  const parsed = typeof val === 'number' ? val : parseInt(String(val || ''), 10);
  if (isNaN(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}

export function generateWireGuardServerConfig(settings: WireGuardSettings): string {
  const iface = sanitizeInterface(settings.serverInterface, 'eth0');
  const interfaceName = sanitizeInterface(settings.interfaceName, 'wg0');
  const serverIp = sanitizeIp(settings.serverIp, '10.8.0.1');
  const serverIpWithMask = `${serverIp}/24`;
  const serverPort = sanitizePort(settings.serverPort, 51820);
  const serverPrivateKey = sanitizeKey(settings.serverPrivateKey, '');
  const clientPublicKey = sanitizeKey(settings.clientPublicKey, '');
  const clientIp = sanitizeIp(settings.clientIp, '10.8.0.2');

  return `# ==========================================================================
# LinuxNetwork.ir - WireGuard Server Config (/etc/wireguard/wg0.conf)
# ==========================================================================
[Interface]
Address = ${serverIpWithMask}
ListenPort = ${serverPort}
PrivateKey = ${serverPrivateKey}

# Packet Forwarding & NAT Masquerade on ${iface}
PostUp = iptables -A FORWARD -i ${interfaceName} -j ACCEPT; iptables -A FORWARD -o ${interfaceName} -j ACCEPT; iptables -t nat -A POSTROUTING -o ${iface} -j MASQUERADE
PostDown = iptables -D FORWARD -i ${interfaceName} -j ACCEPT; iptables -D FORWARD -o ${interfaceName} -j ACCEPT; iptables -t nat -D POSTROUTING -o ${iface} -j MASQUERADE

# --------------------------------------------------------------------------
# Peer Client #1
# --------------------------------------------------------------------------
[Peer]
PublicKey = ${clientPublicKey}
AllowedIPs = ${clientIp}/32
`;
}

export function generateWireGuardClientConfig(settings: WireGuardSettings): string {
  const endpoint = sanitizeEndpoint(settings.serverEndpoint, 'YOUR_SERVER_IP');
  const serverPort = sanitizePort(settings.serverPort, 51820);
  const clientPrivateKey = sanitizeKey(settings.clientPrivateKey, '');
  const clientIp = sanitizeIp(settings.clientIp, '10.8.0.2');
  const dnsResolver = sanitizeDns(settings.dnsResolver, '1.1.1.1, 8.8.8.8');
  const mtu = settings.mtu ? sanitizeNumber(settings.mtu, 1420, 576, 9000) : 1420;
  const serverPublicKey = sanitizeKey(settings.serverPublicKey, '');
  const allowedIps = sanitizeAllowedIps(settings.allowedIps, '0.0.0.0/0, ::/0');
  const keepalive = sanitizeNumber(settings.persistentKeepalive, 25, 0, 86400);

  return `# ==========================================================================
# LinuxNetwork.ir - WireGuard Client Config (wg0-client.conf)
# Import this file into WireGuard Client on Windows / macOS / Linux / iOS / Android
# ==========================================================================
[Interface]
PrivateKey = ${clientPrivateKey}
Address = ${clientIp}/24
DNS = ${dnsResolver}
${mtu ? `MTU = ${mtu}` : ''}

[Peer]
PublicKey = ${serverPublicKey}
Endpoint = ${endpoint}:${serverPort}
AllowedIPs = ${allowedIps}
${keepalive > 0 ? `PersistentKeepalive = ${keepalive}` : ''}
`.trim();
}

export function generateWireGuardServerOneLiner(settings: WireGuardSettings): string {
  const serverConfig = generateWireGuardServerConfig(settings);
  const safeConfig = serverConfig.trim().replace(/^EOF$/gm, 'EOF ').replace(/'/g, "'\\''");

  return `sudo bash -c 'if command -v apk &>/dev/null; then apk add -q wireguard-tools iptables qrencode; elif command -v dnf &>/dev/null; then dnf install -y -q epel-release 2>/dev/null || true; dnf install -y -q wireguard-tools iptables qrencode; elif command -v yum &>/dev/null; then yum install -y -q epel-release 2>/dev/null || true; yum install -y -q wireguard-tools iptables qrencode; elif command -v apt-get &>/dev/null; then export DEBIAN_FRONTEND=noninteractive; apt-get update -qq && apt-get install -y -qq wireguard iptables qrencode; fi
sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward = 1" > /etc/sysctl.d/99-wireguard-forward.conf
sysctl --system 2>/dev/null || sysctl -p /etc/sysctl.d/99-wireguard-forward.conf 2>/dev/null || true

mkdir -p /etc/wireguard
chmod 700 /etc/wireguard

cat << "EOF" > /etc/wireguard/wg0.conf
${safeConfig}
EOF

chmod 600 /etc/wireguard/wg0.conf
if command -v rc-service &>/dev/null; then rc-update add wg-quick.wg0 default 2>/dev/null || true; rc-service wg-quick.wg0 restart 2>/dev/null || wg-quick up wg0; else systemctl enable wg-quick@wg0 2>/dev/null || true; systemctl restart wg-quick@wg0 2>/dev/null || wg-quick up wg0; fi
wg show'`;
}
