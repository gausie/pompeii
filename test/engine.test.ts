import { describe, expect, it } from "vitest";

import { MENU_CHOICE, WELL_COST } from "../src/constants";
import { Engine, Options } from "../src/engine";
import { Observation } from "../src/observation";

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
    expect(simulator.lockedScore).not.toBeNull();
    expect(simulator.finalScores).toContain(simulator.lockedScore);
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
