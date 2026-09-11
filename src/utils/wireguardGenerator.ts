import { WireGuardSettings } from '../types';

export function generateWireGuardServerConfig(settings: WireGuardSettings): string {
  const iface = settings.serverInterface || 'eth0';
  const serverIpWithMask = `${settings.serverIp}/24`;

  return `# ==========================================================================
# LinuxNetwork.ir - WireGuard Server Config (/etc/wireguard/wg0.conf)
# ==========================================================================
[Interface]
Address = ${serverIpWithMask}
ListenPort = ${settings.serverPort}
PrivateKey = ${settings.serverPrivateKey}

# Packet Forwarding & NAT Masquerade on ${iface}
PostUp = iptables -A FORWARD -i ${settings.interfaceName} -j ACCEPT; iptables -A FORWARD -o ${settings.interfaceName} -j ACCEPT; iptables -t nat -A POSTROUTING -o ${iface} -j MASQUERADE
PostDown = iptables -D FORWARD -i ${settings.interfaceName} -j ACCEPT; iptables -D FORWARD -o ${settings.interfaceName} -j ACCEPT; iptables -t nat -D POSTROUTING -o ${iface} -j MASQUERADE

# --------------------------------------------------------------------------
# Peer Client #1
# --------------------------------------------------------------------------
[Peer]
PublicKey = ${settings.clientPublicKey}
AllowedIPs = ${settings.clientIp}/32
`;
}

export function generateWireGuardClientConfig(settings: WireGuardSettings): string {
  const endpoint = settings.serverEndpoint.trim() || 'YOUR_SERVER_IP';

  return `# ==========================================================================
# LinuxNetwork.ir - WireGuard Client Config (wg0-client.conf)
# Import this file into WireGuard Client on Windows / macOS / Linux / iOS / Android
# ==========================================================================
[Interface]
PrivateKey = ${settings.clientPrivateKey}
Address = ${settings.clientIp}/24
DNS = ${settings.dnsResolver}
${settings.mtu ? `MTU = ${settings.mtu}` : ''}

[Peer]
PublicKey = ${settings.serverPublicKey}
Endpoint = ${endpoint}:${settings.serverPort}
AllowedIPs = ${settings.allowedIps}
${settings.persistentKeepalive > 0 ? `PersistentKeepalive = ${settings.persistentKeepalive}` : ''}
`.trim();
}

export function generateWireGuardServerOneLiner(settings: WireGuardSettings): string {
  const serverConfig = generateWireGuardServerConfig(settings);
  const iface = settings.serverInterface || 'eth0';

  return `sudo bash -c 'apt-get update && apt-get install -y wireguard iptables qrencode
sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward = 1" > /etc/sysctl.d/99-wireguard-forward.conf
sysctl --system

mkdir -p /etc/wireguard
chmod 700 /etc/wireguard

cat << "EOF" > /etc/wireguard/wg0.conf
${serverConfig.trim()}
EOF

chmod 600 /etc/wireguard/wg0.conf
systemctl enable wg-quick@wg0
systemctl restart wg-quick@wg0
wg show'`;
}
