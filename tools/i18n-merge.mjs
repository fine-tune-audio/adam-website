import { readFileSync } from 'node:fs';
import { readDict, writeDict } from './lib/dict.mjs';

const [page, file] = process.argv.slice(2);
if (!page || !file) {
  process.stderr.write('usage: node tools/i18n-merge.mjs <page> <translations.json>\n');
  process.exit(2);
}
const incoming = JSON.parse(readFileSync(file, 'utf8'));
const common = await readDict('locales/common.js');
const pageDict = await readDict(`locales/${page}.js`);
let count = 0;

for (const lang of ['en', 'de']) {
  for (const [key, value] of Object.entries(incoming[lang] || {})) {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`empty ${lang} value for ${key}`);
    const target = key in common.nl ? common : key in pageDict.nl ? pageDict : null;
    if (!target) throw new Error(`unknown key (not in any nl dictionary): ${key}`);
    target[lang][key] = value;
    count += 1;
  }
}
writeDict('locales/common.js', common);
writeDict(`locales/${page}.js`, pageDict);
process.stdout.write(`merged ${count} translations into common + ${page}\n`);
