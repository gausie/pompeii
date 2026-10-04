# pompeii

Plays Bastille Battalion for the most cheese it can get.

```
pompeii [rewards...] [games=N] [samples=N] [nopotions] [nolock]
pompeii scores
```

Run `pompeii help` for the options. By default it tops up the Bastille potions to 3 turns each,
plays every game left today with every style picked for score, and locks in a score for the
leaderboard when it's unlikely to do better with the games remaining. Name rewards (e.g.
`pompeii mainstat draftsman`) to fix those styles for the first game. Afterwards it shows where
you placed on today's leaderboard; `pompeii scores` shows just that.

## How it decides

- Your stats are known exactly: everyone starts from the same baseline, and every style and
  prep option changes them by a known amount. The needles double-check that, and keep it on track
  if KoL adds a button it doesn't recognise.
- It reads the game from what KoLmafia already tracks (the `_bastille*` preferences and the
  choice options), so the only page it parses itself is the leaderboard.
- Every castle of a type starts with the same stats, and survivors grow 5-25% per stat each round
  of the bracket, so the odds of each battle comparison are computed exactly.
- Stances are chosen to maximise the chance of winning the battle. Configurations, menus and
  options are chosen by Monte Carlo rollouts of the rest of the game under a greedy policy
  (always look for cheese, take the biggest haul), so they can only improve on it.

If you've ascended today, the score you locked in before is still on the leaderboard and you get
another five plays. It only locks in a score that beats it.

Set `pompeiiNoLock=true` on a character to stop it ever locking in a score there.

## Development

```bash
yarn build          # build to dist/
yarn test           # unit tests and end-to-end games against the simulator
yarn simulate       # benchmark against simple strategies in a few simulated worlds
yarn bars           # regenerate the lock-in bars (src/data/bars.json) after changing the engine
yarn install-mafia  # symlink into KoLmafia
```

`test/simulator.ts` is an offline stand-in for the game. The engine talks to it and to KoLmafia
through the same `Client` interface (`src/observation.ts`), so whole days can be played in tests.
It keeps the game's hidden state private and only reveals it for auditing once play is over.

The lock-in bars are what the engine expects to score by playing on, so they depend on how well
it plays. `yarn test` (and CI) replays fresh simulated games and fails if they've drifted.
