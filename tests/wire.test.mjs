import test from 'node:test';
import assert from 'node:assert/strict';
import { wireHtml } from '../tools/lib/wire.mjs';

const PAGE = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>X</title></head><body>
<nav class="nav"><div class="nav-right"><a href="a.html">A</a>
    <button class="nav-hamburger" id="hamburger" aria-label="Menu"></button></div></nav></body></html>`;

test('adds meta, hreflang, module script, pending guard and switcher mount', () => {
  const { html, manual } = wireHtml(PAGE, 'about.html');
  assert.deepEqual(manual, []);
  assert.match(html, /<meta name="i18n-page" content="about">/);
  assert.match(html, /hreflang="de" href="https:\/\/adamagents\.nl\/about\.html\?lang=de"/);
  assert.match(html, /<script type="module" src="i18n\.js"><\/script>/);
  assert.match(html, /i18n-pending/);
  assert.match(html, /<div data-lang-switcher><\/div>\s*<button class="nav-hamburger"/);
});

test('is idempotent', () => {
  const once = wireHtml(PAGE, 'about.html').html;
  assert.equal(wireHtml(once, 'about.html').html, once);
});

test('leaves an already wired page (index) with only a missing meta added', () => {
  const wired = PAGE.replace('<head>', '<head><script type="module" src="i18n.js"></script>')
    .replace('<button', '<div data-lang-switcher></div><button');
  const { html } = wireHtml(wired, 'index.html');
  assert.equal((html.match(/src="i18n\.js"/g) || []).length, 1);
  assert.match(html, /<meta name="i18n-page" content="index">/);
  assert.equal((html.match(/data-lang-switcher/g) || []).length, 1);
});

test('reports pages without a hamburger button as manual', () => {
  const { manual } = wireHtml('<html><head></head><body><nav></nav></body></html>', 'x.html');
  assert.equal(manual.length, 1);
  assert.match(manual[0], /switcher/);
});
