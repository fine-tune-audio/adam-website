import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../tools/package.json', import.meta.url));
const { JSDOM } = require('jsdom');

const PAGE = `<!doctype html><html lang="nl"><head><meta name="i18n-page" content="index"></head>
<body class="x"><div data-lang-switcher></div>
<a id="about" data-i18n="nav.about">Over ons</a>
<button id="menu" data-i18n-aria-label="nav.menuAria" aria-label="Menu"></button>
<p id="missing" data-i18n="no.such.key">Blijft Nederlands</p></body></html>`;

let n = 0;
async function boot(url, storage = {}) {
  const dom = new JSDOM(PAGE, { url });
  Object.entries(storage).forEach(([k, v]) => dom.window.localStorage.setItem(k, v));
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.CustomEvent = dom.window.CustomEvent;
  const mod = await import(`../i18n.js?dom=${n += 1}`);
  await mod.ready;
  return { dom, mod };
}
const cleanup = () => { delete globalThis.window; delete globalThis.document; delete globalThis.CustomEvent; };

test('default visit is Dutch and renders the switcher', async () => {
  const { dom } = await boot('http://localhost/index.html');
  try {
    const d = dom.window.document;
    assert.equal(d.documentElement.lang, 'nl');
    assert.equal(d.getElementById('about').textContent, 'Over ons');
    assert.equal(d.querySelectorAll('.lang-switch-btn').length, 3);
    assert.equal(d.querySelector('.lang-switch-btn.active').textContent, 'NL');
  } finally { cleanup(); }
});

test('?lang=de translates text and attributes, sets <html lang>, persists', async () => {
  const { dom } = await boot('http://localhost/index.html?lang=de');
  try {
    const d = dom.window.document;
    assert.equal(d.documentElement.lang, 'de');
    assert.equal(d.getElementById('about').textContent, 'Über uns');
    assert.equal(d.getElementById('menu').getAttribute('aria-label'), 'Menü');
    assert.equal(dom.window.localStorage.getItem('adam.lang'), 'de');
  } finally { cleanup(); }
});

test('stored language is used when there is no query', async () => {
  const { dom } = await boot('http://localhost/index.html', { 'adam.lang': 'en' });
  try {
    assert.equal(dom.window.document.getElementById('about').textContent, 'About us');
  } finally { cleanup(); }
});

test('a key missing everywhere keeps the existing Dutch content', async () => {
  const { dom } = await boot('http://localhost/index.html?lang=en');
  try {
    assert.equal(dom.window.document.getElementById('missing').textContent, 'Blijft Nederlands');
  } finally { cleanup(); }
});

test('clicking a switcher button changes language, stores it and fires adam:langchange', async () => {
  const { dom } = await boot('http://localhost/index.html');
  try {
    const d = dom.window.document;
    let detail = null;
    d.addEventListener('adam:langchange', (e) => { detail = e.detail; });
    [...d.querySelectorAll('.lang-switch-btn')].find((b) => b.textContent === 'EN').click();
    assert.equal(d.getElementById('about').textContent, 'About us');
    assert.equal(d.documentElement.lang, 'en');
    assert.equal(dom.window.localStorage.getItem('adam.lang'), 'en');
    assert.deepEqual(detail, { lang: 'en' });
    assert.equal(d.querySelector('.lang-switch-btn.active').textContent, 'EN');
  } finally { cleanup(); }
});

test('the pending guard class is always removed after init', async () => {
  const { dom } = await boot('http://localhost/index.html?lang=de');
  try {
    dom.window.document.documentElement.classList.add('i18n-pending');
    dom.window.adamI18n.setLang('nl');
    assert.equal(dom.window.document.documentElement.classList.contains('i18n-pending'), false);
  } finally { cleanup(); }
});
