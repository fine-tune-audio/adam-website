import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { scanHtml, applyTags, attrNameFor, keyFor, pageName } from './lib/scan.mjs';
import { readDict, writeDict } from './lib/dict.mjs';

const [file, ...flags] = process.argv.slice(2);
if (!file) {
  process.stderr.write('usage: node tools/i18n-autotag.mjs <file.html> [--write]\n');
  process.exit(2);
}
const write = flags.includes('--write');
const html = readFileSync(file, 'utf8');
const page = pageName(html);
if (!page) {
  process.stderr.write(`${file}: no <meta name="i18n-page"> — run tools/wire-pages.mjs first\n`);
  process.exit(2);
}

const invert = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
const common = await readDict('locales/common.js');
const pageDict = await readDict(`locales/${page}.js`);
const reuse = {
  common: invert(common.nl),
  page: { ...invert(common.nl), ...invert(pageDict.nl) }
};

const { items, manual } = scanHtml(html);
const tagged = [];
const added = { common: {}, page: {} };

for (const it of items) {
  const known = reuse[it.ns][it.text];
  const key = known || keyFor(it.ns === 'common' ? 'common' : page, it.text);
  if (!known) {
    added[it.ns][key] = it.text;
    reuse[it.ns][it.text] = key;
  }
  tagged.push({ insertAt: it.insertAt, attrName: attrNameFor(it), key });
}

const newCount = Object.keys(added.common).length + Object.keys(added.page).length;
process.stdout.write(`${file}: ${items.length} items tagged, ${newCount} new keys `
  + `(${Object.keys(added.common).length} common, ${Object.keys(added.page).length} ${page}), ${manual.length} manual\n`);
manual.forEach((m) => process.stdout.write(`  MANUAL <${m.tag}>: ${m.text}\n`));

if (write) {
  writeFileSync(file, applyTags(html, tagged));
  mkdirSync('locales', { recursive: true });
  common.nl = { ...common.nl, ...added.common };
  pageDict.nl = { ...pageDict.nl, ...added.page };
  writeDict('locales/common.js', common);
  writeDict(`locales/${page}.js`, pageDict);
  process.stdout.write('written.\n');
} else {
  process.stdout.write('dry run — pass --write to apply.\n');
}
