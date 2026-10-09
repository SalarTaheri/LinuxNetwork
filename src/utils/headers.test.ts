import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Public Security Headers Configuration', () => {
  it('includes essential web application security headers in public/_headers', () => {
    const headersPath = path.resolve(process.cwd(), 'public/_headers');
    assert.ok(fs.existsSync(headersPath), 'public/_headers file must exist');

    const content = fs.readFileSync(headersPath, 'utf-8');

    // Required security headers
    const requiredHeaders = [
      'X-Content-Type-Options:',
      'X-Frame-Options:',
      'Referrer-Policy:',
      'Permissions-Policy:',
      'Content-Security-Policy:',
      'Strict-Transport-Security:',
      'Cross-Origin-Opener-Policy:',
      'X-XSS-Protection:',
    ];

    for (const header of requiredHeaders) {
      assert.ok(
        content.includes(header),
        `public/_headers must contain security header "${header}"`
      );
    }
  });
});
