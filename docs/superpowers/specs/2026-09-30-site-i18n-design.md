# Site-wide i18n (NL / EN / DE) — Design

Date: 2026-09-30

> Plan-phase amendments: dictionaries live in `locales/` (not `i18n/`, to avoid clashing with `i18n.js`); industry EN/DE text is an overlay file `industry-configs.i18n.js` (Dutch base config unchanged); summary prompt builder is extracted to `vet-server/prompt.js`. See `docs/superpowers/plans/2026-09-30-site-i18n.md`.

## Goal
Every page of adamagents.nl works in Dutch, English and German. Dutch is the default. A language switcher is on every page and one shared choice (`localStorage['adam.lang']`, or `?lang=`) carries across the whole site. Demo voice agents and demo summaries follow the chosen language.

## Decisions (from user)
- Switcher on any page; one language setting across the entire site.
- Dutch default for first-time visitors regardless of browser language (existing `resolveLang()` behaviour).
- Scope: UI text on all pages, plus voice agent and server summaries follow the language, plus translated privacy page.
- Approach: extend existing `i18n.js` with per-page dictionaries (no build step, no per-language URLs).

## Current state
- `i18n.js` exists (runtime + one flat `T` dictionary, `nl/en/de`, ~89 `index.*`/`nav.*`/`trust.*` keys). Only `index.html` uses it.
- 13 other pages are hardcoded Dutch: about, cases, case-belmaatje, case-blauvolt, case-dijk-van-een-wijf, case-fraeylemaborg, case-geo-demo, contact, demo, polygon-walker, privacyverklaring, stadsstemmen-app (partial `data-i18n`, own language system), vet-demo (identical copy of demo, 301-redirected by `vercel.json`; untouched).
- Nav, footer and consent banner are copy-pasted per page. `adam-tracking.js` holds lead-form/consent strings.
- Demo agents: created with `language: 'nl'`; only `first_message` and `tts.voice_id` overrides enabled; prompt override off; Dutch directive baked into prompts via `DUTCH_LANGUAGE_DIRECTIVE` (`industry-configs.js`). `vet-server` `/api/summarise` hardcodes Dutch output.

## 1. Runtime and shared pieces
- `i18n.js` remains the single runtime (resolve, apply, switcher, `adam:langchange` event).
- Dictionary loading: `T` is assembled from `i18n/common.js` plus the current page's file, chosen by `<meta name="i18n-page" content="<name>">`.
- Every page gets: anti-flash `<head>` snippet (as in `index.html`), `<script type="module" src="i18n.js">`, and a `<div data-lang-switcher>` in the nav.
- Switcher CSS moves out of `index.html` into the runtime (injected once).
- `i18n/common.js`: nav, footer, consent banner, lead-form labels, `adam-tracking.js` strings.
- Fallback chain: missing EN/DE key falls back to NL; a dev check lists missing keys.
- Per language: `<html lang>`, `<title>`, meta description, `hreflang`, `og:` tags.

## 2. Per-page dictionaries
- Files: `i18n/common.js`, `index.js`, `cases.js`, `case-<slug>.js` (x4 + geo-demo), `about.js`, `contact.js`, `privacy.js`, `demo.js`. Each exports `{ nl, en, de }`; keys namespaced `page.section.name`.
- Existing 89 keys move into `index.js`/`common.js` unchanged.
- Markup: `data-i18n`, `-html`, `-placeholder`, `-aria-label`, `-content`. Existing Dutch stays in HTML as no-JS fallback; NL dictionary is extracted from current copy (Dutch is source of truth).
- JS-generated strings use `t('key')` and re-render on `adam:langchange`.
- `privacyverklaring`: fully translated EN/DE with a visible "Dutch version prevails" note. Legal text needs human/lawyer review before reliance.
- Translation: EN and DE authored by Claude; brand terms untranslated; German uses "Sie"; ambiguous lines listed for review.
- Verification: script reports (a) `data-i18n` keys missing from dictionaries, (b) leftover hardcoded Dutch text nodes; plus browser load + screenshot of each page in each language.

## 3. Demos, voice agent, server, stadsstemmen
1. `demo.html` UI text via `demo.js`; orb labels, badges, `STRUGGLES` re-render on `adam:langchange`.
2. `industry-configs.js`: `greeting` becomes `{nl, en, de}`; language directive becomes `{{language_name}}` dynamic variable so one prompt serves all languages.
3. `startSession` passes `language_name` and localized `firstMessage`. Takes effect on the next call, not mid-call.
4. ElevenLabs agents (**external, live**): script updates existing industry agents to allow the `language` override and use `{{language_name}}`. Dry-run + diff shown to the user first; not run without explicit go-ahead. Flag any TTS voices that don't cover DE.
5. `vet-server` `/api/summarise` accepts `lang` (nl/en/de, default nl); summary in that language; enum tokens stay English.
6. `stadsstemmen-app.html`: two-way bridge between `ss_lang` and `adam.lang` for nl/en/de; the other UI languages keep working and leave the site language unchanged.
7. `vet-demo.html`: untouched.

## Out of scope
Per-language URLs / SEO indexing of EN/DE, translating the Dutch-only audio spots, mid-call language switching.

## Risks
- Volume: est. 1,500+ keys across ~14 pages; extraction is mechanical but large.
- DE/EN legal text (privacy) requires review.
- Live ElevenLabs agent edits are the only external side effect; gated behind explicit approval.
- Search engines index Dutch only (JS-swapped text).
