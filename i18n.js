// i18n.js
// Shared translation runtime for adamagents.nl (no build step — plain ESM,
// imported by every static HTML page). Dutch is the default; English and
// German are opt-in via the switcher or ?lang=. The choice persists in
// localStorage so it carries across every page.
//
// Dictionaries live in ./locales/: common.js (nav, footer, consent banner;
// loaded on every page) plus one file per page, chosen by
// <meta name="i18n-page" content="about">. Each exports default { nl, en, de }.
//
// Markup contract:
//   data-i18n="key"                -> el.textContent = t(key)
//   data-i18n-html="key"           -> el.innerHTML = t(key)   (copy with inline <br>/<em>)
//   data-i18n-placeholder="key"    -> placeholder
//   data-i18n-aria-label="key"     -> aria-label
//   data-i18n-content="key"        -> content (<meta name="description">, og:*)
//   data-i18n-title="key"          -> title
//   data-i18n-alt="key"            -> alt
//   data-i18n-consent-text="key"   -> data-consent-text (stored with lead consent)
//   data-i18n-skip                 -> never translated (brand text)
//   <div data-lang-switcher></div> -> filled with the NL/EN/DE control
// A key missing in the chosen language falls back to Dutch; a key missing
// everywhere leaves the element's existing (Dutch) content untouched.

export const LANGS = ['nl', 'en', 'de'];
export const DEFAULT_LANG = 'nl';

const STORAGE_KEY = 'adam.lang';
const LANG_NAMES = { nl: 'Nederlands', en: 'English', de: 'Deutsch' };

const ATTR_BINDINGS = [
  ['data-i18n-placeholder', 'placeholder'],
  ['data-i18n-aria-label', 'aria-label'],
  ['data-i18n-content', 'content'],
  ['data-i18n-title', 'title'],
  ['data-i18n-alt', 'alt'],
  ['data-i18n-consent-text', 'data-consent-text']
];

const SWITCH_CSS = `
.lang-switch{display:flex;align-items:center;gap:2px;margin-right:6px;}
.lang-switch-btn{
  background:transparent;border:none;cursor:pointer;
  font-family:'Sora',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.03em;
  padding:6px 8px;border-radius:3px;transition:opacity 0.2s,background 0.2s,color 0.2s;
  color:rgba(0,0,0,0.55);
}
.lang-switch-btn:hover{color:var(--black,#000);}
.lang-switch-btn.active{color:var(--black,#000);background:rgba(0,0,0,0.06);}
.nav.scrolled .lang-switch-btn,.nav.nav-dark .lang-switch-btn{color:rgba(255,255,255,0.55);}
.nav.scrolled .lang-switch-btn:hover,.nav.nav-dark .lang-switch-btn:hover{color:#fff;}
.nav.scrolled .lang-switch-btn.active,.nav.nav-dark .lang-switch-btn.active{color:#fff;background:rgba(255,255,255,0.12);}
.nav-menu .lang-switch{padding:16px 0 4px;border-bottom:1px solid rgba(255,255,255,0.06);gap:8px;}
`;

// ── pure helpers (unit-tested) ──────────────────────────────────────────

export function queryLang(search) {
  const qp = new URLSearchParams(search || '').get('lang');
  const l = qp && qp.toLowerCase();
  return l && LANGS.includes(l) ? l : null;
}

export function pickLang(search, stored) {
  return queryLang(search) || (LANGS.includes(stored) ? stored : DEFAULT_LANG);
}

export function lookup(dicts, lang, key) {
  return (dicts[lang] && dicts[lang][key]) || (dicts[DEFAULT_LANG] && dicts[DEFAULT_LANG][key]) || undefined;
}

export function translate(dicts, lang, key) {
  const v = lookup(dicts, lang, key);
  return v === undefined ? key : v;
}

export function mergeDicts(modules) {
  const out = { nl: {}, en: {}, de: {} };
  modules.forEach((m) => LANGS.forEach((l) => Object.assign(out[l], m.default[l] || {})));
  return out;
}

// ── runtime state ───────────────────────────────────────────────────────

let dicts = { nl: {}, en: {}, de: {} };
let currentLang = DEFAULT_LANG;

export function resolveLang() {
  // Dutch is the default for every first-time visitor, regardless of browser
  // or OS language — only an explicit ?lang= or a previously-made switcher
  // choice (localStorage) moves away from it.
  let stored = null;
  try { stored = window.localStorage.getItem(STORAGE_KEY); } catch (e) { /* storage unavailable */ }
  return pickLang(window.location.search, stored);
}

export async function loadDicts(page) {
  const mods = [import('./locales/common.js')];
  if (page) mods.push(import(`./locales/${page}.js`));
  return mergeDicts(await Promise.all(mods));
}

export function t(key, lang) {
  return translate(dicts, lang || currentLang, key);
}

export function getLang() {
  return currentLang;
}

function bind(root, attr, apply) {
  root.querySelectorAll(`[${attr}]`).forEach((el) => {
    const value = lookup(dicts, currentLang, el.getAttribute(attr));
    if (value !== undefined) apply(el, value);
  });
}

export function applyTranslations(root) {
  root = root || document;
  bind(root, 'data-i18n', (el, v) => { el.textContent = v; });
  bind(root, 'data-i18n-html', (el, v) => { el.innerHTML = v; });
  ATTR_BINDINGS.forEach(([src, dest]) => bind(root, src, (el, v) => el.setAttribute(dest, v)));
  document.documentElement.lang = currentLang;
}

function injectSwitchCss() {
  if (document.getElementById('adam-lang-css')) return;
  const style = document.createElement('style');
  style.id = 'adam-lang-css';
  style.textContent = SWITCH_CSS;
  document.head.appendChild(style);
}

function renderSwitchers() {
  document.querySelectorAll('[data-lang-switcher]').forEach((mount) => {
    mount.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'lang-switch';
    LANGS.forEach((l) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-switch-btn' + (l === currentLang ? ' active' : '');
      btn.textContent = l.toUpperCase();
      btn.setAttribute('aria-label', LANG_NAMES[l]);
      btn.addEventListener('click', () => setLang(l));
      wrap.appendChild(btn);
    });
    mount.appendChild(wrap);
  });
}

function store(lang) {
  try { window.localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
}

export function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  currentLang = lang;
  store(lang);
  applyTranslations(document);
  renderSwitchers();
  document.documentElement.classList.remove('i18n-pending');
  document.dispatchEvent(new CustomEvent('adam:langchange', { detail: { lang } }));
}

async function init() {
  const meta = document.querySelector('meta[name="i18n-page"]');
  currentLang = resolveLang();
  const fromQuery = queryLang(window.location.search);
  if (fromQuery) store(fromQuery); // an explicit ?lang= becomes the site-wide choice
  injectSwitchCss();
  dicts = await loadDicts(meta && meta.content);
  applyTranslations(document);
  renderSwitchers();
}

const domReady = () => (document.readyState === 'loading'
  ? new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }))
  : Promise.resolve());

export const ready = typeof document === 'undefined'
  ? Promise.resolve()
  : domReady().then(init).finally(() => document.documentElement.classList.remove('i18n-pending'));

if (typeof window !== 'undefined') {
  window.adamI18n = { t, getLang, setLang, ready, LANGS };
}
