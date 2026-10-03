import { CA, CASTLES, CastleKey, CD, Configuration, MA, MD, PA, PD } from "./constants";
import { BattleResult, Button, GameOver, Observation } from "./observation";

// String.prototype.matchAll isn't reliably available in KoLmafia's Rhino
function allMatches(text: string, pattern: RegExp): RegExpExecArray[] {
  const re = new RegExp(
    pattern.source,
    pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`,
  );
  const result: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) result.push(match);
  return result;
}

const NEEDLE_ROWS: Record<string, [number, number]> = {
  "233": [MA, MD],
  "252": [CA, CD],
  "270": [PA, PD],
};

function parseNeedles(html: string): Map<number, number> {
  const needles = new Map<number, number>();
  for (const [, top, left] of allMatches(
    html,
    /top: (\d+);? left: (\d+);?'[^>]*otherimages\/bbatt\/needle\.png/g,
  )) {
    const row = NEEDLE_ROWS[top];
    if (!row) continue;
    const value = Number(left);
    needles.set(value < 200 ? row[0] : row[1], value);
  }
  return needles;
}

function parseConfiguration(html: string): Partial<Configuration> {
  const config: Partial<Configuration> = {};
  for (const [, upgrade, value] of allMatches(
    html,
    /otherimages\/bbatt\/(barb|bridge|holes|moat)(\d)\.png/g,
  )) {
    config[upgrade as keyof Configuration] = Number(value) as 1 | 2 | 3;
  }
  return config;
}

function parseEnemy(html: string): CastleKey | null {
  const scanned = html.match(/the nearest enemy castle is .*?, (an? .*?)\./);
  if (scanned) {
    const castle = CASTLES.find((c) => c.description === scanned[1]);
    if (castle) return castle.key;
  }
  // The battle screen shows the looming castle instead
  const looming = html.match(/otherimages\/bbatt\/([a-z]+)_3\.png/);
  return CASTLES.find((c) => c.key === looming?.[1])?.key ?? null;
}

function parseButtons(html: string): Button[] {
  const buttons: Button[] = [];
  for (const form of html.split(/<form/i).slice(1)) {
    const option = form.match(/name=option value=['"]?(\d+)/);
    const name = form.match(/type=submit value="([^"]*)"/);
    if (!option || !name) continue;
    const description = form.match(/<Font color=blue><b>\[([^\]]*)\]/i)?.[1] ?? "";
    buttons.push({ option: Number(option[1]), name: name[1], description });
  }
  return buttons;
}

const BATTLE_LINE =
  /(Military|Castle|Psychological) results:\s*Your (attack strength|defense) is (higher|lower)/g;

function parseBattle(html: string): BattleResult | null {
  const results: [boolean, boolean, boolean] = [false, false, false];
  let attacking: boolean | null = null;
  for (const [, category, side, outcome] of allMatches(html, BATTLE_LINE)) {
    attacking = side === "attack strength";
    results[["Military", "Castle", "Psychological"].indexOf(category)] = outcome === "higher";
  }
  if (attacking === null) return null;
  return { attacking, results, won: html.includes("You have razed your foe") };
}

function parseGameOver(html: string): GameOver | null {
  const score = html.match(/collected ([\d,]+) cheese/);
  if (!html.includes("GAME OVER") || !score) return null;
  return {
    cheese: Number(score[1].replace(/,/g, "")),
    playsLeft: Number(html.match(/You can play <b>(\d+)<\/b> more time/)?.[1] ?? 0),
    canLockIn: html.includes("Lock in your score"),
  };
}

export function parseObservation(html: string): Observation {
  const choice = html.match(/name=whichchoice value=['"]?(\d+)/);
  const turn = html.match(/\(turn #(\d+)\)/);
  return {
    choice: choice ? Number(choice[1]) : null,
    turn: turn ? Number(turn[1]) : null,
    needles: parseNeedles(html),
    config: parseConfiguration(html),
    enemy: parseEnemy(html),
    canStart: html.includes("otherimages/bbatt/start.png"),
    buttons: parseButtons(html),
    cheeseGained: allMatches(html, /You gain (\d+) cheese/g).reduce(
      (sum, [, n]) => sum + Number(n),
      0,
    ),
    battle: parseBattle(html),
    gameOver: parseGameOver(html),
  };
}

// Parses the blue hint shown under each stat button, e.g.
// "Increase Castle attack, decrease Psychological defense, get cheese"
// into the stats it raises and lowers.
export function parseDescription(description: string): {
  up: Set<number>;
  down: Set<number>;
  cheese: boolean;
} {
  const up = new Set<number>();
  const down = new Set<number>();
  let cheese = false;
  let sign = 1;
  for (const clause of description.toLowerCase().split(",")) {
    if (clause.includes("cheese")) cheese = true;
    if (/increase/.test(clause)) sign = 1;
    if (/decrease|reduce/.test(clause)) sign = -1;
    const kinds = [/attack/.test(clause) ? 0 : null, /defen[sc]e/.test(clause) ? 1 : null].filter(
      (k): k is number => k !== null,
    );
    const categories = /\ball\b/.test(clause)
      ? [0, 1, 2]
      : [/military/, /castle/, /psychological/]
          .map((re, i) => (re.test(clause) ? i : null))
          .filter((c): c is number => c !== null);
    for (const category of categories) {
      for (const kind of kinds) {
        (sign > 0 ? up : down).add(category * 2 + kind);
      }
    }
  }
  return { up, down, cheese };
}
