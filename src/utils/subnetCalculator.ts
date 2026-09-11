import { SubnetCalculation } from '../types';

export function ipToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

export function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join('.');
}

export function intToBinary(int: number): string {
  const binaryStr = (int >>> 0).toString(2).padStart(32, '0');
  return [
    binaryStr.slice(0, 8),
    binaryStr.slice(8, 16),
    binaryStr.slice(16, 24),
    binaryStr.slice(24, 32),
  ].join('.');
}

export function cidrToNetmaskInt(cidr: number): number {
  if (cidr === 0) return 0;
  return ((0xffffffff << (32 - cidr)) & 0xffffffff) >>> 0;
}

export function isValidIpv4(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d+$/.test(p)) return false;
    const num = parseInt(p, 10);
    return num >= 0 && num <= 255 && (p === '0' || !p.startsWith('0'));
  });
}

export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

export function getIpClass(firstOctet: number): string {
  if (firstOctet >= 1 && firstOctet <= 126) return 'Class A';
  if (firstOctet === 127) return 'Class A (Loopback)';
  if (firstOctet >= 128 && firstOctet <= 191) return 'Class B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'Class C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'Class D (Multicast)';
  if (firstOctet >= 240 && firstOctet <= 255) return 'Class E (Experimental)';
  return 'Unknown';
}

export function getIpScope(ip: string): string {
  const [o1, o2] = ip.split('.').map((x) => parseInt(x, 10));
  if (o1 === 10) return 'RFC 1918 Private (10.0.0.0/8)';
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return 'RFC 1918 Private (172.16.0.0/12)';
  if (o1 === 192 && o2 === 168) return 'RFC 1918 Private (192.168.0.0/16)';
  if (o1 === 127) return 'RFC 1122 Loopback (127.0.0.0/8)';
  if (o1 === 169 && o2 === 254) return 'RFC 3927 Link-Local (APIPA)';
  if (o1 === 100 && o2 >= 64 && o2 <= 127) return 'RFC 6598 Carrier-Grade NAT (CGNAT)';
  if (o1 >= 224 && o1 <= 239) return 'Multicast';
  if (o1 >= 240) return 'Reserved / Experimental';
  return 'Global Public Unicast';
}

export function calculateSubnet(ipStr: string, cidr: number): SubnetCalculation | null {
  if (!isValidIpv4(ipStr) || cidr < 0 || cidr > 32) {
    return null;
  }

  const ipInt = ipToInt(ipStr);
  const maskInt = cidrToNetmaskInt(cidr);
  const wildcardInt = (~maskInt) >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const totalHosts = Math.pow(2, 32 - cidr);
  let usableHosts = 0;
  let firstUsableInt = 0;
  let lastUsableInt = 0;

  if (cidr === 32) {
    usableHosts = 1;
    firstUsableInt = networkInt;
    lastUsableInt = networkInt;
  } else if (cidr === 31) {
    // RFC 3021 Point-to-Point links
    usableHosts = 2;
    firstUsableInt = networkInt;
    lastUsableInt = broadcastInt;
  } else {
    usableHosts = Math.max(0, totalHosts - 2);
    firstUsableInt = networkInt + 1;
    lastUsableInt = broadcastInt - 1;
  }

  const octets = ipStr.split('.');
  const ptrRecord = `${octets[3]}.${octets[2]}.${octets[1]}.${octets[0]}.in-addr.arpa`;

  const maskHex = '0x' + (maskInt >>> 0).toString(16).toUpperCase().padStart(8, '0');

  return {
    ip: ipStr,
    cidr,
    netmask: intToIp(maskInt),
    netmaskBinary: intToBinary(maskInt),
    netmaskHex: maskHex,
    wildcardMask: intToIp(wildcardInt),
    networkAddress: intToIp(networkInt),
    broadcastAddress: intToIp(broadcastInt),
    firstUsableIp: intToIp(firstUsableInt),
    lastUsableIp: intToIp(lastUsableInt),
    totalHosts,
    usableHosts,
    ipClass: getIpClass(parseInt(octets[0], 10)),
    ipScope: getIpScope(ipStr),
    binaryIp: intToBinary(ipInt),
    ptrRecord,
  };
}
