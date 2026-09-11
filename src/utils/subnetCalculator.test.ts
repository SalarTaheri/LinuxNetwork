import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSubnet,
  isValidIpv4,
  isValidPort,
  ipToInt,
  intToIp,
  intToBinary,
  cidrToNetmaskInt,
  getIpClass,
  getIpScope,
} from './subnetCalculator';

describe('subnetCalculator', () => {
  describe('calculateSubnet', () => {
    it('returns null for invalid IP addresses', () => {
      assert.equal(calculateSubnet('invalid.ip', 24), null);
      assert.equal(calculateSubnet('256.1.1.1', 24), null);
      assert.equal(calculateSubnet('192.168.1.1.1', 24), null);
      assert.equal(calculateSubnet('192.168.1', 24), null);
      assert.equal(calculateSubnet('192.168.1.01', 24), null); // leading zero invalid
      assert.equal(calculateSubnet('', 24), null);
    });

    it('returns null for invalid CIDR values', () => {
      assert.equal(calculateSubnet('192.168.1.10', -1), null);
      assert.equal(calculateSubnet('192.168.1.10', 33), null);
    });

    it('correctly calculates subnet for standard /24 network (Class C Private)', () => {
      const result = calculateSubnet('192.168.1.50', 24);
      assert.notEqual(result, null);
      if (!result) return;

      assert.equal(result.ip, '192.168.1.50');
      assert.equal(result.cidr, 24);
      assert.equal(result.netmask, '255.255.255.0');
      assert.equal(result.netmaskBinary, '11111111.11111111.11111111.00000000');
      assert.equal(result.netmaskHex, '0xFFFFFF00');
      assert.equal(result.wildcardMask, '0.0.0.255');
      assert.equal(result.networkAddress, '192.168.1.0');
      assert.equal(result.broadcastAddress, '192.168.1.255');
      assert.equal(result.firstUsableIp, '192.168.1.1');
      assert.equal(result.lastUsableIp, '192.168.1.254');
      assert.equal(result.totalHosts, 256);
      assert.equal(result.usableHosts, 254);
      assert.equal(result.ipClass, 'Class C');
      assert.equal(result.ipScope, 'RFC 1918 Private (192.168.0.0/16)');
      assert.equal(result.binaryIp, '11000000.10101000.00000001.00110010');
      assert.equal(result.ptrRecord, '50.1.168.192.in-addr.arpa');
    });

    it('correctly calculates subnet for /16 network (Class B Private)', () => {
      const result = calculateSubnet('172.16.5.10', 16);
      assert.notEqual(result, null);
      if (!result) return;

      assert.equal(result.netmask, '255.255.0.0');
      assert.equal(result.networkAddress, '172.16.0.0');
      assert.equal(result.broadcastAddress, '172.16.255.255');
      assert.equal(result.firstUsableIp, '172.16.0.1');
      assert.equal(result.lastUsableIp, '172.16.255.254');
      assert.equal(result.totalHosts, 65536);
      assert.equal(result.usableHosts, 65534);
      assert.equal(result.ipClass, 'Class B');
      assert.equal(result.ipScope, 'RFC 1918 Private (172.16.0.0/12)');
    });

    it('correctly calculates subnet for /8 network (Class A Private)', () => {
      const result = calculateSubnet('10.1.2.3', 8);
      assert.notEqual(result, null);
      if (!result) return;

      assert.equal(result.netmask, '255.0.0.0');
      assert.equal(result.networkAddress, '10.0.0.0');
      assert.equal(result.broadcastAddress, '10.255.255.255');
      assert.equal(result.firstUsableIp, '10.0.0.1');
      assert.equal(result.lastUsableIp, '10.255.255.254');
      assert.equal(result.totalHosts, 16777216);
      assert.equal(result.usableHosts, 16777214);
      assert.equal(result.ipClass, 'Class A');
      assert.equal(result.ipScope, 'RFC 1918 Private (10.0.0.0/8)');
    });

    it('correctly handles edge case /32 (Single Host)', () => {
      const result = calculateSubnet('192.0.2.1', 32);
      assert.notEqual(result, null);
      if (!result) return;

      assert.equal(result.netmask, '255.255.255.255');
      assert.equal(result.networkAddress, '192.0.2.1');
      assert.equal(result.broadcastAddress, '192.0.2.1');
      assert.equal(result.firstUsableIp, '192.0.2.1');
      assert.equal(result.lastUsableIp, '192.0.2.1');
      assert.equal(result.totalHosts, 1);
      assert.equal(result.usableHosts, 1);
    });

    it('correctly handles edge case /31 (RFC 3021 Point-to-Point link)', () => {
      const result = calculateSubnet('192.0.2.4', 31);
      assert.notEqual(result, null);
      if (!result) return;

      assert.equal(result.netmask, '255.255.255.254');
      assert.equal(result.networkAddress, '192.0.2.4');
      assert.equal(result.broadcastAddress, '192.0.2.5');
      assert.equal(result.firstUsableIp, '192.0.2.4');
      assert.equal(result.lastUsableIp, '192.0.2.5');
      assert.equal(result.totalHosts, 2);
      assert.equal(result.usableHosts, 2);
    });

    it('correctly handles edge case /0 (Default Route)', () => {
      const result = calculateSubnet('1.2.3.4', 0);
      assert.notEqual(result, null);
      if (!result) return;

      assert.equal(result.netmask, '0.0.0.0');
      assert.equal(result.networkAddress, '0.0.0.0');
      assert.equal(result.broadcastAddress, '255.255.255.255');
      assert.equal(result.firstUsableIp, '0.0.0.1');
      assert.equal(result.lastUsableIp, '255.255.255.254');
      assert.equal(result.totalHosts, 4294967296);
      assert.equal(result.usableHosts, 4294967294);
    });
  });

  describe('isValidIpv4', () => {
    it('validates correct IPv4 addresses', () => {
      assert.equal(isValidIpv4('0.0.0.0'), true);
      assert.equal(isValidIpv4('127.0.0.1'), true);
      assert.equal(isValidIpv4('192.168.1.1'), true);
      assert.equal(isValidIpv4('255.255.255.255'), true);
    });

    it('rejects invalid IPv4 addresses', () => {
      assert.equal(isValidIpv4(''), false);
      assert.equal(isValidIpv4('1.2.3'), false);
      assert.equal(isValidIpv4('1.2.3.4.5'), false);
      assert.equal(isValidIpv4('256.0.0.1'), false);
      assert.equal(isValidIpv4('1.2.3.-1'), false);
      assert.equal(isValidIpv4('1.2.3.01'), false);
      assert.equal(isValidIpv4('a.b.c.d'), false);
      assert.equal(isValidIpv4('1.2.3.4a'), false);
    });
  });

  describe('isValidPort', () => {
    it('validates valid port numbers', () => {
      assert.equal(isValidPort(1), true);
      assert.equal(isValidPort(80), true);
      assert.equal(isValidPort(443), true);
      assert.equal(isValidPort(65535), true);
    });

    it('rejects invalid port numbers', () => {
      assert.equal(isValidPort(0), false);
      assert.equal(isValidPort(-1), false);
      assert.equal(isValidPort(65536), false);
      assert.equal(isValidPort(80.5), false);
      assert.equal(isValidPort(NaN), false);
    });
  });

  describe('ipToInt and intToIp', () => {
    it('converts IP string to integer and back', () => {
      const ip = '192.168.1.1';
      const int = ipToInt(ip);
      assert.equal(int, 3232235777);
      assert.equal(intToIp(int), ip);
    });

    it('handles 0.0.0.0 and 255.255.255.255', () => {
      assert.equal(ipToInt('0.0.0.0'), 0);
      assert.equal(intToIp(0), '0.0.0.0');

      assert.equal(ipToInt('255.255.255.255'), 4294967295);
      assert.equal(intToIp(4294967295), '255.255.255.255');
    });
  });

  describe('intToBinary', () => {
    it('formats 32-bit int into dot-separated binary string', () => {
      assert.equal(intToBinary(0), '00000000.00000000.00000000.00000000');
      assert.equal(intToBinary(4294967295), '11111111.11111111.11111111.11111111');
      assert.equal(intToBinary(ipToInt('192.168.1.1')), '11000000.10101000.00000001.00000001');
    });
  });

  describe('cidrToNetmaskInt', () => {
    it('converts CIDR prefix length to integer netmask', () => {
      assert.equal(cidrToNetmaskInt(0), 0);
      assert.equal(cidrToNetmaskInt(24), 4294967040);
      assert.equal(cidrToNetmaskInt(32), 4294967295);
    });
  });

  describe('getIpClass', () => {
    it('identifies correct IPv4 class based on first octet', () => {
      assert.equal(getIpClass(10), 'Class A');
      assert.equal(getIpClass(127), 'Class A (Loopback)');
      assert.equal(getIpClass(172), 'Class B');
      assert.equal(getIpClass(192), 'Class C');
      assert.equal(getIpClass(225), 'Class D (Multicast)');
      assert.equal(getIpClass(245), 'Class E (Experimental)');
      assert.equal(getIpClass(0), 'Unknown');
    });
  });

  describe('getIpScope', () => {
    it('identifies RFC 1918 Private scopes', () => {
      assert.equal(getIpScope('10.0.0.1'), 'RFC 1918 Private (10.0.0.0/8)');
      assert.equal(getIpScope('172.16.0.1'), 'RFC 1918 Private (172.16.0.0/12)');
      assert.equal(getIpScope('192.168.1.1'), 'RFC 1918 Private (192.168.0.0/16)');
    });

    it('identifies Special/Reserved scopes', () => {
      assert.equal(getIpScope('127.0.0.1'), 'RFC 1122 Loopback (127.0.0.0/8)');
      assert.equal(getIpScope('169.254.1.1'), 'RFC 3927 Link-Local (APIPA)');
      assert.equal(getIpScope('100.64.0.1'), 'RFC 6598 Carrier-Grade NAT (CGNAT)');
      assert.equal(getIpScope('224.0.0.1'), 'Multicast');
      assert.equal(getIpScope('240.0.0.1'), 'Reserved / Experimental');
    });

    it('identifies Global Public Unicast scope', () => {
      assert.equal(getIpScope('8.8.8.8'), 'Global Public Unicast');
      assert.equal(getIpScope('1.1.1.1'), 'Global Public Unicast');
    });
  });
});
