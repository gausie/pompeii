import { CastleKey, Configuration } from "./constants";

// What the engine can see after each request: the choice we're in, its
// buttons, and KoLmafia's running record of the castle and the game. That
// record carries over between games, so the game fields describe the game in
// progress or, outside one, the last one. The KoLmafia client reads it from
// KoLmafia's preferences; the simulator mirrors it from its own state.

export type Button = { option: number; name: string };

export type BattleResult = {
  attacking: boolean;
  // Whether we won the military, castle and psychological comparisons
  results: [boolean, boolean, boolean];
  won: boolean;
};

export type Observation = {
  // Current choice adventure, or null if we're no longer in one
  choice: number | null;
  buttons: Button[];
  config: Partial<Configuration>;
  // Needle readings by stat index, in KoLmafia's units (see tracker.ts)
  needles: Map<number, number>;
  turn: number;
  // Cheese announced so far. Some cheese turns up unannounced, so this can
  // run behind until the game is over and the final score is shown.
  cheese: number;
  enemy: CastleKey | null;
  lastBattle: BattleResult | null;
};

// Everything the engine needs from the outside world
export interface Client {
  // Whatever is on screen now: the rig's choice if we're in it
  current(): Observation;
  // Use the rig (or a voucher) to enter the game; null if we can't
  open(): Observation | null;
  choose(choice: number, option: number): Observation;
  // Turns of Shark Tooth Grin, Boiling Determination, Enhanced Interrogation
  boosts(): [number, number, number];
  // Whether the first game of the day's rewards are still to come
  rewardsPending(): boolean;
  // Games we can still start today
  playsLeft(): number;
  log(message: string, color?: string): void;
}
