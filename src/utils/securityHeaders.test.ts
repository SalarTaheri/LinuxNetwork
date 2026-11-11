import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Cloudflare Pages Security Headers (_headers)', () => {
  const headersFilePath = path.resolve(process.cwd(), 'public/_headers');

  it('file exists in public directory', () => {
    assert.ok(fs.existsSync(headersFilePath), 'public/_headers must exist');
  });

  it('enforces Strict-Transport-Security (HSTS) and Content-Security-Policy (CSP) on /*', () => {
    const content = fs.readFileSync(headersFilePath, 'utf8');

    // Extract the /* section (match from line starting with '/*' to end of file or next path rule)
    const match = content.match(/^\/\*\s*$/m);
    assert.ok(match, 'Global /* block header must be present');

    const globalBlock = content.slice(match.index);

    // HSTS assertion
    assert.match(
      globalBlock,
      /Strict-Transport-Security:\s*max-age=\d+;\s*includeSubDomains;\s*preload/,
      'Must define Strict-Transport-Security with includeSubDomains and preload'
    );

    // CSP assertion
    assert.match(
      globalBlock,
      /Content-Security-Policy:\s*default-src\s+'self'/,
      'Must define Content-Security-Policy with default-src "self"'
    );
    assert.match(globalBlock, /script-src\s+[^;\n]*https:\/\/cdn\.tailwindcss\.com/);
    assert.match(globalBlock, /style-src\s+[^;\n]*https:\/\/fonts\.googleapis\.com/);
    assert.match(globalBlock, /font-src\s+[^;\n]*https:\/\/fonts\.gstatic\.com/);
    assert.match(globalBlock, /frame-ancestors\s+'self'/);
  });
});
