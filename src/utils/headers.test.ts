import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const headersFilePath = path.resolve(process.cwd(), 'public/_headers');

describe('Security Headers Validation (public/_headers)', () => {
  it('public/_headers file exists', () => {
    assert.equal(fs.existsSync(headersFilePath), true, 'public/_headers should exist');
  });

  it('includes mandatory security headers under global /* path', () => {
    const content = fs.readFileSync(headersFilePath, 'utf-8');

    // Extract the global /* block (last occurrence of /*)
    const globalBlock = content.slice(content.lastIndexOf('\n/*')) || '';

    assert.match(globalBlock, /X-Content-Type-Options:\s*nosniff/i);
    assert.match(globalBlock, /X-Frame-Options:\s*SAMEORIGIN/i);
    assert.match(globalBlock, /X-XSS-Protection:\s*1;\s*mode=block/i);
    assert.match(globalBlock, /Referrer-Policy:\s*strict-origin-when-cross-origin/i);
    assert.match(globalBlock, /Permissions-Policy:/i);
    assert.match(globalBlock, /Cross-Origin-Opener-Policy:\s*same-origin/i);
    assert.match(globalBlock, /Content-Security-Policy:/i);
  });
});
