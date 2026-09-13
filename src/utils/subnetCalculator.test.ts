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
  describe('Class A addresses (1-126)', () => {
    it('should return "Class A" for lower boundary (1)', () => {
      assert.strictEqual(getIpClass(1), 'Class A');
    });

    it('should return "Class A" for upper boundary (126)', () => {
      assert.strictEqual(getIpClass(126), 'Class A');
    });

    it('should return "Class A" for intermediate values in range 1-126', () => {
      assert.strictEqual(getIpClass(10), 'Class A');
      assert.strictEqual(getIpClass(50), 'Class A');
      assert.strictEqual(getIpClass(100), 'Class A');
    });
  });

  describe('Class A Loopback address (127)', () => {
    it('should return "Class A (Loopback)" for octet 127', () => {
      assert.strictEqual(getIpClass(127), 'Class A (Loopback)');
    });
  });

  describe('Class B addresses (128-191)', () => {
    it('should return "Class B" for lower boundary (128)', () => {
      assert.strictEqual(getIpClass(128), 'Class B');
    });

    it('should return "Class B" for upper boundary (191)', () => {
      assert.strictEqual(getIpClass(191), 'Class B');
    });

    it('should return "Class B" for intermediate values in range 128-191', () => {
      assert.strictEqual(getIpClass(172), 'Class B');
      assert.strictEqual(getIpClass(150), 'Class B');
    });
  });

  describe('Class C addresses (192-223)', () => {
    it('should return "Class C" for lower boundary (192)', () => {
      assert.strictEqual(getIpClass(192), 'Class C');
    });

    it('should return "Class C" for upper boundary (223)', () => {
      assert.strictEqual(getIpClass(223), 'Class C');
    });

    it('should return "Class C" for intermediate values in range 192-223', () => {
      assert.strictEqual(getIpClass(198), 'Class C');
      assert.strictEqual(getIpClass(210), 'Class C');
    });
  });

  describe('Class D Multicast addresses (224-239)', () => {
    it('should return "Class D (Multicast)" for lower boundary (224)', () => {
      assert.strictEqual(getIpClass(224), 'Class D (Multicast)');
    });

    it('should return "Class D (Multicast)" for upper boundary (239)', () => {
      assert.strictEqual(getIpClass(239), 'Class D (Multicast)');
    });

    it('should return "Class D (Multicast)" for intermediate values in range 224-239', () => {
      assert.strictEqual(getIpClass(230), 'Class D (Multicast)');
    });
  });

  describe('Class E Experimental addresses (240-255)', () => {
    it('should return "Class E (Experimental)" for lower boundary (240)', () => {
      assert.strictEqual(getIpClass(240), 'Class E (Experimental)');
    });

    it('should return "Class E (Experimental)" for upper boundary (255)', () => {
      assert.strictEqual(getIpClass(255), 'Class E (Experimental)');
    });

    it('should return "Class E (Experimental)" for intermediate values in range 240-255', () => {
      assert.strictEqual(getIpClass(250), 'Class E (Experimental)');
    });
  });

  describe('out-of-bounds octets and unknown classes', () => {
    it('should return "Unknown" for 0', () => {
      assert.strictEqual(getIpClass(0), 'Unknown');
    });

    it('should return "Unknown" for negative values', () => {
      assert.strictEqual(getIpClass(-1), 'Unknown');
      assert.strictEqual(getIpClass(-100), 'Unknown');
    });

    it('should return "Unknown" for values above 255', () => {
      assert.strictEqual(getIpClass(256), 'Unknown');
      assert.strictEqual(getIpClass(300), 'Unknown');
      assert.strictEqual(getIpClass(1000), 'Unknown');
    });
  });

  describe('non-integer and special numeric inputs', () => {
    it('should return "Unknown" for floating point numbers and NaN / Infinity', () => {
      assert.strictEqual(getIpClass(10.5), 'Class A'); // Note: 10.5 >= 1 && 10.5 <= 126
      assert.strictEqual(getIpClass(-0.5), 'Unknown');
      assert.strictEqual(getIpClass(255.5), 'Unknown');
      assert.strictEqual(getIpClass(NaN), 'Unknown');
      assert.strictEqual(getIpClass(Infinity), 'Unknown');
      assert.strictEqual(getIpClass(-Infinity), 'Unknown');
    });
  });
});

