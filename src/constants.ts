import BUTTON_DATA from "./data/buttons.json";
import CASTLE_DATA from "./data/castles.json";
import OPTION_DATA from "./data/options.json";

// The game's fixed rules live here; its tables of castles, options and button
// names live in data/*.json and are turned into the shapes the rest of the
// code works with.

export type Stats = [number, number, number, number, number, number];

// Index order matches KoLmafia's BastilleBattalionManager
export const MA = 0;
export const MD = 1;
export const CA = 2;
export const CD = 3;
export const PA = 4;
export const PD = 5;
export const STAT_NAMES = ["MA", "MD", "CA", "CD", "PA", "PD"] as const;
type StatName = (typeof STAT_NAMES)[number];

// Military, castle, psychological
export const CATEGORIES = [
  { attack: MA, defense: MD },
  { attack: CA, defense: CD },
  { attack: PA, defense: PD },
] as const;

export function zero(): Stats {
  return [0, 0, 0, 0, 0, 0];
}

export function add(a: Stats, b: Stats, scale = 1): Stats {
  return a.map((v, i) => v + b[i] * scale) as Stats;
}

function stats(named: Partial<Record<string, number>>): Stats {
  for (const name of Object.keys(named)) {
    if (!STAT_NAMES.includes(name as StatName)) throw new Error(`Unknown stat ${name}`);
  }
  return STAT_NAMES.map((name) => named[name] ?? 0) as Stats;
}

function statIndex(name: string): number {
  const index = STAT_NAMES.indexOf(name as StatName);
  if (index < 0) throw new Error(`Unknown stat ${name}`);
  return index;
}

// *** Rules

// Everyone's stats with no style bonuses
export const BASELINE = stats({ MA: 100, MD: 90, CA: 110, CD: 100, PA: 110, PD: 110 });

// Each game draws a bracket of castles, halved after every battle; survivors
// grow by this percentage range in each stat
export const BRACKET_SIZE = 31;
export const GROWTH = { min: 105, max: 125 };

// How likely each stance is to put us on the attack, and what it adds to all
// our stats for the battle
export type Stance = { option: number; name: string; attackChance: number; boost: number };
export const STANCES: Stance[] = [
  { option: 1, name: "Try to get the jump on them", attackChance: 0.8, boost: 0 },
  { option: 2, name: "Bide your time", attackChance: 0.5, boost: 10 },
  { option: 3, name: "Ready your defenses and wait for them", attackChance: 0.2, boost: 0 },
];

// Shark Tooth Grin, Boiling Determination, Enhanced Interrogation, which
// boost military, castle and psychological stats in battle
export const BOOST_EFFECTS = [2413, 2414, 2415];
export const BOOST_POTIONS = ["sharkfin gumbo", "boiling broth", "interrogative elixir"];

export function boostMultiplier(turns: number): number {
  return 1 + Math.min(3, turns) / 10;
}

// *** Castle styles. Only differences between styles matter: anything they
// share is absorbed into the baseline.

export const UPGRADES = ["barb", "bridge", "holes", "moat"] as const;
export type Upgrade = (typeof UPGRADES)[number];
export type Configuration = Record<Upgrade, 1 | 2 | 3>;

export const STYLE_DELTAS: Record<Upgrade, Stats[]> = {
  barb: [stats({ MA: 20, MD: 20 }), stats({ CA: 20, CD: 20 }), stats({ PA: 20, PD: 20 })],
  bridge: [
    stats({ MA: 10, CA: 10, PA: 10 }),
    stats({ MD: 20, CD: 20, PD: 20 }),
    stats({ PA: 15, PD: 15 }),
  ],
  holes: [
    stats({ MA: 10, MD: 10, PA: -10, CD: -10 }),
    stats({ CA: 10, MD: 10, PA: -10, PD: -10 }),
    zero(),
  ],
  moat: [
    stats({ PD: -10, CA: -10, MD: 10, PA: 10 }),
    stats({ PD: -10, CA: -10, CD: 10, MA: 10 }),
    zero(),
  ],
};

// Named for the first game's rewards they give
export const STYLE_NAMES: Record<Upgrade, string[]> = {
  barb: ["Barbarian Barbecue (myst stats)", "Babar (muscle stats)", "Barbershop (moxie stats)"],
  bridge: [
    "Brutalist (Brutal brogues)",
    "Draftsman (Draftsman's driving gloves)",
    "Art Nouveau (Nouveau nosering)",
  ],
  holes: [
    "Cannon (Bastille Budgeteer)",
    "Catapult (Bastille Bourgeoisie)",
    "Gesture (Bastille Braggadocio)",
  ],
  moat: ["Sharks (sharkfin gumbo)", "Lava (boiling broth)", "Truth Serum (interrogative elixir)"],
};

