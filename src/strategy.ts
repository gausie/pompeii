import {
  add,
  allConfigurations,
  battleCheese,
  boostMultiplier,
  CASTLES,
  CastleKey,
  CATEGORIES,
  Configuration,
  isBattleTurn,
  LAST_TURN,
  Menu,
  MENU_OPTIONS,
  MENUS,
  POOL_SIZE,
  PrepOption,
  Stance,
  STANCES,
  startingStats,
  Stats,
} from "./constants";
import { enemyChance } from "./enemy";

export type Pools = Record<Menu, number[]>;

export type GameState = {
  // The turn of the next action
  turn: number;
  stats: Stats;
  cheese: number;
  pools: Pools;
  // The castle we'll fight in the upcoming battle, if we've been told
  enemy: CastleKey | null;
};

export type Context = {
  // Turns of Shark Tooth Grin, Boiling Determination, Enhanced Interrogation
  boosts: [number, number, number];
};

export function fullPools(): Pools {
  const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
  return {
    offense: range(POOL_SIZE.offense),
    defense: range(POOL_SIZE.defense),
    cheese: range(POOL_SIZE.cheese),
  };
}

export function newGame(stats: Stats, enemy: CastleKey | null = null): GameState {
  return { turn: 1, stats, cheese: 0, pools: fullPools(), enemy };
}

export function battleNumber(turn: number): number {
  return Math.ceil(turn / 3);
}

