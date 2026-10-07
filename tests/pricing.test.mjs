import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import {
  PLANS, PLAN_ORDER, PLAN_FEATURES, COMPARISON_HIDDEN_FEATURES, ADDONS, BILLING_RULES, CALCULATOR,
  AVG_CALL_MINUTES, ROUTES, approxCalls, featuresFor, effectivePerMinute, hasAnnualPricing, priceFor,
  annualTotal, setupPriceFor, formatMoney, ctaHref
} from '../pricing-config.js';
import pricingLocale from '../locales/pricing.js';

const plan = (id) => PLANS.find((p) => p.id === id);

test('the three plans match the proposal (no custom plan: custom software is a contact note)', () => {
  assert.deepEqual(PLANS.map((p) => p.id), ['start', 'groei', 'pro']);
  assert.deepEqual(PLANS.map((p) => p.monthly), [49, 129, 299]);
  assert.deepEqual(PLANS.map((p) => p.annual), [490, 1290, 2990]);
  assert.deepEqual(PLANS.map((p) => p.includedMinutes), [150, 400, 1000]);
  assert.deepEqual(PLANS.map((p) => p.extraMinuteRate), [0.4, 0.35, 0.25]);
  assert.deepEqual(PLANS.map((p) => p.phoneNumbers), [1, 1, 3]);
  assert.deepEqual(PLANS.map((p) => p.concurrentCalls), [1, 2, 5]);
  assert.deepEqual(PLANS.map((p) => p.setupFee), [149, 149, 349]);
  assert.equal(PLANS.some((p) => p.id === 'maatwerk'), false);
});

test('approximate calls = minutes / 2.5', () => {
  assert.equal(AVG_CALL_MINUTES, 2.5);
  assert.equal(approxCalls(150), 60);
  assert.deepEqual(PLANS.map((p) => p.approxCalls), [60, 160, 400]);
});

test('only groei is marked most chosen', () => {
  assert.deepEqual(PLANS.filter((p) => p.highlighted).map((p) => p.id), ['groei']);
});

test('annual is 10 x monthly', () => {
  for (const p of PLANS) {
    assert.equal(p.annual, p.monthly * 10);
    assert.equal(annualTotal(p), p.annual);
  }
});

test('priceFor: annual shows the per-month price (annual / 12)', () => {
  assert.equal(priceFor(plan('start'), 'monthly'), 49);
  assert.ok(Math.abs(priceFor(plan('start'), 'annual') - 490 / 12) < 1e-9);
});

test('annual toggle shows only when every plan has an annual price', () => {
  assert.equal(hasAnnualPricing(PLANS), true);
  assert.equal(hasAnnualPricing(PLANS.map((p) => (p.id === 'pro' ? { ...p, annual: null } : p))), false);
});

test('effective per-minute price', () => {
  assert.equal(effectivePerMinute(plan('start')).toFixed(2), '0.33');
  assert.equal(effectivePerMinute(plan('groei')).toFixed(2), '0.32');
  assert.equal(effectivePerMinute(plan('pro')).toFixed(2), '0.30');
});

test('setup service: free with annual billing', () => {
  assert.equal(setupPriceFor(plan('start'), 'monthly'), 149);
  assert.equal(setupPriceFor(plan('pro'), 'monthly'), 349);
  assert.equal(setupPriceFor(plan('pro'), 'annual'), 0);
});

test('features: each plan builds on the one below and adds its own', () => {
  assert.deepEqual(featuresFor('start').builtOn, null);
  assert.deepEqual(featuresFor('groei').builtOn, 'start');
  assert.deepEqual(featuresFor('pro').builtOn, 'groei');
  assert.deepEqual(PLAN_FEATURES.start, ['answers', 'messages', 'knowledge', 'forward', 'preset', 'emailSummary']);
  assert.deepEqual(PLAN_FEATURES.groei, ['calendar', 'languages']);
  assert.deepEqual(PLAN_FEATURES.pro, ['multiAgent', 'recordings', 'webhooks', 'prioritySupport']);
  assert.deepEqual(PLAN_ORDER, PLANS.map((p) => p.id));
});

test('extras for every plan: extra number €10, unlimited users, free setup with annual; no top-up packs anywhere', () => {
  assert.equal(ADDONS.extraPhoneNumberMonthly, 10);
  assert.equal(ADDONS.unlimitedUsers, true);
  assert.equal(ADDONS.setupFreeWithAnnual, true);
  assert.equal('topUpMinutes' in ADDONS, false);
  assert.equal('smsEach' in ADDONS, false);
  for (const p of PLANS) assert.equal('topUp' in p, false);
});

test('billing rules are stored for Phase 3', () => {
  assert.equal(BILLING_RULES.vatRate, 0.21);
  assert.equal(BILLING_RULES.annualMonthsBilled, 10);
  assert.equal(BILLING_RULES.billedPerSecond, true);
  assert.equal(BILLING_RULES.freeCallUnderSeconds, 10);
  assert.equal(BILLING_RULES.failedCallsFree, true);
  assert.equal(BILLING_RULES.extraMinutesCharged, 'end-of-month');
  assert.deepEqual([...BILLING_RULES.usageAlertPercents], [80, 100]);
  assert.deepEqual([...BILLING_RULES.limitBehaviours], ['stop-at-limit', 'allow-extra-up-to-cap']);
  assert.deepEqual([...BILLING_RULES.stopAtLimitFallbacks], ['forward', 'voicemail']);
  assert.deepEqual({ ...BILLING_RULES.upgrade }, { effective: 'immediately', prorated: true });
  assert.deepEqual({ ...BILLING_RULES.downgrade }, { effective: 'end-of-period' });
  assert.equal(BILLING_RULES.cancellation.effective, 'end-of-period');
  assert.equal(BILLING_RULES.cancellation.interval, 'monthly');
  assert.equal(BILLING_RULES.freeSetupAndBrowserTestCalls, true);
  assert.equal(BILLING_RULES.cardRequiredForTesting, false);
  assert.equal(BILLING_RULES.paymentStartsWhen, 'phone-number-live');
  assert.equal(BILLING_RULES.moneyBackDays, 14);
  assert.deepEqual([...BILLING_RULES.paymentMethods], ['direct-debit', 'card']);
});

