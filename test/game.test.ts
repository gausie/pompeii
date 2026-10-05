import { readFileSync } from "fs";
import { describe, expect, it, vi } from "vitest";

import { BastillePrefs, parseHiScores, poolsAfter, readObservation } from "../src/game";
import { fullPools } from "../src/strategy";

// libram needs KoLmafia to load; game.ts only touches it when playing
vi.mock("libram", () => ({ $item: () => ({}), $items: () => [], get: vi.fn(), have: vi.fn() }));

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/test_bastille_${name}.html`, import.meta.url), "utf8");

// KoLmafia's preferences on turn 4 of a real game
const PREFS: BastillePrefs = {
  _bastilleCurrentStyles: "BARBECUE,DRAFTSMAN,GESTURE,SHARKS",
  _bastilleStats: "MA=120,MD=140,CA=100,CD=120,PA=120,PD=120",
  _bastilleEnemyCastle: "berserker",
  _bastilleGameTurn: 4,
  _bastilleCheese: 278,
  _bastilleLastBattleWon: true,
  _bastilleLastBattleResults: "MA>MD,CA>CD,PA>PD",
  _bastilleOptionsTaken: "Raid the cave,Rob the suburb",
};

const read = (prefs: Partial<BastillePrefs> = {}, options: Record<number, string> = {}) =>
  readObservation({ choice: 1314, options, prefs: { ...PREFS, ...prefs } });

describe("readObservation", () => {
  it("reads KoLmafia's record of the game", () => {
    const page = read({}, { 1: "Raid the cave", 2: "Scrape out the mine" });
    expect(page.choice).toBe(1314);
    expect(page.buttons).toEqual([
      { option: 1, name: "Raid the cave" },
      { option: 2, name: "Scrape out the mine" },
    ]);
    expect(page.config).toEqual({ barb: 1, bridge: 2, holes: 3, moat: 1 });
    expect(page.game).toMatchObject({
      turn: 4,
      stats: [120, 140, 100, 120, 120, 120],
      cheese: 278,
      enemy: "berserker",
    });
    expect(page.game?.pools.cheese).toHaveLength(14);
    expect(page.lastBattle).toEqual({ attacking: true, results: [true, true, true], won: true });
  });

  it("reads a lost battle we were defending", () => {
    const page = read({
      _bastilleLastBattleWon: false,
      _bastilleLastBattleResults: "MD<MA,CD>CA,PD<PA",
    });
    expect(page.lastBattle).toEqual({
      attacking: false,
      results: [false, true, false],
      won: false,
    });
  });

  it("copes with a day that hasn't started", () => {
    const page = read({
      _bastilleCurrentStyles: "",
      _bastilleStats: "",
      _bastilleEnemyCastle: "",
      _bastilleLastBattleResults: "",
      _bastilleOptionsTaken: "",
    });
    expect(page.config).toEqual({});
    expect(page.game).toBeNull();
    expect(page.lastBattle).toBeNull();
  });
});

describe("poolsAfter", () => {
  it("leaves out the buttons already taken this game", () => {
    const pools = poolsAfter(["Use the wishing well", "Improve the keep", "Something new"]);
    expect(pools.cheese).not.toContain(16);
    expect(pools.offense).not.toContain(9);
    expect(pools.cheese).toHaveLength(fullPools().cheese.length - 1);
    expect(pools.defense).toEqual(fullPools().defense);
  });
});

describe("parseHiScores", () => {
  it("parses today's leaderboard", () => {
    const scores = parseHiScores(fixture("hiscores"));
    expect(scores?.today).toHaveLength(8);
    expect(scores?.today[0]).toEqual({ playerId: 1197090, name: "gaUsie", cheese: 1579 });
    expect(scores?.today[7]).toEqual({ playerId: 754053, name: "Gargonite", cheese: 19 });
    expect(scores?.yesterday).toEqual([]);
  });

  it("splits out yesterday's final standings", () => {
    const scores = parseHiScores(fixture("hiscores_yesterday"));
    expect(scores?.today).toHaveLength(15);
    expect(scores?.today[0]).toEqual({ playerId: 119474, name: "adwriter", cheese: 1890 });
    expect(scores?.today[14]).toEqual({ playerId: 360318, name: "GadTheHero", cheese: 412 });
    expect(scores?.yesterday).toHaveLength(15);
    expect(scores?.yesterday[0]).toEqual({ playerId: 2138850, name: "PeKaJe", cheese: 1913 });
    expect(scores?.yesterday[14]).toEqual({ playerId: 3235855, name: "Prusias", cheese: 975 });
  });

  it("returns null for other pages", () => {
    expect(parseHiScores("<html>Results: You can't do that.</html>")).toBeNull();
  });
});
