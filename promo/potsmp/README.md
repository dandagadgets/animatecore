# PotSMP Season IV — 3 YouTube Shorts ad tests

Three vertical ads (1080×1920, 30 fps), each a different angle on Season IV, for A/B testing on
YouTube. All copy comes from the Season IV announcement, and each ends on the same card: the
PotSMP logo, SEASON IV, OUT NOW, JAVA + BEDROCK, PROXIMITY VOICE CHAT and **IP IN DESCRIPTION**.

| # | Ad | Length | Angle | Hook |
|---|---|---|---|---|
| 1 | `out/potsmp-01-features.mp4` | 20s | Feature speedrun: story progress bar and countdown timer, 10 beat-cut feature cards, then +342 MORE | "10 new things in 15 seconds" |
| 2 | `out/potsmp-02-drowned-captain.mp4` | 18.5s | Spooky boss trailer: eyes in a flooded dungeon, boss rise and boss bar, lightning/slowness/blindness weapon fight | "Something is waiting in the dungeons..." → "Think you can defeat him?" |
| 3 | `out/potsmp-03-crates.mp4` | 17.6s | Comedy comparison: other servers' crates land on 1x dirt and beg for keys; PotSMP's selective crates let you pick | "Other servers' crates:" → "YOU PICK. NO GAMBLING." |

Each has a `-cover.png` thumbnail in `out/`.

- **Assumption:** the ads say **OUT NOW**, since the announcement gave 24 Oct 2026 as the release
  date. The End War event is shown as "week one", meaning 7 days after launch.
- **Testing tip:** run all three with the same targeting and budget for a few days, then compare
  view rate and average view duration. The pinned comment or description should carry the IP.
- Music and sound effects are synthesized from scratch, so there are no copyright claims. Audio
  sits at about −14 LUFS with true peaks at or below −1 dBTP after AAC encoding.

## Re-rendering

```sh
./build.sh                  # all three
./build.sh 02-drowned-captain
```

Uses the shared toolkit in `../shorts/shared` plus the PotSMP kit in `shared/pot.js` (palette,
bats, potion splash, sprites, end card). The brand art in `shared/assets/` is the client's.