test('calculator config: one input (calls per day) and fixed assumptions', () => {
  assert.deepEqual({ ...CALCULATOR.callsPerDay }, { min: 0, max: 60, default: 10 });
  assert.deepEqual({ ...CALCULATOR.assumptions }, { days: 22, callMinutes: 2.5, sharePercent: 100 });
});

test('money: whole euros without decimals, cents with two', () => {
  assert.equal(formatMoney(49, { lang: 'en' }), '€49');
  assert.equal(formatMoney(0.4, { lang: 'en' }), '€0.40');
  assert.equal(formatMoney(181.5, { lang: 'en' }), '€181.50');
  assert.equal(formatMoney(0.4, { lang: 'en', decimals: 2 }), '€0.40');
  assert.match(formatMoney(49, { lang: 'nl' }), /49$/);
  assert.match(formatMoney(0.35, { lang: 'de' }), /0,35/);
});

test('CTA links go to the app signup; annual adds billing=annual', () => {
  assert.equal(ROUTES.signup, 'https://app.adamagents.nl/signup');
  assert.equal(ctaHref('start'), 'https://app.adamagents.nl/signup?plan=start');
  assert.equal(ctaHref('groei', 'monthly'), 'https://app.adamagents.nl/signup?plan=groei');
  assert.equal(ctaHref('pro', 'annual'), 'https://app.adamagents.nl/signup?plan=pro&billing=annual');
});

test('comparison table hides webhooks; the feature stays in the config', () => {
  assert.deepEqual([...COMPARISON_HIDDEN_FEATURES], ['webhooks']);
  const known = Object.values(PLAN_FEATURES).flat();
  for (const k of COMPARISON_HIDDEN_FEATURES) assert.ok(known.includes(k), `${k} is not a known feature`);
});

test('pricing dictionary: en/de define every nl key', () => {
  const nl = Object.keys(pricingLocale.nl);
  for (const l of ['en', 'de']) {
    assert.deepEqual(nl.filter((k) => !(k in pricingLocale[l])), [], `${l} missing keys`);
    assert.deepEqual(Object.keys(pricingLocale[l]).filter((k) => !(k in pricingLocale.nl)), [], `${l} has extra keys`);
  }
});

test('no old pricing values, plan names or removed plan survive in the pricing copy', () => {
  const all = JSON.stringify(pricingLocale);
  assert.doesNotMatch(all, /Starter|Growth/);
  assert.doesNotMatch(all, /top-?up|pack|pakket|Paket/i);
  assert.doesNotMatch(all, /€\s?(41|108|249)\b/);
  assert.doesNotMatch(all, /Maatwerk/);
});

test('the custom-software note exists in every language', () => {
  for (const l of ['nl', 'en', 'de']) {
    assert.ok(pricingLocale[l]['pricing.custom.text'], `${l} custom text`);
    assert.ok(pricingLocale[l]['pricing.custom.link'], `${l} custom link`);
  }
});

test('every static translation key the pricing page asks for exists in every language', () => {
  const html = readFileSync(new URL('../pricing.html', import.meta.url), 'utf8');
  const keys = new Set();
  for (const m of html.matchAll(/data-i18n(?:-html|-aria-label|-content|-placeholder)?="([\w.]+)"/g)) keys.add(m[1]);
  for (const m of html.matchAll(/\b(?:t|fill)\(\s*'([\w.]+)'/g)) keys.add(m[1]);
  for (const m of html.matchAll(/\b(?:t|fill)\(\s*`([\w.]+)`/g)) keys.add(m[1]);
  const common = Object.keys(pricingLocale.nl);
  const own = (k) => /^(pricing|calc|meta\.pricing)\./.test(k);
  assert.ok(keys.size > 50, `only found ${keys.size} keys: the key scan is broken`);
  for (const l of ['nl', 'en', 'de']) {
    const missing = [...keys].filter((k) => own(k) && !(k in pricingLocale[l]));
    assert.deepEqual(missing, [], `${l} is missing keys used by pricing.html`);
  }
  assert.ok(common.length > 0);
});

test('the pricing page has no FAQ and no SMS feature', () => {
  const html = readFileSync(new URL('../pricing.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /faq/i);
  assert.equal(Object.values(PLAN_FEATURES).flat().includes('sms'), false);
  for (const l of ['nl', 'en', 'de']) {
    assert.deepEqual(Object.keys(pricingLocale[l]).filter((k) => k.startsWith('pricing.faq.') || k === 'pricing.feat.sms'), []);
  }
});

test('the pricing page does not advertise "2 months free"', () => {
  const html = readFileSync(new URL('../pricing.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /toggleHint|annualHint|price-saving|monthsFree/);
  assert.doesNotMatch(JSON.stringify(pricingLocale), /months free|maanden gratis|Monate gratis/i);
});
