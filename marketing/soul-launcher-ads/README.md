# Soul Launcher ads

Three static ads for Soul Launcher, built as HTML and rendered to PNG at exact platform sizes.

| File | Size | Use | Angle |
| --- | --- | --- | --- |
| `out/soul-launcher-ad-1-chores-1080x1080.png` | 1080×1080 | Feed (square) | "Minecraft, minus the chores." Java, loaders and servers handle themselves |
| `out/soul-launcher-ad-2-sync-1080x1350.png` | 1080×1350 | Feed (4:5) | "Add a server once. Every Space has it." Categories share `servers.dat` and `options.txt` |
| `out/soul-launcher-ad-3-install-1080x1920.png` | 1080×1920 | Stories / Reels / TikTok | "Install in two minutes." Download, create a Space, press Play |

All copy comes from claims on the Soul Launcher site: the ~125 MB idle RAM figure, the install steps, category sync, and no telemetry or ads.

## Editing and re-rendering

- `brand.css` holds the shared colors (sampled from the site), type and buttons. `pixel.js` draws the Minecraft-style blocks and soul fire from code, so no game textures are used.
- Edit an `ad-*.html` file and open it in a browser to preview it.
- Run `node render.cjs` to regenerate every PNG in `out/`, or `node render.cjs ad-2` to regenerate one. This needs the `playwright` npm package and its Chromium.

## Before running these

- `logo.png` is an upscaled crop of the icon from a site screenshot, so it is a little soft. Replace it with the original icon file at the same path and re-render.
- Fonts (Baloo 2, Nunito, JetBrains Mono) are in `fonts/` under the SIL Open Font License.
