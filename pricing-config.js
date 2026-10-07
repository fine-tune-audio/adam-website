// pricing-config.js
// Single source of truth for ADAM's public pricing. Ships to the browser, so it holds public values only.
// All prices are EUR and exclude 21% VAT. Edit prices HERE; pricing.html and the calculator render from this
// module, and BILLING_RULES is what Phase 3 (real billing) reads.

/**
 * @typedef {Object} Plan
 * @property {'start'|'groei'|'pro'|'maatwerk'} id
 * @property {number} monthly              price per month, EUR excl. VAT ("from" price for maatwerk)
 * @property {number|null} annual          price per year (10 x monthly); null = no annual billing (maatwerk)
 * @property {number} includedMinutes      minutes per month ("from" for maatwerk)
 * @property {number} approxCalls          included minutes / AVG_CALL_MINUTES, rounded
 * @property {number} extraMinuteRate      EUR per extra minute ("from" for maatwerk)
 * @property {number} phoneNumbers         included phone numbers ("5+" for maatwerk)
 * @property {number|null} concurrentCalls simultaneous calls; null = custom (maatwerk)
 * @property {number} setupFee             optional setup service, EUR; 0 = included (maatwerk)
 * @property {boolean} setupIncluded       setup is part of the plan (maatwerk)
 * @property {boolean} highlighted         marked "most chosen"
 * @property {boolean} custom              custom contract: quote instead of signup
 * @property {boolean} fromPricing         price, minutes, extra-minute rate and numbers are "from" values
 */

/** Average call length used for the "approximately N calls" figures (minutes). */
export const AVG_CALL_MINUTES = 2.5;
export const VAT_RATE = 0.21;

/** @param {number} minutes */
export const approxCalls = (minutes) => Math.round(minutes / AVG_CALL_MINUTES);

/** @param {number} monthly annual = 10 x monthly ("2 months free") */
const annualOf = (monthly) => monthly * 10;

/** @type {readonly Plan[]} */
export const PLANS = Object.freeze([
  {
    id: 'start', monthly: 49, annual: annualOf(49), includedMinutes: 150, approxCalls: approxCalls(150),
    extraMinuteRate: 0.4, phoneNumbers: 1, concurrentCalls: 1, setupFee: 149, setupIncluded: false,
    highlighted: false, custom: false, fromPricing: false
  },
  {
    id: 'groei', monthly: 129, annual: annualOf(129), includedMinutes: 400, approxCalls: approxCalls(400),
    extraMinuteRate: 0.35, phoneNumbers: 1, concurrentCalls: 2, setupFee: 149, setupIncluded: false,
    highlighted: true, custom: false, fromPricing: false
  },
  {
    id: 'pro', monthly: 299, annual: annualOf(299), includedMinutes: 1000, approxCalls: approxCalls(1000),
    extraMinuteRate: 0.25, phoneNumbers: 3, concurrentCalls: 5, setupFee: 349, setupIncluded: false,
    highlighted: false, custom: false, fromPricing: false
  },
  {
    id: 'maatwerk', monthly: 799, annual: null, includedMinutes: 3000, approxCalls: approxCalls(3000),
    extraMinuteRate: 0.2, phoneNumbers: 5, concurrentCalls: null, setupFee: 0, setupIncluded: true,
    highlighted: false, custom: true, fromPricing: true
  }
]);

/**
 * Feature keys NEW at each plan. A plan also has everything of the plan below it
 * (see featuresFor); each higher plan lists only what it adds.
 */
export const PLAN_FEATURES = Object.freeze({
  start: ['answers', 'messages', 'knowledge', 'forward', 'preset', 'emailSummary'],
  groei: ['calendar', 'sms', 'languages'],
  pro: ['multiAgent', 'recordings', 'webhooks', 'prioritySupport'],
  maatwerk: ['sla', 'dpa', 'contact', 'integrations']
});

/** Order in which plans build on each other. */
export const PLAN_ORDER = Object.freeze(['start', 'groei', 'pro', 'maatwerk']);

/**
 * Features of one plan: what it adds, and the plan it builds on.
 * @param {string} planId
 * @returns {{ builtOn: string|null, own: readonly string[] }}
 */
export function featuresFor(planId) {
  const i = PLAN_ORDER.indexOf(planId);
  return { builtOn: i > 0 ? PLAN_ORDER[i - 1] : null, own: PLAN_FEATURES[planId] ?? [] };
}

/** Extras that apply to every plan. */
export const ADDONS = Object.freeze({
  extraPhoneNumberMonthly: 10,
  unlimitedUsers: true,
  setupFreeWithAnnual: true
});

/**
 * Billing rules. Shown in the pricing FAQ and read by Phase 3 (billing). Time is in seconds/days,
 * percentages are of the included minutes.
 */
