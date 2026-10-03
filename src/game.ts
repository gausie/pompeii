import {
  availableAmount,
  Effect,
  haveEffect,
  Item,
  itemAmount,
  myHash,
  print,
  retrieveItem,
  use,
  userConfirm,
  visitUrl,
} from "kolmafia";
import { $item, $items, get, have } from "libram";

import { BOOST_EFFECTS, BOOST_POTIONS } from "./constants";
import { Client, Observation } from "./observation";
import { parseObservation } from "./parse";

const RIG = $item`Bastille Battalion control rig`;
const VOUCHER = $item`Bastille Battalion control rig loaner voucher`;
const DAILY_ITEMS = $items`Brutal brogues, Draftsman's driving gloves, Nouveau nosering`;
const PLAYS_PER_DAY = 5;

export class GameClient implements Client {
  current(): Observation {
    return parseObservation(visitUrl("choice.php"));
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
    return parseObservation(visitUrl(`inv_use.php?whichitem=${item.id}&pwd=${myHash()}`));
  }

  choose(choice: number, option: number): Observation {
    return parseObservation(
      visitUrl(`choice.php?whichchoice=${choice}&option=${option}&pwd=${myHash()}`),
    );
  }

  boosts(): [number, number, number] {
    return BOOST_EFFECTS.map((id) => haveEffect(Effect.get(id))) as [number, number, number];
  }

  rewardsPending(): boolean {
    return !DAILY_ITEMS.some((item) => have(item));
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
