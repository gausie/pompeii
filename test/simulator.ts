import {
  BRACKET_SIZE,
  BUTTONS,
  CASTLES,
  CastleKey,
  CATEGORIES,
  Configuration,
  configurationDelta,
  startingStats,
  GROWTH,
  isBattleTurn,
  LAST_TURN,
  Menu,
  MENU_CHOICE,
  MENU_OPTIONS,
  MENUS,
  PrepOption,
  STANCES,
  Stats,
  UPGRADE_OPTION,
  UPGRADES,
} from "../src/constants";
import { Button, Client, Observation } from "../src/observation";
import { fullPools, mulberry32, Rng, sample } from "../src/strategy";
import { needleInterval } from "../src/tracker";

function emptyObservation(): Observation {
  return {
    choice: null,
    turn: null,
    needles: new Map(),
    config: {},
    enemy: null,
    canStart: false,
    buttons: [],
    cheeseGained: 0,
    battle: null,
    gameOver: null,
  };
}

// An offline stand-in for the game so the engine can be exercised end to end.

export type SimulatorSettings = {
  seed: number;
  styles: Configuration;
  // Relative chance of each castle type (in CASTLES order) joining the bracket
  castleWeights: number[];
  playsPerDay: number;
  boosts: [number, number, number];
};

export const DEFAULT_SETTINGS: SimulatorSettings = {
  seed: 1,
  styles: { barb: 3, bridge: 2, holes: 3, moat: 3 },
  castleWeights: CASTLES.map(() => 1),
  playsPerDay: 5,
  boosts: [0, 0, 0],
};

type Phase = "lobby" | "planning" | Menu | "siege" | "results";

const PHASE_CHOICE: Record<Phase, number> = {
  lobby: 1313,
  planning: 1314,
  siege: 1315,
  results: 1316,
  ...MENU_CHOICE,
};

type Rival = { castle: CastleKey; strength: Stats };

export type AuditEntry = { choice: number; option: number; strength: Stats | null };

type Match = {
  strength: Stats;
  hoard: number;
  clock: number;
  // Who we'll face in each battle. The bracket plays out the same whatever we
  // do, so it's decided up front.
  foes: Rival[];
  untaken: Record<Menu, number[]>;
  offered: number[];
};

export class Simulator implements Client {
  // Everything about the game is private so nothing playing it can peek
  readonly #settings: SimulatorSettings;
  readonly #random: Rng;
  #styles: Configuration;
  #phase: Phase | null = null;
  #match: Match | null = null;
  #plays: number;
  #locked: number | null = null;
  #rewardsClaimed = false;
  readonly #scores: number[] = [];
  readonly #transcript: AuditEntry[] = [];
  readonly messages: string[] = [];

  constructor(settings: Partial<SimulatorSettings> = {}) {
    this.#settings = { ...DEFAULT_SETTINGS, ...settings };
    this.#random = mulberry32(this.#settings.seed);
    this.#styles = { ...this.#settings.styles };
    this.#plays = this.#settings.playsPerDay;
  }

  // *** Randomness

  #between(lo: number, hi: number): number {
    return lo + Math.floor(this.#random() * (hi - lo + 1));
  }

