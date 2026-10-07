import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANS, CALCULATOR, planById } from '../pricing-config.js';
import { usageFor, planCost, compareAll, recommend, recommendForCallsPerDay, round2 } from '../pricing-calculator.js';

// The core logic keeps full inputs (share, call length, days) so every scenario of the proposal stays testable;
// the page only exposes calls per day and uses the fixed assumptions from the config.
const base = { days: 22, callMinutes: 2.5 };
const run = (callsPerDay, sharePercent, interval = 'monthly') => {
  const usage = usageFor({ ...base, callsPerDay, sharePercent });
  return { usage, best: recommend(usage.minutes, interval) };
};

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
});

test('zero usage recommends the cheapest plan', () => {
  const r = run(0, 30);
  assert.equal(r.best.plan.id, 'start');
  assert.equal(r.best.total, 49);
});

test('very high usage recommends Pro (the largest plan)', () => {
  const r = run(60, 100); // 60 x 22 x 2.5 = 3300 minutes
  assert.equal(r.best.plan.id, 'pro');
  assert.equal(r.best.total, 299 + (3300 - 1000) * 0.25);
});

test('a tie goes to the lower plan', () => {
  // Start and Groei cost the same at exactly 350 minutes
  assert.equal(planCost(planById('start'), 350).total, planCost(planById('groei'), 350).total);
  assert.equal(recommend(350).plan.id, 'start');
  assert.equal(recommend(351).plan.id, 'groei');
});

test('compareAll lists every plan in order', () => {
  const rows = compareAll(550);
  assert.deepEqual(rows.map((r) => r.plan.id), ['start', 'groei', 'pro']);
  assert.deepEqual(rows.map((r) => r.total), [209, 181.5, 299]);
});

test('the page calculator: calls per day in, plan out, with the fixed assumptions', () => {
  const a = CALCULATOR.assumptions;
  assert.equal(a.days, 22);
  assert.equal(a.sharePercent, 100);
  const cases = [
    [0, 'start', 49],
    [5, 'start', 99],
    [10, 'groei', 181.5],
    [20, 'pro', 324]
  ];
  for (const [callsPerDay, id, total] of cases) {
    const r = recommendForCallsPerDay(callsPerDay);
    assert.equal(r.best.plan.id, id, `${callsPerDay} calls a day`);
    assert.equal(r.best.total, total, `${callsPerDay} calls a day`);
  }
  assert.equal(recommendForCallsPerDay(10).usage.calls, 220);
  assert.equal(recommendForCallsPerDay(10).usage.minutes, 550);
});

test('the page calculator honours the billing interval', () => {
  const r = recommendForCallsPerDay(10, 'annual');
  assert.equal(r.best.plan.id, 'groei');
  assert.equal(r.best.total, 107.5 + 150 * 0.35);
  assert.equal(PLANS.length, 3);
  assert.equal(round2(1 / 3), 0.33);
});
