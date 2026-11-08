import { test, describe } from 'node:test';
import assert from 'node:assert';
import { translations } from '../i18n/translations';

describe('Accessibility & Localization', () => {
  test('skipToContent label is defined and non-empty for both Persian and English', () => {
    assert.ok(translations.fa.skipToContent, 'translations.fa.skipToContent must exist');
    assert.ok(translations.en.skipToContent, 'translations.en.skipToContent must exist');
    assert.strictEqual(translations.fa.skipToContent, 'پرش به محتوای اصلی');
    assert.strictEqual(translations.en.skipToContent, 'Skip to main content');
  });
});
