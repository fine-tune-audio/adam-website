import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLANS, PLAN_ORDER, PLAN_FEATURES, COMPARISON_HIDDEN_FEATURES, ADDONS, BILLING_RULES, CALCULATOR, AVG_CALL_MINUTES, ROUTES,
  approxCalls, featuresFor, effectivePerMinute, hasAnnualPricing, priceFor, annualTotal,
  annualSavingPerMonth, monthsFreeAnnual, setupPriceFor, formatMoney, ctaHref, planById
} from '../pricing-config.js';
import pricingLocale from '../locales/pricing.js';

const plan = (id) => PLANS.find((p) => p.id === id);

test('the four plans match the proposal', () => {
  assert.deepEqual(PLANS.map((p) => p.id), ['start', 'groei', 'pro', 'maatwerk']);
  assert.deepEqual(PLANS.map((p) => p.monthly), [49, 129, 299, 799]);
  assert.deepEqual(PLANS.map((p) => p.annual), [490, 1290, 2990, null]);
  assert.deepEqual(PLANS.map((p) => p.includedMinutes), [150, 400, 1000, 3000]);
  assert.deepEqual(PLANS.map((p) => p.extraMinuteRate), [0.4, 0.35, 0.25, 0.2]);
  assert.deepEqual(PLANS.map((p) => p.phoneNumbers), [1, 1, 3, 5]);
  assert.deepEqual(PLANS.map((p) => p.concurrentCalls), [1, 2, 5, null]);
  assert.deepEqual(PLANS.map((p) => p.setupFee), [149, 149, 349, 0]);
});

test('approximate calls = minutes / 2.5', () => {
  assert.equal(AVG_CALL_MINUTES, 2.5);
  assert.equal(approxCalls(150), 60);
  assert.deepEqual(PLANS.map((p) => p.approxCalls), [60, 160, 400, 1200]);
});

test('only groei is marked most chosen; only maatwerk is custom and quoted', () => {
  assert.deepEqual(PLANS.filter((p) => p.highlighted).map((p) => p.id), ['groei']);
  assert.deepEqual(PLANS.filter((p) => p.custom).map((p) => p.id), ['maatwerk']);
  assert.equal(plan('maatwerk').fromPricing, true);
  assert.equal(plan('maatwerk').setupIncluded, true);
});

test('annual is 10 x monthly ("2 months free")', () => {
  for (const p of PLANS.filter((x) => !x.custom)) {
    assert.equal(p.annual, p.monthly * 10);
    assert.equal(monthsFreeAnnual(p), 2);
    assert.equal(annualTotal(p), p.annual);
  }
  assert.equal(monthsFreeAnnual(plan('maatwerk')), 0);
  assert.equal(annualTotal(plan('maatwerk')), null);
});

test('priceFor: annual shows the per-month price (annual / 12); saving is two months a year', () => {
  assert.equal(priceFor(plan('start'), 'monthly'), 49);
  assert.ok(Math.abs(priceFor(plan('start'), 'annual') - 490 / 12) < 1e-9);
  assert.ok(Math.abs(annualSavingPerMonth(plan('start')) - (49 - 490 / 12)) < 1e-9);
  // maatwerk has no annual price: always the monthly "from" price
  assert.equal(priceFor(plan('maatwerk'), 'annual'), 799);
  assert.equal(annualSavingPerMonth(plan('maatwerk')), 0);
});

test('annual toggle shows only when every online plan has an annual price (custom is quoted)', () => {
  assert.equal(hasAnnualPricing(PLANS), true);
  assert.equal(hasAnnualPricing(PLANS.map((p) => (p.id === 'pro' ? { ...p, annual: null } : p))), false);
});

test('effective per-minute price', () => {
  assert.equal(effectivePerMinute(plan('start')).toFixed(2), '0.33');
  assert.equal(effectivePerMinute(plan('groei')).toFixed(2), '0.32');
  assert.equal(effectivePerMinute(plan('pro')).toFixed(2), '0.30');
});

test('setup service: free with annual billing, included for maatwerk', () => {
  assert.equal(setupPriceFor(plan('start'), 'monthly'), 149);
  assert.equal(setupPriceFor(plan('pro'), 'monthly'), 349);
  assert.equal(setupPriceFor(plan('pro'), 'annual'), 0);
  assert.equal(setupPriceFor(plan('maatwerk'), 'monthly'), 0);
});