export const BILLING_RULES = Object.freeze({
  currency: 'EUR',
  vatRate: VAT_RATE,
  annualMonthsBilled: 10, // annual = 10 x monthly
  billedPerSecond: true,
  freeCallUnderSeconds: 10,
  failedCallsFree: true,
  extraMinutesCharged: 'end-of-month',
  usageAlertPercents: Object.freeze([80, 100]), // email to the owner
  // Each customer chooses what happens at the limit.
  limitBehaviours: Object.freeze(['stop-at-limit', 'allow-extra-up-to-cap']),
  stopAtLimitFallbacks: Object.freeze(['forward', 'voicemail']),
  upgrade: Object.freeze({ effective: 'immediately', prorated: true }),
  downgrade: Object.freeze({ effective: 'end-of-period' }),
  cancellation: Object.freeze({ effective: 'end-of-period', interval: 'monthly' }),
  freeSetupAndBrowserTestCalls: true,
  cardRequiredForTesting: false,
  paymentStartsWhen: 'phone-number-live',
  moneyBackDays: 14,
  paymentMethods: Object.freeze(['direct-debit', 'card'])
});

/** Calculator defaults, limits, and what a human answering service costs per call. */
export const CALCULATOR = Object.freeze({
  callsPerDay: Object.freeze({ min: 0, max: 60, default: 10 }),
  sharePresets: Object.freeze([
    Object.freeze({ id: 'missed', percent: 30 }),
    Object.freeze({ id: 'half', percent: 50 }),
    Object.freeze({ id: 'all', percent: 100 })
  ]),
  share: Object.freeze({ min: 10, max: 100, step: 5, default: 30 }),
  callMinutes: Object.freeze({ min: 1, max: 6, step: 0.5, default: AVG_CALL_MINUTES }),
  daysOpen: Object.freeze([22, 26, 30]),
  daysOpenDefault: 22,
  humanCostPerCall: Object.freeze({ min: 1.5, max: 2.5 })
});

/** Where the CTAs go. */
export const ROUTES = Object.freeze({
  signup: 'https://app.adamagents.nl/signup',
  contact: 'contact.html'
});

// ── helpers (unit-tested) ───────────────────────────────────────────────

/** @param {string} id */
export const planById = (id) => PLANS.find((p) => p.id === id);

/** Effective price per included minute = monthly price / included minutes. */
export function effectivePerMinute(plan) {
  return plan.monthly / plan.includedMinutes;
}

/** True when every plan that is billed online has an annual price (custom plans are quoted). */
export function hasAnnualPricing(plans = PLANS) {
  return plans.filter((p) => !p.custom).every((p) => typeof p.annual === 'number' && p.annual > 0);
}

/** Per-month price for the chosen interval (annual / 12); monthly when the plan has no annual price. */
export function priceFor(plan, interval) {
  return interval === 'annual' && typeof plan.annual === 'number' ? plan.annual / 12 : plan.monthly;
}

/** Yearly total when billed yearly; null without an annual price. */
export function annualTotal(plan) {
  return typeof plan.annual === 'number' ? plan.annual : null;
}

/** Monthly saving when billed yearly; 0 when no annual price. */
export function annualSavingPerMonth(plan) {
  return typeof plan.annual === 'number' ? Math.max(0, plan.monthly - plan.annual / 12) : 0;
}

/** Months free when billed yearly (12 minus months billed), 0 without an annual price. */
export function monthsFreeAnnual(plan) {
  return typeof plan.annual === 'number' ? 12 - plan.annual / plan.monthly : 0;
}

/** Setup service price for the interval: free with annual billing, included for custom plans. */
export function setupPriceFor(plan, interval) {
  if (plan.setupIncluded) return 0;
  if (interval === 'annual' && ADDONS.setupFreeWithAnnual) return 0;
  return plan.setupFee;
}

const INTL_LOCALES = { nl: 'nl-NL', en: 'en-IE', de: 'de-DE' };

/**
 * One money formatter for the whole page. Whole euros without decimals (€49), amounts with cents
 * (€0.40, €181.50) with two.
 */
export function formatMoney(amount, { lang = 'nl', decimals } = {}) {
  const fd = decimals === undefined ? (Number.isInteger(amount) ? 0 : 2) : decimals;
  return new Intl.NumberFormat(INTL_LOCALES[lang] || INTL_LOCALES.nl, {
    style: 'currency',
    currency: BILLING_RULES.currency,
    minimumFractionDigits: fd,
    maximumFractionDigits: fd
  }).format(amount);
}

/** Integer with locale grouping (2,000 / 2.000). */
export function formatInt(n, lang = 'nl') {
  return new Intl.NumberFormat(INTL_LOCALES[lang] || INTL_LOCALES.nl).format(n);
}

/**
 * CTA link. Online plans go to the app signup (plan and billing params); custom plans to the contact form.
 * @param {string} planId
 * @param {'monthly'|'annual'} interval
 */
export function ctaHref(planId, interval = 'monthly') {
  const plan = planById(planId);
  if (!plan || plan.custom) return `${ROUTES.contact}?plan=${encodeURIComponent(planId)}`;
  const billing = interval === 'annual' ? '&billing=annual' : '';
  return `${ROUTES.signup}?plan=${encodeURIComponent(planId)}${billing}`;
}
