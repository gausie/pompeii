import { CastleKey, Configuration } from "./constants";

// What the engine can see after each request. The KoLmafia client builds this
// from KoL's HTML; the simulator builds it straight from its game state.

export type Button = { option: number; name: string; description: string };

export type BattleResult = {
  attacking: boolean;
  // Whether we won the military, castle and psychological comparisons
  results: [boolean, boolean, boolean];
  won: boolean;
};

export type GameOver = { cheese: number; playsLeft: number; canLockIn: boolean };

export type Observation = {
  // Current choice adventure, or null if we're no longer in one
  choice: number | null;
  // Only shown on the main game screen (1314)
  turn: number | null;
  // Needle position (pixels from the left) by stat index
  needles: Map<number, number>;
  config: Partial<Configuration>;
  // Castle we'll fight next, if shown
  enemy: CastleKey | null;
  // Whether the configuration screen offers to start a game
  canStart: boolean;
  buttons: Button[];
  // Cheese announced as gained by the request that produced this
  cheeseGained: number;
  battle: BattleResult | null;
  gameOver: GameOver | null;
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
