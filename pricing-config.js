// pricing-config.js
// Single source of truth for the public /pricing page. Ships to the browser,
// so it holds public prices only. All prices are EUR and exclude VAT.
// Edit prices HERE; pricing.html renders everything from this module.
//
// TODO(owner): not stated anywhere yet, so the page makes no claim about them:
//   - free trial / money-back guarantee / contract length / cancellation terms
//   - SLA
//   - how minutes are counted (per second vs rounded up)
//   - what happens when all concurrent call slots are busy
//   - annual prices are placeholders (~16% below monthly, close to "2 months free"); confirm or change `annualMonthly`.
//     Unset it on ANY plan and the monthly/yearly toggle disappears.

/**
 * @typedef {Object} Plan
 * @property {'starter'|'growth'|'pro'} id
 * @property {number} monthly            price per month, EUR excl. VAT
 * @property {number|undefined} annualMonthly  per-month price when billed yearly; unset = no annual billing
 * @property {number} includedMinutes
 * @property {number} extraMinuteRate    EUR per extra minute
 * @property {number} phoneNumbers       included phone numbers
 * @property {number} concurrentCalls
 * @property {boolean} highlighted
 */

/** @type {readonly Plan[]} */
export const PLANS = Object.freeze([
  { id: 'starter', monthly: 49, annualMonthly: 41, includedMinutes: 250, extraMinuteRate: 0.25, phoneNumbers: 1, concurrentCalls: 1, highlighted: false },
  { id: 'growth', monthly: 129, annualMonthly: 108, includedMinutes: 750, extraMinuteRate: 0.2, phoneNumbers: 1, concurrentCalls: 2, highlighted: true },
  { id: 'pro', monthly: 299, annualMonthly: 249, includedMinutes: 2000, extraMinuteRate: 0.15, phoneNumbers: 3, concurrentCalls: 3, highlighted: false }
]);

export const ADDONS = Object.freeze({
  extraPhoneNumberMonthly: 9,
  topUpMinutes: 100, // pack size; the pack price is derived per plan (see topUpPrice)
  smsEach: 0.15
});

export const CURRENCY = 'EUR';

/** Routes used by the CTAs. */
export const ROUTES = Object.freeze({
  signup: 'signup.html', // placeholder signup (password gate); no billing yet. Params are passed for billing to pick up later
  contact: 'contact.html'
});

// ── helpers (unit-tested) ───────────────────────────────────────────────

/** Effective price per included minute = monthly price / included minutes. */
export function effectivePerMinute(plan) {
  return plan.monthly / plan.includedMinutes;
}

/** Minute top-up pack price, matched to the plan's extra-minute rate. */
export function topUpPrice(plan, packMinutes = ADDONS.topUpMinutes) {
  return Math.round(plan.extraMinuteRate * packMinutes * 100) / 100;
}

/** True only when every plan has an annual per-month price. */
export function hasAnnualPricing(plans = PLANS) {
  return plans.every((p) => typeof p.annualMonthly === 'number' && p.annualMonthly > 0);
}

/** Per-month price for the chosen interval; falls back to monthly. */
export function priceFor(plan, interval) {
  return interval === 'annual' && typeof plan.annualMonthly === 'number' ? plan.annualMonthly : plan.monthly;
}

/** Monthly saving when billed yearly; 0 when no annual price. */
export function annualSavingPerMonth(plan) {
  return typeof plan.annualMonthly === 'number' ? Math.max(0, plan.monthly - plan.annualMonthly) : 0;
}

const INTL_LOCALES = { nl: 'nl-NL', en: 'en-IE', de: 'de-DE' };

/**
 * One money formatter for the whole page. Whole euros without decimals
 * (€49), per-minute / per-SMS / per-pack amounts with two (€0.25).
 */
export function formatMoney(amount, { lang = 'nl', decimals } = {}) {
  const fd = decimals === undefined ? (Number.isInteger(amount) ? 0 : 2) : decimals;
  return new Intl.NumberFormat(INTL_LOCALES[lang] || INTL_LOCALES.nl, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: fd,
    maximumFractionDigits: fd
  }).format(amount);
}

/** Integer with locale grouping (2,000 / 2.000). */
export function formatInt(n, lang = 'nl') {
  return new Intl.NumberFormat(INTL_LOCALES[lang] || INTL_LOCALES.nl).format(n);
}

/** CTA link: route (default contact) plus plan/interval params. */
export function ctaHref(planId, interval = 'monthly', route = ROUTES.contact) {
  return `${route}?plan=${encodeURIComponent(planId)}&interval=${encodeURIComponent(interval)}`;
}
