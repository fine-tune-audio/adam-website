// i18n.js
// Shared translation runtime for adamagents.nl (no build step — plain ESM,
// imported directly by every static HTML page). Dutch is the default;
// English and German are opt-in via the switcher, ?lang=, or browser
// language on first visit.
//
// Markup contract:
//   data-i18n="key"              -> el.textContent = t(key)
//   data-i18n-html="key"         -> el.innerHTML = t(key)   (copy with inline <br>/<em>)
//   data-i18n-placeholder="key"  -> el.placeholder = t(key)
//   data-i18n-aria-label="key"   -> el.aria-label = t(key)
//   data-i18n-content="key"      -> el.content = t(key)     (<meta name="description">)
//   <div data-lang-switcher></div> -> filled with the NL/EN/DE control
//
// See ~/.claude/plans/calm-swimming-sprout.md for the design rationale.

export const LANGS = ['nl', 'en', 'de'];
export const DEFAULT_LANG = 'nl';

const STORAGE_KEY = 'adam.lang';
const LANG_NAMES = { nl: 'Nederlands', en: 'English', de: 'Deutsch' };

export const T = {
  nl: {
    'nav.cases': 'Cases',
    'nav.about': 'Over ons',
    'nav.cta': 'Plan een demo',
    'nav.menuAria': 'Menu',

    'index.hero.title1': 'Je klant praat.',
    'index.hero.title2': 'Het systeem handelt.',
    'index.hero.sub': 'ADAM zorgt dat elk klantgesprek direct wordt afgehandeld, met agents die natuurlijk aanvoelen, afgestemd zijn op je processen en direct tot actie leiden.',
    'index.hero.cta': 'Bekijk hoe het werkt',

    'trust.label': 'Ingezet bij',
    'trust.item1': 'Installatietechniek',
    'trust.item2': 'Woningcorporaties',
    'trust.item3': 'Uitzendbureaus',
    'trust.item4': 'Horeca',

    'index.problem.label': 'Waarom ADAM',
    'index.problem.title': 'Het probleem is niet bereikbaarheid.<br>Het probleem is hoe gesprekken worden <em>afgehandeld.</em>',
    'index.problem.body': "Wachttijden, keuzemenu's, medewerkers die steeds dezelfde vragen beantwoorden. ADAM vervangt die frictie door een conversational layer die luistert, begrijpt en direct handelt. Zonder scripts. Zonder omwegen.",

    'index.app1.name': 'Intake',
    'index.app1.result': 'Minder onnodige gesprekken, betere gesprekken',
    'index.app1.tag': 'Filter & stuur',
    'index.app2.name': 'Informatie verzamelen',
    'index.app2.result': 'Minder handmatig werk, consistente data',
    'index.app2.tag': 'Data collection',
    'index.app3.name': 'Reserveringen',
    'index.app3.result': 'Geen gemiste omzet, altijd bereikbaar',
    'index.app3.tag': 'Booking',

    'index.how.title': 'Van eerste woord<br>tot afgehandelde actie.',
    'index.how.link': 'Probeer het zelf →',
    'index.how.step1.title': 'Luisteren',
    'index.how.step1.body': "De klant spreekt zoals hij dat normaal zou doen. Geen menu's, geen instructies.",
    'index.how.step2.title': 'Begrijpen',
    'index.how.step2.body': 'ADAM herkent bedoeling, context en urgentie. Niet alleen wat iemand zegt, maar wat er nodig is.',
    'index.how.step3.title': 'Beslissen',
    'index.how.step3.body': 'Elke agent werkt volgens jouw regels en processen. Het systeem bepaalt zelfstandig wat er moet gebeuren.',
    'index.how.step4.title': 'Handelen',
    'index.how.step4.body': 'Het gesprek wordt direct omgezet in actie. Een taak wordt uitgevoerd of gericht doorgezet, zonder vertraging.',

    'index.social.label': 'Wie wij zijn',
    'index.social.title': 'Gebouwd door mensen met achtergrond in audio en voice.',
    'index.social.p1': 'ADAM is geen generiek AI-bureau. Onze wortels liggen in audio technologie, sound design en voice interfaces. Dat maakt het verschil in hoe wij agents ontwerpen.',
    'index.social.p2': 'Wij begrijpen hoe gesprekken werken. Niet alleen de woorden, maar de toon, het ritme, de pauze. Die kennis zit ingebakken in elke agent die wij bouwen.',
    'index.social.p3': 'Gevestigd in Groningen, actief voor organisaties door heel Nederland.',
    'index.social.link': 'Meer over ons →',
    'index.social.card1.title': 'Audio & voice expertise',
    'index.social.card1.body': 'Jarenlange ervaring in sound design en voice interfaces vormt de basis van onze aanpak.',
    'index.social.card2.title': 'AI development',
    'index.social.card2.body': 'Eigen ontwikkeling van agent architectuur, geoptimaliseerd voor conversationele context.',
    'index.social.card3.title': 'Implementatie & integratie',
    'index.social.card3.body': 'Van briefing tot live agent, inclusief koppelingen met uw bestaande systemen.',
    'index.social.card4.title': 'Groningen, NL',
    'index.social.card4.body': 'Lokaal geworteld, nationaal actief. Persoonlijk contact bij elk project.',

    'index.demo.eyebrow': 'Live demo',
    'index.demo.title': 'Probeer het zelf.<br>Kies uw branche.',
    'index.demo.body': 'Maak in enkele minuten een gepersonaliseerde AI-telefoonassistent voor uw branche en test hem direct.',
    'index.demo.cta': 'Start de demo<span class="demo-cta-arr">→</span>',
    'index.demo.micro': 'Geen verplichtingen. Direct te testen, geen installatie.',
    'index.demo.orbLabel': 'Klik om te starten',

    'index.wie.label': 'Wat er concreet verandert',
    'index.wie.title': 'Minder gesprekken die niets opleveren.<br>Meer <em style="font-style:normal;color:var(--blue);">directe actie.</em>',
    'index.wie.p1': 'ADAM vervangt geen mensen. Het zorgt dat mensen alleen doen wat écht menselijk contact vraagt. De rest handelt het systeem zelfstandig af — consistent, direct en zonder omwegen.',
    'index.wie.link': 'Bekijk case: Dijk van een Wijf →',
    'index.wie.card1.body': "Keuzemenu's of scripts nodig. De agent begrijpt het gesprek direct.",
    'index.wie.card2.body': 'Bereikbaar. Altijd dezelfde kwaliteit, ook buiten kantooruren.',
    'index.wie.card3.body': 'Gesprekken tegelijk verwerken, zonder wachtrij of extra personeel.',
    'index.wie.card4.stat': 'Binnen<br>dagen live',
    'index.wie.card4.body': 'Van briefing tot werkende agent, zonder lange implementatietrajecten.',

    'index.cta.label': 'Klaar voor de volgende stap',
    'index.cta.title': 'Laten we beginnen.',
    'index.cta.sub': 'Vertel ons welk vraagstuk u wil oplossen. Wij laten zien hoe een ADAM agent dat aanpakt.',
    'index.cta.secondary': 'Bekijk hoe het werkt →',
    'index.cta.micro': 'Geen verplichtingen. Reactie binnen één werkdag.',

    'foot.tagline': 'Van gesprek naar actie. Automatisch.',
    'foot.services.title': 'Diensten',
    'foot.services.1': 'Voice AI agents',
    'foot.services.2': 'Conversational design',
    'foot.services.3': 'Audio experiences',
    'foot.cases.title': 'Cases',
    'foot.cases.all': 'Alle cases',
    'foot.company.title': 'Bedrijf',
    'foot.company.home': 'Home',
    'foot.company.contact': 'Contact',
    'foot.contact.title': 'Contact',
    'foot.contact.officeLabel': 'Kantoor',

    'meta.index.title': 'ADAM | Van gesprek naar actie. Automatisch.',
    'meta.index.desc': 'ADAM is de conversational layer voor klantcontact. Gesprekken worden automatisch omgezet in acties. Schaalbaar bereikbaar zonder extra personeel.'
  },

  en: {
    'nav.cases': 'Cases',
    'nav.about': 'About us',
    'nav.cta': 'Book a demo',
    'nav.menuAria': 'Menu',

    'index.hero.title1': 'Your customer talks.',
    'index.hero.title2': 'The system acts.',
    'index.hero.sub': 'ADAM makes sure every customer conversation is handled immediately, with agents that feel natural, match your processes, and lead straight to action.',
    'index.hero.cta': 'See how it works',

    'trust.label': 'Trusted by',
    'trust.item1': 'Building & Installation',
    'trust.item2': 'Housing Associations',
    'trust.item3': 'Staffing Agencies',
    'trust.item4': 'Hospitality',

    'index.problem.label': 'Why ADAM',
    'index.problem.title': "The problem isn't reachability.<br>The problem is how conversations get <em>handled.</em>",
    'index.problem.body': 'Hold times, phone menus, staff answering the same questions over and over. ADAM replaces that friction with a conversational layer that listens, understands, and acts immediately. No scripts. No detours.',

    'index.app1.name': 'Intake',
    'index.app1.result': 'Fewer unnecessary calls, better conversations',
    'index.app1.tag': 'Filter & route',
    'index.app2.name': 'Gathering information',
    'index.app2.result': 'Less manual work, consistent data',
    'index.app2.tag': 'Data collection',
    'index.app3.name': 'Bookings',
    'index.app3.result': 'No missed revenue, always reachable',
    'index.app3.tag': 'Booking',

    'index.how.title': 'From first word<br>to completed action.',
    'index.how.link': 'Try it yourself →',
    'index.how.step1.title': 'Listen',
    'index.how.step1.body': 'The customer speaks the way they normally would. No menus, no instructions.',
    'index.how.step2.title': 'Understand',
    'index.how.step2.body': "ADAM recognises intent, context and urgency — not just what someone says, but what's needed.",
    'index.how.step3.title': 'Decide',
    'index.how.step3.body': 'Every agent works to your rules and processes. The system decides for itself what needs to happen.',
    'index.how.step4.title': 'Act',
    'index.how.step4.body': 'The conversation is turned straight into action. A task gets carried out or routed on, without delay.',

    'index.social.label': 'Who we are',
    'index.social.title': 'Built by people with a background in audio and voice.',
    'index.social.p1': "ADAM isn't a generic AI agency. Our roots are in audio technology, sound design and voice interfaces. That's what makes the difference in how we design agents.",
    'index.social.p2': 'We understand how conversations work — not just the words, but the tone, the rhythm, the pause. That knowledge is built into every agent we build.',
    'index.social.p3': 'Based in Groningen, active for organisations across the Netherlands.',
    'index.social.link': 'More about us →',
    'index.social.card1.title': 'Audio & voice expertise',
    'index.social.card1.body': 'Years of experience in sound design and voice interfaces form the basis of our approach.',
    'index.social.card2.title': 'AI development',
    'index.social.card2.body': 'In-house development of agent architecture, optimised for conversational context.',
    'index.social.card3.title': 'Implementation & integration',
    'index.social.card3.body': 'From briefing to live agent, including integrations with your existing systems.',
    'index.social.card4.title': 'Groningen, NL',
    'index.social.card4.body': 'Locally rooted, nationally active. Personal contact on every project.',

    'index.demo.eyebrow': 'Live demo',
    'index.demo.title': 'Try it yourself.<br>Pick your industry.',
    'index.demo.body': 'Build a personalised AI phone assistant for your industry in minutes and test it right away.',
    'index.demo.cta': 'Start the demo<span class="demo-cta-arr">→</span>',
    'index.demo.micro': 'No obligations. Test it right away, no installation.',
    'index.demo.orbLabel': 'Click to start',

    'index.wie.label': 'What actually changes',
    'index.wie.title': 'Fewer conversations that go nowhere.<br>More <em style="font-style:normal;color:var(--blue);">direct action.</em>',
    'index.wie.p1': "ADAM doesn't replace people. It makes sure people only do what genuinely needs a human touch. The system handles the rest by itself — consistent, direct, no detours.",
    'index.wie.link': 'View case: Dijk van een Wijf →',
    'index.wie.card1.body': 'Menus or scripts needed. The agent understands the conversation immediately.',
    'index.wie.card2.body': 'Reachable. Always the same quality, even outside office hours.',
    'index.wie.card3.body': 'Conversations handled at once, no queue and no extra staff.',
    'index.wie.card4.stat': 'Live within<br>days',
    'index.wie.card4.body': 'From briefing to working agent, without long implementation projects.',

    'index.cta.label': 'Ready for the next step',
    'index.cta.title': "Let's get started.",
    'index.cta.sub': "Tell us which problem you'd like to solve. We'll show you how an ADAM agent handles it.",
    'index.cta.secondary': 'See how it works →',
    'index.cta.micro': 'No obligations. Response within one business day.',

    'foot.tagline': 'From conversation to action. Automatically.',
    'foot.services.title': 'Services',
    'foot.services.1': 'Voice AI agents',
    'foot.services.2': 'Conversational design',
    'foot.services.3': 'Audio experiences',
    'foot.cases.title': 'Cases',
    'foot.cases.all': 'All cases',
    'foot.company.title': 'Company',
    'foot.company.home': 'Home',
    'foot.company.contact': 'Contact',
    'foot.contact.title': 'Contact',
    'foot.contact.officeLabel': 'Office',

    'meta.index.title': 'ADAM | From conversation to action. Automatically.',
    'meta.index.desc': 'ADAM is the conversational layer for customer contact. Conversations are automatically turned into actions. Scalable reachability without extra staff.'
  },

  de: {
    'nav.cases': 'Referenzen',
    'nav.about': 'Über uns',
    'nav.cta': 'Demo vereinbaren',
    'nav.menuAria': 'Menü',

    'index.hero.title1': 'Ihr Kunde spricht.',
    'index.hero.title2': 'Das System handelt.',
    'index.hero.sub': 'ADAM sorgt dafür, dass jedes Kundengespräch sofort bearbeitet wird — mit Agenten, die sich natürlich anfühlen, zu Ihren Prozessen passen und direkt zu einer Aktion führen.',
    'index.hero.cta': 'So funktioniert es',

    'trust.label': 'Im Einsatz bei',
    'trust.item1': 'Installationstechnik',
    'trust.item2': 'Wohnungsgenossenschaften',
    'trust.item3': 'Personaldienstleister',
    'trust.item4': 'Gastronomie',

    'index.problem.label': 'Warum ADAM',
    'index.problem.title': 'Das Problem ist nicht die Erreichbarkeit.<br>Das Problem ist, wie Gespräche <em>bearbeitet</em> werden.',
    'index.problem.body': 'Wartezeiten, Wahlmenüs, Mitarbeitende, die immer wieder dieselben Fragen beantworten. ADAM ersetzt diese Reibung durch eine Conversational Layer, die zuhört, versteht und sofort handelt. Ohne Skripte. Ohne Umwege.',

    'index.app1.name': 'Intake',
    'index.app1.result': 'Weniger unnötige Anrufe, bessere Gespräche',
    'index.app1.tag': 'Filtern & weiterleiten',
    'index.app2.name': 'Informationen erfassen',
    'index.app2.result': 'Weniger manuelle Arbeit, konsistente Daten',
    'index.app2.tag': 'Datenerfassung',
    'index.app3.name': 'Reservierungen',
    'index.app3.result': 'Kein entgangener Umsatz, immer erreichbar',
    'index.app3.tag': 'Buchung',

    'index.how.title': 'Vom ersten Wort<br>bis zur abgeschlossenen Aktion.',
    'index.how.link': 'Selbst ausprobieren →',
    'index.how.step1.title': 'Zuhören',
    'index.how.step1.body': 'Der Kunde spricht so, wie er es normalerweise tun würde. Keine Menüs, keine Anweisungen.',
    'index.how.step2.title': 'Verstehen',
    'index.how.step2.body': 'ADAM erkennt Absicht, Kontext und Dringlichkeit — nicht nur, was gesagt wird, sondern was gebraucht wird.',
    'index.how.step3.title': 'Entscheiden',
    'index.how.step3.body': 'Jeder Agent arbeitet nach Ihren Regeln und Prozessen. Das System entscheidet selbstständig, was zu tun ist.',
    'index.how.step4.title': 'Handeln',
    'index.how.step4.body': 'Das Gespräch wird direkt in eine Aktion umgesetzt. Eine Aufgabe wird ausgeführt oder gezielt weitergeleitet, ohne Verzögerung.',

    'index.social.label': 'Wer wir sind',
    'index.social.title': 'Gebaut von Menschen mit einem Hintergrund in Audio und Voice.',
    'index.social.p1': 'ADAM ist keine generische KI-Agentur. Unsere Wurzeln liegen in Audiotechnologie, Sound-Design und Voice-Interfaces. Das macht den Unterschied, wie wir Agenten gestalten.',
    'index.social.p2': 'Wir verstehen, wie Gespräche funktionieren. Nicht nur die Worte, sondern Tonfall, Rhythmus und Pause. Dieses Wissen steckt in jedem Agenten, den wir bauen.',
    'index.social.p3': 'Ansässig in Groningen, aktiv für Organisationen in den gesamten Niederlanden.',
    'index.social.link': 'Mehr über uns →',
    'index.social.card1.title': 'Audio- & Voice-Expertise',
    'index.social.card1.body': 'Jahrelange Erfahrung in Sound-Design und Voice-Interfaces bildet die Grundlage unseres Ansatzes.',
    'index.social.card2.title': 'KI-Entwicklung',
    'index.social.card2.body': 'Eigene Entwicklung der Agentenarchitektur, optimiert für konversationellen Kontext.',
    'index.social.card3.title': 'Implementierung & Integration',
    'index.social.card3.body': 'Vom Briefing bis zum Live-Agenten, inklusive Anbindung an Ihre bestehenden Systeme.',
    'index.social.card4.title': 'Groningen, NL',
    'index.social.card4.body': 'Lokal verwurzelt, national aktiv. Persönlicher Kontakt bei jedem Projekt.',

    'index.demo.eyebrow': 'Live-Demo',
    'index.demo.title': 'Selbst ausprobieren.<br>Wählen Sie Ihre Branche.',
    'index.demo.body': 'Erstellen Sie in wenigen Minuten einen personalisierten KI-Telefonassistenten für Ihre Branche und testen Sie ihn sofort.',
    'index.demo.cta': 'Demo starten<span class="demo-cta-arr">→</span>',
    'index.demo.micro': 'Unverbindlich. Sofort testbar, keine Installation.',
    'index.demo.orbLabel': 'Klicken zum Starten',

    'index.wie.label': 'Was sich konkret ändert',
    'index.wie.title': 'Weniger Gespräche, die nichts bringen.<br>Mehr <em style="font-style:normal;color:var(--blue);">direkte Aktion.</em>',
    'index.wie.p1': 'ADAM ersetzt keine Menschen. Es sorgt dafür, dass Menschen nur das tun, was wirklich menschlichen Kontakt erfordert. Den Rest erledigt das System selbstständig — konsistent, direkt und ohne Umwege.',
    'index.wie.link': 'Referenz ansehen: Dijk van een Wijf →',
    'index.wie.card1.body': 'Wahlmenüs oder Skripte nötig. Der Agent versteht das Gespräch sofort.',
    'index.wie.card2.body': 'Erreichbar. Immer dieselbe Qualität, auch außerhalb der Bürozeiten.',
    'index.wie.card3.body': 'Gespräche gleichzeitig verarbeiten, ohne Warteschlange oder zusätzliches Personal.',
    'index.wie.card4.stat': 'Innerhalb von<br>Tagen live',
    'index.wie.card4.body': 'Vom Briefing zum funktionierenden Agenten, ohne lange Implementierungsprojekte.',

    'index.cta.label': 'Bereit für den nächsten Schritt',
    'index.cta.title': 'Lassen Sie uns beginnen.',
    'index.cta.sub': 'Erzählen Sie uns, welches Problem Sie lösen möchten. Wir zeigen Ihnen, wie ein ADAM-Agent das angeht.',
    'index.cta.secondary': 'So funktioniert es →',
    'index.cta.micro': 'Unverbindlich. Antwort innerhalb eines Werktags.',

    'foot.tagline': 'Vom Gespräch zur Aktion. Automatisch.',
    'foot.services.title': 'Leistungen',
    'foot.services.1': 'Voice-AI-Agenten',
    'foot.services.2': 'Conversational Design',
    'foot.services.3': 'Audio-Erlebnisse',
    'foot.cases.title': 'Referenzen',
    'foot.cases.all': 'Alle Referenzen',
    'foot.company.title': 'Unternehmen',
    'foot.company.home': 'Startseite',
    'foot.company.contact': 'Kontakt',
    'foot.contact.title': 'Kontakt',
    'foot.contact.officeLabel': 'Büro',

    'meta.index.title': 'ADAM | Vom Gespräch zur Aktion. Automatisch.',
    'meta.index.desc': 'ADAM ist die Conversational Layer für den Kundenkontakt. Gespräche werden automatisch in Aktionen umgesetzt. Skalierbar erreichbar, ohne zusätzliches Personal.'
  }
};

