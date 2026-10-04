import { it } from "vitest";

import {
  BASELINE,
  BUTTONS,
  Configuration,
  MENU_CHOICE,
  MENU_OPTIONS,
  START_OPTION,
  startingStats,
  Stats,
} from "../src/constants";
import { Engine } from "../src/engine";
import { battleNumber, bestStance, Context, optionCheese } from "../src/strategy";

import { lockInThreshold, scoreDistribution } from "./analysis";
import { DEFAULT_SETTINGS, Simulator, SimulatorSettings } from "./simulator";

// Benchmark, not a test: SIMULATE=1 yarn simulate
// What counts is the score locked in each day.
const DAYS = Number(process.env.DAYS ?? 100);
const SAMPLES = Number(process.env.SAMPLES ?? 16);
const GAMES = 5;

const ctx: Context = { boosts: [0, 0, 0] };

// Always look for cheese and take the biggest haul, then pick the stance with
// the best odds. Plays all five games and returns their scores. Cheese
// options don't change stats, so it knows them from the configuration alone.
function greedyDay(settings: Partial<SimulatorSettings>): number[] {
  const sim = new Simulator(settings);
  const ctx: Context = { boosts: sim.boosts() };
  let o = sim.open()!;
  let stats: Stats = BASELINE;
  while (o.choice !== null) {
    if (o.choice === 1313) {
      stats = startingStats(o.config as Configuration);
      const canStart = o.buttons.some((b) => b.option === START_OPTION);
      o = sim.choose(1313, canStart ? START_OPTION : 8);
    } else if (o.choice === 1314) {
      o = sim.choose(1314, 3);
    } else if (o.choice === MENU_CHOICE.cheese) {
      const values = o.buttons.map((b) =>
        optionCheese(MENU_OPTIONS.cheese[BUTTONS.cheese[b.name]], stats, o.cheese),
      );
      o = sim.choose(o.choice, o.buttons[values.indexOf(Math.max(...values))].option);
    } else if (o.choice === 1315) {
      const battle = battleNumber(o.turn);
      o = sim.choose(1315, bestStance(ctx, stats, o.enemy!, battle).stance.option);
    } else if (o.choice === 1316) o = sim.choose(1316, sim.playsLeft() > 0 ? 2 : 3);
  }
  return sim.finalScores;
}

// Lock in the first game that beats what we'd expect from carrying on
function lockedWithThresholds(scores: number[], distribution: number[]): number {
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] >= lockInThreshold(distribution, scores.length - 1 - i)) return scores[i];
  }
  return scores[scores.length - 1];
}

function engineDay(settings: Partial<SimulatorSettings>): number {
  const sim = new Simulator(settings);
  new Engine(sim, {
    rewards: {},
    games: GAMES,
    samples: SAMPLES,
    lockIn: true,
    toBeat: 0,
  }).run();
  return sim.lockedScore ?? 0;
}

const summary = (scores: number[]) => {
  const sorted = [...scores].sort((a, b) => a - b);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const at = (q: number) => sorted[Math.floor(q * (sorted.length - 1))];
  return `mean ${mean.toFixed(0)}, median ${at(0.5)}, p90 ${at(0.9)}, best ${at(1)}`;
};

const WORLDS: Record<string, Partial<SimulatorSettings>> = {
  "no potions": {},
  "one of each potion": { boosts: [1, 1, 1] },
  "three of each potion": { boosts: [3, 3, 3] },
};

it.runIf(process.env.SIMULATE)("benchmarks the engine", { timeout: 3_600_000 }, () => {
  for (const [name, world] of Object.entries(WORLDS)) {
    const distribution = scoreDistribution(
      { ...ctx, boosts: world.boosts ?? [0, 0, 0] },
      startingStats(DEFAULT_SETTINGS.styles),
      1000,
    );
    const days = Array.from({ length: DAYS }, (_, d) => ({ ...world, seed: d + 1 }));
    const greedy = days.map(greedyDay);
    console.log(`${name}, locked-in score per day over ${DAYS} days:`);
    console.log(`  greedy, lock in the last game: ${summary(greedy.map((s) => s[s.length - 1]))}`);
    console.log(
      `  greedy, lock in when good enough: ${summary(greedy.map((s) => lockedWithThresholds(s, distribution)))}`,
    );
    console.log(`  engine: ${summary(days.map((d) => engineDay(d)))}`);
  }
});
