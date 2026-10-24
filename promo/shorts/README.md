# Mine Radar — 3 vertical shorts

Three 1080×1920 / 30 fps shorts (TikTok, YouTube Shorts, Reels), each aimed at a different
audience and built in a different style. All three end on the same branded card.

| | Short | Length | Audience | Style |
|---|---|---|---|---|
| 1 | **Dead Servers** — `out/mine-radar-01-dead-servers.mp4` | 20s | Players | Relatable POV comedy |
| 2 | **Every World** — `out/mine-radar-02-every-world.mp4` | 18s | Players | Beat-cut hype trailer |
| 3 | **Nobody's Online** — `out/mine-radar-03-nobody-online.mp4` | 22s | Server owners | Emotional story |

Each has a matching `-cover.png` thumbnail in `out/`.

**1. Dead Servers.** "POV: you just want ONE good server." A parody multiplayer list where
every join fails: timed out, completely empty, wrong version, pay-to-win, then a pile of
"Connection Lost" screens and a sad trombone. A radar sweep wipes it all away: "Meet Mine
Radar" → "Less scrolling. More playing."

**2. Every World.** Opens on "What kind of player are you?" then drops into one-second cuts
through eight pixel-art worlds (Survival, SkyBlock, PvP, SMP, Minigames, Factions, Prison,
Creative), each with its own one-liner, then a rapid recap and "Every world. One radar."

**3. Nobody's Online.** A flyover of a hand-built server town ("You spent months building
your server.") that sits at 1/100 players in the rain. "It's not your server. Nobody can find
it." A radar ping breaks the storm, dawn rises, players spawn in and chat fills up.
Ends on "Built for server owners."

## Cinematic cut of Short 3 (Higgsfield)

`mine-radar-03-nobody-online-cinematic.mp4` (15.7s) opens on an AI-generated shot of the empty
server instead of the pixel flyover: a voxel castle in heavy rain with one lonely player at the
gate. The captions, red 1/100 counter, chat and a lightning flash sit on top of it. At the radar
ping, a flash cuts to the pixel world for the dawn, the crowd arriving and the end card.

- Keyframe: Nano Banana 2. Shot: Wan 2.7 image-to-video, 5s, made from the keyframe.
- `03-nobody-online/cinematic/overlay.js` draws the overlay on a transparent canvas. It is
  rendered with `render.js frames` and encoded to `overlay.webm` (VP9 with alpha).
- `03-nobody-online/cinematic/compose.sh <ai-clip.mp4> <out.mp4>` builds the cut. It reuses
  this short's own soundtrack from 6.3s, so every sound effect stays in sync.
- The finished file is in the Higgsfield media library. The generated clip isn't stored in this
  repo because this build environment can't reach Higgsfield's CDN.

## Made for mobile

- The hook text is on screen from the very first frame.
- Key text stays inside the safe area (clear of the top bar, right-side buttons and bottom caption area).
- Audio is mastered to about −14 to −15.6 LUFS with true peaks at or below −1 dBTP after AAC encoding.
- All copy comes from Mine Radar's own messaging. There are no invented stats, and server names are obvious parodies.
- Music and sound effects are synthesized from scratch, so there are no licensing issues.

## Re-rendering

```sh
./build.sh                    # all three
./build.sh 02-every-world     # just one
```

Needs Node with Playwright (Chromium), Python 3 with NumPy, and ffmpeg. Each short is a canvas
animation (`<short>/short.js`, using `shared/lib.js`) rendered frame-exact by `shared/render.js`.
Its soundtrack (`<short>/audio.py`, using `shared/synth.py`) places sound effects from the cue
sheet the page exports, so changes to timing stay in sync. Open any `<short>/index.html` through
a local web server to watch it loop live.
