import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Cloudflare Pages Security Headers (_headers)', () => {
  const headersFilePath = path.resolve(process.cwd(), 'public/_headers');

  it('file public/_headers exists', () => {
    assert.ok(fs.existsSync(headersFilePath), 'public/_headers should exist');
  });

  it('contains essential global security headers', () => {
    const content = fs.readFileSync(headersFilePath, 'utf-8');

    // HSTS header
    assert.match(
      content,
      /Strict-Transport-Security:\s*max-age=\d+;\s*includeSubDomains;\s*preload/i,
      'Should configure Strict-Transport-Security header'
    );

    // Content Security Policy
    assert.match(
      content,
      /Content-Security-Policy:\s*default-src\s+'self'/i,
      'Should configure Content-Security-Policy header'
    );

    // X-Content-Type-Options
    assert.match(
      content,
      /X-Content-Type-Options:\s*nosniff/i,
      'Should configure X-Content-Type-Options nosniff'
    );

    // X-Frame-Options
    assert.match(
      content,
      /X-Frame-Options:\s*SAMEORIGIN/i,
      'Should configure X-Frame-Options SAMEORIGIN'
    );

    // Referrer-Policy
    assert.match(
      content,
      /Referrer-Policy:\s*strict-origin-when-cross-origin/i,
      'Should configure Referrer-Policy'
    );
  });
});
