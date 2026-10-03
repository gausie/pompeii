import { lockInBar } from "./bars";
import {
  Configuration,
  Menu,
  MENU_CHOICE,
  MENU_OPTION,
  MENU_OPTIONS,
  MENUS,
  STANCES,
  STAT_NAMES,
  startingStats,
  Stats,
  STYLE_NAMES,
  UPGRADE_OPTION,
  UPGRADES,
} from "./constants";
import { identify } from "./identify";
import { Client, Observation } from "./observation";
import {
  battleNumber,
  bestStance,
  Context,
  evaluateButtons,
  evaluateConfigurations,
  evaluateMenus,
  GameState,
  newGame,
} from "./strategy";
import { Tracker } from "./tracker";

export type Options = {
  // Styles we want for the first game's rewards; anything unset is optimised
  rewards: Partial<Configuration>;
  games: number;
  samples: number;
  lockIn: boolean;
};

// Everything about the game in progress except our stats, which the tracker owns
type Progress = Omit<GameState, "stats">;

const fmt = (n: number) => Math.round(n).toString();
const fmtStats = (stats: Stats) => stats.map((v, i) => `${STAT_NAMES[i]} ${fmt(v)}`).join(", ");

export class Engine {
  ctx: Context;
  tracker = Tracker.unknown();
  config: Partial<Configuration> = {};
  progress: Progress | null = null;
  gamesPlayed = 0;
  // Score worth locking in, given the games still to come
  lockTarget = -Infinity;
  // The best configuration only changes once the rewards are collected
  private configurations = new Map<string, Configuration>();

  constructor(
    readonly client: Client,
    readonly options: Options,
  ) {
    this.ctx = { boosts: client.boosts() };
  }

  private log(message: string, color?: string) {
    this.client.log(message, color);
  }

  run(): void {
    let observation = this.client.current();
    if (observation.choice === null || observation.choice < 1313 || observation.choice > 1319) {
      const opened = this.client.open();
      if (!opened) return;
      observation = opened;
    }
    this.loop(observation);
  }

  private loop(first: Observation): void {
    let observation = first;
    for (let guard = 0; guard < 500; guard++) {
      this.observe(observation);
      let next: Observation | null;
      switch (observation.choice) {
        case 1313:
          if (this.gamesPlayed >= this.options.games || !observation.canStart) {
            this.client.choose(1313, 8);
            return;
          }
          next = this.startGame();
          break;
        case 1314:
          next = this.chooseMenu(observation);
          break;
        case 1315:
          next = this.fight(observation);
          break;
        case 1316:
          next = this.endGame(observation);
          break;
        case 1317:
        case 1318:
        case 1319:
          next = this.chooseButton(observation);
          break;
        default:
          // Locking in a score ends the choice; reopen if there's more to play
          next = this.gamesPlayed < this.options.games ? this.client.open() : null;
      }
      if (!next) return;
      observation = next;
    }
  }

  // Before a game our stats follow from the configuration alone; during one
  // the needles check the stats we've tracked
  private observe(observation: Observation): void {
    if (Object.keys(observation.config).length === 4) this.config = observation.config;
    if (observation.choice === 1313 && Object.keys(this.config).length === 4) {
      this.tracker = Tracker.exactly(startingStats(this.config as Configuration));
    }
    if (observation.needles.size === 0) return;
    if (!this.tracker.observe(observation.needles)) {
      this.log("Needles disagreed with tracked stats; resetting from the needles.", "gray");
    }
  }

  // What the strategy needs to know about the game in progress
  private state(): GameState {
    return { ...(this.progress as Progress), stats: this.tracker.estimate() };
  }

  // *** Setting up

  private startGame(): Observation {
    const rewards = this.client.rewardsPending();
    const fixed = rewards ? this.options.rewards : {};

    // Only the score we lock in counts, so with games to come after this one
    // there's a bar this one has to clear to be worth locking in
    const gamesAfter = Math.min(
      this.client.playsLeft() - 1,
      this.options.games - this.gamesPlayed - 1,
    );
    this.lockTarget =
      this.options.lockIn && gamesAfter > 0 ? lockInBar(this.ctx.boosts, gamesAfter) : -Infinity;

    const key = JSON.stringify(fixed);
    let target = this.configurations.get(key);
    if (!target) {
      const allowed = (config: Configuration) =>
        UPGRADES.every((u) => fixed[u] === undefined || fixed[u] === config[u]);
      target = evaluateConfigurations(this.ctx, allowed, this.options.samples)[0].choice;
      this.configurations.set(key, target);
    }
    const chosen = target;
    this.log(
      `Configuration: ${UPGRADES.map((u) => STYLE_NAMES[u][chosen[u] - 1]).join(", ")}` +
        `${rewards ? " (rewards pending)" : ""}`,
      "blue",
    );
    if (this.lockTarget > -Infinity) {
      this.log(
        `${gamesAfter} more game${gamesAfter === 1 ? "" : "s"} after this, so locking in at ${fmt(this.lockTarget)}+`,
        "blue",
      );
    }
    for (const upgrade of UPGRADES) {
      for (let i = 0; i < 3 && this.config[upgrade] !== chosen[upgrade]; i++) {
        this.observe(this.client.choose(1313, UPGRADE_OPTION[upgrade]));
      }
      if (this.config[upgrade] !== chosen[upgrade]) throw new Error(`Couldn't set ${upgrade}`);
    }

    const start = this.client.choose(1313, 5);
    this.progress = newGame(this.tracker.estimate(), start.enemy);
    this.log(
      `Game ${this.gamesPlayed + 1} started. Stats: ${fmtStats(this.tracker.estimate())}`,
      "blue",
    );
    return start;
  }

