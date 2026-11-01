import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Cloudflare Pages Security Headers (_headers)', () => {
  const headersFilePath = path.resolve(process.cwd(), 'public/_headers');

  it('contains the public/_headers configuration file', () => {
    assert.ok(fs.existsSync(headersFilePath), 'public/_headers must exist');
  });

  it('enforces global OWASP security headers under /*', () => {
    const content = fs.readFileSync(headersFilePath, 'utf8');
    const globalSectionMatch = content.match(/\n\/\*\n([\s\S]*?)(?=\n\/|$)/);
    assert.ok(globalSectionMatch, '/* section must exist in _headers');

    const globalHeaders = globalSectionMatch[1];

    // Assert Content-Security-Policy
    assert.match(globalHeaders, /Content-Security-Policy:\s*default-src 'self'/);
    assert.match(globalHeaders, /base-uri 'self'/);
    assert.match(globalHeaders, /form-action 'self'/);
    assert.match(globalHeaders, /frame-ancestors 'self'/);

    // Assert Strict-Transport-Security (HSTS)
    assert.match(globalHeaders, /Strict-Transport-Security:\s*max-age=\d+;\s*includeSubDomains;\s*preload/);

    // Assert X-Content-Type-Options
    assert.match(globalHeaders, /X-Content-Type-Options:\s*nosniff/);

    // Assert X-Frame-Options
    assert.match(globalHeaders, /X-Frame-Options:\s*SAMEORIGIN/);

    // Assert Referrer-Policy
    assert.match(globalHeaders, /Referrer-Policy:\s*strict-origin-when-cross-origin/);

    // Assert Permissions-Policy
    assert.match(globalHeaders, /Permissions-Policy:\s*geolocation=\(\),\s*camera=\(\),\s*microphone=\(\)/);
  });
});
