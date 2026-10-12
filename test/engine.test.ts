import { describe, expect, it } from "vitest";

import { MENU_CHOICE, WELL_COST } from "../src/constants";
import { Engine, Goal, Options } from "../src/engine";
import { HiScores, Observation } from "../src/observation";

import { Simulator, SimulatorSettings } from "./simulator";

const options: Options = { rewards: { barb: 2 }, games: 5, samples: 4, lockIn: true };

function play(settings: Partial<SimulatorSettings> = {}, overrides: Partial<Options> = {}) {
  const simulator = new Simulator(settings);
  const engine = new Engine(simulator, { ...options, ...overrides });
  engine.run();
  return { simulator, engine };
}

describe("engine against the simulator", () => {
  it("stops once it has locked in a score", () => {
    const { simulator } = play();
    expect(simulator.lockedInScore()).toBe(simulator.finalScores[simulator.finalScores.length - 1]);
    expect(simulator.inGame).toBe(false);
  });

  it("plays out every game of the day when not locking in", () => {
    const simulator = new Simulator();
    new Engine(simulator, { ...options, lockIn: false }).run();
    expect(simulator.finalScores).toHaveLength(5);
    expect(simulator.playsLeft()).toBe(0);
    expect(simulator.lockedInScore()).toBe(0);
    expect(simulator.inGame).toBe(false);
  });

  it("locks in the last game if nothing earlier was good enough", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { simulator } = play({ seed });
      if (simulator.finalScores.length === 5) {
        expect(simulator.lockedInScore()).toBe(simulator.finalScores[4]);
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

  it("takes the wishing well whenever it can afford to", () => {
    // Notes every cheese menu the engine is shown and what it picks there
    class Recorder extends Simulator {
      shown: Observation | null = null;
      picks: { cheese: number; well: boolean; picked: boolean }[] = [];
      choose(choice: number, option: number): Observation {
        const well = this.shown?.buttons.find((b) => b.name === "Use the wishing well");
        if (choice === MENU_CHOICE.cheese && this.shown?.game) {
          const picked = well?.option === option;
          this.picks.push({ cheese: this.shown.game.cheese, well: !!well, picked });
        }
        this.shown = super.choose(choice, option);
        return this.shown;
      }
    }
    const picks = [];
    for (let seed = 1; seed <= 10; seed++) {
      const simulator = new Recorder({ seed, boosts: [3, 3, 3] });
      new Engine(simulator, options).run();
      picks.push(...simulator.picks);
    }
    const affordable = picks.filter((p) => p.well && p.cheese >= WELL_COST);
    expect(affordable.length).toBeGreaterThan(0);
    expect(affordable.every((p) => p.picked)).toBe(true);
  });

  it("collects the rewards it was asked for", () => {
    const { simulator } = play();
    expect(simulator.rewardsPending()).toBe(false);
  });

  it("locks in exactly one score", () => {
    const { simulator } = play();
    expect(simulator.lockedInScore()).toBeGreaterThan(0);
    expect(simulator.finalScores).toContain(simulator.lockedInScore());
  });

  describe("aiming for a goal", () => {
    const goal = (g: Partial<Goal>) => ({
      games: Infinity,
      goal: { vouchers: 0, maxPrice: 1000, ...g },
    });
    const board = (today: number[], yesterday: number[] = []): HiScores => {
      const scores = (cheese: number[]) =>
        cheese.map((c, i) => ({ playerId: 100 + i, name: `rival${i}`, cheese: c }));
      return { today: scores(today), yesterday: scores(yesterday) };
    };
    const stoppedAt = (simulator: Simulator, aim: number) => {
      const scores = simulator.finalScores;
      expect(scores[scores.length - 1]).toBeGreaterThanOrEqual(aim);
      expect(scores.slice(0, -1).every((s) => s < aim)).toBe(true);
    };
    const lockedFirstReaching = (simulator: Simulator, aim: number) => {
      stoppedAt(simulator, aim);
      expect(simulator.lockedInScore()).toBe(
        simulator.finalScores[simulator.finalScores.length - 1],
      );
    };

    it("locks in the first score that reaches the minimum", () => {
      const { simulator } = play({}, goal({ min: 800 }));
      lockedFirstReaching(simulator, 800);
    });

    it("stops at the goal without locking in when told not to", () => {
      const { simulator } = play({}, { ...goal({ min: 800 }), lockIn: false });
      stoppedAt(simulator, 800);
      expect(simulator.lockedInScore()).toBe(0);
      expect(simulator.inGame).toBe(false);
    });

    it("locks in nothing if the goal is never reached", () => {
      const { simulator } = play({}, goal({ min: 100000 }));
      expect(simulator.finalScores).toHaveLength(5);
      expect(simulator.lockedInScore()).toBe(0);
      expect(simulator.vouchersUsed()).toBe(0);
      expect(simulator.inGame).toBe(false);
    });

    it("beats the place it's aiming for", () => {
      const { simulator } = play({ hiScores: board([1100, 900, 700]) }, goal({ place: 1 }));
      lockedFirstReaching(simulator, 1101);
    });

    it("aims for the minimum when it's above the place", () => {
      const { simulator } = play({ hiScores: board([600]) }, goal({ place: 1, min: 1000 }));
      lockedFirstReaching(simulator, 1000);
    });

    it("takes any score when there's no one in that place yet", () => {
      const { simulator } = play({ hiScores: board([1500, 1400]) }, goal({ place: 3 }));
      expect(simulator.finalScores).toHaveLength(1);
      expect(simulator.lockedInScore()).toBe(simulator.finalScores[0]);
    });

    it("rereads the board before every game", () => {
      // Someone posts an unbeatable score, then it vanishes from the board
      const boards = [board([100000]), board([500])];
      const simulator = new Simulator();
      simulator.readBoard = () => boards.shift() ?? board([500]);
      new Engine(simulator, { ...options, ...goal({ place: 1 }) }).run();
      expect(simulator.finalScores).toHaveLength(2);
      expect(simulator.lockedInScore()).toBe(simulator.finalScores[1]);
    });

    it("plays nothing if it can't read the board", () => {
      const simulator = new Simulator();
      simulator.readBoard = () => null;
      new Engine(simulator, { ...options, ...goal({ place: 1 }) }).run();
      expect(simulator.finalScores).toHaveLength(0);
      expect(simulator.inGame).toBe(false);
    });

    it("can aim for yesterday's winning score", () => {
      const hiScores = board([600], [1050, 900]);
      const { simulator } = play({ hiScores }, goal({ place: 1, min: "yesterday" }));
      lockedFirstReaching(simulator, 1050);
    });

    it("reads yesterday's winning score only once", () => {
      const simulator = new Simulator({ hiScores: board([], [100000]) });
      let reads = 0;
      const readBoard = simulator.readBoard.bind(simulator);
      simulator.readBoard = () => {
        reads += 1;
        return readBoard();
      };
      new Engine(simulator, { ...options, ...goal({ min: "yesterday" }) }).run();
      expect(simulator.finalScores).toHaveLength(5);
      expect(reads).toBe(1);
    });

    it("plays nothing if there are no final standings for yesterday", () => {
      const { simulator } = play({ hiScores: board([600]) }, goal({ min: "yesterday" }));
      expect(simulator.finalScores).toHaveLength(0);
      expect(simulator.inGame).toBe(false);
    });

    it("finishes a game in progress before reading yesterday's winning score", () => {
      const simulator = new Simulator({ hiScores: board([], [100000]) });
      simulator.open();
      simulator.choose(1313, 5);
      simulator.choose(1314, 3);
      new Engine(simulator, { ...options, ...goal({ min: "yesterday" }) }).run();
      expect(simulator.finalScores).toHaveLength(5);
      expect(simulator.lockedInScore()).toBe(0);
      expect(simulator.inGame).toBe(false);
    });

    it("uses vouchers for more plays, up to the limit", () => {
      const { simulator } = play({}, goal({ min: 100000, vouchers: 2 }));
      expect(simulator.vouchersUsed()).toBe(2);
      expect(simulator.finalScores).toHaveLength(7);
      expect(simulator.lockedInScore()).toBe(0);
      expect(simulator.inGame).toBe(false);
    });

    it("counts vouchers used earlier today toward the limit", () => {
      const simulator = new Simulator();
      new Engine(simulator, { ...options, ...goal({ min: 100000, vouchers: 2 }) }).run();
      new Engine(simulator, { ...options, ...goal({ min: 100000, vouchers: 3 }) }).run();
      expect(simulator.vouchersUsed()).toBe(3);
      expect(simulator.finalScores).toHaveLength(8);
    });

    it("stops at the voucher limit even if the day's count doesn't go up", () => {
      const simulator = new Simulator();
      simulator.vouchersUsed = () => 0;
      // Capped so that if the limit is ignored, this fails rather than hangs
      const capped = { ...options, ...goal({ min: 100000, vouchers: 2 }), games: 50 };
      new Engine(simulator, capped).run();
      expect(simulator.finalScores).toHaveLength(7);
    });

    it("plays a voucher that was used but not played before using another", () => {
      const simulator = new Simulator();
      new Engine(simulator, { ...options, lockIn: false }).run();
      simulator.useVoucher(1000);
      simulator.choose(1313, 8);
      expect(simulator.playsLeft()).toBe(1);
      new Engine(simulator, { ...options, ...goal({ min: 100000, vouchers: 1 }) }).run();
      expect(simulator.vouchersUsed()).toBe(1);
      expect(simulator.finalScores).toHaveLength(6);
    });

    it("stops if a voucher doesn't give any more plays", () => {
      const { simulator } = play({ voucherPlays: 0 }, goal({ min: 100000, vouchers: 3 }));
      expect(simulator.vouchersUsed()).toBe(1);
      expect(simulator.finalScores).toHaveLength(5);
    });

    it("won't pay more than the price limit for a voucher", () => {
      const settings = { voucherPrice: 5000 };
      const { simulator } = play(settings, goal({ min: 100000, vouchers: 3, maxPrice: 1000 }));
      expect(simulator.vouchersUsed()).toBe(0);
      expect(simulator.finalScores).toHaveLength(5);
    });

    it("starts on a voucher if today's plays are already spent", () => {
      const { simulator } = play({ playsPerDay: 0 }, goal({ min: 800, vouchers: 10 }));
      expect(simulator.vouchersUsed()).toBeGreaterThan(0);
      lockedFirstReaching(simulator, 800);
    });

    it("does nothing once a score is locked in today", () => {
      const simulator = new Simulator();
      new Engine(simulator, { ...options, games: 1 }).run();
      const played = simulator.finalScores.length;
      new Engine(simulator, { ...options, ...goal({ min: 100000, vouchers: 3 }) }).run();
      expect(simulator.finalScores).toHaveLength(played);
      expect(simulator.vouchersUsed()).toBe(0);
    });
  });

  it("picks up a game in progress", () => {
    const simulator = new Simulator();
    simulator.open();
    simulator.choose(1313, 5);
    simulator.choose(1314, 3);
    const menu = simulator.choose(1319, 1);
    new Engine(simulator, { ...options, games: 1 }).run();
    expect(menu.game?.pools.cheese).toHaveLength(15);
    expect(simulator.finalScores).toHaveLength(1);
    expect(simulator.inGame).toBe(false);
  });
});
