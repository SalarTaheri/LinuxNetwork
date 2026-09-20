import { SubnetCalculation } from '../types';

export function ipToInt(ip: string): number {
  let res = 0;
  let octet = 0;
  for (let i = 0; i < ip.length; i++) {
    const code = ip.charCodeAt(i);
    if (code === 46) { // '.'
      res = (res << 8) + octet;
      octet = 0;
    } else {
      octet = octet * 10 + (code - 48);
    }
  }
  return ((res << 8) + octet) >>> 0;
}

export function intToIp(int: number): string {
  return `${(int >>> 24) & 255}.${(int >>> 16) & 255}.${(int >>> 8) & 255}.${int & 255}`;
}

export function intToBinary(int: number): string {
  const binaryStr = (int >>> 0).toString(2).padStart(32, '0');
  return `${binaryStr.slice(0, 8)}.${binaryStr.slice(8, 16)}.${binaryStr.slice(16, 24)}.${binaryStr.slice(24, 32)}`;
}

export function cidrToNetmaskInt(cidr: number): number {
  if (cidr === 0) return 0;
  return ((0xffffffff << (32 - cidr)) & 0xffffffff) >>> 0;
}

export function isValidIpv4(ip: string): boolean {
  const str = ip.trim();
  if (str.length < 7 || str.length > 15) return false;

  let dots = 0;
  let octetVal = 0;
  let octetLen = 0;
  let startsWithZero = false;

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code === 46) { // '.'
      if (octetLen === 0 || octetVal > 255 || (startsWithZero && octetLen > 1)) return false;
      dots++;
      octetVal = 0;
      octetLen = 0;
      startsWithZero = false;
    } else if (code >= 48 && code <= 57) { // '0'-'9'
      if (octetLen === 0 && code === 48) {
        startsWithZero = true;
      }
      octetVal = octetVal * 10 + (code - 48);
      octetLen++;
    } else {
      return false;
    }
  }

  if (dots !== 3 || octetLen === 0 || octetVal > 255 || (startsWithZero && octetLen > 1)) {
    return false;
  }

  return true;
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
  const ipInt = ipToInt(ip);
  const o1 = (ipInt >>> 24) & 255;
  const o2 = (ipInt >>> 16) & 255;

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

  const o1 = (ipInt >>> 24) & 255;
  const o2 = (ipInt >>> 16) & 255;
  const o3 = (ipInt >>> 8) & 255;
  const o4 = ipInt & 255;
  const ptrRecord = `${o4}.${o3}.${o2}.${o1}.in-addr.arpa`;

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
    ipClass: getIpClass(o1),
    ipScope: getIpScope(ipStr),
    binaryIp: intToBinary(ipInt),
    ptrRecord,
  };
}
