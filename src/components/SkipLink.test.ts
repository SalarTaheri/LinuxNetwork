import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../i18n/translations';

test('Skip to Content translations', async (t) => {
  await t.test('has non-empty skipToContent translation in Persian (fa)', () => {
    assert.ok(translations.fa.nav.skipToContent);
    assert.equal(typeof translations.fa.nav.skipToContent, 'string');
    assert.equal(translations.fa.nav.skipToContent, 'پرش به محتوای اصلی');
  });

  await t.test('has non-empty skipToContent translation in English (en)', () => {
    assert.ok(translations.en.nav.skipToContent);
    assert.equal(typeof translations.en.nav.skipToContent, 'string');
    assert.equal(translations.en.nav.skipToContent, 'Skip to main content');
  });
});
