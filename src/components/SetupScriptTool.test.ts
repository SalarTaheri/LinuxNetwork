import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSshPort, sanitizeQdisc } from './SetupScriptTool';

describe('SetupScriptTool Input Sanitization', () => {
  describe('sanitizeSshPort', () => {
    it('accepts valid SSH port numbers', () => {
      assert.equal(sanitizeSshPort(22), 22);
      assert.equal(sanitizeSshPort(2222), 2222);
      assert.equal(sanitizeSshPort(65535), 65535);
      assert.equal(sanitizeSshPort('8080'), 8080);
    });

    it('falls back to default (2222) for out-of-range or negative ports', () => {
      assert.equal(sanitizeSshPort(-1), 2222);
      assert.equal(sanitizeSshPort(0), 2222);
      assert.equal(sanitizeSshPort(70000), 2222);
      assert.equal(sanitizeSshPort('-50'), 2222);
      assert.equal(sanitizeSshPort('999999'), 2222);
    });

    it('falls back to default (2222) for non-integer or malformed input', () => {
      assert.equal(sanitizeSshPort(22.5), 2222);
      assert.equal(sanitizeSshPort(NaN), 2222);
      assert.equal(sanitizeSshPort('invalid'), 2222);
      assert.equal(sanitizeSshPort(null), 2222);
      assert.equal(sanitizeSshPort(undefined), 2222);
    });

    it('respects custom fallback port parameter', () => {
      assert.equal(sanitizeSshPort(-1, 8022), 8022);
      assert.equal(sanitizeSshPort('invalid', 8022), 8022);
    });
  });

  describe('sanitizeQdisc', () => {
    it('accepts valid qdisc "cake"', () => {
      assert.equal(sanitizeQdisc('cake'), 'cake');
    });

    it('defaults to "fq" for "fq" or any unapproved/malicious string', () => {
      assert.equal(sanitizeQdisc('fq'), 'fq');
      assert.equal(sanitizeQdisc('fq; echo injected'), 'fq');
      assert.equal(sanitizeQdisc('invalid_algorithm'), 'fq');
      assert.equal(sanitizeQdisc(null), 'fq');
      assert.equal(sanitizeQdisc(undefined), 'fq');
    });
  });
});