// *** Random numbers. Seeded so that alternatives can be compared on the same
// sampled futures (common random numbers), which cuts variance a lot.

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sample<T>(items: T[], n: number, rng: Rng): T[] {
  const copy = [...items];
  for (let i = 0; i < n && i < copy.length; i++) {
    const j = i + Math.floor(rng() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// *** Battles

// P(at least two of three independent events)
function twoOfThree([a, b, c]: number[]): number {
  return a * b + a * c + b * c - 2 * a * b * c;
}

export function stanceWinChances(
  ctx: Context,
  stats: Stats,
  castle: CastleKey,
  battle: number,
): number[] {
  const comparisons = (boost: number) => {
    const attack: number[] = [];
    const defense: number[] = [];
    CATEGORIES.forEach(({ attack: a, defense: d }, i) => {
      const mult = boostMultiplier(ctx.boosts[i]);
      // We attack: win if our attack > their defense
      attack.push(enemyChance(castle, d, battle, (stats[a] + boost) * mult, false));
      // They attack: win if our defense >= their attack
      defense.push(enemyChance(castle, a, battle, (stats[d] + boost) * mult, true));
    });
    return { attack: twoOfThree(attack), defense: twoOfThree(defense) };
  };
  const plain = comparisons(0);
  const bide = comparisons(10);
  return STANCES.map((s) => {
    const c = s.boost ? bide : plain;
    return s.attackChance * c.attack + (1 - s.attackChance) * c.defense;
  });
}

// Rollouts mostly take cheese, which leaves stats alone, so the same few win
// chances come up again and again
const winChances = new Map<string, number>();

export function winChance(ctx: Context, stats: Stats, castle: CastleKey, battle: number): number {
  const key = `${ctx.boosts}|${stats}|${castle}|${battle}`;
  let chance = winChances.get(key);
  if (chance === undefined) {
    if (winChances.size > 100_000) winChances.clear();
    chance = Math.max(...stanceWinChances(ctx, stats, castle, battle));
    winChances.set(key, chance);
  }
  return chance;
}

// *** Prep options

export function optionCheese(option: PrepOption, stats: Stats, cheese: number): number {
  switch (option.kind) {
    case "stats":
    case "fixed":
      return option.cheese;
    case "scaled": {
      const value = option.inverse ? 200 - stats[option.stat] : stats[option.stat];
      return Math.max(10, value);
    }
    case "well":
      // 1 in 3 chance of 300, but only if we can afford the coin
      return cheese >= 10 ? 100 : 0;
  }
}

export function applyOption(state: GameState, menu: Menu, id: number): GameState {
  const option = MENU_OPTIONS[menu][id];
  return {
    ...state,
    turn: state.turn + 1,
    stats: option.kind === "stats" ? add(state.stats, option.delta) : state.stats,
    cheese: state.cheese + optionCheese(option, state.stats, state.cheese),
    pools: { ...state.pools, [menu]: state.pools[menu].filter((x) => x !== id) },
  };
}

// *** Heuristic value: expected final cheese if our stats stayed as they are
// now and every remaining prep went on the typical cheese haul. Used to rank
// stat options and configurations cheaply.

function expectedBestOfThree(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n <= 3) return sorted[n - 1] ?? 0;
  const combinations = (n * (n - 1) * (n - 2)) / 6;
  let total = 0;
  for (let i = 2; i < n; i++) total += (sorted[i] * (i * (i - 1))) / 2;
  return total / combinations;
}

export function heuristicValue(ctx: Context, state: GameState): number {
  const cheesePerPrep = expectedBestOfThree(
    state.pools.cheese.map((id) =>
      optionCheese(MENU_OPTIONS.cheese[id], state.stats, state.cheese),
    ),
  );
  let value = state.cheese;
  let survival = 1;
  const next = battleNumber(state.turn);
  for (let turn = state.turn; turn <= LAST_TURN; turn++) {
    if (isBattleTurn(turn)) {
      const battle = battleNumber(turn);
      // We only know who we're fighting next; after that it's anyone
      survival *=
        battle === next && state.enemy
          ? winChance(ctx, state.stats, state.enemy, battle)
          : average(CASTLES.map((c) => winChance(ctx, state.stats, c.key, battle)));
      value += survival * battleCheese(turn);
    } else {
      value += survival * cheesePerPrep;
    }
  }
  return value;
}

export function biggestHaul(state: GameState, shown: number[]): number {
  const haul = (id: number) => optionCheese(MENU_OPTIONS.cheese[id], state.stats, state.cheese);
  return shown.reduce((best, id) => (haul(id) > haul(best) ? id : best));
}

// Castle types for each of the five battles: the known upcoming one, and
// random ones after that
export function sampleCastles(state: GameState, rng: Rng): CastleKey[] {
  const castles = Array.from({ length: 5 }, () => CASTLES[Math.floor(rng() * CASTLES.length)].key);
  if (state.enemy) castles[battleNumber(state.turn) - 1] = state.enemy;
  return castles;
}

// Plays out the rest of the game greedily: always look for cheese, take the
// biggest haul, fight with the best stance. Decisions are made by comparing
// rollouts after each alternative, so they can only improve on this. Rather
// than sampling battle outcomes we weight everything after a battle by the
// chance of surviving it, which gives the same expectation with less noise.
export function rollout(ctx: Context, start: GameState, rng: Rng, castles: CastleKey[]): number {
  let state = start;
  let value = state.cheese;
  let survival = 1;
  while (state.turn <= LAST_TURN) {
    if (isBattleTurn(state.turn)) {
      const battle = battleNumber(state.turn);
      survival *= winChance(ctx, state.stats, castles[battle - 1], battle);
      value += survival * battleCheese(state.turn);
      state = { ...state, turn: state.turn + 1, enemy: castles[battle] ?? null };
      continue;
    }
    const shown = sample(state.pools.cheese, 3, rng);
    const next = applyOption(state, "cheese", biggestHaul(state, shown));
    value += survival * (next.cheese - state.cheese);
    state = next;
  }
  return value;
}

// *** Decisions

export type Evaluation<T> = { choice: T; value: number }[];

export function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function evaluateMenus(
  ctx: Context,
  state: GameState,
  samples: number,
  seed = 1,
): Evaluation<Menu> {
  return MENUS.map((menu) => {
    // Which of the three offered we'd take: the biggest haul, or for stat
    // menus whichever the heuristic likes best. Worked out once per option.
    const score = new Map<number, number>();
    for (const id of state.pools[menu]) {
      const option = MENU_OPTIONS[menu][id];
      score.set(
        id,
        menu === "cheese"
          ? optionCheese(option, state.stats, state.cheese)
          : heuristicValue(ctx, applyOption(state, menu, id)),
      );
    }
    const pick = (shown: number[]) =>
      shown.reduce((best, id) =>
        (score.get(id) as number) > (score.get(best) as number) ? id : best,
      );

    return {
      choice: menu,
      value: average(
        Array.from({ length: samples }, (_, i) => {
          const rng = mulberry32(seed + i);
          const castles = sampleCastles(state, rng);
          const id = pick(sample(state.pools[menu], 3, rng));
          return rollout(ctx, applyOption(state, menu, id), rng, castles);
        }),
      ),
    };
  }).sort((a, b) => b.value - a.value);
}

// Values taking each option, returning indexes into `ids`
export function evaluateButtons(
  ctx: Context,
  state: GameState,
  menu: Menu,
  ids: number[],
  samples: number,
  seed = 1,
): Evaluation<number> {
  return ids
    .map((id, index) => {
      const next = applyOption(state, menu, id);
      return {
        choice: index,
        value: average(
          Array.from({ length: samples }, (_, i) => {
            const rng = mulberry32(seed + i);
            return rollout(ctx, next, rng, sampleCastles(state, rng));
          }),
        ),
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function bestStance(
  ctx: Context,
  stats: Stats,
  castle: CastleKey,
  battle: number,
): { stance: Stance; chances: number[] } {
  const chances = stanceWinChances(ctx, stats, castle, battle);
  const index = chances.indexOf(Math.max(...chances));
  return { stance: STANCES[index], chances };
}

// How many configurations get rolled out after the cheap heuristic pass
const SHORTLIST = 6;

// Ranks configurations by expected score for a game started from them
export function evaluateConfigurations(
  ctx: Context,
  allowed: (config: Configuration) => boolean,
  samples: number,
): Evaluation<Configuration> {
  const candidates = allConfigurations().filter(allowed);
  const stateFor = (config: Configuration) => newGame(startingStats(config));
  return candidates
    .map((config) => ({ config, value: heuristicValue(ctx, stateFor(config)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, SHORTLIST)
    .map(({ config }) => ({
      choice: config,
      value: average(
        Array.from({ length: samples }, (_, i) => {
          const rng = mulberry32(1000 + i);
          const state = stateFor(config);
          return rollout(ctx, state, rng, sampleCastles(state, rng));
        }),
      ),
    }))
    .sort((a, b) => b.value - a.value);
}
