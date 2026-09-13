export type Language = 'fa' | 'en';

export type PageView = 'landing' | 'toolbox';

export type ToolTab = 'setup' | 'sysctl' | 'nginx' | 'wireguard' | 'subnet' | 'routing';

export type ToolCategory = 'all' | 'server' | 'network' | 'security';

export interface SetupScriptSettings {
  enableBbr: boolean;
  enableBbr3: boolean;
  qdisc: 'fq' | 'cake';
  enableSysctlOpt: boolean;
  enableCustomSshPort: boolean;
  sshPort: number;
  disablePasswordAuth: boolean;
  enableFail2ban: boolean;
  enableUfw: boolean;
  enableDocker: boolean;
  enableDockerMirror: boolean;
  enableTools: boolean;
  enableZsh: boolean;
}

export type ServerProfile = 'web' | 'proxy' | 'download' | 'lowlatency';

export type RamSize = '1GB' | '2GB' | '4GB' | '8GB' | '16GB' | '32GB' | '64GB';

export type BandwidthTier = '100M' | '1G' | '10G';

export interface SysctlSettings {
  profile: ServerProfile;
  ram: RamSize;
  bandwidth: BandwidthTier;
  enableBbr: boolean;
  enableSynCookies: boolean;
  enableTwReuse: boolean;
  enableFastOpen: boolean;
  disableIpv6: boolean;
  enableIpForward: boolean;
  enableMtuProbing: boolean;
  increaseFileLimits: boolean;
}

export interface NginxSettings {
  domain: string;
  serverAlias: string;
  upstreamType: 'http' | 'unix';
  upstreamAddress: string;
  listenPort: number;
  enableSsl: boolean;
  sslCertPath: string;
  sslKeyPath: string;
  enableHttp2: boolean;
  enableWebsockets: boolean;
  clientMaxBodySize: number; // in MB
  enableGzip: boolean;
  enableRealIpHeaders: boolean;
  proxyTimeout: 'short' | 'standard' | 'long';
  proxyBuffering: 'enabled' | 'disabled' | 'stream';
  enableSecurityHeaders: boolean;
}

export interface WireGuardSettings {
  serverEndpoint: string;
  serverPort: number;
  tunnelSubnet: string; // e.g. 10.8.0.0/24
  serverIp: string; // 10.8.0.1
  clientIp: string; // 10.8.0.2
  dnsResolver: string;
  mtu: number;
  persistentKeepalive: number;
  allowedIps: string;
  interfaceName: string; // wg0
  serverPrivateKey: string;
  serverPublicKey: string;
  clientPrivateKey: string;
  clientPublicKey: string;
  serverInterface: string; // eth0 / ens3
}

export interface SubnetCalculation {
  ip: string;
  cidr: number;
  netmask: string;
  netmaskBinary: string;
  netmaskHex: string;
  wildcardMask: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableIp: string;
  lastUsableIp: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: string;
  ipScope: string;
  binaryIp: string;
  ptrRecord: string;
}

export type RoutingScenario =
  | 'nat_gateway'
  | 'port_forward'
  | 'docker_shield'
  | 'pbr_multiwan'
  | 'rate_limit';

export type NatMode = 'masquerade' | 'snat';
export type Protocol = 'tcp' | 'udp' | 'both';

export interface RoutingSettings {
  scenario: RoutingScenario;
  // NAT Gateway settings
  wanInterface: string;
  lanInterface: string;
  lanSubnet: string;
  natMode: NatMode;
  staticPublicIp: string;
  enableDnsForwarding: boolean;
  enableMssClamping: boolean;

  // Port Forwarding settings
  protocol: Protocol;
  externalPort: string;
  internalIp: string;
  internalPort: string;
  enableHairpinNat: boolean;

  // Docker Shield settings
  dockerPort: string;
  dockerAllowedSubnet: string;
  dockerAction: 'DROP' | 'REJECT';

  // Policy-Based Routing (Multi-WAN) settings
  secondaryInterface: string;
  secondaryIp: string;
  secondaryGateway: string;
  pbrTableNumber: number;
  pbrTableName: string;
  enableLooseRpFilter: boolean;

  // Rate Limiting settings
  rateLimitPort: string;
  rateLimitMaxHits: number;
  rateLimitWindowSeconds: number;
  rateLimitBlockSeconds: number;
}
