import { describe, it, expect } from 'vitest';
import {
  intToIp,
  ipToInt,
  intToBinary,
  cidrToNetmaskInt,
  isValidIpv4,
  isValidPort,
  getIpClass,
  getIpScope,
  calculateSubnet,
} from './subnetCalculator';

describe('intToIp', () => {
  it('converts 0 to "0.0.0.0"', () => {
    expect(intToIp(0)).toBe('0.0.0.0');
  });

  it('converts max 32-bit unsigned integer (4294967295 / 0xFFFFFFFF) to "255.255.255.255"', () => {
    expect(intToIp(4294967295)).toBe('255.255.255.255');
    expect(intToIp(0xffffffff)).toBe('255.255.255.255');
  });

  it('converts standard IP integer values correctly', () => {
    expect(intToIp(3232235777)).toBe('192.168.1.1'); // 0xC0A80101
    expect(intToIp(2130706433)).toBe('127.0.0.1'); // 0x7F000001
    expect(intToIp(167772161)).toBe('10.0.0.1'); // 0x0A000001
    expect(intToIp(16909060)).toBe('1.2.3.4'); // 0x01020304
  });

  it('handles negative 32-bit signed integers via unsigned right shift', () => {
    // In JavaScript bitwise operations, numbers are converted to 32-bit signed ints.
    // -1 has bits 0xFFFFFFFF, which >>> treats as unsigned 4294967295
    expect(intToIp(-1)).toBe('255.255.255.255');
    // -1062731519 is 3232235777 - 2^32
    expect(intToIp(-1062731519)).toBe('192.168.1.1');
  });

  it('is the inverse operation of ipToInt for valid IPv4 addresses', () => {
    const testIps = [
      '0.0.0.0',
      '10.0.0.1',
      '172.16.254.1',
      '192.168.1.1',
      '127.0.0.1',
      '8.8.8.8',
      '255.255.255.255',
    ];

    for (const ip of testIps) {
      expect(intToIp(ipToInt(ip))).toBe(ip);
    }
  });

  it('preserves unsigned 32-bit integer value when round-tripping with ipToInt', () => {
    const testInts = [0, 1, 167772161, 2130706433, 3232235777, 4294967295];

    for (const intVal of testInts) {
      expect(ipToInt(intToIp(intVal))).toBe(intVal >>> 0);
    }
  });
});

describe('ipToInt', () => {
  it('converts IP strings to 32-bit unsigned integers', () => {
    expect(ipToInt('0.0.0.0')).toBe(0);
    expect(ipToInt('192.168.1.1')).toBe(3232235777);
    expect(ipToInt('255.255.255.255')).toBe(4294967295);
  });
});

describe('intToBinary', () => {
  it('converts integer to formatted 32-bit binary string', () => {
    expect(intToBinary(0)).toBe('00000000.00000000.00000000.00000000');
    expect(intToBinary(4294967295)).toBe('11111111.11111111.11111111.11111111');
    expect(intToBinary(3232235777)).toBe('11000000.10101000.00000001.00000001'); // 192.168.1.1
  });
});

describe('cidrToNetmaskInt', () => {
  it('calculates netmask integer for various CIDR prefix lengths', () => {
    expect(cidrToNetmaskInt(0)).toBe(0);
    expect(cidrToNetmaskInt(8)).toBe(0xff000000 >>> 0); // 255.0.0.0 = 4278190080
    expect(cidrToNetmaskInt(24)).toBe(0xffffff00 >>> 0); // 255.255.255.0 = 4294967040
    expect(cidrToNetmaskInt(32)).toBe(0xffffffff >>> 0); // 255.255.255.255 = 4294967295
  });
});

describe('isValidIpv4', () => {
  it('validates IPv4 addresses', () => {
    expect(isValidIpv4('192.168.1.1')).toBe(true);
    expect(isValidIpv4('0.0.0.0')).toBe(true);
    expect(isValidIpv4('255.255.255.255')).toBe(true);

    expect(isValidIpv4('256.1.1.1')).toBe(false);
    expect(isValidIpv4('192.168.1')).toBe(false);
    expect(isValidIpv4('192.168.1.1.1')).toBe(false);
    expect(isValidIpv4('192.168.01.1')).toBe(false); // Leading zero
    expect(isValidIpv4('abc.def.ghi.jkl')).toBe(false);
    expect(isValidIpv4('-1.0.0.0')).toBe(false);
  });
});

