import {
  availableAmount,
  availableChoiceOptions,
  Effect,
  handlingChoice,
  haveEffect,
  Item,
  itemAmount,
  lastChoice,
  myHash,
  print,
  retrieveItem,
  use,
  userConfirm,
  visitUrl,
} from "kolmafia";
import { $item, get, have } from "libram";

import {
  BOOST_EFFECTS,
  BOOST_POTIONS,
  BUTTONS,
  CASTLES,
  CastleKey,
  Configuration,
  MENUS,
  PLAYS_PER_DAY,
  STAT_NAMES,
  Stats,
  STYLE_KEYS,
  UPGRADES,
} from "./constants";
import { BattleResult, Client, Observation } from "./observation";
import { fullPools, GameState, Pools } from "./strategy";

// Everything about talking to KoL through KoLmafia lives here. The game
// itself comes from what KoLmafia tracks as we play.

const RIG = $item`Bastille Battalion control rig`;
const VOUCHER = $item`Bastille Battalion control rig loaner voucher`;

// The preferences KoLmafia keeps Bastille Battalion in
export type BastillePrefs = {
  _bastilleCurrentStyles: string;
  _bastilleStats: string;
  _bastilleEnemyCastle: string;
  _bastilleGameTurn: number;
  _bastilleCheese: number;
  _bastilleLastBattleWon: boolean;
  _bastilleLastBattleResults: string;
  _bastilleOptionsTaken: string;
};

export type MafiaState = {
  // The choice we're in, if any
  choice: number | null;
  // Its options by number, as availableChoiceOptions() gives them
  options: Record<number, string>;
  prefs: BastillePrefs;
};

// e.g. MA=120,MD=140,CA=100,...
function readStats(pref: string): Stats | null {
  const named = new Map(pref.split(",").map((part) => part.split("=") as [string, string]));
  const stats = STAT_NAMES.map((name) => Number(named.get(name)));
  return stats.every((v) => Number.isFinite(v)) ? (stats as Stats) : null;
}

const STYLES = new Map(
  UPGRADES.flatMap((upgrade) =>
    STYLE_KEYS[upgrade].map((key, i) => [key, { upgrade, level: (i + 1) as 1 | 2 | 3 }] as const),
  ),
);

// e.g. BARBECUE,DRAFTSMAN,GESTURE,SHARKS
function readConfiguration(pref: string): Partial<Configuration> {
  const config: Partial<Configuration> = {};
  for (const key of pref.split(",")) {
    const style = STYLES.get(key);
    if (style) config[style.upgrade] = style.level;
  }
  return config;
}

// e.g. MA>MD,CA<CD,PA>PD when we attacked, MD<MA,... when we defended
function readBattle(prefs: BastillePrefs): BattleResult | null {
  const results = prefs._bastilleLastBattleResults.split(",");
  if (results.length !== 3) return null;
  return {
    attacking: results[0][1] === "A",
    results: results.map((r) => r[2] === ">") as [boolean, boolean, boolean],
    won: prefs._bastilleLastBattleWon,
  };
}

// What's left to be offered once these buttons have been taken this game
export function poolsAfter(taken: string[]): Pools {
  const pools = fullPools();
  for (const menu of MENUS) {
    const ids = new Set(taken.map((name) => BUTTONS[menu][name]));
    pools[menu] = pools[menu].filter((id) => !ids.has(id));
  }
  return pools;
}

function readGame(prefs: BastillePrefs): GameState | null {
  const stats = readStats(prefs._bastilleStats);
  if (!stats) return null;
  const enemy = prefs._bastilleEnemyCastle;
  return {
    turn: prefs._bastilleGameTurn,
    stats,
    cheese: prefs._bastilleCheese,
    pools: poolsAfter(prefs._bastilleOptionsTaken.split(",").filter(Boolean)),
    enemy: CASTLES.some((c) => c.key === enemy) ? (enemy as CastleKey) : null,
  };
}

export function readObservation({ choice, options, prefs }: MafiaState): Observation {
  return {
    choice,
    buttons: Object.entries(options).map(([option, name]) => ({ option: Number(option), name })),
    config: readConfiguration(prefs._bastilleCurrentStyles),
    game: readGame(prefs),
    lastBattle: readBattle(prefs),
  };
}