  // *** Playing

  private ensureProgress(observation: Observation): Progress {
    // If we've picked up a game in progress we don't know which options were
    // already taken; assume none were and go by the needles.
    if (!this.progress) this.progress = newGame(this.tracker.estimate(), observation.enemy);
    if (observation.turn) this.progress.turn = observation.turn;
    if (observation.enemy) this.progress.enemy = observation.enemy;
    return this.progress;
  }

  private chooseMenu(observation: Observation): Observation {
    const progress = this.ensureProgress(observation);
    const ranked = evaluateMenus(
      this.ctx,
      this.state(),
      this.options.samples,
      progress.turn * 1000,
    );
    this.log(
      `Turn ${progress.turn} vs ${progress.enemy ?? "?"} (${fmt(progress.cheese)} cheese): ${ranked
        .map((r) => `${r.choice} ${fmt(r.value)}`)
        .join(", ")}`,
    );
    return this.client.choose(1314, MENU_OPTION[ranked[0].choice]);
  }

  private chooseButton(observation: Observation): Observation {
    const progress = this.ensureProgress(observation);
    const menu = MENUS.find((m) => MENU_CHOICE[m] === observation.choice) as Menu;
    const ids = observation.buttons.map((b) => identify(menu, b, progress.pools[menu]));
    const known = observation.buttons.flatMap((button, i) =>
      ids[i] === null ? [] : [{ button, id: ids[i] as number }],
    );
    if (known.length === 0) {
      // Nothing we recognise; take the first and let the needles sort us out
      this.log(`  Unrecognised buttons; taking ${observation.buttons[0].name}`, "red");
      this.tracker = Tracker.unknown();
      return this.client.choose(observation.choice as number, observation.buttons[0].option);
    }

    const ranked = evaluateButtons(
      this.ctx,
      this.state(),
      menu,
      known.map((k) => k.id),
      this.options.samples,
      progress.turn * 1000,
    );
    // With games to come, a game that isn't good enough to lock in is just
    // practice, so gamble on the wishing well: it's worth as much as the
    // other big hauls on average, and its all-or-nothing 300 makes more of
    // our games lockable. Simulated, this lifts days scoring 1900+ by about
    // three percentage points without costing anything on average.
    let pick = ranked[0];
    if (this.lockTarget > -Infinity && progress.cheese >= 10) {
      pick = ranked.find((r) => MENU_OPTIONS[menu][known[r.choice].id].kind === "well") ?? pick;
    }
    const { button, id } = known[pick.choice];
    this.log(`  ${ranked.map((r) => `${known[r.choice].button.name} ${fmt(r.value)}`).join(", ")}`);
    this.log(`  -> ${button.name}`, "green");

    const option = MENU_OPTIONS[menu][id];
    if (option.kind === "stats") this.tracker.shift(option.delta);
    const result = this.client.choose(observation.choice as number, button.option);
    progress.cheese += result.cheeseGained;
    progress.pools[menu] = progress.pools[menu].filter((x) => x !== id);
    progress.turn += 1;
    return result;
  }

  private fight(observation: Observation): Observation {
    const progress = this.ensureProgress(observation);
    const battle = battleNumber(progress.turn);
    const enemy = progress.enemy ?? "masterofnone";
    const { stance, chances } = bestStance(this.ctx, this.tracker.estimate(), enemy, battle);
    this.log(
      `Battle ${battle} vs ${enemy}: ${STANCES.map((s, i) => `${s.name} ${fmt(chances[i] * 100)}%`).join(", ")}`,
    );
    const result = this.client.choose(1315, stance.option);
    progress.cheese += result.cheeseGained;
    progress.turn += 1;
    progress.enemy = null;
    this.log(
      `  ${result.battle?.won ? "Won" : "Lost"} (${result.battle?.attacking ? "attacking" : "defending"})` +
        `${result.cheeseGained ? `, +${result.cheeseGained} cheese` : ""}`,
      result.battle?.won ? "green" : "red",
    );
    return result;
  }

  private endGame(observation: Observation): Observation | null {
    const over = observation.gameOver;
    // The rewards arrive with whichever option we pick here
    this.gamesPlayed += 1;
    this.progress = null;
    if (!over) return this.client.choose(1316, 3);

    this.log(`Game over: ${over.cheese} cheese.`, "blue");
    const remaining = Math.min(over.playsLeft, this.options.games - this.gamesPlayed);

    // Lock in if we hit what we were going for, or if this is the last game.
    // Once locked in there's nothing more to play for today.
    const target = remaining > 0 ? this.lockTarget : -Infinity;
    if (this.options.lockIn && over.canLockIn && over.cheese >= target) {
      this.log(
        `Locking in ${over.cheese}${target > -Infinity ? ` (aimed for ${fmt(target)})` : ""}.`,
        "green",
      );
      this.client.choose(1316, 1);
      return null;
    }
    if (remaining > 0) return this.client.choose(1316, 2);
    this.client.choose(1316, 3);
    return null;
  }
}
