import { scanHtml, pageName } from './scan.mjs';

const LANGS = ['nl', 'en', 'de'];
const KEY_RE = /\sdata-i18n(?:-(?!skip)[a-z-]+)?="([^"]+)"/g;
const shape = (s) => (s.match(/<\/?[a-z][^>]*>|\{\{[^}]+\}\}/gi) || [])
  .map((x) => x.replace(/\s+/g, ' ')).sort().join('|');

export function checkPage({ html, common, page }) {
  const errors = [];
  const missing = {};
  if (!pageName(html)) errors.push('no <meta name="i18n-page"> in <head>');

  const dict = {};
  for (const l of LANGS) dict[l] = { ...common[l], ...page[l] };

  const keys = new Set();
  for (const m of html.matchAll(KEY_RE)) keys.add(m[1]);

  for (const key of keys) {
    for (const l of LANGS) {
      const v = dict[l][key];
      if (typeof v !== 'string' || !v) {
        errors.push(`missing ${l} translation for ${key}`);
        if (l !== 'nl') missing[key] = dict.nl[key] || '';
      }
    }
    if (dict.nl[key]) {
      for (const l of ['en', 'de']) {
        if (dict[l][key] && shape(dict[l][key]) !== shape(dict.nl[key])) {
          errors.push(`shape mismatch (${l}) for ${key}: markup/{{placeholders}} differ from nl`);
        }
      }
    }
  }

  for (const tag of html.match(/<[^>]*\sdata-consent-text="[^>]*>/g) || []) {
    if (!/\sdata-i18n-consent-text="/.test(tag)) {
      errors.push(`consent text is not translated: ${tag.slice(0, 80)}…`);
    }
  }

  for (const tag of html.match(/<option\b[^>]*\sdata-i18n[^>]*>/g) || []) {
    if (!/\svalue=/.test(tag)) errors.push(`translated <option> without explicit value (form submissions would change with language): ${tag.slice(0, 80)}`);
  }

  const { items, manual } = scanHtml(html);
  for (const it of items) errors.push(`untagged ${it.kind === 'attr' ? it.attr : 'text'}: "${it.text.slice(0, 60)}"`);
  for (const m of manual) errors.push(`untagged loose text in <${m.tag}>: "${m.text.slice(0, 60)}" (tag manually or add data-i18n-skip)`);

  return { errors, missing };
}
