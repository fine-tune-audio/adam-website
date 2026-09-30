import { readFileSync, readdirSync } from 'node:fs';
import { checkPage } from './lib/check.mjs';
import { pageName } from './lib/scan.mjs';
import { readDict } from './lib/dict.mjs';

const EXCLUDE = new Set(['vet-demo.html', 'stadsstemmen-app.html', 'demo.html']);
const args = process.argv.slice(2);
const wantMissing = args.includes('--missing');
const named = args.filter((a) => !a.startsWith('--'));

const files = named.length
  ? named.map((a) => (a.endsWith('.html') ? a : `${a}.html`))
  : readdirSync('.').filter((f) => f.endsWith('.html') && !EXCLUDE.has(f));

const common = await readDict('locales/common.js');
const allMissing = {};
let failed = false;

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const page = await readDict(`locales/${pageName(html) || '_none_'}.js`);
  const { errors, missing } = checkPage({ html, common, page });
  Object.assign(allMissing, missing);
  if (!wantMissing) {
    process.stdout.write(`${errors.length ? 'FAIL' : 'ok  '} ${file}${errors.length ? ` (${errors.length})` : ''}\n`);
    errors.slice(0, 40).forEach((e) => process.stdout.write(`     ${e}\n`));
    if (errors.length > 40) process.stdout.write(`     … ${errors.length - 40} more\n`);
    if (errors.length) failed = true;
  }
}
if (wantMissing) process.stdout.write(JSON.stringify(allMissing, null, 2) + '\n');
process.exit(failed ? 1 : 0);
