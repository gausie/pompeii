# pompeii

Plays Bastille Battalion for the most cheese it can get.

Stances are chosen to maximise the chance of winning the battle. Configurations, menus and options
are chosen by Monte Carlo rollouts of the rest of the game under a greedy policy (always look for
cheese, take the biggest haul).

```
pompeii [rewards...] [games=N] [samples=N] [nopotions] [nolock]
pompeii [place=N] [min=N|yesterday] [early=N|yesterday] [fallback] [vouchers=N] [maxprice=N]
pompeii scores
pompeii yesterday
```

Run `pompeii help` for the options. By default it tops up the Bastille potions to 3 turns each,
plays every game left today with every style picked for score, and locks in a score for the
leaderboard when it's unlikely to do better with the games remaining. Name rewards (e.g.
`pompeii mainstat draftsman`) to fix those styles for the first game. `pompeii scores` shows
today's leaderboard and `pompeii yesterday` shows yesterday's final standings.

Or give it a goal and it locks in the first score that meets it. `place=N` beats whoever is in
place N on today's board, read again before every game since it moves as people lock in. `min=N`
won't take less than N, and `min=yesterday` won't take less than yesterday's winning score.
`early=` is the same but only while today's board has fewer than 15 scores, for when today's
scores are still too low to go on. It aims for the highest of whichever are given.

Once the day's plays are spent it can buy and use loaner vouchers for one more game each, but only
as many as `vouchers=N` allows (none by default), each for no more than `maxprice=N` (default: your
`autoBuyPriceLimit`). If the goal is never met, nothing is locked in, unless `fallback` is given,
in which case it locks in the last game it plays. With `nolock` it just stops once it meets the
goal.

```
pompeii place=1 early=yesterday fallback
```

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
It keeps the game's hidden state, like the enemy castles, private.

The lock-in bars are what the engine expects to score by playing on, so they depend on how well
it plays. `yarn test` (and CI) replays fresh simulated games and fails if they've drifted.
