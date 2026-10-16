import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Cloudflare Pages Security Headers Configuration', () => {
  it('includes all critical HTTP security headers under /*', () => {
    const headersPath = path.resolve(process.cwd(), 'public/_headers');
    assert.ok(fs.existsSync(headersPath), '_headers file should exist in public/');

    const content = fs.readFileSync(headersPath, 'utf-8');

    // Extract the global /* section (matches /* section at start of file or after newline)
    const globalSectionMatch = content.match(/(?:^|\n)\/\*\s*\n([\s\S]*?)(?=\n\/|\n#|$)/);
    assert.ok(globalSectionMatch, 'global /* section should be present');

    const globalHeaders = globalSectionMatch[1];

    assert.match(globalHeaders, /X-Content-Type-Options:\s*nosniff/i);
    assert.match(globalHeaders, /X-Frame-Options:\s*SAMEORIGIN/i);
    assert.match(globalHeaders, /Referrer-Policy:\s*strict-origin-when-cross-origin/i);
    assert.match(globalHeaders, /Permissions-Policy:\s*geolocation=\(\),\s*camera=\(\),\s*microphone=\(\)/i);
    assert.match(globalHeaders, /Strict-Transport-Security:\s*max-age=31536000;\s*includeSubDomains;\s*preload/i);
    assert.match(globalHeaders, /X-XSS-Protection:\s*1;\s*mode=block/i);
  });
});
