# Mine Radar — promo ad

15-second square (1080×1080, 30 fps) video ad for Mine Radar, plus a still poster.

- `out/mine-radar-ad.mp4` — the ad, with soundtrack
- `out/mine-radar-poster.png` — end-card still for image posts
- `index.html` + `ad.js` — the animation itself (open via any local web server to watch it loop live)

Story: radar scans for servers → blips become game modes ("Discover your next adventure")
→ a server listing gets spotted ("Own a server?", "Grow your community") → logo end card
("Find your next world.", "Website coming soon").

## Re-rendering

```sh
./render/build.sh
```

Needs Node with Playwright (Chromium), Python 3 with NumPy, and ffmpeg. Every frame comes from
`render(t)` in `ad.js`, and `render/make-audio.py` synthesizes the music and places sound effects
from the cue sheet `ad.js` exports, so edits to timing stay in sync automatically.
