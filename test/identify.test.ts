import { describe, expect, it } from "vitest";

import { identify } from "../src/identify";
import { fullPools } from "../src/strategy";

const pools = fullPools();
const button = (name: string, description = "") => ({ option: 1, name, description });

describe("identify", () => {
  it("uses the button name", () => {
    expect(identify("offense", button("Improve the keep"), pools.offense)).toBe(9);
  });

  it("tells apart the buttons with identical descriptions", () => {
    expect(identify("defense", button("Blunt everything"), pools.defense)).toBe(11);
    expect(identify("defense", button("Do the plowshares thing"), pools.defense)).toBe(12);
  });

  it("matches an unrecognised button's description against what's left", () => {
    const sloppy = button("Some new name", "Increase all attack strengths, decrease all defense");
    expect(identify("offense", sloppy, pools.offense)).toBe(11);
    const withoutEleven = pools.offense.filter((id) => id !== 11);
    expect(identify("offense", sloppy, withoutEleven)).toBe(12);

    const cheesy = button(
      "Another new name",
      "Increase Castle attack, decrease Psychological defense, get cheese",
    );
    expect(identify("offense", cheesy, pools.offense)).toBe(14);
  });

  it("gives up on buttons it can't place", () => {
    expect(identify("defense", button("Mystery"), pools.defense)).toBeNull();
    expect(identify("cheese", button("Mystery", "Gain cheese"), pools.cheese)).toBeNull();
  });
});
