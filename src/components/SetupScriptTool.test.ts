import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSshPort } from './SetupScriptTool';

describe('SetupScriptTool - sanitizeSshPort', () => {
  it('preserves valid SSH ports within 1-65535', () => {
    assert.equal(sanitizeSshPort(22), 22);
    assert.equal(sanitizeSshPort(2222), 2222);
    assert.equal(sanitizeSshPort(8080), 8080);
    assert.equal(sanitizeSshPort(65535), 65535);
    assert.equal(sanitizeSshPort('2222'), 2222);
  });

  it('sanitizes out-of-bounds or negative ports to fallback', () => {
    assert.equal(sanitizeSshPort(-1), 2222);
    assert.equal(sanitizeSshPort(0), 2222);
    assert.equal(sanitizeSshPort(65536), 2222);
    assert.equal(sanitizeSshPort(99999), 2222);
    assert.equal(sanitizeSshPort('-10'), 2222);
  });

  it('sanitizes non-numeric, floating point, or invalid inputs to fallback', () => {
    assert.equal(sanitizeSshPort(NaN), 2222);
    assert.equal(sanitizeSshPort(null), 2222);
    assert.equal(sanitizeSshPort(undefined), 2222);
    assert.equal(sanitizeSshPort('invalid'), 2222);
    assert.equal(sanitizeSshPort(2222.8), 2222);
  });

  it('allows custom fallback parameter', () => {
    assert.equal(sanitizeSshPort(-5, 22), 22);
  });
});
