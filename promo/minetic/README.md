# Minetic Media: 3 promo ads

Three vertical ads (1080×1920, 30 fps) for YouTube Shorts, TikTok and Reels, all selling Minetic
Media's video ads to Minecraft server owners. Each one ends on the same card: the Minetic Media
logo, VIDEO ADS FOR MINECRAFT SERVERS, "Ads that move players.", a **JOIN THE DISCORD** button that
gets clicked, LINK IN DESCRIPTION, and CUSTOM ANIMATION / NO-COPYRIGHT MUSIC chips.

| # | Ad | Length | Angle | Hook |
|---|---|---|---|---|
| 1 | `out/minetic-01-scroll.mp4` | 18s | Before/after: boring server ads get swiped straight past, then a Minetic ad stops the thumb ("SCROLL STOPPED"), a montage of real work plays with feature stickers, then "Your server could be next." | "Your server ad right now:" |
| 2 | `out/minetic-02-showreel.mp4` | 16.5s | 128 BPM showreel: WE MAKE / MINECRAFT / SERVER ADS slam in, then a carousel of phones plays one ad type per two beats (boss trailers, comedy ads, server lists…), then a wall of phones with an empty "your server here" slot | "WE MAKE" |
| 3 | `out/minetic-03-craft.mp4` | 17.2s | A crafting grid: Your Logo + Your Server IP + Best Features + Epic Music + Eye-Catching Effects + Minetic Magic craft an "Ad That Moves Players" (with item lore), then three achievement toasts: Join the Discord → Open a ticket → Get your ad | "How to craft the perfect server ad:" |

Each has a `-cover.png` thumbnail in `out/`.

- **Client work shown:** the phones play clips from the PotSMP, Soul Launcher and Mine Radar ads.
  Get each client's OK before posting these publicly. To swap or remove a clip, edit
  `shared/reel.json`, re-run `shared/prep-reel.sh`, and change the clip ids in the ad's `ad.js`.
- The Discord invite isn't in the video. The end card says LINK IN DESCRIPTION, so put the invite
  link in the description and pinned comment.
- Music and sound effects are synthesized from scratch, so there are no copyright claims. Audio
  sits at about −14 LUFS with true peaks at or below −1 dBTP after AAC encoding.

## Re-rendering

```sh
./build.sh               # all three
./build.sh 03-craft
```

`build.sh` first runs `shared/prep-reel.sh`, which cuts the clips listed in `shared/reel.json`
out of the finished ads in `../potsmp/out`, `../soul/out`, `../shorts/out` and `../discord/out`
into JPEG frames under `shared/reel/` (generated, not committed). Uses the shared toolkit in
`../shorts/shared` plus the Minetic kit in `shared/mm.js` (palette, logo, phone mockups that play
reel clips, Discord button and end card). `shared/assets/logo.png` and `icon.png` are the logo
with its navy background keyed out; `logo-source.webp` is the original.