let currentLang = DEFAULT_LANG;

export function resolveLang() {
  // Dutch is the default for every first-time visitor, regardless of browser
  // or OS language — only an explicit ?lang= or a previously-made switcher
  // choice (localStorage) moves away from it.
  try {
    const qp = new URLSearchParams(window.location.search).get('lang');
    if (qp && LANGS.includes(qp)) return qp;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && LANGS.includes(stored)) return stored;
  } catch (e) { /* localStorage may be unavailable (privacy mode) */ }
  return DEFAULT_LANG;
}

export function t(key, lang) {
  const l = lang || currentLang;
  return (T[l] && T[l][key]) || (T[DEFAULT_LANG] && T[DEFAULT_LANG][key]) || key;
}

export function applyTranslations(root) {
  root = root || document;
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'))); });
  root.querySelectorAll('[data-i18n-aria-label]').forEach((el) => { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label'))); });
  root.querySelectorAll('[data-i18n-content]').forEach((el) => { el.setAttribute('content', t(el.getAttribute('data-i18n-content'))); });
  document.documentElement.lang = currentLang;
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

export function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  currentLang = lang;
  try { window.localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
  applyTranslations(document);
  renderSwitchers();
  document.documentElement.classList.remove('i18n-pending');
  document.dispatchEvent(new CustomEvent('adam:langchange', { detail: { lang } }));
}

function initI18n() {
  currentLang = resolveLang();
  applyTranslations(document);
  renderSwitchers();
  document.documentElement.classList.remove('i18n-pending');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}