// 1313 option that cycles each upgrade
export const UPGRADE_OPTION: Record<Upgrade, number> = { barb: 1, bridge: 2, holes: 3, moat: 4 };

export function configurationDelta(config: Configuration): Stats {
  return UPGRADES.reduce<Stats>((acc, u) => add(acc, STYLE_DELTAS[u][config[u] - 1]), zero());
}

// Our stats at the start of a game with this configuration
export function startingStats(config: Configuration): Stats {
  return add(BASELINE, configurationDelta(config));
}

export function allConfigurations(): Configuration[] {
  const result: Configuration[] = [];
  for (let i = 0; i < 81; i++) {
    const digit = (n: number) => ((Math.floor(i / 3 ** n) % 3) + 1) as 1 | 2 | 3;
    result.push({ barb: digit(3), bridge: digit(2), holes: digit(1), moat: digit(0) });
  }
  return result;
}

// *** Preparation options

export const MENUS = ["offense", "defense", "cheese"] as const;
export type Menu = (typeof MENUS)[number];
export const MENU_OPTION: Record<Menu, number> = { offense: 1, defense: 2, cheese: 3 };
export const MENU_CHOICE: Record<Menu, number> = { offense: 1317, defense: 1318, cheese: 1319 };

export type PrepOption =
  | { kind: "stats"; delta: Stats; cheese: number }
  | { kind: "fixed"; cheese: number }
  | { kind: "scaled"; stat: number; inverse: boolean }
  | { kind: "well" };

type RawOption = {
  bonus?: Record<string, number>;
  cheese?: number;
  fixed?: number;
  scaled?: string;
  inverse?: boolean;
  well?: boolean;
};

function prepOption(raw: RawOption): PrepOption {
  if (raw.bonus) return { kind: "stats", delta: stats(raw.bonus), cheese: raw.cheese ?? 0 };
  if (raw.fixed !== undefined) return { kind: "fixed", cheese: raw.fixed };
  if (raw.scaled) return { kind: "scaled", stat: statIndex(raw.scaled), inverse: !!raw.inverse };
  if (raw.well) return { kind: "well" };
  throw new Error(`Unrecognised option ${JSON.stringify(raw)}`);
}

// Options are numbered from 1 in the order they're listed in options.json
function numbered(raws: RawOption[]): Record<number, PrepOption> {
  const options: Record<number, PrepOption> = {};
  raws.forEach((raw, i) => (options[i + 1] = prepOption(raw)));
  return options;
}

const OPTIONS = OPTION_DATA as Record<Menu, RawOption[]>;

export const MENU_OPTIONS: Record<Menu, Record<number, PrepOption>> = {
  offense: numbered(OPTIONS.offense),
  defense: numbered(OPTIONS.defense),
  cheese: numbered(OPTIONS.cheese),
};

// How many options each menu starts with (defense has no cheesy ones)
export const POOL_SIZE: Record<Menu, number> = {
  offense: OPTIONS.offense.length,
  defense: OPTIONS.defense.length,
  cheese: OPTIONS.cheese.length,
};

// Button text for each option. Two buttons per stat menu share a description
// ("all attack up, all defense down"); which is the milder one was worked out
// from the needles.
export const BUTTONS: Record<Menu, Record<string, number>> = BUTTON_DATA;

// *** Timeline: preps on turns 1,2,4,5,...; battles on turns 3,6,9,12,15
export const LAST_TURN = 15;
export function isBattleTurn(turn: number): boolean {
  return turn % 3 === 0;
}

// Razing a castle yields a 10-20 cheese roll for every turn elapsed, summed
export function battleCheese(turn: number): number {
  return 15 * turn;
}

// *** Enemy castles. Every castle of a type starts with the same stats. Each
// game draws a bracket of them; it's halved after every battle and the
// survivors grow in each stat independently.

export type CastleKey = string;
export type Castle = { key: CastleKey; description: string; stats: Stats };

export const CASTLES: Castle[] = CASTLE_DATA.map((c) => ({
  key: c.key,
  description: c.description,
  stats: stats(c.stats),
}));
