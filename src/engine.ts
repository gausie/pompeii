import { lockInBar } from "./bars";
import {
  BUTTONS,
  Configuration,
  LOCK_IN,
  Menu,
  MENU_CHOICE,
  MENU_OPTION,
  MENU_OPTIONS,
  MENUS,
  STANCES,
  START_OPTION,
  STAT_NAMES,
  Stats,
  STYLE_NAMES,
  UPGRADE_OPTION,
  UPGRADES,
  WELL_COST,
} from "./constants";
import { Client, Observation } from "./observation";
import {
  battleNumber,
  bestStance,
  Context,
  evaluateButtons,
  evaluateConfigurations,
  evaluateMenus,
  GameState,
} from "./strategy";

export type Options = {
  // Styles we want for the first game's rewards; anything unset is optimised
  rewards: Partial<Configuration>;
  games: number;
  samples: number;
  lockIn: boolean;
};

const fmt = (n: number) => Math.round(n).toString();
const fmtStats = (stats: Stats) => stats.map((v, i) => `${STAT_NAMES[i]} ${fmt(v)}`).join(", ");

export class Engine {
  ctx: Context;
  gamesPlayed = 0;
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
    for (;;) {
      let next: Observation | null;
      switch (observation.choice) {
        case 1313:
          if (this.gamesPlayed >= this.options.games || !this.canStart(observation)) {
            this.client.choose(1313, 8);
            return;
          }
          next = this.startGame(observation);
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

  private canStart(observation: Observation): boolean {
    return observation.buttons.some((b) => b.option === START_OPTION);
  }

  private state(observation: Observation): GameState {
    if (!observation.game) throw new Error("KoLmafia isn't tracking this game's stats.");
    return observation.game;
  }

  // Only the score we lock in counts, so with games to come after this one
  // there's a bar this one has to clear to be worth locking in
  private lockTarget(gamesAfter: number): number {
    return this.options.lockIn && gamesAfter > 0
      ? lockInBar(this.ctx.boosts, gamesAfter)
      : -Infinity;
  }

  // *** Setting up

  private bestConfiguration(fixed: Partial<Configuration>): Configuration {
    const key = JSON.stringify(fixed);
    const cached = this.configurations.get(key);
    if (cached) return cached;
    const allowed = (config: Configuration) =>
      UPGRADES.every((u) => fixed[u] === undefined || fixed[u] === config[u]);
    const best = evaluateConfigurations(this.ctx, allowed, this.options.samples)[0].choice;
    this.configurations.set(key, best);
    return best;
  }

  private startGame(lobby: Observation): Observation {
    const rewards = this.client.rewardsPending();
    const fixed = rewards ? this.options.rewards : {};
    const gamesAfter = Math.min(
      this.client.playsLeft() - 1,
      this.options.games - this.gamesPlayed - 1,
    );

    const chosen = this.bestConfiguration(fixed);
    this.log(
      `Configuration: ${UPGRADES.map((u) => STYLE_NAMES[u][chosen[u] - 1]).join(", ")}` +
        `${rewards ? " (rewards pending)" : ""}`,
      "blue",
    );
    const bar = this.lockTarget(gamesAfter);
    if (bar > -Infinity) {
      this.log(
        `${gamesAfter} more game${gamesAfter === 1 ? "" : "s"} after this, so locking in at ${fmt(bar)}+`,
        "blue",
      );
    }
    let config = lobby.config;
    for (const upgrade of UPGRADES) {
      for (let i = 0; i < 3 && config[upgrade] !== chosen[upgrade]; i++) {
        config = this.client.choose(1313, UPGRADE_OPTION[upgrade]).config;
      }
      if (config[upgrade] !== chosen[upgrade]) throw new Error(`Couldn't set ${upgrade}`);
    }

    const start = this.client.choose(1313, START_OPTION);
    this.log(
      `Game ${this.gamesPlayed + 1} started. Stats: ${fmtStats(this.state(start).stats)}`,
      "blue",
    );
    return start;
  }

  // *** Playing

  private chooseMenu(observation: Observation): Observation {
    const game = this.state(observation);
    const ranked = evaluateMenus(this.ctx, game, this.options.samples, game.turn * 1000);
    this.log(
      `Turn ${game.turn} vs ${game.enemy ?? "?"} (${fmt(game.cheese)} cheese): ${ranked
        .map((r) => `${r.choice} ${fmt(r.value)}`)
        .join(", ")}`,
    );
    return this.client.choose(1314, MENU_OPTION[ranked[0].choice]);
  }

  private chooseButton(observation: Observation): Observation {
    const game = this.state(observation);
    const menu = MENUS.find((m) => MENU_CHOICE[m] === observation.choice) as Menu;
    const known = observation.buttons.flatMap((button) => {
      const id = BUTTONS[menu][button.name];
      return id === undefined ? [] : [{ button, id }];
    });
    if (known.length === 0) {
      // Nothing we recognise; take the first and let KoLmafia track the rest
      this.log(`  Unrecognised buttons; taking ${observation.buttons[0].name}`, "red");
      return this.client.choose(observation.choice as number, observation.buttons[0].option);
    }

    const well = known.find((k) => MENU_OPTIONS[menu][k.id].kind === "well");
    if (well && game.cheese >= WELL_COST) {
      this.log(`  -> ${well.button.name}`, "green");
      return this.client.choose(observation.choice as number, well.button.option);
    }

    const ranked = evaluateButtons(
      this.ctx,
      game,
      menu,
      known.map((k) => k.id),
      this.options.samples,
      game.turn * 1000,
    );
    const { button } = known[ranked[0].choice];
    this.log(`  ${ranked.map((r) => `${known[r.choice].button.name} ${fmt(r.value)}`).join(", ")}`);
    this.log(`  -> ${button.name}`, "green");
    return this.client.choose(observation.choice as number, button.option);
  }

  private fight(observation: Observation): Observation {
    const game = this.state(observation);
    const battle = battleNumber(game.turn);
    const enemy = game.enemy;
    if (!enemy) throw new Error("KoLmafia doesn't know which castle we're fighting.");
    const { stance, chances } = bestStance(this.ctx, game.stats, enemy, battle);
    this.log(
      `Battle ${battle} vs ${enemy}: ${STANCES.map((s, i) => `${s.name} ${fmt(chances[i] * 100)}%`).join(", ")}`,
    );
    const result = this.client.choose(1315, stance.option);
    const outcome = result.lastBattle;
    const gained = this.state(result).cheese - game.cheese;
    this.log(
      `  ${outcome?.won ? "Won" : "Lost"} (${outcome?.attacking ? "attacking" : "defending"})` +
        `${gained > 0 ? `, +${gained} cheese` : ""}`,
      outcome?.won ? "green" : "red",
    );
    return result;
  }

  private endGame(observation: Observation): Observation | null {
    // The rewards arrive with whichever option we pick here
    this.gamesPlayed += 1;
    const { cheese } = this.state(observation);
    this.log(`Game over: ${cheese} cheese.`, "blue");
    const remaining = Math.min(this.client.playsLeft(), this.options.games - this.gamesPlayed);
    const canLockIn = observation.buttons.some((b) => b.name === LOCK_IN);

    // Lock in if we hit what we were going for, or if this is the last game.
    // Once locked in there's nothing more to play for today.
    const target = this.lockTarget(remaining);
    if (this.options.lockIn && canLockIn && cheese >= target) {
      this.log(
        `Locking in ${cheese}${target > -Infinity ? ` (aimed for ${fmt(target)})` : ""}.`,
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
