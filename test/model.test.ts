import { describe, expect, it } from "vitest";

import { CD, configurationDelta, MA, MD, MENU_OPTIONS, PA, PD, Stats } from "../src/constants";
import { enemyChance, enemyMedian } from "../src/enemy";
import { needleInterval, Tracker } from "../src/tracker";

const delta = (option: { kind: string; delta?: Stats }) => option.delta as Stats;

describe("configurationDelta", () => {
  it("moves military and psychological when switching Barbershop to Barbarian Barbecue", () => {
    const before = configurationDelta({ barb: 3, bridge: 2, holes: 3, moat: 3 });
    const after = configurationDelta({ barb: 1, bridge: 2, holes: 3, moat: 3 });
    expect(after.map((v, i) => v - before[i])).toEqual([20, 20, 0, 0, -20, -20]);
  });

  it("cycles the murder holes back to where they started", () => {
    const base = { barb: 1, bridge: 1, moat: 1 } as const;
    const cannon = configurationDelta({ ...base, holes: 1 });
    const catapult = configurationDelta({ ...base, holes: 2 });
    // Cannon to catapult trades military attack for castle
    expect(catapult.map((v, i) => v - cannon[i])).toEqual([-10, 0, 10, 10, 0, -10]);
  });
});

describe("needleInterval", () => {
  // Readings from KoLmafia session logs with known stats
  it.each([
    [MA, 100, 124],
    [MA, 110, 126],
    [PA, 115, 126],
    [PA, 135, 129],
    [MD, 90, 240],
    [MD, 105, 242],
    [PD, 130, 245],
    [PD, 150, 248],
  ])("puts stat %i at %i on pixel %i", (stat, value, pixel) => {
    const [lo, hi] = needleInterval(stat, pixel);
    expect(value).toBeGreaterThanOrEqual(lo);
    expect(value).toBeLessThan(hi);
  });
});

describe("Tracker", () => {
  it("narrows stats as needles are observed across known shifts", () => {
    const tracker = Tracker.unknown();
    tracker.observe(new Map([[MA, 124]]));
    expect(tracker.lo[MA]).toBe(95);
    expect(tracker.hi[MA]).toBe(102.5);
    // +5 MA keeps us on the same pixel, so MA was below 97.5
    tracker.shift(delta(MENU_OPTIONS.offense[1]));
    tracker.observe(new Map([[MA, 124]]));
    expect(tracker.lo[MA]).toBe(100);
    expect(tracker.hi[MA]).toBe(102.5);
  });

  it("reports exact stats exactly", () => {
    const stats: Stats = [100, 90, 110, 100, 110, 110];
    expect(Tracker.exactly(stats).estimate()).toEqual(stats);
  });

  it("starts over if the needles contradict everything", () => {
    const tracker = Tracker.exactly([100, 100, 100, 100, 100, 100]);
    expect(tracker.observe(new Map([[PD, 300]]))).toBe(false);
    expect(tracker.lo[PD]).toBe(needleInterval(PD, 300)[0]);
    // The other stats go back to unknown rather than keeping stale values
    expect(tracker.hi[MA] - tracker.lo[MA]).toBeGreaterThan(100);
  });
});

describe("enemy stats", () => {
  it("are exact in the first battle", () => {
    // Barracks start with 120 military attack
    expect(enemyChance("barracks", MA, 1, 120, false)).toBe(0);
    expect(enemyChance("barracks", MA, 1, 120, true)).toBe(1);
    expect(enemyMedian("barracks", MA, 1)).toBe(120);
  });

  it("grow 5-25% a round, rounding down", () => {
    expect(enemyChance("barracks", MA, 2, 126, false)).toBe(0);
    expect(enemyChance("barracks", MA, 2, 126, true)).toBeCloseTo(1 / 21);
    expect(enemyChance("barracks", MA, 2, 150, true)).toBeCloseTo(1);
    expect(enemyMedian("barracks", MA, 2)).toBe(138);
  });

  it("has a sensible spread after four rounds", () => {
    const median = enemyMedian("shieldmaster", CD, 5);
    expect(median).toBeGreaterThan(130 * 1.15 ** 4 * 0.97);
    expect(median).toBeLessThan(130 * 1.15 ** 4 * 1.03);
  });
});
