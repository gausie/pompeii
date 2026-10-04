import { myId, myName, myPrimestat, print } from "kolmafia";
import { $stat, get } from "libram";

import { Configuration } from "./constants";
import { Engine, Options } from "./engine";
import { GameClient, Score } from "./game";

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

// Today's leaderboard, which only shows the top 15, with us under it if we
// didn't make it
function showHiScores(client: GameClient): void {
  const scores = client.hiScores();
  if (!scores) return print("Couldn't get to the Bastille Battalion hi scores.", "red");
  const rank = scores.findIndex(isMe);
  print(`Today's top ${scores.length}:`, "blue");
  scores.forEach((score, i) => {
    print(`${i + 1}. ${score.name} ${score.cheese}`, i === rank ? "green" : undefined);
  });
  if (rank < 0) {
    const locked = client.lockedInScore();
    print(locked ? `?. ${myName()} ${locked}` : "No score locked in today.", "green");
  }
}

function help(): void {
  print("pompeii [rewards...] [games=N] [samples=N] [nopotions] [nolock]");
  print("pompeii scores  (just show today's leaderboard)");
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
}

export function main(args = ""): void {
  const words = args.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.includes("help")) return help();
  if (words.includes("scores")) return showHiScores(new GameClient());

  const options: Options = {
    rewards: {},
    games: 5,
    samples: 16,
    // Per-character opt-out, e.g. for characters that shouldn't appear on the leaderboard
    lockIn: !get("pompeiiNoLock", false),
  };
  let potions = true;

  for (const word of words) {
    const [key, value] = word.split("=");
    if (key === "games") options.games = Number(value);
    else if (key === "samples") options.samples = Number(value);
    else if (word === "nopotions") potions = false;
    else if (word === "nolock") options.lockIn = false;
    else if (word === "mainstat") Object.assign(options.rewards, WORDS[mainstat()]);
    else if (WORDS[word]) Object.assign(options.rewards, WORDS[word]);
    else {
      print(`Unknown argument "${word}"`, "red");
      return help();
    }
  }

  const client = new GameClient();
  if (potions) client.drinkPotions();
  new Engine(client, options).run();
  const locked = client.lockedInScore();
  print(locked ? `Locked in ${locked} today.` : "No score locked in today.", "blue");
}
