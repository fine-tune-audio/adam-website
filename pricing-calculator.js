// pricing-calculator.js
// Pure calculator logic for the pricing page (no DOM, unit-tested). Every number comes from pricing-config.js.
//
//   calls answered = calls per day x days open x share answered by ADAM
//   minutes        = calls answered x average call length
//   plan monthly   = base (annual / 12 when billed yearly) + max(0, minutes - included) x extra-minute price

import { PLANS, CALCULATOR, priceFor } from './pricing-config.js';

/** Round to whole cents; removes float noise such as 6.000000000000012. */
export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * @param {{ callsPerDay: number, days: number, sharePercent: number, callMinutes: number }} input
 * @returns {{ calls: number, minutes: number }}
 */
export function usageFor({ callsPerDay, days, sharePercent, callMinutes }) {
  const calls = callsPerDay * days * (sharePercent / 100);
  return { calls, minutes: calls * callMinutes };
}

/**
 * Monthly cost of one plan at a given number of minutes.
 * @returns {{ base: number, extraMinutes: number, extraCost: number, total: number }}
 */
export function planCost(plan, minutes, interval = 'monthly') {
  const base = priceFor(plan, interval);
  const extraMinutes = Math.max(0, minutes - plan.includedMinutes);
  const extraCost = extraMinutes * plan.extraMinuteRate;
  return {
    base: round2(base),
    extraMinutes: Math.round(extraMinutes * 100) / 100,
    extraCost: round2(extraCost),
    total: round2(base + extraCost)
  };
}

/** Cost of every plan, in plan order. */
export function compareAll(minutes, interval = 'monthly', plans = PLANS) {
  return plans.map((plan) => ({ plan, ...planCost(plan, minutes, interval) }));
}

/** The cheapest plan; ties go to the lower plan. */
export function recommend(minutes, interval = 'monthly', plans = PLANS) {
  const all = compareAll(minutes, interval, plans);
  return all.reduce((best, cur) => (cur.total < best.total ? cur : best), all[0]);
}

/**
 * The page's calculator: calls per day in, recommended plan out, using the fixed assumptions from the config.
 * @param {number} callsPerDay
 * @returns {{ usage: { calls: number, minutes: number }, best: object }}
 */
export function recommendForCallsPerDay(callsPerDay, interval = 'monthly', plans = PLANS) {
  const { days, callMinutes, sharePercent } = CALCULATOR.assumptions;
  const usage = usageFor({ callsPerDay, days, sharePercent, callMinutes });
  return { usage, best: recommend(usage.minutes, interval, plans) };
}
