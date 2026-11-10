import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Cloudflare Pages Security Headers', () => {
  const headersFilePath = path.resolve(process.cwd(), 'public/_headers');
  const headersContent = fs.readFileSync(headersFilePath, 'utf-8');

  it('includes standard global security headers in /* block', () => {
    assert.match(headersContent, /X-Content-Type-Options:\s*nosniff/);
    assert.match(headersContent, /X-Frame-Options:\s*SAMEORIGIN/);
    assert.match(headersContent, /Referrer-Policy:\s*strict-origin-when-cross-origin/);
    assert.match(headersContent, /Permissions-Policy:\s*geolocation=\(\),\s*camera=\(\),\s*microphone=\(\)/);
  });

  it('defines a strict Content-Security-Policy (CSP) with key directives', () => {
    assert.match(headersContent, /Content-Security-Policy:/);

    // Verify vital CSP directives to prevent XSS, data exfiltration, clickjacking, and arbitrary script execution
    assert.match(headersContent, /default-src\s+'self'/);
    assert.match(headersContent, /script-src\s+'self'/);
    assert.match(headersContent, /style-src\s+'self'/);
    assert.match(headersContent, /font-src\s+'self'/);
    assert.match(headersContent, /img-src\s+'self'/);
    assert.match(headersContent, /connect-src\s+'self'/);
    assert.match(headersContent, /frame-ancestors\s+'self'/);
    assert.match(headersContent, /base-uri\s+'self'/);
    assert.match(headersContent, /form-action\s+'self'/);
  });
});