  // Stat-scaled cheese is fuzzed by about 10% either way
  // ...then rounded up or down at random, in proportion
  #fuzz(amount: number): number {
    const fuzzed = amount * (0.9 + 0.2 * this.#random());
    return Math.floor(fuzzed) + (this.#random() < fuzzed % 1 ? 1 : 0);
  }

  // *** Client

  current(): Observation {
    return this.#view(emptyObservation());
  }

  open(): Observation | null {
    if (this.#phase === null) this.#enterLobby();
    return this.current();
  }

  boosts(): [number, number, number] {
    return this.#settings.boosts;
  }

  playsLeft(): number {
    return this.#plays;
  }

  rewardsPending(): boolean {
    return !this.#rewardsClaimed;
  }

  // *** What anyone could see on screen or in their inventory

  get finalScores(): number[] {
    return [...this.#scores];
  }

  get lockedScore(): number | null {
    return this.#locked;
  }

  get inGame(): boolean {
    return this.#phase !== null;
  }

  // The truth behind every request, for tests to check against. Only
  // available once we've left the game, so it can't inform play.
  audit(): AuditEntry[] {
    if (this.#phase !== null) throw new Error("No peeking while the game is on");
    return this.#transcript.map((e) => ({ ...e, strength: e.strength && [...e.strength] }));
  }

  log(message: string): void {
    this.messages.push(message);
  }

  choose(choice: number, option: number): Observation {
    if (this.#phase === null || PHASE_CHOICE[this.#phase] !== choice) {
      throw new Error(`Chose ${choice}.${option} while in ${this.#phase ?? "nothing"}`);
    }
    const outcome = emptyObservation();
    switch (this.#phase) {
      case "lobby":
        this.#inLobby(option, outcome);
        break;
      case "planning":
        this.#openMenu(MENUS[option - 1]);
        break;
      case "offense":
      case "defense":
      case "cheese":
        this.#take(this.#phase, option, outcome);
        break;
      case "siege":
        this.#clash(option, outcome);
        break;
      case "results":
        this.#wrapUp(option, outcome);
        break;
    }
    this.#transcript.push({
      choice,
      option,
      strength: this.#match ? ([...this.#match.strength] as Stats) : null,
    });
    return this.#view(outcome);
  }

  // *** Lobby: restyle the castle, start, or leave

  #enterLobby(): void {
    this.#phase = "lobby";
    this.#match = this.#freshMatch();
  }

  #freshMatch(): Match {
    const weights = this.#settings.castleWeights;
    const total = weights.reduce((a, b) => a + b, 0);
    const bracket = Array.from({ length: BRACKET_SIZE }, () => {
      let roll = this.#random() * total;
      const castle = CASTLES.find((_, i) => (roll -= weights[i]) < 0) ?? CASTLES[0];
      return { castle: castle.key, strength: [...castle.stats] as Stats };
    });
    // Each round we meet a random survivor, while the rest of the bracket
    // fights among itself: half survive, and grow
    const foes: Rival[] = [];
    let remaining = bracket;
    for (let battle = 0; battle < 5; battle++) {
      const foe = remaining[Math.floor(this.#random() * remaining.length)];
      foes.push(foe);
      const others = remaining.filter((r) => r !== foe);
      remaining = sample(others, Math.floor(others.length / 2), this.#random).map((r) => ({
        ...r,
        strength: r.strength.map((v) =>
          Math.floor((v * this.#between(GROWTH.min, GROWTH.max)) / 100),
        ) as Stats,
      }));
    }
    return {
      strength: startingStats(this.#styles),
      hoard: 0,
      clock: 1,
      foes,
      untaken: fullPools(),
      offered: [],
    };
  }

  #inLobby(option: number, outcome: Observation): void {
    const match = this.#match as Match;
    const upgrade = UPGRADES.find((u) => UPGRADE_OPTION[u] === option);
    if (upgrade) {
      const before = configurationDelta(this.#styles);
      this.#styles[upgrade] = ((this.#styles[upgrade] % 3) + 1) as 1 | 2 | 3;
      const after = configurationDelta(this.#styles);
      match.strength = match.strength.map((v, i) => v + after[i] - before[i]) as Stats;
      // The needles only appear once you've changed something
      outcome.needles = this.#needles();
    } else if (option === 5 && this.#plays > 0) {
      this.#phase = "planning";
    } else if (option === 8) {
      this.#leave();
    }
  }

  #leave(): void {
    this.#phase = null;
    this.#match = null;
  }

  // *** Preparation

  #openMenu(menu: Menu): void {
    const match = this.#match as Match;
    match.offered = sample(match.untaken[menu], 3, this.#random);
    this.#phase = menu;
  }

  #take(menu: Menu, option: number, outcome: Observation): void {
    const match = this.#match as Match;
    const id = match.offered[option - 1];
    match.untaken[menu] = match.untaken[menu].filter((x) => x !== id);
    const effect = MENU_OPTIONS[menu][id];

    if (effect.kind === "stats") {
      match.strength = match.strength.map((v, i) => v + effect.delta[i]) as Stats;
      if (effect.cheese > 0) {
        const amount = this.#between(10, 20);
        match.hoard += amount;
        // Defensive cheese turns up without being announced
        if (menu === "offense") outcome.cheeseGained += amount;
      }
    } else {
      const amount = this.#cheeseFrom(effect, match);
      match.hoard += amount;
      outcome.cheeseGained += amount;
    }

    match.clock += 1;
    this.#phase = isBattleTurn(match.clock) ? "siege" : "planning";
  }

  #cheeseFrom(effect: Exclude<PrepOption, { kind: "stats" }>, match: Match): number {
    switch (effect.kind) {
      case "fixed":
        return this.#fuzz(effect.cheese);
      case "scaled": {
        const stat = match.strength[effect.stat];
        return this.#fuzz(Math.max(10, effect.inverse ? 200 - stat : stat));
      }
      case "well":
        return match.hoard >= 10 && this.#random() < 1 / 3 ? this.#fuzz(300) : 0;
    }
  }

  // *** Battle

  #clash(option: number, outcome: Observation): void {
    const match = this.#match as Match;
    const foe = this.#foe(match);
    const stance = STANCES[option - 1];
    const attacking = this.#random() < stance.attackChance;

    const results = CATEGORIES.map(({ attack, defense }, i) => {
      const boost = 1 + Math.min(3, this.#settings.boosts[i]) / 10;
      return attacking
        ? (match.strength[attack] + stance.boost) * boost > foe.strength[defense]
        : (match.strength[defense] + stance.boost) * boost >= foe.strength[attack];
    }) as [boolean, boolean, boolean];
    const won = results.filter(Boolean).length >= 2;
    outcome.battle = { attacking, results, won };

    if (won) {
      let amount = 0;
      for (let turn = 0; turn < match.clock; turn++) amount += this.#between(10, 20);
      match.hoard += amount;
      outcome.cheeseGained += amount;
    }

    if (!won || match.clock >= LAST_TURN) {
      this.#phase = "results";
      this.#plays -= 1;
      this.#scores.push(match.hoard);
    } else {
      match.clock += 1;
      this.#phase = "planning";
    }
  }

  #foe(match: Match): Rival {
    return match.foes[Math.ceil(match.clock / 3) - 1];
  }