test('features: each plan builds on the one below and adds its own', () => {
  assert.deepEqual(featuresFor('start').builtOn, null);
  assert.deepEqual(featuresFor('groei').builtOn, 'start');
  assert.deepEqual(featuresFor('pro').builtOn, 'groei');
  assert.deepEqual(featuresFor('maatwerk').builtOn, 'pro');
  assert.deepEqual(PLAN_FEATURES.start, ['answers', 'messages', 'knowledge', 'forward', 'preset', 'emailSummary']);
  assert.deepEqual(PLAN_FEATURES.groei, ['calendar', 'sms', 'languages']);
  assert.deepEqual(PLAN_FEATURES.pro, ['multiAgent', 'recordings', 'webhooks', 'prioritySupport']);
  assert.deepEqual(PLAN_FEATURES.maatwerk, ['sla', 'dpa', 'contact', 'integrations']);
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

test('calculator config: ranges and defaults from the proposal', () => {
  assert.deepEqual({ ...CALCULATOR.callsPerDay }, { min: 0, max: 60, default: 10 });
  assert.deepEqual(CALCULATOR.sharePresets.map((s) => [s.id, s.percent]), [['missed', 30], ['half', 50], ['all', 100]]);
  assert.equal(CALCULATOR.share.min, 10);
  assert.equal(CALCULATOR.share.max, 100);
  assert.equal(CALCULATOR.share.default, 30);
  assert.deepEqual({ ...CALCULATOR.callMinutes }, { min: 1, max: 6, step: 0.5, default: 2.5 });
  assert.deepEqual([...CALCULATOR.daysOpen], [22, 26, 30]);
  assert.equal(CALCULATOR.daysOpenDefault, 22);
  assert.deepEqual({ ...CALCULATOR.humanCostPerCall }, { min: 1.5, max: 2.5 });
});

test('money: whole euros without decimals, cents with two', () => {
  assert.equal(formatMoney(49, { lang: 'en' }), '€49');
  assert.equal(formatMoney(0.4, { lang: 'en' }), '€0.40');
  assert.equal(formatMoney(181.5, { lang: 'en' }), '€181.50');
  assert.equal(formatMoney(0.4, { lang: 'en', decimals: 2 }), '€0.40');
  assert.match(formatMoney(49, { lang: 'nl' }), /49$/);
  assert.match(formatMoney(0.35, { lang: 'de' }), /0,35/);
});

test('CTA links: online plans to the app signup, annual adds billing=annual, maatwerk to the contact form', () => {
  assert.equal(ROUTES.signup, 'https://app.adamagents.nl/signup');
  assert.equal(ctaHref('start'), 'https://app.adamagents.nl/signup?plan=start');
  assert.equal(ctaHref('groei', 'monthly'), 'https://app.adamagents.nl/signup?plan=groei');
  assert.equal(ctaHref('pro', 'annual'), 'https://app.adamagents.nl/signup?plan=pro&billing=annual');
  assert.equal(ctaHref('maatwerk', 'annual'), 'contact.html?plan=maatwerk');
  assert.ok(planById('maatwerk').custom);
});

test('pricing dictionary: en/de define every nl key', () => {
  const nl = Object.keys(pricingLocale.nl);
  for (const l of ['en', 'de']) {
    assert.deepEqual(nl.filter((k) => !(k in pricingLocale[l])), [], `${l} missing keys`);
    assert.deepEqual(Object.keys(pricingLocale[l]).filter((k) => !(k in pricingLocale.nl)), [], `${l} has extra keys`);
  }
});

test('no old pricing values or plan names survive in the pricing copy', () => {
  const all = JSON.stringify(pricingLocale);
  assert.doesNotMatch(all, /Starter|Growth/);
  assert.doesNotMatch(all, /top-?up|pack|pakket|Paket/i);
  assert.doesNotMatch(all, /€\s?(41|108|249)\b/);
});

test('comparison table hides webhooks, SLA, DPA, dedicated contact and custom integrations; they stay in the config', () => {
  assert.deepEqual([...COMPARISON_HIDDEN_FEATURES].sort(), ['contact', 'dpa', 'integrations', 'sla', 'webhooks']);
  const known = Object.values(PLAN_FEATURES).flat();
  for (const k of COMPARISON_HIDDEN_FEATURES) assert.ok(known.includes(k), `${k} is not a known feature`);
});
