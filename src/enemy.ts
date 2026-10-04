import { CASTLES, CastleKey, GROWTH } from "./constants";

// The castle you face in battle k has had k-1 rounds of growth, each stat
// separately multiplied by a random 105-125% and rounded down. Starting stats
// are fixed by castle type, so the distribution is exact.

type Distribution = { values: number[]; cumulative: number[] };

const cache = new Map<string, Distribution>();

function grown(base: number, rounds: number): Distribution {
  const key = `${base}:${rounds}`;
  const cached = cache.get(key);
  if (cached) return cached;

  let current = new Map<number, number>([[base, 1]]);
  const steps = GROWTH.max - GROWTH.min + 1;
  for (let r = 0; r < rounds; r++) {
    const next = new Map<number, number>();
    for (const [value, p] of current) {
      for (let pct = GROWTH.min; pct <= GROWTH.max; pct++) {
        const v = Math.floor((value * pct) / 100);
        next.set(v, (next.get(v) ?? 0) + p / steps);
      }
    }
    current = next;
  }

  const values = [...current.keys()].sort((a, b) => a - b);
  let total = 0;
  const cumulative = values.map((v) => (total += current.get(v) as number));
  const result = { values, cumulative };
  cache.set(key, result);
  return result;
}

// P(stat < value), or P(stat <= value) if inclusive
function chanceBelow({ values, cumulative }: Distribution, value: number, inclusive: boolean) {
  let lo = 0;
  let hi = values.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (inclusive ? values[mid] <= value : values[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo === 0 ? 0 : cumulative[lo - 1];
}

// This is the innermost loop of every decision, so look distributions up by
// castle, stat and battle directly rather than searching
const byCastle = new Map<CastleKey, { stats: number[]; grown: Distribution[][] }>();

function distribution(castle: CastleKey, stat: number, battle: number): Distribution {
  let entry = byCastle.get(castle);
  if (!entry) {
    const found = CASTLES.find((c) => c.key === castle);
    if (!found) throw new Error(`Unknown castle ${castle}`);
    entry = { stats: found.stats, grown: found.stats.map(() => []) };
    byCastle.set(castle, entry);
  }
  const battles = entry.grown[stat];
  battles[battle] ??= grown(entry.stats[stat], battle - 1);
  return battles[battle];
}

export function enemyChance(
  castle: CastleKey,
  stat: number,
  battle: number,
  value: number,
  inclusive: boolean,
): number {
  return chanceBelow(distribution(castle, stat, battle), value, inclusive);
}
