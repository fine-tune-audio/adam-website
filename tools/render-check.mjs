// Renders each page's real HTML with the real i18n runtime in jsdom (scripts off)
// and reports what a visitor would see per language.
//   node tools/render-check.mjs [page ...]
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('./package.json', import.meta.url));
const { JSDOM } = require('jsdom');

const EXCLUDE = new Set(['vet-demo.html', 'stadsstemmen-app.html', 'demo.html']);
const named = process.argv.slice(2).map((a) => (a.endsWith('.html') ? a : `${a}.html`));
const files = named.length
  ? named
  : readdirSync('.').filter((f) => f.endsWith('.html') && !EXCLUDE.has(f));

let n = 0;
let problems = 0;
const nlText = new Map();

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  for (const lang of ['nl', 'en', 'de']) {
    const dom = new JSDOM(html, { url: `http://localhost/${file}?lang=${lang}` });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.CustomEvent = dom.window.CustomEvent;
    const mod = await import(`../i18n.js?render=${n += 1}`);
    await mod.ready;
    const d = dom.window.document;
    const bound = [...d.querySelectorAll('[data-i18n],[data-i18n-html]')];
    const texts = bound.map((el) => el.textContent.trim());
    if (lang === 'nl') nlText.set(file, texts);
    const same = lang === 'nl' ? 0 : texts.filter((t, i) => t === nlText.get(file)[i]).length;
    const h1 = (d.querySelector('h1') || {}).textContent || '';
    const rawKeys = texts.filter((t) => /^[a-z0-9_-]+\.[a-z0-9_.-]+$/i.test(t)).length;
    if (rawKeys) problems += 1;
    process.stdout.write(`${file.padEnd(28)} ${lang} html.lang=${d.documentElement.lang} bound=${bound.length}`
      + ` sameAsNL=${same} rawKeys=${rawKeys} switcher=${d.querySelectorAll('.lang-switch-btn').length}`
      + ` | ${h1.replace(/\s+/g, ' ').trim().slice(0, 50)}\n`);
    delete globalThis.window; delete globalThis.document; delete globalThis.CustomEvent;
  }
}
process.exit(problems ? 1 : 0);
