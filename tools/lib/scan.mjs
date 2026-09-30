import { parse } from 'parse5';
import { createHash } from 'node:crypto';

const SKIP_TAGS = new Set(['script', 'style', 'svg', 'noscript', 'template', 'pre', 'code']);
const INLINE = new Set(['br', 'em', 'strong', 'b', 'i', 'u', 'span', 'a', 'small', 'sup', 'sub', 'mark', 'wbr']);
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const TEXT_BOUND = ['data-i18n', 'data-i18n-html', 'data-i18n-skip'];
const BRAND = new Set(['ADAM']);
const COMMON_TAGS = new Set(['nav', 'footer']);

export const hasLetters = (s) => /\p{L}/u.test(s);
export const collapse = (s) => s.replace(/\s+/g, ' ').trim();

export function keyFor(ns, text) {
  const slug = text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    .split(' ').slice(0, 4).join('_') || 'text';
  const hash = createHash('sha1').update(text).digest('hex').slice(0, 6);
  return `${ns}.${slug}_${hash}`;
}

export function pageName(html) {
  const m = html.match(/<meta\s+name="i18n-page"\s+content="([^"]+)"/);
  return m ? m[1] : null;
}

export function attrNameFor(item) {
  if (item.kind === 'text') return 'data-i18n';
  if (item.kind === 'html') return 'data-i18n-html';
  return `data-i18n-${item.attr}`;
}

const attrOf = (node, name) => {
  const a = node.attrs && node.attrs.find((x) => x.name === name);
  return a ? a.value : undefined;
};
const isTextBound = (node) => TEXT_BOUND.some((a) => attrOf(node, a) !== undefined);
const textOf = (node) => (node.nodeName === '#text'
  ? node.value
  : (node.childNodes || []).map(textOf).join(''));
const inlineOnly = (node) => (node.childNodes || []).every((c) => c.nodeName === '#text'
  || c.nodeName === '#comment'
  || (INLINE.has(c.tagName) && !isTextBound(c) && inlineOnly(c)));

export function scanHtml(html) {
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const items = [];
  const manual = [];

  const visit = (node, ns) => {
    if (!node.tagName) {
      (node.childNodes || []).forEach((c) => visit(c, ns));
      return;
    }
    const tag = node.tagName;
    if (SKIP_TAGS.has(tag)) return;
    const loc = node.sourceCodeLocation;
    const here = ns === 'common' || COMMON_TAGS.has(tag) || attrOf(node, 'id') === 'adam-consent-banner'
      ? 'common' : 'page';
    const insertAt = loc && loc.startTag ? loc.startTag.startOffset + 1 + tag.length : null;

    if (insertAt !== null) {
      if (tag === 'meta') {
        const name = attrOf(node, 'name');
        const prop = attrOf(node, 'property');
        const content = attrOf(node, 'content');
        const wanted = name === 'description' || prop === 'og:title' || prop === 'og:description';
        if (wanted && content && hasLetters(content) && attrOf(node, 'data-i18n-content') === undefined) {
          items.push({ kind: 'attr', attr: 'content', ns: 'page', text: collapse(content), insertAt, tag });
        }
      }
      for (const a of ATTRS) {
        const v = attrOf(node, a);
        if (v !== undefined && hasLetters(v) && attrOf(node, `data-i18n-${a}`) === undefined) {
          items.push({ kind: 'attr', attr: a, ns: here, text: collapse(v), insertAt, tag });
        }
      }
    }

    // A textarea's content is a default value, not a label: only its attributes translate.
    if (tag === 'meta' || tag === 'textarea' || isTextBound(node)) return;

    const text = collapse(textOf(node));
    const hasEl = node.childNodes.some((c) => c.tagName);
    // A container of inline elements with no text of its own (e.g. <nav><a>..</a><a>..</a></nav>)
    // is not one unit: each child is tagged separately.
    const ownText = node.childNodes.some((c) => c.nodeName === '#text' && hasLetters(c.value));
    if (loc && loc.startTag && loc.endTag && hasLetters(text) && !BRAND.has(text) && inlineOnly(node) && (ownText || !hasEl)) {
      if (hasEl) {
        const raw = collapse(html.slice(loc.startTag.endOffset, loc.endTag.startOffset));
        items.push({ kind: 'html', ns: here, text: raw, insertAt, tag });
      } else {
        items.push({ kind: 'text', ns: here, text, insertAt, tag });
      }
      return;
    }

    for (const c of node.childNodes || []) {
      if (c.nodeName === '#text') {
        const t = collapse(c.value);
        if (hasLetters(t) && !BRAND.has(t)) manual.push({ tag, text: t });
      } else {
        visit(c, here);
      }
    }
  };

  visit(doc, 'page');
  return { items, manual };
}

export function applyTags(html, tagged) {
  return [...tagged]
    .sort((a, b) => b.insertAt - a.insertAt)
    .reduce((s, t) => s.slice(0, t.insertAt) + ` ${t.attrName}="${t.key}"` + s.slice(t.insertAt), html);
}
