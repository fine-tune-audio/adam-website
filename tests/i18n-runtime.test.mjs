import test from 'node:test';
import assert from 'node:assert/strict';
import { pickLang, queryLang, lookup, translate, mergeDicts, resolveLang } from '../i18n.js';

test('pickLang: default is Dutch', () => {
  assert.equal(pickLang('', null), 'nl');
});
test('pickLang: query param wins over stored', () => {
  assert.equal(pickLang('?lang=en', 'de'), 'en');
});
test('pickLang: query is case-insensitive', () => {
  assert.equal(pickLang('?lang=DE', null), 'de');
});
test('pickLang: unsupported query falls back to stored', () => {
  assert.equal(pickLang('?lang=fr', 'en'), 'en');
});
test('pickLang: unsupported query and no storage falls back to Dutch', () => {
  assert.equal(pickLang('?lang=fr', null), 'nl');
});
test('pickLang: invalid stored value is ignored', () => {
  assert.equal(pickLang('', 'xx'), 'nl');
});
test('queryLang: returns null when absent', () => {
  assert.equal(queryLang(''), null);
});

const dicts = { nl: { a: 'Een', b: 'Twee' }, en: { a: 'One', b: '' }, de: {} };
test('lookup: returns the language value', () => {
  assert.equal(lookup(dicts, 'en', 'a'), 'One');
});
test('lookup: falls back to Dutch when missing or empty', () => {
  assert.equal(lookup(dicts, 'de', 'a'), 'Een');
  assert.equal(lookup(dicts, 'en', 'b'), 'Twee');
});
test('lookup: undefined when absent everywhere', () => {
  assert.equal(lookup(dicts, 'de', 'zzz'), undefined);
});
test('translate: returns the key as last resort', () => {
  assert.equal(translate(dicts, 'de', 'zzz'), 'zzz');
});
test('mergeDicts: merges modules per language', () => {
  const merged = mergeDicts([
    { default: { nl: { a: '1' }, en: { a: 'x' }, de: {} } },
    { default: { nl: { b: '2' } } }
  ]);
  assert.deepEqual(merged, { nl: { a: '1', b: '2' }, en: { a: 'x' }, de: {} });
});

test('resolveLang: Dutch when localStorage throws', () => {
  globalThis.window = {
    location: { search: '' },
    get localStorage() { throw new Error('denied'); }
  };
  try {
    assert.equal(resolveLang(), 'nl');
  } finally {
    delete globalThis.window;
  }
});
test('resolveLang: query still works when localStorage throws', () => {
  globalThis.window = {
    location: { search: '?lang=de' },
    get localStorage() { throw new Error('denied'); }
  };
  try {
    assert.equal(resolveLang(), 'de');
  } finally {
    delete globalThis.window;
  }
});
