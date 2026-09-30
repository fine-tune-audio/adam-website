import test from 'node:test';
import assert from 'node:assert/strict';
import { scanHtml, applyTags, attrNameFor, keyFor, pageName } from '../tools/lib/scan.mjs';

const FIXTURE = `<!doctype html><html lang="nl"><head><meta name="i18n-page" content="about"><title>Over ons</title>
<meta name="description" content="Wij bouwen agents"><script>var x="Hallo wereld"</script></head>
<body><nav class="nav"><a href="a.html">Home</a></nav>
<h1>Je klant <em>praat</em>.</h1>
<p>Korte tekst</p><p data-i18n="k">Al getagd</p>
<input placeholder="Jouw naam"><button aria-label="Menu"><span></span></button>
<div>Los <img src="x.png"> tekst</div><span>ADAM</span><svg><text>Niet</text></svg>
<p data-i18n-skip>Overslaan</p><footer><p>Groningen</p></footer></body></html>`;

const find = (items, text) => items.find((i) => i.text === text);

test('pageName reads the i18n-page meta', () => {
  assert.equal(pageName(FIXTURE), 'about');
  assert.equal(pageName('<html></html>'), null);
});

test('scanHtml finds text units, inline-html units and attributes', () => {
  const { items } = scanHtml(FIXTURE);
  assert.equal(find(items, 'Over ons').kind, 'text');
  assert.equal(find(items, 'Over ons').tag, 'title');
  assert.equal(find(items, 'Korte tekst').ns, 'page');
  assert.equal(find(items, 'Je klant <em>praat</em>.').kind, 'html');
  assert.equal(find(items, 'Wij bouwen agents').kind, 'attr');
  assert.equal(find(items, 'Wij bouwen agents').attr, 'content');
  assert.equal(find(items, 'Jouw naam').attr, 'placeholder');
  assert.equal(find(items, 'Menu').attr, 'aria-label');
});

test('nav and footer text is in the common namespace', () => {
  const { items } = scanHtml(FIXTURE);
  assert.equal(find(items, 'Home').ns, 'common');
  assert.equal(find(items, 'Groningen').ns, 'common');
});

test('skips scripts, svg, brand, already tagged and data-i18n-skip', () => {
  const texts = scanHtml(FIXTURE).items.map((i) => i.text);
  for (const t of ['Hallo wereld', 'Niet', 'ADAM', 'Al getagd', 'Overslaan']) {
    assert.ok(!texts.includes(t), `should skip ${t}`);
  }
});

test('reports loose text next to block children as manual', () => {
  const { manual } = scanHtml(FIXTURE);
  assert.deepEqual(manual.map((m) => m.text).sort(), ['Los', 'tekst']);
});

test('applyTags inserts attributes without touching other text', () => {
  const { items } = scanHtml(FIXTURE);
  const tagged = items.map((i) => ({ insertAt: i.insertAt, attrName: attrNameFor(i), key: keyFor('about', i.text) }));
  const out = applyTags(FIXTURE, tagged);
  assert.match(out, /<p data-i18n="about\.korte_tekst_[0-9a-f]{6}">Korte tekst<\/p>/);
  assert.match(out, /<h1 data-i18n-html="about\.je_klant_em_praat_[0-9a-f]{6}">Je klant <em>praat<\/em>\.<\/h1>/);
  assert.match(out, /<input data-i18n-placeholder="about\.jouw_naam_[0-9a-f]{6}" placeholder="Jouw naam">/);
  const strip = (s) => s.replace(/ data-i18n[a-z-]*="[^"]*"/g, '');
  assert.equal(strip(out), strip(FIXTURE));
});

test('scanHtml is idempotent after tagging', () => {
  const { items } = scanHtml(FIXTURE);
  const tagged = items.map((i) => ({ insertAt: i.insertAt, attrName: attrNameFor(i), key: keyFor('about', i.text) }));
  const again = scanHtml(applyTags(FIXTURE, tagged));
  assert.equal(again.items.length, 0);
});

test('keyFor is stable and namespaced', () => {
  assert.equal(keyFor('about', 'Korte tekst'), keyFor('about', 'Korte tekst'));
  assert.match(keyFor('common', 'Over ons'), /^common\.over_ons_[0-9a-f]{6}$/);
  assert.notEqual(keyFor('about', 'A'), keyFor('about', 'B'));
});

test('textarea placeholder is found even though textarea content is skipped', () => {
  const { items } = scanHtml('<html><head></head><body><textarea placeholder="Typ hier je vraag">Voorbeeld</textarea></body></html>');
  assert.deepEqual(items.map((i) => [i.kind, i.attr, i.text]), [['attr', 'placeholder', 'Typ hier je vraag']]);
});