describe('isValidPort', () => {
  it('validates port numbers', () => {
    expect(isValidPort(1)).toBe(true);
    expect(isValidPort(80)).toBe(true);
    expect(isValidPort(443)).toBe(true);
    expect(isValidPort(65535)).toBe(true);

    expect(isValidPort(0)).toBe(false);
    expect(isValidPort(65536)).toBe(false);
    expect(isValidPort(-80)).toBe(false);
    expect(isValidPort(80.5)).toBe(false);
  });
});

describe('getIpClass', () => {
  it('determines IPv4 address class based on first octet', () => {
    expect(getIpClass(10)).toBe('Class A');
    expect(getIpClass(127)).toBe('Class A (Loopback)');
    expect(getIpClass(172)).toBe('Class B');
    expect(getIpClass(192)).toBe('Class C');
    expect(getIpClass(224)).toBe('Class D (Multicast)');
    expect(getIpClass(240)).toBe('Class E (Experimental)');
    expect(getIpClass(0)).toBe('Unknown');
    expect(getIpClass(256)).toBe('Unknown');
  });
});

describe('getIpScope', () => {
  it('identifies RFC defined scope of IPv4 addresses', () => {
    expect(getIpScope('10.0.0.1')).toBe('RFC 1918 Private (10.0.0.0/8)');
    expect(getIpScope('172.16.0.1')).toBe('RFC 1918 Private (172.16.0.0/12)');
    expect(getIpScope('192.168.1.1')).toBe('RFC 1918 Private (192.168.0.0/16)');
    expect(getIpScope('127.0.0.1')).toBe('RFC 1122 Loopback (127.0.0.0/8)');
    expect(getIpScope('169.254.1.1')).toBe('RFC 3927 Link-Local (APIPA)');
    expect(getIpScope('100.64.0.1')).toBe('RFC 6598 Carrier-Grade NAT (CGNAT)');
    expect(getIpScope('224.0.0.1')).toBe('Multicast');
    expect(getIpScope('240.0.0.1')).toBe('Reserved / Experimental');
    expect(getIpScope('8.8.8.8')).toBe('Global Public Unicast');
  });
});

describe('calculateSubnet', () => {
  it('returns null for invalid IP or CIDR', () => {
    expect(calculateSubnet('invalid-ip', 24)).toBeNull();
    expect(calculateSubnet('192.168.1.1', -1)).toBeNull();
    expect(calculateSubnet('192.168.1.1', 33)).toBeNull();
  });

  it('calculates subnet details for standard /24 subnet', () => {
    const result = calculateSubnet('192.168.1.50', 24);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.ip).toBe('192.168.1.50');
    expect(result.cidr).toBe(24);
    expect(result.netmask).toBe('255.255.255.0');
    expect(result.wildcardMask).toBe('0.0.0.255');
    expect(result.networkAddress).toBe('192.168.1.0');
    expect(result.broadcastAddress).toBe('192.168.1.255');
    expect(result.firstUsableIp).toBe('192.168.1.1');
    expect(result.lastUsableIp).toBe('192.168.1.254');
    expect(result.totalHosts).toBe(256);
    expect(result.usableHosts).toBe(254);
    expect(result.ipClass).toBe('Class C');
    expect(result.ptrRecord).toBe('50.1.168.192.in-addr.arpa');
  });

  it('handles /32 point host CIDR', () => {
    const result = calculateSubnet('10.0.0.5', 32);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.usableHosts).toBe(1);
    expect(result.firstUsableIp).toBe('10.0.0.5');
    expect(result.lastUsableIp).toBe('10.0.0.5');
  });

  it('handles /31 RFC 3021 Point-to-Point links', () => {
    const result = calculateSubnet('10.0.0.0', 31);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.usableHosts).toBe(2);
    expect(result.firstUsableIp).toBe('10.0.0.0');
    expect(result.lastUsableIp).toBe('10.0.0.1');
  });
});
