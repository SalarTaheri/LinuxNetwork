import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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

describe('isValidPort', () => {
  describe('valid port numbers', () => {
    it('should return true for lower boundary port (1)', () => {
      assert.strictEqual(isValidPort(1), true);
    });

    it('should return true for upper boundary port (65535)', () => {
      assert.strictEqual(isValidPort(65535), true);
    });

    it('should return true for standard valid port numbers', () => {
      const validPorts = [80, 443, 22, 8080, 3000, 53, 1024, 49151];
      for (const port of validPorts) {
        assert.strictEqual(isValidPort(port), true, `Port ${port} should be valid`);
      }
    });
  });

  describe('out-of-bound port numbers', () => {
    it('should return false for port 0', () => {
      assert.strictEqual(isValidPort(0), false);
    });

    it('should return false for negative ports', () => {
      assert.strictEqual(isValidPort(-1), false);
      assert.strictEqual(isValidPort(-80), false);
      assert.strictEqual(isValidPort(-65535), false);
    });

    it('should return false for ports above 65535', () => {
      assert.strictEqual(isValidPort(65536), false);
      assert.strictEqual(isValidPort(70000), false);
      assert.strictEqual(isValidPort(1000000), false);
    });
  });

  describe('non-integer numbers and special numeric values', () => {
    it('should return false for floating point / non-integer numbers', () => {
      assert.strictEqual(isValidPort(80.5), false);
      assert.strictEqual(isValidPort(1.0001), false);
      assert.strictEqual(isValidPort(65534.99), false);
    });

    it('should return false for NaN, Infinity, and -Infinity', () => {
      assert.strictEqual(isValidPort(NaN), false);
      assert.strictEqual(isValidPort(Infinity), false);
      assert.strictEqual(isValidPort(-Infinity), false);
    });
  });

  describe('invalid types (runtime edge cases)', () => {
    it('should return false for non-number inputs', () => {
      assert.strictEqual(isValidPort(null as unknown as number), false);
      assert.strictEqual(isValidPort(undefined as unknown as number), false);
      assert.strictEqual(isValidPort('80' as unknown as number), false);
      assert.strictEqual(isValidPort({} as unknown as number), false);
      assert.strictEqual(isValidPort([] as unknown as number), false);
    });
  });
});

describe('isValidIpv4', () => {
  describe('valid IPv4 addresses', () => {
    it('should return true for standard private IP addresses', () => {
      assert.strictEqual(isValidIpv4('192.168.1.1'), true);
      assert.strictEqual(isValidIpv4('10.0.0.1'), true);
      assert.strictEqual(isValidIpv4('172.16.0.1'), true);
    });

    it('should return true for boundary IPv4 addresses', () => {
      assert.strictEqual(isValidIpv4('0.0.0.0'), true);
      assert.strictEqual(isValidIpv4('255.255.255.255'), true);
    });

    it('should return true for public IPv4 addresses', () => {
      assert.strictEqual(isValidIpv4('8.8.8.8'), true);
      assert.strictEqual(isValidIpv4('1.1.1.1'), true);
    });
  });

  describe('invalid IPv4 addresses', () => {
    it('should return false for octets out of 0-255 range', () => {
      assert.strictEqual(isValidIpv4('256.1.1.1'), false);
      assert.strictEqual(isValidIpv4('1.256.1.1'), false);
      assert.strictEqual(isValidIpv4('1.1.256.1'), false);
      assert.strictEqual(isValidIpv4('1.1.1.256'), false);
      assert.strictEqual(isValidIpv4('999.999.999.999'), false);
    });

    it('should return false for addresses with incorrect number of octets', () => {
      assert.strictEqual(isValidIpv4('192.168.1'), false);
      assert.strictEqual(isValidIpv4('10.0'), false);
      assert.strictEqual(isValidIpv4('172'), false);
      assert.strictEqual(isValidIpv4('192.168.1.1.1'), false);
    });

    it('should return false for addresses with leading zeros in octets', () => {
      assert.strictEqual(isValidIpv4('192.168.01.1'), false);
      assert.strictEqual(isValidIpv4('01.0.0.1'), false);
      assert.strictEqual(isValidIpv4('192.168.1.01'), false);
    });

    it('should return false for non-numeric characters and empty strings', () => {
      assert.strictEqual(isValidIpv4('abc.def.ghi.jkl'), false);
      assert.strictEqual(isValidIpv4('192.168.1.a'), false);
      assert.strictEqual(isValidIpv4(''), false);
      assert.strictEqual(isValidIpv4('...'), false);
    });

    it('should return false for negative numbers', () => {
      assert.strictEqual(isValidIpv4('-1.0.0.0'), false);
      assert.strictEqual(isValidIpv4('10.-1.0.0'), false);
    });
  });
});

describe('intToIp', () => {
  it('converts 0 to "0.0.0.0"', () => {
    assert.strictEqual(intToIp(0), '0.0.0.0');
  });

  it('converts max 32-bit unsigned integer (4294967295 / 0xFFFFFFFF) to "255.255.255.255"', () => {
    assert.strictEqual(intToIp(4294967295), '255.255.255.255');
    assert.strictEqual(intToIp(0xffffffff), '255.255.255.255');
  });

  it('converts standard IP integer values correctly', () => {
    assert.strictEqual(intToIp(3232235777), '192.168.1.1');
    assert.strictEqual(intToIp(2130706433), '127.0.0.1');
    assert.strictEqual(intToIp(167772161), '10.0.0.1');
    assert.strictEqual(intToIp(16909060), '1.2.3.4');
  });

  it('handles negative 32-bit signed integers via unsigned right shift', () => {
    assert.strictEqual(intToIp(-1), '255.255.255.255');
    assert.strictEqual(intToIp(-1062731519), '192.168.1.1');
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
      assert.strictEqual(intToIp(ipToInt(ip)), ip);
    }
  });

  it('preserves unsigned 32-bit integer value when round-tripping with ipToInt', () => {
    const testInts = [0, 1, 167772161, 2130706433, 3232235777, 4294967295];

    for (const intVal of testInts) {
      assert.strictEqual(ipToInt(intToIp(intVal)), intVal >>> 0);
    }
  });
});

