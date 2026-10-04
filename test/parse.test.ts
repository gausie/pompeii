import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

import { CA, CD, MA, MD, PA, PD } from "../src/constants";
import { parseDescription, parseHiScores, parseObservation } from "../src/parse";

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/test_bastille_${name}.html`, import.meta.url), "utf8");

describe("parseObservation", () => {
  it("parses the first turn of a game", () => {
    const page = parseObservation(fixture("game1_0_1"));
    expect(page.choice).toBe(1314);
    expect(page.turn).toBe(1);
    expect(page.enemy).toBe("shieldmaster");
    expect(page.config).toEqual({ barb: 3, moat: 3, bridge: 2, holes: 3 });
    expect(Object.fromEntries(page.needles)).toEqual({
      [MA]: 124,
      [CA]: 126,
      [PA]: 128,
      [MD]: 243,
      [CD]: 244,
      [PD]: 248,
    });
  });

  it("parses offense buttons with their descriptions", () => {
    const page = parseObservation(fixture("game1_1"));
    expect(page.choice).toBe(1317);
    expect(page.buttons).toEqual([
      {
        option: 1,
        name: "Let the citizens hurl cheese at you",
        description: "Increase Castle attack, decrease Psychological defense, get cheese",
      },
      {
        option: 2,
        name: "Adopt the radical combat style",
        description: "Increase all attack strengths, decrease all defense",
      },
      {
        option: 3,
        name: "Commission some art",
        description: "Increase Psychological attack strength",
      },
    ]);
  });

  it("parses the battle screen", () => {
    const page = parseObservation(fixture("game1_2_3"));
    expect(page.choice).toBe(1315);
    expect(page.enemy).toBe("shieldmaster");
    expect(page.buttons.map((b) => b.option)).toEqual([1, 2, 3]);
  });

  it("parses a won battle and the next enemy", () => {
    const page = parseObservation(fixture("game1_3_4"));
    expect(page.battle).toEqual({ attacking: true, results: [true, false, true], won: true });
    expect(page.cheeseGained).toBe(38);
    expect(page.turn).toBe(4);
    expect(page.enemy).toBe("berserker");
  });

  it("parses a lost battle and game over", () => {
    const page = parseObservation(fixture("game1_12_loss"));
    expect(page.battle).toEqual({ attacking: true, results: [true, false, false], won: false });
    expect(page.gameOver).toEqual({ cheese: 390, playsLeft: 4, canLockIn: true });
    expect(page.choice).toBe(1316);
  });

  it("parses cheese buttons", () => {
    const page = parseObservation(fixture("game1_11"));
    expect(page.choice).toBe(1319);
    expect(page.buttons.map((b) => b.name)).toEqual([
      "Raid the cave",
      "Have the cheese contest",
      "Let the cheese horse in",
    ]);
  });

  it("parses needles after changing configuration", () => {
    const page = parseObservation(fixture("configure_1"));
    expect(page.choice).toBe(1313);
    expect(page.needles.size).toBe(6);
    expect(page.config.barb).toBe(1);
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
    expect(parseHiScores(fixture("configure_1"))).toBeNull();
  });
});

describe("parseDescription", () => {
  it("handles single and paired stats", () => {
    expect(
      parseDescription("Increase Military and Castle defense, reduce Psychological defense"),
    ).toEqual({
      up: new Set([MD, CD]),
      down: new Set([PD]),
      cheese: false,
    });
  });

  it("handles all-stat changes and cheese", () => {
    expect(parseDescription("Increase all attack strengths, decrease all defense")).toEqual({
      up: new Set([MA, CA, PA]),
      down: new Set([MD, CD, PD]),
      cheese: false,
    });
    expect(
      parseDescription("Increase Military defense, reduce Castle attack strength, get cheese"),
    ).toEqual({ up: new Set([MD]), down: new Set([CA]), cheese: true });
  });
});
