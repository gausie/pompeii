import { describe, expect, it } from "vitest";

import { CD, configurationDelta, MA } from "../src/constants";
import { enemyChance } from "../src/enemy";

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

describe("enemy stats", () => {
  it("are exact in the first battle", () => {
    // Barracks start with 120 military attack
    expect(enemyChance("barracks", MA, 1, 120, false)).toBe(0);
    expect(enemyChance("barracks", MA, 1, 120, true)).toBe(1);
  });

  it("grow 5-25% a round, rounding down", () => {
    expect(enemyChance("barracks", MA, 2, 126, false)).toBe(0);
    expect(enemyChance("barracks", MA, 2, 126, true)).toBeCloseTo(1 / 21);
    expect(enemyChance("barracks", MA, 2, 150, true)).toBeCloseTo(1);
  });

  it("has a sensible spread after four rounds", () => {
    const typical = 130 * 1.15 ** 4;
    expect(enemyChance("shieldmaster", CD, 5, typical * 0.97, true)).toBeLessThan(0.5);
    expect(enemyChance("shieldmaster", CD, 5, typical * 1.03, true)).toBeGreaterThan(0.5);
  });
});
