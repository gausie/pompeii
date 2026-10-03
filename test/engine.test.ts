import { describe, expect, it } from "vitest";

import { Stats } from "../src/constants";
import { Engine, Options } from "../src/engine";
import { Observation } from "../src/observation";

import { Simulator, SimulatorSettings } from "./simulator";

const options: Options = { rewards: { barb: 2 }, games: 5, samples: 4, lockIn: true };

// Notes what the engine believes about its stats after every request, to
// check against the simulator's audit once the day is over
class Watched extends Simulator {
  engine: Engine | null = null;
  beliefs = new Map<number, { lo: Stats; hi: Stats }>();
  requests = 0;

  choose(choice: number, option: number): Observation {
    const result = super.choose(choice, option);
    if (this.engine?.progress && result.needles.size > 0) {
      const { tracker } = this.engine;
      tracker.observe(result.needles);
      this.beliefs.set(this.requests, { lo: [...tracker.lo], hi: [...tracker.hi] } as {
        lo: Stats;
        hi: Stats;
      });
    }
    this.requests += 1;
    return result;
  }

  misses(): number {
    const audit = this.audit();
    return [...this.beliefs].filter(([i, belief]) => {
      const truth = audit[i].strength as Stats;
      return !truth.every((v, j) => belief.lo[j] <= v && v < belief.hi[j]);
    }).length;
  }
}

function play(settings: Partial<SimulatorSettings> = {}, overrides: Partial<Options> = {}) {
  const simulator = new Watched(settings);
  const engine = new Engine(simulator, { ...options, ...overrides });
  simulator.engine = engine;
  engine.run();
  return { simulator, engine };
}

describe("engine against the simulator", () => {
  it("stops once it has locked in a score", () => {
    const { simulator } = play();
    expect(simulator.lockedScore).toBe(simulator.finalScores[simulator.finalScores.length - 1]);
    expect(simulator.inGame).toBe(false);
  });

  it("plays out every game of the day when not locking in", () => {
    const simulator = new Simulator();
    new Engine(simulator, { ...options, lockIn: false }).run();
    expect(simulator.finalScores).toHaveLength(5);
    expect(simulator.playsLeft()).toBe(0);
    expect(simulator.lockedScore).toBeNull();
    expect(simulator.inGame).toBe(false);
  });

  it("locks in the last game if nothing earlier was good enough", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { simulator } = play({ seed });
      if (simulator.finalScores.length === 5) {
        expect(simulator.lockedScore).toBe(simulator.finalScores[4]);
        return;
      }
    }
  });

  it("stops after the requested number of games without reopening the rig", () => {
    const simulator = new Simulator();
    let opens = 0;
    const open = simulator.open.bind(simulator);
    simulator.open = () => {
      opens += 1;
      return open();
    };
    new Engine(simulator, { ...options, games: 1 }).run();
    expect(simulator.finalScores).toHaveLength(1);
    expect(opens).toBe(1);
    expect(simulator.inGame).toBe(false);
  });

  it("gambles on the wishing well when a later game could still be locked in", () => {
    let offered = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const { simulator } = play({ seed, boosts: [3, 3, 3] });
      let gamesAfter = false;
      let cheese = 0;
      simulator.messages.forEach((message, i) => {
        if (message.startsWith("Configuration")) gamesAfter = false;
        if (message.includes("so locking in at")) gamesAfter = true;
        const turn = message.match(/^Turn \d+ vs \S+ \((\d+) cheese\)/);
        if (turn) cheese = Number(turn[1]);
        if (!gamesAfter || cheese < 10 || !message.includes("Use the wishing well ")) return;
        offered++;
        expect(simulator.messages[i + 1]).toBe("  -> Use the wishing well");
      });
    }
    expect(offered).toBeGreaterThan(0);
  });

  it("collects the rewards it was asked for", () => {
    const { simulator } = play();
    expect(simulator.rewardsPending()).toBe(false);
  });

  it("locks in exactly one score", () => {
    const { simulator } = play();
    expect(simulator.lockedScore).not.toBeNull();
    expect(simulator.finalScores).toContain(simulator.lockedScore);
  });

  it("keeps the true stats inside its tracked intervals", () => {
    // Play all five games rather than stopping at a lock-in
    const { simulator } = play({}, { lockIn: false });
    expect(simulator.beliefs.size).toBeGreaterThan(20);
    expect(simulator.misses()).toBe(0);
  });

  it("can't peek at the truth mid-game", () => {
    const simulator = new Simulator();
    simulator.open();
    expect(() => simulator.audit()).toThrow();
    expect(Object.keys(simulator)).not.toContain("match");
  });

  it("never has to fall back on the needles", () => {
    const { simulator } = play();
    expect(simulator.messages.some((m) => m.includes("Needles disagreed"))).toBe(false);
  });
});
