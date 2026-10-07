// pricing-calculator.js
// Pure calculator logic for the pricing page (no DOM, unit-tested). Every number comes from pricing-config.js.
//
//   calls answered = calls per day x days open x share answered by ADAM
//   minutes        = calls answered x average call length
//   plan monthly   = base (annual / 12 when billed yearly) + max(0, minutes - included) x extra-minute price

import { PLANS, PLAN_ORDER, CALCULATOR, priceFor } from './pricing-config.js';

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

/** The cheapest plan; ties go to the lower plan. The custom plan is an estimate ("from" values). */
export function recommend(minutes, interval = 'monthly', plans = PLANS) {
  const all = compareAll(minutes, interval, plans);
  return all.reduce((best, cur) => (cur.total < best.total ? cur : best), all[0]);
}

/** Price per answered call; null when no calls. */
export function pricePerCall(total, calls) {
  return calls > 0 ? round2(total / calls) : null;
}

/** What a human answering service would cost for the same calls. */
export function humanServiceCost(calls) {
  const { min, max } = CALCULATOR.humanCostPerCall;
  return { min: round2(calls * min), max: round2(calls * max) };
}

/**
 * Smallest number of minutes at which plan `to` becomes cheaper than plan `from`, or null if it never does.
 * Both costs are piecewise linear in minutes, so each segment is solved exactly.
 */
export function crossoverMinutes(from, to, interval = 'monthly') {
  const cost = (p, m) => priceFor(p, interval) + Math.max(0, m - p.includedMinutes) * p.extraMinuteRate;
  const f = (m) => cost(from, m) - cost(to, m);
  const slopeAt = (m) => (m > from.includedMinutes ? from.extraMinuteRate : 0) - (m > to.includedMinutes ? to.extraMinuteRate : 0);
  const points = [...new Set([0, from.includedMinutes, to.includedMinutes])].sort((a, b) => a - b);
  for (let i = 0; i < points.length; i += 1) {
    const x0 = points[i];
    const x1 = i + 1 < points.length ? points[i + 1] : Infinity;
    const f0 = f(x0);
    if (f0 > 0) return x0;
    const slope = slopeAt(Number.isFinite(x1) ? (x0 + x1) / 2 : x0 + 1);
    if (slope > 0) {
      const root = x0 + -f0 / slope;
      if (root <= x1) return root;
    }
  }
  return null;
}

/**
 * The next plan up and from how many calls a day it becomes cheaper (at the same share, call length and days).
 * @returns {{ plan: object, minutes: number, callsPerDay: number } | null}
 */
export function nextPlanUp(currentId, { days, sharePercent, callMinutes }, interval = 'monthly', plans = PLANS) {
  const i = PLAN_ORDER.indexOf(currentId);
  const from = plans.find((p) => p.id === currentId);
  const to = plans.find((p) => p.id === PLAN_ORDER[i + 1]);
  if (!from || !to) return null;
  const minutes = crossoverMinutes(from, to, interval);
  const callsPerMinuteFactor = callMinutes * days * (sharePercent / 100);
  if (minutes === null || callsPerMinuteFactor <= 0) return null;
  return { plan: to, minutes, callsPerDay: minutes / callsPerMinuteFactor };
}

/** Everything the page shows for one set of inputs. */
export function calculate(input, interval = 'monthly', plans = PLANS) {
  const usage = usageFor(input);
  const all = compareAll(usage.minutes, interval, plans);
  const best = recommend(usage.minutes, interval, plans);
  return {
    usage,
    all,
    best,
    perCall: pricePerCall(best.total, usage.calls),
    human: humanServiceCost(usage.calls),
    next: nextPlanUp(best.plan.id, input, interval, plans)
  };
}
