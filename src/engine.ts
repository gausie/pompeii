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
  goal?: Goal;
};

export type Goal = {
  // Beat whoever is in this place on today's board
  place?: number;
  min?: number | "yesterday";
  vouchers: number;
  maxPrice: number;
};

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

const fmt = (n: number) => Math.round(n).toString();
const fmtStats = (stats: Stats) => stats.map((v, i) => `${STAT_NAMES[i]} ${fmt(v)}`).join(", ");

export class Engine {
  ctx: Context;
  gamesPlayed = 0;
  private vouchersUsedThisRun = 0;
  private aim: number | null = null;
  // Read once, from the lobby, since we might start partway through a game
  private yesterdaysWinner: number | null = null;
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
    const locked = this.client.lockedInScore();
    if (this.options.goal && this.options.lockIn && locked > 0) {
      this.log(`Already locked in ${locked} today.`, "red");
      return;
    }
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
          if (!this.canStart(observation)) {
            this.client.choose(1313, 8);
            next = this.restock();
            break;
          }
          if (
            this.gamesPlayed >= this.options.games ||
            (this.options.goal && !this.updateAim(this.options.goal))
          ) {
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

  // Before every game, since the board moves as people lock in
  private updateAim(goal: Goal): boolean {
    const needsBoard =
      goal.place !== undefined || (goal.min === "yesterday" && this.yesterdaysWinner === null);
    const board = needsBoard ? this.client.readBoard() : null;
    if (needsBoard && !board) {
      this.log("Couldn't read the hi scores.", "red");
      return false;
    }
    let min = goal.min;
    if (min === "yesterday") {
      if (this.yesterdaysWinner === null) {
        const winner = board?.yesterday[0];
        if (!winner) {
          this.log("No final standings for yesterday to aim for.", "red");
          return false;
        }
        this.log(`Yesterday's winner ${winner.name} got ${winner.cheese}.`, "blue");
        this.yesterdaysWinner = winner.cheese;
      }
      min = this.yesterdaysWinner;
    }
    const aims = [1];
    const reasons: string[] = [];
    if (goal.place !== undefined) {
      const rival = board?.today[goal.place - 1];
      if (rival) aims.push(rival.cheese + 1);
      reasons.push(
        rival
          ? `${ordinal(goal.place)} place is ${rival.name} with ${rival.cheese}`
          : `no one is in ${ordinal(goal.place)} place yet`,
      );
    }
    if (min !== undefined) {
      aims.push(min);
      reasons.push(`the minimum is ${min}`);
    }
    const aim = Math.max(...aims);
    if (aim !== this.aim) this.log(`${reasons.join(" and ")}, so aiming for ${aim}+`, "blue");
    this.aim = aim;
    return true;
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
    if (!this.options.goal) {
      const bar = this.lockTarget(gamesAfter);
      if (bar > -Infinity) {
        this.log(
          `${gamesAfter} more game${gamesAfter === 1 ? "" : "s"} after this, so locking in at ${fmt(bar)}+`,
          "blue",
        );
      }
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
    const canLockIn = this.options.lockIn && observation.buttons.some((b) => b.name === LOCK_IN);

    // Lock in if we hit what we were going for, or if this is the last game.
    // Once locked in there's nothing more to play for today. A game picked up
    // partway through has no aim, so it can't meet a goal.
    const target = this.options.goal ? (this.aim ?? Infinity) : this.lockTarget(remaining);
    if (cheese >= target) {
      if (canLockIn) {
        this.log(
          `Locking in ${cheese}${target > -Infinity ? ` (aimed for ${fmt(target)})` : ""}.`,
          "green",
        );
        this.client.choose(1316, 1);
        return null;
      }
      if (this.options.goal) {
        this.log(`Reached ${fmt(target)}; stopping without locking in.`, "green");
        this.client.choose(1316, 3);
        return null;
      }
    }
    if (remaining > 0) return this.client.choose(1316, 2);
    this.client.choose(1316, 3);
    return this.restock();
  }

  // KoLmafia's count covers reruns; ours holds if its tracking ever breaks
  private vouchersUsed(): number {
    return Math.max(this.client.vouchersUsed(), this.vouchersUsedThisRun);
  }

  private restock(): Observation | null {
    const goal = this.options.goal;
    if (!goal || this.gamesPlayed >= this.options.games) return null;
    if (this.vouchersUsed() >= goal.vouchers) {
      this.log("Out of plays without meeting the goal, so nothing locked in.", "red");
      return null;
    }
    const lobby = this.client.useVoucher(goal.maxPrice);
    if (!lobby) return null;
    this.vouchersUsedThisRun += 1;
    if (lobby.choice !== 1313 || !this.canStart(lobby)) {
      this.log("That loaner voucher didn't give any more plays; not buying more.", "red");
      if (lobby.choice === 1313) this.client.choose(1313, 8);
      return null;
    }
    this.log(`Used loaner voucher ${this.vouchersUsed()} of ${goal.vouchers} today.`, "blue");
    return lobby;
  }
}
