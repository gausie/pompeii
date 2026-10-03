import { describe, expect, it } from "vitest";

import { Stats } from "../src/constants";
import {
  applyOption,
  bestStance,
  Context,
  evaluateButtons,
  evaluateConfigurations,
  evaluateMenus,
  newGame,
  stanceWinChances,
} from "../src/strategy";

import { lockInThreshold, scoreDistribution } from "./analysis";

const ctx: Context = { boosts: [0, 0, 0] };
const typical: Stats = [110, 110, 110, 110, 110, 110];

describe("battles", () => {
  it("charges when strong on attack and weak on defense", () => {
    const { stance } = bestStance(ctx, [200, 20, 200, 20, 200, 20], "masterofnone", 1);
    expect(stance.option).toBe(1);
  });

  it("waits when strong on defense and weak on attack", () => {
    const { stance } = bestStance(ctx, [20, 200, 20, 200, 20, 200], "masterofnone", 1);
    expect(stance.option).toBe(3);
  });

  it("bides when balanced, because of the +10", () => {
    const { stance } = bestStance(ctx, typical, "masterofnone", 2);
    expect(stance.option).toBe(2);
  });

  it("counts boosts", () => {
    const boosted = { ...ctx, boosts: [3, 3, 3] as [number, number, number] };
    expect(stanceWinChances(boosted, typical, "barracks", 3)[1]).toBeGreaterThan(
      stanceWinChances(ctx, typical, "barracks", 3)[1],
    );
  });
});

describe("prep", () => {
  it("removes taken options from the pool and advances the turn", () => {
    const state = applyOption(newGame(typical), "cheese", 3);
    expect(state.cheese).toBe(100);
    expect(state.turn).toBe(2);
    expect(state.pools.cheese).not.toContain(3);
  });

  it("only pays out the wishing well when we can afford the coin", () => {
    expect(applyOption(newGame(typical), "cheese", 16).cheese).toBe(0);
  });

  it("evaluates menus deterministically", () => {
    const state = newGame(typical, "barracks");
    const a = evaluateMenus(ctx, state, 16);
    const b = evaluateMenus(ctx, state, 16);
    expect(a).toEqual(b);
    expect(a).toHaveLength(3);
  });

  it("prefers the big fixed cheese to the small one", () => {
    const state = newGame(typical, "barracks");
    const [best] = evaluateButtons(ctx, state, "cheese", [1, 3], 16);
    expect(best.choice).toBe(1);
  });
});

describe("configuration", () => {
  it("returns a ranked shortlist", () => {
    const ranked = evaluateConfigurations(ctx, () => true, 8);
    expect(ranked).toHaveLength(6);
    expect(ranked[0].value).toBeGreaterThanOrEqual(ranked[5].value);
  });
});

describe("performance", () => {
  it("evaluates a menu decision quickly enough for Rhino", () => {
    const start = Date.now();
    evaluateMenus(ctx, newGame(typical, "barracks"), 64);
    const elapsed = Date.now() - start;
    console.log(`64-sample menu evaluation from turn 1: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(5000);
  });
});

describe("lockInThreshold", () => {
  it("locks in on the last game regardless", () => {
    expect(lockInThreshold([100, 200], 0)).toBe(-Infinity);
  });

  it("demands more with more games left", () => {
    const history = [100, 200, 300, 400, 500];
    expect(lockInThreshold(history, 1)).toBe(300);
    // E[max(X, 300)] = (300 + 300 + 300 + 400 + 500) / 5
    expect(lockInThreshold(history, 2)).toBe(360);
  });
});

describe("scoreDistribution", () => {
  it("samples plausible whole-game scores", () => {
    const scores = scoreDistribution(ctx, typical, 200);
    expect(Math.min(...scores)).toBeGreaterThanOrEqual(0);
    expect(new Set(scores).size).toBeGreaterThan(20);
  });
});
