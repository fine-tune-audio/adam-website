import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANS, CALCULATOR, planById } from '../pricing-config.js';
import {
  usageFor, planCost, compareAll, recommend, pricePerCall, humanServiceCost,
  crossoverMinutes, nextPlanUp, calculate, round2
} from '../pricing-calculator.js';

const base = { days: 22, callMinutes: 2.5 };
const run = (callsPerDay, sharePercent, interval = 'monthly') =>
  calculate({ ...base, callsPerDay, sharePercent }, interval);

// The four scenarios from the proposal (monthly billing, 2.5-minute calls, 22 days).
test('10 calls a day, missed calls (30%): Start, €55.00', () => {
  const r = run(10, 30);
  assert.equal(r.best.plan.id, 'start');
  assert.equal(r.best.total, 55);
  assert.equal(r.best.base, 49);
  assert.equal(r.best.extraCost, 6);
  assert.equal(Math.round(r.usage.minutes), 165);
});

test('10 calls a day, every call: Groei, €181.50', () => {
  const r = run(10, 100);
  assert.equal(r.best.plan.id, 'groei');
  assert.equal(r.best.total, 181.5);
});

test('20 calls a day, every call: Pro, €324.00', () => {
  const r = run(20, 100);
  assert.equal(r.best.plan.id, 'pro');
  assert.equal(r.best.total, 324);
});

test('5 calls a day, every call: Start, €99.00', () => {
  const r = run(5, 100);
  assert.equal(r.best.plan.id, 'start');
  assert.equal(r.best.total, 99);
});

test('usage: calls = per day x days x share, minutes = calls x length', () => {
  const u = usageFor({ callsPerDay: 20, days: 26, sharePercent: 50, callMinutes: 3 });
  assert.equal(u.calls, 260);
  assert.equal(u.minutes, 780);
  assert.deepEqual(usageFor({ callsPerDay: 0, days: 22, sharePercent: 100, callMinutes: 2.5 }), { calls: 0, minutes: 0 });
});

test('plan cost: base plus extra minutes only above the included minutes', () => {
  const start = planById('start');
  assert.deepEqual(planCost(start, 100), { base: 49, extraMinutes: 0, extraCost: 0, total: 49 });
  assert.deepEqual(planCost(start, 150), { base: 49, extraMinutes: 0, extraCost: 0, total: 49 });
  assert.deepEqual(planCost(start, 200), { base: 49, extraMinutes: 50, extraCost: 20, total: 69 });
});

test('annual billing uses annual / 12 as the base', () => {
  const groei = planCost(planById('groei'), 400, 'annual');
  assert.equal(groei.base, 107.5); // 1290 / 12
  assert.equal(groei.total, 107.5);
  // maatwerk has no annual price: its base stays the monthly "from" price
  assert.equal(planCost(planById('maatwerk'), 0, 'annual').base, 799);
});

test('zero usage recommends the cheapest plan and has no per-call price', () => {
  const r = run(0, 30);
  assert.equal(r.best.plan.id, 'start');
  assert.equal(r.best.total, 49);
  assert.equal(r.perCall, null);
  assert.deepEqual(r.human, { min: 0, max: 0 });
});

test('very high usage recommends the custom plan (an estimate from the "from" values)', () => {
  const r = run(60, 100); // 60 x 22 x 2.5 = 3300 minutes
  assert.equal(r.best.plan.id, 'maatwerk');
  assert.equal(r.next, null);
});

test('a tie goes to the lower plan', () => {
  // Pro and maatwerk both cost 799 at exactly 3000 minutes
  assert.equal(recommend(3000).plan.id, 'pro');
});

test('price per answered call and the human answering service for the same calls', () => {
  const r = run(10, 100); // 220 calls, €181.50
  assert.equal(r.usage.calls, 220);
  assert.equal(r.perCall, round2(181.5 / 220));
  assert.deepEqual(r.human, { min: 330, max: 550 });
  assert.equal(humanServiceCost(100).min, CALCULATOR.humanCostPerCall.min * 100);
  assert.equal(pricePerCall(55, 0), null);
});

test('compareAll lists every plan in order at this usage (for the bar chart)', () => {
  const rows = compareAll(550);
  assert.deepEqual(rows.map((r) => r.plan.id), ['start', 'groei', 'pro', 'maatwerk']);
  assert.deepEqual(rows.map((r) => r.total), [209, 181.5, 299, 799]);
});

test('crossover: from which usage the next plan up becomes cheaper', () => {
  assert.equal(crossoverMinutes(planById('start'), planById('groei')), 350);
  assert.ok(Math.abs(crossoverMinutes(planById('groei'), planById('pro')) - (400 + 170 / 0.35)) < 1e-9);
  assert.equal(crossoverMinutes(planById('pro'), planById('maatwerk')), 3000);
  // at the crossover both cost the same, just beyond it the next plan is cheaper
  const [start, groei] = [planById('start'), planById('groei')];
  assert.equal(planCost(start, 350).total, planCost(groei, 350).total);
  assert.ok(planCost(groei, 351).total < planCost(start, 351).total);
});

test('next plan up in calls a day', () => {
  // Start -> Groei at 350 minutes: 350 / 2.5 min / (22 days x 30%) = 21.2 calls a day
  const n = nextPlanUp('start', { ...base, sharePercent: 30 });
  assert.equal(n.plan.id, 'groei');
  assert.equal(n.minutes, 350);
  assert.equal(Math.round(n.callsPerDay * 10) / 10, 21.2);
  assert.equal(nextPlanUp('maatwerk', { ...base, sharePercent: 30 }), null);
});

test('calculate() bundles everything the page shows', () => {
  const r = run(10, 30);
  assert.deepEqual(Object.keys(r).sort(), ['all', 'best', 'human', 'next', 'perCall', 'usage']);
  assert.equal(r.all.length, PLANS.length);
  assert.equal(r.next.plan.id, 'groei');
});
