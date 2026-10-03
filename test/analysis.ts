import { battleCheese, isBattleTurn, LAST_TURN, MENU_OPTIONS, Stats } from "../src/constants";
import {
  applyOption,
  average,
  battleNumber,
  biggestHaul,
  Context,
  GameState,
  mulberry32,
  newGame,
  sample,
  sampleCastles,
  winChance,
} from "../src/strategy";

// Tools for working out what the engine should expect to score, used to
// generate and check the lock-in bars and in benchmarks.

// You can only lock in one score a day, straight after the game. With n games
// still to play after this one, the optimal rule for independent scores is to
// lock in if this one beats t(n), where t(0) = -inf and
// t(n) = E[max(X, t(n - 1))].
export function lockInThreshold(scores: number[], gamesAfter: number): number {
  let threshold = -Infinity;
  for (let n = 1; n <= gamesAfter; n++) {
    threshold = average(scores.map((x) => Math.max(x, threshold)));
  }
  return threshold;
}

// A whole game of greedy play, sampling every outcome so we get a score
// rather than an expectation
function playout(ctx: Context, start: GameState, seed: number): number {
  const rng = mulberry32(seed);
  const castles = sampleCastles(start, rng);
  let state = start;
  while (state.turn <= LAST_TURN) {
    if (isBattleTurn(state.turn)) {
      const battle = battleNumber(state.turn);
      if (rng() >= winChance(ctx, state.stats, castles[battle - 1], battle)) break;
      state = { ...state, cheese: state.cheese + battleCheese(state.turn), turn: state.turn + 1 };
      continue;
    }
    const id = biggestHaul(state, sample(state.pools.cheese, 3, rng));
    const next = applyOption(state, "cheese", id);
    // The wishing well pays out all or nothing
    if (MENU_OPTIONS.cheese[id].kind === "well") {
      next.cheese = state.cheese + (state.cheese >= 10 && rng() < 1 / 3 ? 300 : 0);
    }
    state = next;
  }
  return state.cheese;
}

// Scores a whole game from the given starting stats might produce
export function scoreDistribution(ctx: Context, stats: Stats, samples: number): number[] {
  return Array.from({ length: samples }, (_, i) => playout(ctx, newGame(stats), 5000 + i));
}
