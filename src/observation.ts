import { Configuration } from "./constants";
import { GameState } from "./strategy";

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
  // The game in progress, or outside one the last one; null if we don't know
  // our stats
  game: GameState | null;
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
