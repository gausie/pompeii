import { add, Stats } from "./constants";

// KoLmafia reads each needle as how many pixels it sits from where it starts
// (e.g. MA=3), and each pixel is 7.5 points of the stat. Fitted against
// thousands of readings in KoLmafia session logs with known stats: attack
// needles read floor((stat - 95) / 7.5), defense floor((stat - 87.5) / 7.5).
const NEEDLE_SCALE = 7.5;
const NEEDLE_ORIGIN = { attack: 95, defense: 87.5 };

const origin = (stat: number) => (stat % 2 === 0 ? NEEDLE_ORIGIN.attack : NEEDLE_ORIGIN.defense);

export function needleInterval(stat: number, reading: number): [number, number] {
  const lo = origin(stat) + reading * NEEDLE_SCALE;
  return [lo, lo + NEEDLE_SCALE];
}

export function needleReading(stat: number, value: number): number {
  return Math.floor((value - origin(stat)) / NEEDLE_SCALE);
}

// Tracks what we know about our stats as intervals. Starting stats and every
// change are known exactly, so normally the intervals are a single value; the
// needles check that, and let us recover if we pick up a game midway.
export class Tracker {
  constructor(
    public lo: Stats,
    public hi: Stats,
  ) {}

  static exactly(stats: Stats): Tracker {
    return new Tracker([...stats] as Stats, stats.map((v) => v + 1) as Stats);
  }

  static unknown(): Tracker {
    return new Tracker([0, 0, 0, 0, 0, 0], [400, 400, 400, 400, 400, 400]);
  }

  shift(delta: Stats): void {
    this.lo = add(this.lo, delta);
    this.hi = add(this.hi, delta);
  }

  // Returns false if the reading contradicted what we had, in which case we
  // trust the needles and start over from them
  observe(needles: Map<number, number>): boolean {
    const lo = [...this.lo] as Stats;
    const hi = [...this.hi] as Stats;
    for (const [stat, reading] of needles) {
      const [nlo, nhi] = needleInterval(stat, reading);
      lo[stat] = Math.max(lo[stat], nlo);
      hi[stat] = Math.min(hi[stat], nhi);
    }
    if (lo.every((v, i) => v < hi[i])) {
      [this.lo, this.hi] = [lo, hi];
      return true;
    }
    const fresh = Tracker.unknown();
    for (const [stat, reading] of needles)
      [fresh.lo[stat], fresh.hi[stat]] = needleInterval(stat, reading);
    [this.lo, this.hi] = [fresh.lo, fresh.hi];
    return false;
  }

  // Our stats are whole numbers, so a width-1 interval is exact
  estimate(): Stats {
    return this.lo.map((lo, i) => (this.hi[i] - lo <= 1 ? lo : (lo + this.hi[i]) / 2)) as Stats;
  }
}