describe('ipToInt', () => {
  it('converts IP strings to 32-bit unsigned integers', () => {
    assert.strictEqual(ipToInt('0.0.0.0'), 0);
    assert.strictEqual(ipToInt('192.168.1.1'), 3232235777);
    assert.strictEqual(ipToInt('255.255.255.255'), 4294967295);
  });
});

describe('intToBinary', () => {
  it('converts integer to formatted 32-bit binary string', () => {
    assert.strictEqual(intToBinary(0), '00000000.00000000.00000000.00000000');
    assert.strictEqual(intToBinary(4294967295), '11111111.11111111.11111111.11111111');
    assert.strictEqual(intToBinary(3232235777), '11000000.10101000.00000001.00000001');
  });
});

describe('cidrToNetmaskInt', () => {
  it('calculates netmask integer for various CIDR prefix lengths', () => {
    assert.strictEqual(cidrToNetmaskInt(0), 0);
    assert.strictEqual(cidrToNetmaskInt(8), 0xff000000 >>> 0);
    assert.strictEqual(cidrToNetmaskInt(24), 0xffffff00 >>> 0);
    assert.strictEqual(cidrToNetmaskInt(32), 0xffffffff >>> 0);
  });
});

describe('getIpClass', () => {
  it('determines IPv4 address class based on first octet', () => {
    assert.strictEqual(getIpClass(10), 'Class A');
    assert.strictEqual(getIpClass(127), 'Class A (Loopback)');
    assert.strictEqual(getIpClass(172), 'Class B');
    assert.strictEqual(getIpClass(192), 'Class C');
    assert.strictEqual(getIpClass(224), 'Class D (Multicast)');
    assert.strictEqual(getIpClass(240), 'Class E (Experimental)');
    assert.strictEqual(getIpClass(0), 'Unknown');
    assert.strictEqual(getIpClass(256), 'Unknown');
  });
});

describe('getIpScope', () => {
  it('identifies RFC defined scope of IPv4 addresses', () => {
    assert.strictEqual(getIpScope('10.0.0.1'), 'RFC 1918 Private (10.0.0.0/8)');
    assert.strictEqual(getIpScope('172.16.0.1'), 'RFC 1918 Private (172.16.0.0/12)');
    assert.strictEqual(getIpScope('192.168.1.1'), 'RFC 1918 Private (192.168.0.0/16)');
    assert.strictEqual(getIpScope('127.0.0.1'), 'RFC 1122 Loopback (127.0.0.0/8)');
    assert.strictEqual(getIpScope('169.254.1.1'), 'RFC 3927 Link-Local (APIPA)');
    assert.strictEqual(getIpScope('100.64.0.1'), 'RFC 6598 Carrier-Grade NAT (CGNAT)');
    assert.strictEqual(getIpScope('224.0.0.1'), 'Multicast');
    assert.strictEqual(getIpScope('240.0.0.1'), 'Reserved / Experimental');
    assert.strictEqual(getIpScope('8.8.8.8'), 'Global Public Unicast');
  });
});

describe('calculateSubnet', () => {
  it('returns null for invalid IP or CIDR', () => {
    assert.strictEqual(calculateSubnet('invalid-ip', 24), null);
    assert.strictEqual(calculateSubnet('192.168.1.1', -1), null);
    assert.strictEqual(calculateSubnet('192.168.1.1', 33), null);
  });

  it('calculates subnet details for standard /24 subnet', () => {
    const result = calculateSubnet('192.168.1.50', 24);
    assert.notStrictEqual(result, null);
    if (!result) return;

    assert.strictEqual(result.ip, '192.168.1.50');
    assert.strictEqual(result.cidr, 24);
    assert.strictEqual(result.netmask, '255.255.255.0');
    assert.strictEqual(result.wildcardMask, '0.0.0.255');
    assert.strictEqual(result.networkAddress, '192.168.1.0');
    assert.strictEqual(result.broadcastAddress, '192.168.1.255');
    assert.strictEqual(result.firstUsableIp, '192.168.1.1');
    assert.strictEqual(result.lastUsableIp, '192.168.1.254');
    assert.strictEqual(result.totalHosts, 256);
    assert.strictEqual(result.usableHosts, 254);
    assert.strictEqual(result.ipClass, 'Class C');
    assert.strictEqual(result.ptrRecord, '50.1.168.192.in-addr.arpa');
  });

  it('handles /32 point host CIDR', () => {
    const result = calculateSubnet('10.0.0.5', 32);
    assert.notStrictEqual(result, null);
    if (!result) return;

    assert.strictEqual(result.usableHosts, 1);
    assert.strictEqual(result.firstUsableIp, '10.0.0.5');
    assert.strictEqual(result.lastUsableIp, '10.0.0.5');
  });

  it('handles /31 RFC 3021 Point-to-Point links', () => {
    const result = calculateSubnet('10.0.0.0', 31);
    assert.notStrictEqual(result, null);
    if (!result) return;

    assert.strictEqual(result.usableHosts, 2);
    assert.strictEqual(result.firstUsableIp, '10.0.0.0');
    assert.strictEqual(result.lastUsableIp, '10.0.0.1');
  });
});