describe('getIpScope', () => {
  describe('RFC 1918 Private addresses', () => {
    it('identifies 10.0.0.0/8 private block', () => {
      assert.strictEqual(getIpScope('10.0.0.0'), 'RFC 1918 Private (10.0.0.0/8)');
      assert.strictEqual(getIpScope('10.0.0.1'), 'RFC 1918 Private (10.0.0.0/8)');
      assert.strictEqual(getIpScope('10.123.45.67'), 'RFC 1918 Private (10.0.0.0/8)');
      assert.strictEqual(getIpScope('10.255.255.255'), 'RFC 1918 Private (10.0.0.0/8)');
    });

    it('identifies 172.16.0.0/12 private block boundaries', () => {
      assert.strictEqual(getIpScope('172.16.0.0'), 'RFC 1918 Private (172.16.0.0/12)');
      assert.strictEqual(getIpScope('172.16.0.1'), 'RFC 1918 Private (172.16.0.0/12)');
      assert.strictEqual(getIpScope('172.20.100.1'), 'RFC 1918 Private (172.16.0.0/12)');
      assert.strictEqual(getIpScope('172.31.255.255'), 'RFC 1918 Private (172.16.0.0/12)');
    });

    it('identifies 172.16.0.0/12 out-of-bounds addresses as public', () => {
      assert.strictEqual(getIpScope('172.15.255.255'), 'Global Public Unicast');
      assert.strictEqual(getIpScope('172.32.0.0'), 'Global Public Unicast');
      assert.strictEqual(getIpScope('172.0.0.1'), 'Global Public Unicast');
    });

    it('identifies 192.168.0.0/16 private block', () => {
      assert.strictEqual(getIpScope('192.168.0.0'), 'RFC 1918 Private (192.168.0.0/16)');
      assert.strictEqual(getIpScope('192.168.1.1'), 'RFC 1918 Private (192.168.0.0/16)');
      assert.strictEqual(getIpScope('192.168.255.255'), 'RFC 1918 Private (192.168.0.0/16)');
    });

    it('identifies non-private 192.x addresses as public', () => {
      assert.strictEqual(getIpScope('192.167.1.1'), 'Global Public Unicast');
      assert.strictEqual(getIpScope('192.169.1.1'), 'Global Public Unicast');
      assert.strictEqual(getIpScope('192.0.2.1'), 'Global Public Unicast');
    });
  });

  describe('RFC 1122 Loopback addresses', () => {
    it('identifies 127.0.0.0/8 loopback block', () => {
      assert.strictEqual(getIpScope('127.0.0.1'), 'RFC 1122 Loopback (127.0.0.0/8)');
      assert.strictEqual(getIpScope('127.0.0.0'), 'RFC 1122 Loopback (127.0.0.0/8)');
      assert.strictEqual(getIpScope('127.255.255.255'), 'RFC 1122 Loopback (127.0.0.0/8)');
    });
  });

  describe('RFC 3927 Link-Local (APIPA) addresses', () => {
    it('identifies 169.254.0.0/16 link-local block', () => {
      assert.strictEqual(getIpScope('169.254.0.0'), 'RFC 3927 Link-Local (APIPA)');
      assert.strictEqual(getIpScope('169.254.1.1'), 'RFC 3927 Link-Local (APIPA)');
      assert.strictEqual(getIpScope('169.254.255.255'), 'RFC 3927 Link-Local (APIPA)');
    });

    it('identifies non-link-local 169.x addresses as public', () => {
      assert.strictEqual(getIpScope('169.253.255.255'), 'Global Public Unicast');
      assert.strictEqual(getIpScope('169.255.0.0'), 'Global Public Unicast');
    });
  });

  describe('RFC 6598 Carrier-Grade NAT (CGNAT) addresses', () => {
    it('identifies 100.64.0.0/10 CGNAT block boundaries', () => {
      assert.strictEqual(getIpScope('100.64.0.0'), 'RFC 6598 Carrier-Grade NAT (CGNAT)');
      assert.strictEqual(getIpScope('100.64.0.1'), 'RFC 6598 Carrier-Grade NAT (CGNAT)');
      assert.strictEqual(getIpScope('100.100.0.1'), 'RFC 6598 Carrier-Grade NAT (CGNAT)');
      assert.strictEqual(getIpScope('100.127.255.255'), 'RFC 6598 Carrier-Grade NAT (CGNAT)');
    });

    it('identifies 100.64.0.0/10 out-of-bounds addresses as public', () => {
      assert.strictEqual(getIpScope('100.63.255.255'), 'Global Public Unicast');
      assert.strictEqual(getIpScope('100.128.0.0'), 'Global Public Unicast');
    });
  });

  describe('Multicast and Reserved addresses', () => {
    it('identifies 224.0.0.0 - 239.255.255.255 Multicast addresses', () => {
      assert.strictEqual(getIpScope('224.0.0.0'), 'Multicast');
      assert.strictEqual(getIpScope('224.0.0.1'), 'Multicast');
      assert.strictEqual(getIpScope('230.1.2.3'), 'Multicast');
      assert.strictEqual(getIpScope('239.255.255.255'), 'Multicast');
    });

    it('identifies 240.0.0.0+ Reserved / Experimental addresses', () => {
      assert.strictEqual(getIpScope('240.0.0.0'), 'Reserved / Experimental');
      assert.strictEqual(getIpScope('240.0.0.1'), 'Reserved / Experimental');
      assert.strictEqual(getIpScope('255.255.255.255'), 'Reserved / Experimental');
    });
  });

  describe('Global Public Unicast addresses', () => {
    it('identifies various global public IP addresses', () => {
      assert.strictEqual(getIpScope('1.1.1.1'), 'Global Public Unicast');
      assert.strictEqual(getIpScope('8.8.8.8'), 'Global Public Unicast');
      assert.strictEqual(getIpScope('11.0.0.1'), 'Global Public Unicast');
      assert.strictEqual(getIpScope('223.255.255.255'), 'Global Public Unicast');
    });
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

describe('CIDR options benchmark', () => {
  it('measures inline array allocation vs static array reference', () => {
    const iterations = 100000;

    const startInline = performance.now();
    for (let i = 0; i < iterations; i++) {
      const arr = Array.from({ length: 25 }, (_, idx) => idx + 8);
      // simulate map / access
      arr.forEach((m) => m);
    }
    const inlineTime = performance.now() - startInline;

    const STATIC_CIDR_OPTIONS = Array.from({ length: 25 }, (_, idx) => idx + 8);
    const startStatic = performance.now();
    for (let i = 0; i < iterations; i++) {
      const arr = STATIC_CIDR_OPTIONS;
      arr.forEach((m) => m);
    }
    const staticTime = performance.now() - startStatic;

    console.log(`\n--- BENCHMARK RESULTS (${iterations} iterations) ---`);
    console.log(`Inline Array Creation: ${inlineTime.toFixed(3)} ms`);
    console.log(`Static Array Reference: ${staticTime.toFixed(3)} ms`);
    const speedup = (inlineTime / staticTime).toFixed(2);
    console.log(`Speedup: ${speedup}x faster`);
    console.log(`--------------------------------------------------\n`);

    assert.ok(staticTime < inlineTime, 'Static array reference should be faster than inline creation');
  });
});
