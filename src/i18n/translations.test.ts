import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { translations } from './translations';

describe('Translations & Localization', () => {
  it('contains skipToContent in both English and Persian navigation', () => {
    assert.ok(translations.fa.nav.skipToContent);
    assert.ok(translations.en.nav.skipToContent);
    assert.equal(translations.fa.nav.skipToContent, 'پرش به محتوای اصلی');
    assert.equal(translations.en.nav.skipToContent, 'Skip to main content');
  });

  it('has consistent navigation keys between English and Persian', () => {
    const faKeys = Object.keys(translations.fa.nav).sort();
    const enKeys = Object.keys(translations.en.nav).sort();
    assert.deepEqual(faKeys, enKeys);
  });
});