export type Score = { playerId: number; name: string; cheese: number };

// Today's leaderboard, from the Hi Scores button in the lobby. KoLmafia
// doesn't read this one.
export function parseHiScores(html: string): Score[] | null {
  if (!html.includes("Cheesemasters:")) return null;
  // String.prototype.matchAll isn't reliably available in KoLmafia's Rhino
  const re = /showplayer\.php\?who=(\d+)>([^<]+)<\/a>.*?<td>([\d,]+) curds/g;
  const scores: Score[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const [, id, name, cheese] = match;
    scores.push({ playerId: Number(id), name, cheese: Number(cheese.replace(/,/g, "")) });
  }
  return scores;
}

function readPrefs(): BastillePrefs {
  return {
    _bastilleCurrentStyles: get("_bastilleCurrentStyles"),
    _bastilleStats: get("_bastilleStats"),
    _bastilleEnemyCastle: get("_bastilleEnemyCastle"),
    _bastilleGameTurn: get("_bastilleGameTurn"),
    _bastilleCheese: get("_bastilleCheese"),
    _bastilleLastBattleWon: get("_bastilleLastBattleWon"),
    _bastilleLastBattleResults: get("_bastilleLastBattleResults"),
    _bastilleOptionsTaken: get("_bastilleOptionsTaken", ""),
  };
}

export class GameClient implements Client {
  current(): Observation {
    visitUrl("choice.php");
    return this.read();
  }

  open(): Observation | null {
    let item = RIG;
    if (!have(RIG)) {
      if (!have(VOUCHER)) {
        print("You don't have a Bastille Battalion control rig or a loaner voucher.", "red");
        return null;
      }
      if (!userConfirm("Use a loaner voucher to play Bastille Battalion?")) return null;
      item = VOUCHER;
    }
    if (itemAmount(item) === 0) retrieveItem(1, item);
    return this.useRig(item);
  }

  choose(choice: number, option: number): Observation {
    this.visitChoice(choice, option);
    return this.read();
  }

  private useRig(item: Item): Observation {
    visitUrl(`inv_use.php?whichitem=${item.id}&pwd=${myHash()}`);
    return this.read();
  }

  // KoLmafia has already taken in the page we just visited
  private read(): Observation {
    const choice = handlingChoice() ? lastChoice() : null;
    return readObservation({
      choice,
      options: choice === null ? {} : availableChoiceOptions(),
      prefs: readPrefs(),
    });
  }

  private visitChoice(choice: number, option: number): string {
    return visitUrl(`choice.php?whichchoice=${choice}&option=${option}&pwd=${myHash()}`);
  }

  // Today's leaderboard, or null if we can't get to it. Never spends a loaner
  // voucher just to look.
  hiScores(): Score[] | null {
    if (!have(RIG)) return null;
    let page = this.current();
    if (page.choice === null) page = this.useRig(RIG);
    if (page.choice !== 1313) return null;
    const html = this.visitChoice(1313, 6);
    // With plays left the board keeps us in the lobby
    if (handlingChoice()) this.visitChoice(1313, 8);
    return parseHiScores(html);
  }

  boosts(): [number, number, number] {
    return BOOST_EFFECTS.map((id) => haveEffect(Effect.get(id))) as [number, number, number];
  }

  rewardsPending(): boolean {
    return !get("_bastilleRewardsCollected", false);
  }

  // Today's locked-in score, or 0 if we haven't locked one in
  lockedInScore(): number {
    return get("_bastilleLockedInScore", 0);
  }

  playsLeft(): number {
    return Math.max(0, PLAYS_PER_DAY - get("_bastilleGames"));
  }

  log(message: string, color?: string): void {
    print(message, color);
  }

  // Each potion gives a turn of its boost, which caps at 3. Games don't take
  // turns, so they last until you next adventure.
  drinkPotions(): void {
    const boosts = this.boosts();
    BOOST_POTIONS.forEach((name, i) => {
      const potion = Item.get(name);
      const wanted = Math.min(3 - boosts[i], availableAmount(potion));
      if (wanted > 0) {
        retrieveItem(wanted, potion);
        use(wanted, potion);
      }
    });
  }
}
