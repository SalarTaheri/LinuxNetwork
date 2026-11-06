import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { translations } from '../i18n/translations';

describe('App Accessibility & Skip to Main Content', () => {
  test('translations contain skipToContent in both fa and en locales', () => {
    assert.strictEqual(typeof translations.fa.skipToContent, 'string');
    assert.strictEqual(translations.fa.skipToContent, 'پرش به محتوای اصلی');

    assert.strictEqual(typeof translations.en.skipToContent, 'string');
    assert.strictEqual(translations.en.skipToContent, 'Skip to main content');
  });

  test('App.tsx contains skip to content link targeting #main-content', () => {
    const appPath = path.resolve(process.cwd(), 'src/App.tsx');
    const appSource = fs.readFileSync(appPath, 'utf8');

    assert.ok(
      appSource.includes('href="#main-content"'),
      'App.tsx must include an anchor with href="#main-content"'
    );
    assert.ok(
      appSource.includes('id="main-content"'),
      'App.tsx must include a main element with id="main-content"'
    );
    assert.ok(
      appSource.includes('tabIndex={-1}'),
      'App.tsx main element must have tabIndex={-1} for programmatic focus'
    );
    assert.ok(
      appSource.includes('sr-only focus:not-sr-only'),
      'Skip link must be visually hidden until focused (sr-only focus:not-sr-only)'
    );
  });
});
