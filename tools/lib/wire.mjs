const ORIGIN = 'https://adamagents.nl';

export function wireHtml(html, file) {
  const page = file.replace(/\.html$/, '');
  const manual = [];
  const head = [];

  if (!/name="i18n-page"/.test(html)) head.push(`<meta name="i18n-page" content="${page}">`);
  if (!/hreflang=/.test(html)) {
    head.push(
      `<link rel="alternate" hreflang="nl" href="${ORIGIN}/${file}">`,
      `<link rel="alternate" hreflang="en" href="${ORIGIN}/${file}?lang=en">`,
      `<link rel="alternate" hreflang="de" href="${ORIGIN}/${file}?lang=de">`,
      `<link rel="alternate" hreflang="x-default" href="${ORIGIN}/${file}">`
    );
  }
  if (!/src="i18n\.js"/.test(html)) {
    head.push(
      `<script>try{var __p=new URLSearchParams(location.search).get('lang'),__l=(__p||localStorage.getItem('adam.lang')||'nl').toLowerCase();if(__l!=='nl')document.documentElement.classList.add('i18n-pending');}catch(e){}</script>`,
      '<script type="module" src="i18n.js"></script>',
      '<style>.i18n-pending body{visibility:hidden;}</style>'
    );
  }

  let out = html;
  if (head.length) out = out.replace(/<head[^>]*>/i, (m) => `${m}\n  ${head.join('\n  ')}`);

  if (!/data-lang-switcher/.test(out)) {
    if (/<button class="nav-hamburger"/.test(out)) {
      out = out.replace('<button class="nav-hamburger"', '<div data-lang-switcher></div>\n    <button class="nav-hamburger"');
    } else {
      manual.push(`${file}: no nav-hamburger button found — add <div data-lang-switcher></div> to the nav manually`);
    }
  }
  return { html: out, manual };
}
