import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidPort } from './subnetCalculator';

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
