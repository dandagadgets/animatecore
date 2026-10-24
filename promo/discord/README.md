# Mine Radar — 5 "Join the Discord" shorts

Five vertical promos (1080×1920, 30 fps, 17–18s each), each built on a line from Mine Radar's
About post and each ending on the same call to action: the logo, **JOIN THE DISCORD NOW**, a
button that gets clicked, chips for UPDATES / EVENTS / GIVEAWAYS / SNEAK PEEKS, and "Website
coming soon".

| # | Video | Hook | Style | Sound |
|---|---|---|---|---|
| 1 | `out/mine-radar-01-wooden-pickaxe.mp4` | "Searching for a good server with a wooden pickaxe:" | First-person mining: crack stages, drops into the hotbar, pickaxe snaps, neon upgrade shatters the wall into diamond-ore game modes | Crunchy digs, block breaks, snap, charge-up, drop |
| 2 | `out/mine-radar-02-loot-reel.mp4` | "What will you find next?" | Chest unlock, then a case-opening reel of game modes that lands on a legendary Mine Radar card | Rattles, reel ticks slowing down, fanfare, coin shower |
| 3 | `out/mine-radar-03-community.mp4` | "More than just a server list." | A Mine Radar chat channel fills up: role badges, typing dots, reactions, giveaway post, channel list | Lo-fi beat; dings and pops play the melody |
| 4 | `out/mine-radar-04-the-build.mp4` | "We're building something new." | Isometric island and radar tower built block by block, then "We're just getting started." | Satisfying block taps, radar power-up, bright drop |
| 5 | `out/mine-radar-05-launch.mp4` | "Got a server? Let's get it out there." | Countdown, liftoff, climb from daylight to space; the server deploys as a beacon and players stream in | Countdown beeps, rumble, anthem, pings, fireworks |

Each has a `-cover.png` thumbnail in `out/`.

- Copy comes from the About post. Usernames, chat messages and reaction counts are fictional
  ad dramatisation, and no real stats are claimed.
- The end card says "LINK IN BIO" because there's no invite link yet. Change the footer text in
  `discordCard` (`../shorts/shared/lib.js`) to add one.
- Audio is mastered to about −14 LUFS with true peaks at or below −1 dBTP after AAC encoding.
  All music and sound effects are synthesized from scratch.

## Re-rendering

```sh
./build.sh                    # all five
./build.sh 03-community       # just one
```

This reuses the shorts toolkit in `../shorts/shared` (the canvas helpers, the `discordCard` end
card, and the synth with `play_common`). Each video's `short.js` exports a cue sheet that its
`audio.py` turns into the soundtrack, so the sounds stay in sync with the picture.
