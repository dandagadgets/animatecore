# Soul Launcher v1.0.0-beta: 3 vertical ads

Three vertical ads (1080×1920, 30 fps) for YouTube Shorts, TikTok and Reels. Each one sells a
different angle of the launcher. All copy comes from the v1.0.0-beta announcement and the website,
and all three end on the same card: the logo assembling pixel by pixel, **Soul Launcher**,
v1.0.0-beta · OUT NOW, "Minecraft, minus the chores.", a **Download free** button that gets clicked,
`github.com/unmid/SoulLauncher`, and FREE · OPEN SOURCE · WINDOWS.

| # | Ad | Length | Angle | Hook |
|---|---|---|---|---|
| 1 | `out/soul-01-chores.mp4` | 20.9s | Comedy pain → relief: modding by hand buries the desktop in error popups ("Java not found", "Wrong Java version", "Game crashed" ×17) while a setup timer runs to 2½ hours. A wall of soul fire burns it off, then the 4-step wizard (version, software, content, name → Play) runs while Java and the loader install themselves. The chores get crossed out. | "POV: you just want to play modded Minecraft" |
| 2 | `out/soul-02-spaces.mp4` | 18.1s | Satisfying explainer: a glass Space gets packed with version + loader + mods + worlds + settings, and Spaces multiply (Vanilla, Fabric, Quilt, Forge, NeoForge, OptiFine). A server added in one Space of the "family nights" category flies to the others, a render-distance slider drags all three, and the file tree shows the shared `servers.dat` / `options.txt` links. | "This is a Space." |
| 3 | `out/soul-03-numbers.mp4` | 16.7s | Kinetic type on a 128 BPM beat: ~125 MB idle RAM, 0 telemetry/ads/accounts for offline play, 4 steps, 1 click (OneClient FPS build), 2 mod sites in 1 search (no silent latest), 100% open source (GPL-3.0). The end card adds "Installs in 2 minutes." | "~125 MB" counting up |

Each has a `-cover.png` thumbnail in `out/`.

- **Wording:** the button says **Download free** and the page shows the GitHub releases address.
  The announcement's SmartScreen warning is left out of the ads; put it in the video description
  or a pinned comment.
- **Names shown:** Sodium, Lithium and Iris (from the OneClient description) and Modrinth and
  CurseForge appear as plain text only, with no logos. "Friday Night SMP" and "An old zoom mod" are
  made-up examples.
- **Testing tip:** run all three with the same targeting and budget for a few days, then compare
  view rate and average view duration.
- Music and sound effects are synthesized from scratch, so there are no copyright claims. Audio
  sits at about −14 LUFS with true peaks at or below −1 dBTP after AAC encoding.

## Re-rendering

```sh
./build.sh               # all three
./build.sh 02-spaces
```

Uses the shared toolkit in `../shorts/shared` plus the Soul kit in `shared/soul.js` (palette,
aurora background, soul fire, the logo traced into a 20×20 grid, cards, buttons and the end card).
Fonts are Baloo 2, Inter and JetBrains Mono (all SIL OFL). The logo in `shared/assets/` is the
client's.
