import { BUTTONS, Menu, MENU_OPTIONS } from "./constants";
import { Button } from "./observation";
import { parseDescription } from "./parse";

// Works out which option a button is. The name tells us for every button we
// know of; if KoL adds one we don't, we match its blue hint text against the
// options still to come.
export function identify(menu: Menu, button: Button, pool: number[]): number | null {
  const named = BUTTONS[menu][button.name];
  if (named) return named;
  if (menu === "cheese" || !button.description) return null;

  const { up, down, cheese } = parseDescription(button.description);
  const match = pool.find((id) => {
    const option = MENU_OPTIONS[menu][id];
    if (option.kind !== "stats" || cheese !== option.cheese > 0) return false;
    return option.delta.every((d, stat) =>
      d > 0 ? up.has(stat) : d < 0 ? down.has(stat) : !up.has(stat) && !down.has(stat),
    );
  });
  return match ?? null;
}
