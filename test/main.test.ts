import { beforeEach, describe, expect, it, vi } from "vitest";

import { Options } from "../src/engine";
import { main } from "../src/main";

// main only parses arguments, so the game and KoLmafia are stubbed out
const { print, engines, hiScores } = vi.hoisted(() => {
  const engines: Options[] = [];
  return { print: vi.fn(), engines, hiScores: vi.fn() };
});

vi.mock("kolmafia", () => ({ print, myId: () => "1", myName: () => "me", myPrimestat: vi.fn() }));
vi.mock("libram", () => ({
  $stat: vi.fn(),
  sinceKolmafiaRevision: vi.fn(),
  get: (name: string, fallback?: unknown) => (name === "autoBuyPriceLimit" ? 20000 : fallback),
}));
vi.mock("../src/game", () => ({
  GameClient: class {
    hiScores = hiScores;
    drinkPotions() {}
    lockedInScore() {
      return 0;
    }
  },
}));
vi.mock("../src/engine", () => ({
  Engine: class {
    constructor(_client: unknown, options: Options) {
      engines.push(options);
    }
    run() {}
  },
}));

beforeEach(() => {
  print.mockClear();
  hiScores.mockReset();
  engines.length = 0;
});

describe("main", () => {
  it("passes the voucher limit and price on with a goal", () => {
    main("place=1 vouchers=3 maxprice=500");
    expect(engines).toHaveLength(1);
    expect(engines[0].goal).toMatchObject({ place: 1, vouchers: 3, maxPrice: 500 });
  });

  it("defaults the price to autoBuyPriceLimit", () => {
    main("min=1900 vouchers=3");
    expect(engines[0].goal).toMatchObject({ vouchers: 3, maxPrice: 20000 });
  });

  it("passes an early minimum on as a goal", () => {
    main("place=1 early=yesterday vouchers=2");
    expect(engines[0].goal).toMatchObject({ place: 1, early: "yesterday", vouchers: 2 });
  });

  it.each(["early=soon", "early=0", "min=-3"])("won't play with %s", (arg) => {
    main(`place=1 ${arg}`);
    expect(engines).toHaveLength(0);
  });

  it("passes a fallback on with a goal", () => {
    main("place=1 min=yesterday fallback");
    expect(engines[0].goal).toMatchObject({ fallback: true });
  });

  it("won't take a fallback without a goal", () => {
    main("fallback");
    expect(engines).toHaveLength(0);
    expect(print).toHaveBeenCalledWith(expect.stringContaining("fallback"), "red");
  });

  // It might be partway through a game, when the board can't be read
  it("leaves min=yesterday for the engine to read from the lobby", () => {
    main("place=1 min=yesterday");
    expect(engines[0].goal).toMatchObject({ place: 1, min: "yesterday" });
    expect(hiScores).not.toHaveBeenCalled();
  });

  it.each(["vouchers", "vouchers=lots", "vouchers=-1", "vouchers=1.5"])(
    "won't play with %s",
    (arg) => {
      main(`place=1 ${arg}`);
      expect(engines).toHaveLength(0);
      expect(print).toHaveBeenCalledWith(expect.stringContaining("vouchers"), "red");
    },
  );

  it.each(["maxprice", "maxprice=cheap", "maxprice=-5", "maxprice=1.5"])(
    "won't play with %s",
    (arg) => {
      main(`place=1 vouchers=3 ${arg}`);
      expect(engines).toHaveLength(0);
      expect(print).toHaveBeenCalledWith(expect.stringContaining("maxprice"), "red");
    },
  );
});
