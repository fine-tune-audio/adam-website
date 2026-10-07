// pricing-config.js
// Single source of truth for ADAM's public pricing. Ships to the browser, so it holds public values only.
// All prices are EUR and exclude 21% VAT. Edit prices HERE; pricing.html and the calculator render from this
// module, and BILLING_RULES is what Phase 3 (real billing) reads.

/**
 * @typedef {Object} Plan
 * @property {'start'|'groei'|'pro'} id
 * @property {number} monthly              price per month, EUR excl. VAT
 * @property {number} annual               price per year (10 x monthly)
 * @property {number} includedMinutes      minutes per month
 * @property {number} approxCalls          included minutes / AVG_CALL_MINUTES, rounded
 * @property {number} extraMinuteRate      EUR per extra minute
 * @property {number} phoneNumbers         included phone numbers
 * @property {number} concurrentCalls      simultaneous calls
 * @property {number} setupFee             optional setup service, EUR (free with annual billing)
 * @property {boolean} highlighted         marked "most chosen"
 */

/** Average call length used for the "approximately N calls" figures (minutes). */
export const AVG_CALL_MINUTES = 2.5;
export const VAT_RATE = 0.21;

/** @param {number} minutes */
export const approxCalls = (minutes) => Math.round(minutes / AVG_CALL_MINUTES);

/** @param {number} monthly annual = 10 x monthly */
const annualOf = (monthly) => monthly * 10;

/** @type {readonly Plan[]} */
export const PLANS = Object.freeze([
  {
    id: 'start', monthly: 49, annual: annualOf(49), includedMinutes: 150, approxCalls: approxCalls(150),
    extraMinuteRate: 0.4, phoneNumbers: 1, concurrentCalls: 1, setupFee: 149, highlighted: false
  },
  {
    id: 'groei', monthly: 129, annual: annualOf(129), includedMinutes: 400, approxCalls: approxCalls(400),
    extraMinuteRate: 0.35, phoneNumbers: 1, concurrentCalls: 2, setupFee: 149, highlighted: true
  },
  {
    id: 'pro', monthly: 299, annual: annualOf(299), includedMinutes: 1000, approxCalls: approxCalls(1000),
    extraMinuteRate: 0.25, phoneNumbers: 3, concurrentCalls: 5, setupFee: 349, highlighted: false
  }
]);

/**
 * Feature keys NEW at each plan. A plan also has everything of the plan below it
 * (see featuresFor); each higher plan lists only what it adds.
 */
export const PLAN_FEATURES = Object.freeze({
  start: ['answers', 'messages', 'knowledge', 'forward', 'preset', 'emailSummary'],
  groei: ['calendar', 'languages'],
  pro: ['multiAgent', 'recordings', 'webhooks', 'prioritySupport']
});

/**
 * Features that stay on the plan cards but are not shown as rows in the comparison table.
 * Remove a key from this list to show its row again.
 */
export const COMPARISON_HIDDEN_FEATURES = Object.freeze(['webhooks']);

/** Order in which plans build on each other. */
export const PLAN_ORDER = Object.freeze(['start', 'groei', 'pro']);

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
 * Billing rules, read by Phase 3 (billing); not shown on the pricing page. Time is in seconds/days,
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

/**
 * Calculator: one question (calls per day). Everything else is a fixed assumption, shown under the result.
 * The assumptions err on the high side: ADAM answers every call.
 */
export const CALCULATOR = Object.freeze({
  callsPerDay: Object.freeze({ min: 0, max: 60, default: 10 }),
  assumptions: Object.freeze({ days: 22, callMinutes: AVG_CALL_MINUTES, sharePercent: 100 })
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

/** True when every plan has an annual price (the yearly toggle only shows then). */
export function hasAnnualPricing(plans = PLANS) {
  return plans.every((p) => typeof p.annual === 'number' && p.annual > 0);
}

/** Per-month price for the chosen interval (annual / 12). */
export function priceFor(plan, interval) {
  return interval === 'annual' ? plan.annual / 12 : plan.monthly;
}

/**
 * The per-month price as shown to customers. Yearly billing is rounded to whole euros
 * (490 / 12 = 40.83 shows as 41); the exact figure stays in priceFor, which the calculator uses.
 */
export function displayPriceFor(plan, interval) {
  return interval === 'annual' ? Math.round(plan.annual / 12) : plan.monthly;
}

/** Yearly total when billed yearly. */
export function annualTotal(plan) {
  return plan.annual;
}

/** Setup service price for the interval: free with annual billing. */
export function setupPriceFor(plan, interval) {
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
 * CTA link to the app signup (plan and billing params).
 * @param {string} planId
 * @param {'monthly'|'annual'} interval
 */
export function ctaHref(planId, interval = 'monthly') {
  const billing = interval === 'annual' ? '&billing=annual' : '';
  return `${ROUTES.signup}?plan=${encodeURIComponent(planId)}${billing}`;
}