  // *** Game over

  #wrapUp(option: number, outcome: Observation): void {
    const match = this.#match as Match;
    this.#rewardsClaimed = true;
    if (option === 1) {
      if (this.#locked === null) this.#locked = match.hoard;
      this.#leave();
    } else if (option === 2) {
      this.#enterLobby();
      // Unlike opening the rig, playing again shows the fresh needles
      outcome.needles = this.#needles();
    } else {
      this.#leave();
    }
  }

  // *** What the screen shows

  #needles(): Map<number, number> {
    const match = this.#match as Match;
    // Invert the engine's reading of the needles so the two agree
    const left = (stat: number, value: number) => {
      let pixel = 0;
      while (needleInterval(stat, pixel + 1)[0] <= value) pixel++;
      return pixel;
    };
    return new Map(match.strength.map((v, stat) => [stat, left(stat, v)] as [number, number]));
  }

  #view(outcome: Observation): Observation {
    outcome.choice = this.#phase === null ? null : PHASE_CHOICE[this.#phase];
    const match = this.#match;
    if (!match || this.#phase === null) return outcome;
    outcome.config = { ...this.#styles };

    switch (this.#phase) {
      case "lobby":
        outcome.canStart = this.#plays > 0;
        break;
      case "planning":
        outcome.turn = match.clock;
        outcome.enemy = this.#foe(match).castle;
        outcome.needles = this.#needles();
        break;
      case "siege":
        outcome.enemy = this.#foe(match).castle;
        outcome.needles = this.#needles();
        break;
      case "results":
        outcome.gameOver = {
          cheese: match.hoard,
          playsLeft: this.#plays,
          canLockIn: this.#locked === null,
        };
        break;
      default: {
        const menu = this.#phase;
        outcome.needles = this.#needles();
        outcome.buttons = match.offered.map((id, i) => ({ option: i + 1, ...label(menu, id) }));
      }
    }
    return outcome;
  }
}

function label(menu: Menu, id: number): Omit<Button, "option"> {
  const name = Object.keys(BUTTONS[menu]).find((n) => BUTTONS[menu][n] === id) as string;
  return { name, description: hint(MENU_OPTIONS[menu][id]) };
}

const AREAS = ["Military", "Castle", "Psychological"];

// Mimics the blue hint shown under each button
function hint(option: PrepOption): string {
  if (option.kind !== "stats") return "Gain cheese";
  const listed = (sign: number) =>
    option.delta
      .map((d, stat) =>
        Math.sign(d) === sign ? `${AREAS[stat >> 1]} ${stat % 2 ? "defense" : "attack"}` : null,
      )
      .filter(Boolean)
      .join(" and ");
  const parts = [`Increase ${listed(1)}`];
  if (option.delta.some((d) => d < 0)) parts.push(`decrease ${listed(-1)}`);
  if (option.cheese) parts.push("get cheese");
  return parts.join(", ");
}
