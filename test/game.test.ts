import { readFileSync } from "fs";
import { describe, expect, it, vi } from "vitest";

import { CA, CD, MA, MD, PA, PD } from "../src/constants";
import { BastillePrefs, parseHiScores, readObservation } from "../src/game";

// libram needs KoLmafia to load; game.ts only touches it when playing
vi.mock("libram", () => ({ $item: () => ({}), $items: () => [], get: vi.fn(), have: vi.fn() }));

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/test_bastille_${name}.html`, import.meta.url), "utf8");

// KoLmafia's preferences on turn 4 of a real game
const PREFS: BastillePrefs = {
  _bastilleCurrentStyles: "BARBECUE,DRAFTSMAN,GESTURE,SHARKS",
  _bastilleStats: "MA=3,MD=7,CA=0,CD=4,PA=3,PD=4",
  _bastilleEnemyCastle: "berserker",
  _bastilleGameTurn: 4,
  _bastilleCheese: 278,
  _bastilleLastBattleWon: true,
  _bastilleLastBattleResults: "MA>MD,CA>CD,PA>PD",
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
    expect(Object.fromEntries(page.needles)).toEqual({
      [MA]: 3,
      [MD]: 7,
      [CA]: 0,
      [CD]: 4,
      [PA]: 3,
      [PD]: 4,
    });
    expect(page.turn).toBe(4);
    expect(page.cheese).toBe(278);
    expect(page.enemy).toBe("berserker");
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
    });
    expect(page.config).toEqual({});
    expect(page.needles.size).toBe(0);
    expect(page.enemy).toBeNull();
    expect(page.lastBattle).toBeNull();
  });
});

describe("parseHiScores", () => {
  it("parses today's leaderboard", () => {
    const scores = parseHiScores(fixture("hiscores"));
    expect(scores).toHaveLength(8);
    expect(scores?.[0]).toEqual({ playerId: 1197090, name: "gaUsie", cheese: 1579 });
    expect(scores?.[7]).toEqual({ playerId: 754053, name: "Gargonite", cheese: 19 });
  });

  it("returns null for other pages", () => {
    expect(parseHiScores("<html>Results: You can't do that.</html>")).toBeNull();
  });
});
