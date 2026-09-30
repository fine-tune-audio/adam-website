import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { wireHtml } from './lib/wire.mjs';

// demo.html is handled separately (voice-language picker, not a site switcher).
const EXCLUDE = new Set(['vet-demo.html', 'stadsstemmen-app.html', 'demo.html']);
const files = readdirSync('.').filter((f) => f.endsWith('.html') && !EXCLUDE.has(f));
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  const { html, manual } = wireHtml(before, file);
  if (html !== before) writeFileSync(file, html);
  process.stdout.write(`${html !== before ? 'wired  ' : 'no-op  '} ${file}\n`);
  manual.forEach((m) => process.stdout.write(`  MANUAL ${m}\n`));
}
