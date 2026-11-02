import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Web Application Security Headers and Anchor Attributes', () => {
  const headersFilePath = path.resolve(process.cwd(), 'public/_headers');
  const standaloneFilePath = path.resolve(process.cwd(), 'public/standalone.html');
  const indexHtmlFilePath = path.resolve(process.cwd(), 'index.html');

  it('contains HSTS and CSP security headers in public/_headers under /*', () => {
    assert.ok(fs.existsSync(headersFilePath), 'public/_headers must exist');
    const content = fs.readFileSync(headersFilePath, 'utf-8');

    // Verify HSTS
    assert.match(
      content,
      /Strict-Transport-Security:\s*max-age=\d+;\s*includeSubDomains;\s*preload/,
      'Must enforce HSTS preload'
    );

    // Verify CSP
    assert.match(content, /Content-Security-Policy:\s*default-src 'self'/, 'Must have CSP with default-src self');
    assert.match(content, /object-src 'none'/, 'Must disable plugin objects via object-src none');
    assert.match(content, /base-uri 'self'/, 'Must restrict base-uri to self');
    assert.match(content, /frame-ancestors 'self'/, 'Must restrict frame embedding');

    // Verify Standard Security Headers
    assert.match(content, /X-Content-Type-Options:\s*nosniff/);
    assert.match(content, /X-Frame-Options:\s*SAMEORIGIN/);
    assert.match(content, /Referrer-Policy:\s*strict-origin-when-cross-origin/);
  });

  it('protects against reverse-tabnabbing in public/standalone.html', () => {
    assert.ok(fs.existsSync(standaloneFilePath), 'public/standalone.html must exist');
    const content = fs.readFileSync(standaloneFilePath, 'utf-8');

    // Find all anchor tags with target="_blank"
    const targetBlankAnchors = content.match(/<a\s+[^>]*target=["']_blank["'][^>]*>/gi) || [];
    assert.ok(targetBlankAnchors.length > 0, 'Found at least one target="_blank" link');

    for (const anchor of targetBlankAnchors) {
      assert.match(
        anchor,
        /rel=["'][^"']*noopener[^"']*["']/i,
        `Anchor tag missing rel="noopener": ${anchor}`
      );
      assert.match(
        anchor,
        /rel=["'][^"']*noreferrer[^"']*["']/i,
        `Anchor tag missing rel="noreferrer": ${anchor}`
      );
    }
  });

  it('ensures no unsafe target="_blank" anchors without rel="noopener noreferrer" exist in index.html', () => {
    assert.ok(fs.existsSync(indexHtmlFilePath), 'index.html must exist');
    const content = fs.readFileSync(indexHtmlFilePath, 'utf-8');

    const targetBlankAnchors = content.match(/<a\s+[^>]*target=["']_blank["'][^>]*>/gi) || [];
    for (const anchor of targetBlankAnchors) {
      assert.match(
        anchor,
        /rel=["'][^"']*noopener[^"']*["']/i,
        `Anchor tag missing rel="noopener": ${anchor}`
      );
    }
  });
});
