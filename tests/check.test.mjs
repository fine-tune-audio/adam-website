import test from 'node:test';
import assert from 'node:assert/strict';
import { checkPage } from '../tools/lib/check.mjs';

const dict = (nl, en, de) => ({ nl, en, de });
const HTML = (body) => `<!doctype html><html><head><meta name="i18n-page" content="p"></head><body>${body}</body></html>`;

test('passes when every used key exists in all languages', () => {
  const common = dict({}, {}, {});
  const page = dict({ 'p.a': 'Een' }, { 'p.a': 'One' }, { 'p.a': 'Eins' });
  const r = checkPage({ html: HTML('<p data-i18n="p.a">Een</p>'), common, page });
  assert.deepEqual(r.errors, []);
});

test('reports keys missing in en/de and lists them in missing', () => {
  const common = dict({}, {}, {});
  const page = dict({ 'p.a': 'Een' }, {}, { 'p.a': 'Eins' });
  const r = checkPage({ html: HTML('<p data-i18n="p.a">Een</p>'), common, page });
  assert.ok(r.errors.some((e) => e.includes('en') && e.includes('p.a')));
  assert.deepEqual(r.missing, { 'p.a': 'Een' });
});

test('reports a key used in HTML but absent from dictionaries', () => {
  const r = checkPage({ html: HTML('<p data-i18n="p.zzz">x</p>'), common: dict({}, {}, {}), page: dict({}, {}, {}) });
  assert.ok(r.errors.some((e) => e.includes('p.zzz')));
});

test('reports markup / placeholder mismatch between languages', () => {
  const common = dict({}, {}, {});
  const page = dict(
    { 'p.a': 'Hallo<br>{{naam}}' },
    { 'p.a': 'Hello {{naam}}' },
    { 'p.a': 'Hallo<br>{{naam}}' }
  );
  const r = checkPage({ html: HTML('<p data-i18n-html="p.a">Hallo<br>{{naam}}</p>'), common, page });
  assert.ok(r.errors.some((e) => e.includes('shape') && e.includes('en')));
});

test('reports leftover untagged Dutch text', () => {
  const page = dict({}, {}, {});
  const r = checkPage({ html: HTML('<p>Nog niet getagd</p>'), common: dict({}, {}, {}), page });
  assert.ok(r.errors.some((e) => e.includes('untagged') && e.includes('Nog niet getagd')));
});

test('requires data-i18n-consent-text next to data-consent-text', () => {
  const page = dict({}, {}, {});
  const bad = checkPage({ html: HTML('<input data-consent-text="Ik ga akkoord">'), common: dict({}, {}, {}), page });
  assert.ok(bad.errors.some((e) => e.includes('consent')));
  const good = checkPage({
    html: HTML('<input data-i18n-consent-text="p.c" data-consent-text="Ik ga akkoord">'),
    common: dict({}, {}, {}),
    page: dict({ 'p.c': 'Ik ga akkoord' }, { 'p.c': 'I agree' }, { 'p.c': 'Ich stimme zu' })
  });
  assert.deepEqual(good.errors, []);
});

test('reports a page without an i18n-page meta', () => {
  const r = checkPage({ html: '<html><body></body></html>', common: dict({}, {}, {}), page: dict({}, {}, {}) });
  assert.ok(r.errors.some((e) => e.includes('i18n-page')));
});

test('translated <option> must carry an explicit value so submissions stay language-independent', () => {
  const page = dict({ 'p.o': 'Keuze' }, { 'p.o': 'Choice' }, { 'p.o': 'Wahl' });
  const bad = checkPage({ html: HTML('<select><option data-i18n="p.o">Keuze</option></select>'), common: dict({}, {}, {}), page });
  assert.ok(bad.errors.some((e) => e.includes('option') && e.includes('value')));
  const good = checkPage({ html: HTML('<select><option data-i18n="p.o" value="Keuze">Keuze</option></select>'), common: dict({}, {}, {}), page });
  assert.deepEqual(good.errors, []);
});
