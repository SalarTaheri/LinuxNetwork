import { describe, it, expect } from 'vitest';
import { ipToInt, intToIp } from './subnetCalculator';

describe('ipToInt', () => {
  it('should convert standard IPv4 addresses to unsigned 32-bit integers', () => {
    expect(ipToInt('0.0.0.0')).toBe(0);
    expect(ipToInt('127.0.0.1')).toBe(2130706433);
    expect(ipToInt('192.168.1.1')).toBe(3232235777);
    expect(ipToInt('10.0.0.1')).toBe(167772161);
    expect(ipToInt('172.16.0.1')).toBe(2886729729);
    expect(ipToInt('255.255.255.255')).toBe(4294967295);
  });

  it('should treat result as an unsigned integer (non-negative)', () => {
    // 255.255.255.255 in signed 32-bit int is -1, but ipToInt should return unsigned 4294967295
    const result = ipToInt('255.255.255.255');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBe(0xFFFFFFFF >>> 0);
  });

  it('should be consistent round-trip with intToIp', () => {
    const testIps = [
      '0.0.0.0',
      '1.1.1.1',
      '8.8.8.8',
      '10.254.0.1',
      '172.31.255.254',
      '192.168.0.100',
      '224.0.0.1',
      '255.255.255.255',
    ];

    for (const ip of testIps) {
      expect(intToIp(ipToInt(ip))).toBe(ip);
    }
  });
});
