import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLANS, ADDONS, effectivePerMinute, topUpPrice, hasAnnualPricing, priceFor,
  annualSavingPerMonth, formatMoney, ctaHref
} from '../pricing-config.js';
import pricingLocale from '../locales/pricing.js';

const plan = (id) => PLANS.find((p) => p.id === id);

test('effective per-minute price rounds to the expected 2 decimals', () => {
  const two = (id) => effectivePerMinute(plan(id)).toFixed(2);
  assert.equal(two('starter'), '0.20');
  assert.equal(two('growth'), '0.17');
  assert.equal(two('pro'), '0.15');
});

test('top-up pack price matches each plan overage rate', () => {
  assert.equal(topUpPrice(plan('starter'), ADDONS.topUpMinutes), 25);
  assert.equal(topUpPrice(plan('growth'), ADDONS.topUpMinutes), 20);
  assert.equal(topUpPrice(plan('pro'), ADDONS.topUpMinutes), 15);
});

test('money: whole euros without decimals, small amounts with two', () => {
  assert.equal(formatMoney(49, { lang: 'en' }), '€49');
  assert.equal(formatMoney(0.25, { lang: 'en' }), '€0.25');
  assert.equal(formatMoney(0.2, { lang: 'en', decimals: 2 }), '€0.20');
  assert.match(formatMoney(49, { lang: 'nl' }), /49$/);
  assert.match(formatMoney(0.25, { lang: 'de' }), /0,25/);
});

test('annual toggle stays hidden while any plan lacks an annual price', () => {
  assert.equal(hasAnnualPricing(PLANS), false);
  const partial = PLANS.map((p, i) => ({ ...p, annualMonthly: i === 0 ? 40 : undefined }));
  assert.equal(hasAnnualPricing(partial), false);
  const full = PLANS.map((p) => ({ ...p, annualMonthly: p.monthly - 5 }));
  assert.equal(hasAnnualPricing(full), true);
});

test('priceFor and saving fall back to monthly without annual price', () => {
  const p = plan('starter');
  assert.equal(priceFor(p, 'annual'), 49);
  assert.equal(annualSavingPerMonth(p), 0);
  const annual = { ...p, annualMonthly: 42 };
  assert.equal(priceFor(annual, 'annual'), 42);
  assert.equal(annualSavingPerMonth(annual), 7);
});

test('CTA carries plan and interval params', () => {
  assert.equal(ctaHref('growth'), 'contact.html?plan=growth&interval=monthly');
});

test('pricing dictionary: en/de define every nl key', () => {
  const nl = Object.keys(pricingLocale.nl);
  for (const l of ['en', 'de']) {
    assert.deepEqual(nl.filter((k) => !(k in pricingLocale[l])), [], `${l} missing keys`);
  }
});
