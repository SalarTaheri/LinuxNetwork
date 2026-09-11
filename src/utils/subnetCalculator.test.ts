import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidIpv4 } from './subnetCalculator';

describe('isValidIpv4', () => {
  describe('valid IPv4 addresses', () => {
    it('returns true for standard valid IPv4 addresses', () => {
      assert.strictEqual(isValidIpv4('192.168.1.1'), true);
      assert.strictEqual(isValidIpv4('10.0.0.1'), true);
      assert.strictEqual(isValidIpv4('172.16.254.1'), true);
      assert.strictEqual(isValidIpv4('8.8.8.8'), true);
    });

    it('returns true for boundary IPv4 addresses', () => {
      assert.strictEqual(isValidIpv4('0.0.0.0'), true);
      assert.strictEqual(isValidIpv4('255.255.255.255'), true);
    });

    it('returns true for IP addresses with leading or trailing whitespace', () => {
      assert.strictEqual(isValidIpv4('  192.168.1.1  '), true);
      assert.strictEqual(isValidIpv4('\t10.0.0.1\n'), true);
    });
  });

  describe('invalid IPv4 addresses', () => {
    it('returns false when octet count is not 4', () => {
      assert.strictEqual(isValidIpv4('192.168.1'), false);
      assert.strictEqual(isValidIpv4('192.168.1.1.1'), false);
      assert.strictEqual(isValidIpv4('192.168.1.'), false);
      assert.strictEqual(isValidIpv4('.192.168.1.1'), false);
      assert.strictEqual(isValidIpv4('127.0.0'), false);
    });

    it('returns false when octet values are out of range (> 255)', () => {
      assert.strictEqual(isValidIpv4('256.0.0.1'), false);
      assert.strictEqual(isValidIpv4('192.168.1.256'), false);
      assert.strictEqual(isValidIpv4('300.168.1.1'), false);
      assert.strictEqual(isValidIpv4('999.999.999.999'), false);
    });

    it('returns false when octets have leading zeros (e.g. octet starting with 0 except "0")', () => {
      assert.strictEqual(isValidIpv4('01.2.3.4'), false);
      assert.strictEqual(isValidIpv4('192.168.01.1'), false);
      assert.strictEqual(isValidIpv4('192.168.1.00'), false);
      assert.strictEqual(isValidIpv4('00.0.0.0'), false);
    });

    it('returns false for non-numeric or invalid characters', () => {
      assert.strictEqual(isValidIpv4('192.168.1.a'), false);
      assert.strictEqual(isValidIpv4('abc.def.ghi.jkl'), false);
      assert.strictEqual(isValidIpv4('192.168.1.1a'), false);
      assert.strictEqual(isValidIpv4('-1.2.3.4'), false);
      assert.strictEqual(isValidIpv4('192.168.1.-1'), false);
      assert.strictEqual(isValidIpv4('192.168.1.1/24'), false);
    });

    it('returns false for empty or whitespace-only strings', () => {
      assert.strictEqual(isValidIpv4(''), false);
      assert.strictEqual(isValidIpv4('   '), false);
    });

    it('returns false for empty octets', () => {
      assert.strictEqual(isValidIpv4('192..168.1'), false);
      assert.strictEqual(isValidIpv4('192.168..1'), false);
    });
  });
});
