import { myId, myName, myPrimestat, print } from "kolmafia";
import { $stat, get, sinceKolmafiaRevision } from "libram";

import { Configuration, HI_SCORES_SHOWN } from "./constants";
import { Engine, Options } from "./engine";
import { GameClient } from "./game";
import { Score } from "./observation";

const WORDS: Record<string, Partial<Configuration>> = {
  barbecue: { barb: 1 },
  bbq: { barb: 1 },
  babar: { barb: 2 },
  barbershop: { barb: 3 },
  brutalist: { bridge: 1 },
  brogues: { bridge: 1 },
  draftsman: { bridge: 2 },
  gloves: { bridge: 2 },
  nouveau: { bridge: 3 },
  nosering: { bridge: 3 },
  cannon: { holes: 1 },
  catapult: { holes: 2 },
  gesture: { holes: 3 },
  sharks: { moat: 1 },
  lava: { moat: 2 },
  truth: { moat: 3 },
  muscle: { barb: 2, bridge: 1, holes: 1 },
  myst: { barb: 1, bridge: 2, holes: 2 },
  moxie: { barb: 3, bridge: 3, holes: 3 },
};

// Which of the stat-themed style sets suits our mainstat
function mainstat(): "muscle" | "myst" | "moxie" {
  const stat = myPrimestat();
  if (stat === $stat`Muscle`) return "muscle";
  if (stat === $stat`Mysticality`) return "myst";
  return "moxie";
}

const isMe = (score: Score) => score.playerId === Number(myId());

const isWholeNumber = (n: number) => Number.isInteger(n) && n >= 0;

function printScores(scores: Score[]): number {
  const rank = scores.findIndex(isMe);
  scores.forEach((score, i) => {
    print(`${i + 1}. ${score.name} ${score.cheese}`, i === rank ? "green" : undefined);
  });
  return rank;
}

// Today's leaderboard, which only shows the top 15, with us under it if we
// didn't make it
function showHiScores(client: GameClient): void {
  const scores = client.hiScores();
  if (!scores) return print("Couldn't get to the Bastille Battalion hi scores.", "red");
  print(`Today's top ${scores.today.length}:`, "blue");
  if (printScores(scores.today) < 0) {
    const locked = client.lockedInScore();
    print(locked ? `?. ${myName()} ${locked}` : "No score locked in today.", "green");
  }
}

// Yesterday's final standings. Our locked-in score has been reset by now, so
// there's nothing to show if we didn't place.
function showYesterday(client: GameClient): void {
  const scores = client.hiScores();
  if (!scores) return print("Couldn't get to the Bastille Battalion hi scores.", "red");
  if (scores.yesterday.length === 0) return print("No final standings for yesterday.", "red");
  print(`Yesterday's top ${scores.yesterday.length}:`, "blue");
  if (printScores(scores.yesterday) < 0) print("You didn't place yesterday.", "green");
}

function help(): void {
  print("pompeii [rewards...] [games=N] [samples=N] [nopotions] [nolock]");
  print("pompeii [place=N] [min=N] [vouchers=N] [maxprice=N] [...]");
  print("pompeii scores  (just show today's leaderboard)");
  print("pompeii yesterday  (just show yesterday's final standings)");
  print("Plays Bastille Battalion to maximise cheese.");
  print("");
  print("Rewards for the first game of the day; anything not given is chosen for score:");
  print("  barbecue/babar/barbershop, brutalist/draftsman/nouveau, cannon/catapult/gesture,");
  print("  sharks/lava/truth, or muscle/myst/moxie/mainstat for all three stat-themed ones.");
  print("games=N    stop after N games (default: all remaining plays)");
  print("samples=N  rollouts per decision; higher is slower but sharper (default 16)");
  print(
    "nopotions  don't top up sharkfin gumbo/boiling broth/interrogative elixir to 3 turns each",
  );
  print("nolock     never lock in a score for the leaderboard");
  print("");
  print("Or set a goal, and lock in the first score that meets it however many games it takes");
  print("(with nolock, just stop there):");
  print(`place=N    beat whoever is in place N (1-${HI_SCORES_SHOWN}) on today's board`);
  print("min=N      score at least N, or min=yesterday for yesterday's winning score");
  print("vouchers=N buy and use up to N loaner vouchers for more plays (default 0)");
  print("maxprice=N most to pay for a voucher (default autoBuyPriceLimit)");
}

export function main(args = ""): void {
  // Bastille Battalion tracking
  sinceKolmafiaRevision(29360);
  const words = args.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.includes("help")) return help();
  if (words.includes("scores")) return showHiScores(new GameClient());
  if (words.includes("yesterday")) return showYesterday(new GameClient());

  const options: Options = {
    rewards: {},
    games: Infinity,
    samples: 16,
    // Per-character opt-out, e.g. for characters that shouldn't appear on the leaderboard
    lockIn: !get("pompeiiNoLock", false),
  };
  let potions = true;
  let place: number | undefined;
  let min: number | "yesterday" | undefined;
  let vouchers = 0;
  let maxPrice = get("autoBuyPriceLimit");

  for (const word of words) {
    const [key, value] = word.split("=");
    if (key === "games") options.games = Number(value);
    else if (key === "samples") options.samples = Number(value);
    else if (key === "place") place = Number(value);
    else if (key === "min") min = value === "yesterday" ? value : Number(value);
    else if (key === "vouchers") vouchers = Number(value);
    else if (key === "maxprice") maxPrice = Number(value);
    else if (word === "nopotions") potions = false;
    else if (word === "nolock") options.lockIn = false;
    else if (word === "mainstat") Object.assign(options.rewards, WORDS[mainstat()]);
    else if (WORDS[word]) Object.assign(options.rewards, WORDS[word]);
    else {
      print(`Unknown argument "${word}"`, "red");
      return help();
    }
  }

  if (place !== undefined && !(isWholeNumber(place) && place >= 1 && place <= HI_SCORES_SHOWN)) {
    return print(`place should be from 1 to ${HI_SCORES_SHOWN}.`, "red");
  }
  if (typeof min === "number" && !(min > 0)) {
    return print("min should be a score or yesterday.", "red");
  }
  if (!isWholeNumber(vouchers)) return print("vouchers should be a whole number.", "red");
  if (!isWholeNumber(maxPrice)) return print("maxprice should be a whole number of meat.", "red");
  if (place === undefined && min === undefined && vouchers > 0) {
    return print("Vouchers are only used when aiming for a place or min.", "red");
  }

  if (place !== undefined || min !== undefined) options.goal = { place, min, vouchers, maxPrice };

  const client = new GameClient();
  if (potions) client.drinkPotions();
  new Engine(client, options).run();
  const locked = client.lockedInScore();
  print(locked ? `Locked in ${locked} today.` : "No score locked in today.", "blue");
}
