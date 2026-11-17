#!/usr/bin/env python3
"""
Generates the server's branding as crisp pixel art (no fonts or external assets needed).

Everything is drawn on a small "logical" pixel grid and then scaled up with nearest-neighbour,
so every output keeps hard, Minecraft-style pixels at any size:

  branding/server-icon.png  - 64x64, drop it next to server.properties (shown in the server list)
  branding/icon-512.png     - the same icon at 512x512 (Discord server icon, store, socials)
  branding/logo.png         - emblem + 3D wordmark on a transparent background (website, store header)
  branding/banner.png       - logo on a night-sky scene, 16:9 (Discord banner, website hero)

The emblem is an isometric block with a glowing "core" and a sword-swing trail wrapping around it.

Usage:
  python3 scripts/generate_logo.py                        # "ANIMATE|CORE"
  python3 scripts/generate_logo.py --name "SKY|BLOCK"      # '|' switches colour (gold -> cyan -> ...)
  python3 scripts/generate_logo.py --name "MY SERVER"      # spaces render as a gap
"""
import argparse
import math
import os
import random

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def rgba(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


OUTLINE = rgba("#160B28")

# ---------------------------------------------------------------------------------------------
# Pixel font: 7 rows tall, 2px vertical stems. Original glyphs drawn for this logo.
# ---------------------------------------------------------------------------------------------
FONT = {
    "A": [".XXXXX.", "XX...XX", "XX...XX", "XXXXXXX", "XX...XX", "XX...XX", "XX...XX"],
    "B": ["XXXXXX.", "XX...XX", "XX...XX", "XXXXXX.", "XX...XX", "XX...XX", "XXXXXX."],
    "C": [".XXXXX.", "XX...XX", "XX.....", "XX.....", "XX.....", "XX...XX", ".XXXXX."],
    "D": ["XXXXXX.", "XX...XX", "XX...XX", "XX...XX", "XX...XX", "XX...XX", "XXXXXX."],
    "E": ["XXXXXX", "XX....", "XX....", "XXXXX.", "XX....", "XX....", "XXXXXX"],
    "F": ["XXXXXX", "XX....", "XX....", "XXXXX.", "XX....", "XX....", "XX...."],
    "G": [".XXXXX.", "XX...XX", "XX.....", "XX.XXXX", "XX...XX", "XX...XX", ".XXXXX."],
    "H": ["XX...XX", "XX...XX", "XX...XX", "XXXXXXX", "XX...XX", "XX...XX", "XX...XX"],
    "I": ["XXXXXX", "..XX..", "..XX..", "..XX..", "..XX..", "..XX..", "XXXXXX"],
    "J": ["..XXXX", "....XX", "....XX", "....XX", "XX..XX", "XX..XX", ".XXXX."],
    "K": ["XX...XX", "XX..XX.", "XX.XX..", "XXXX...", "XX.XX..", "XX..XX.", "XX...XX"],
    "L": ["XX....", "XX....", "XX....", "XX....", "XX....", "XX....", "XXXXXX"],
    "M": ["XX...XX", "XXX.XXX", "XXXXXXX", "XX.X.XX", "XX...XX", "XX...XX", "XX...XX"],
    "N": ["XX...XX", "XXX..XX", "XXXX.XX", "XX.XXXX", "XX..XXX", "XX...XX", "XX...XX"],
    "O": [".XXXXX.", "XX...XX", "XX...XX", "XX...XX", "XX...XX", "XX...XX", ".XXXXX."],
    "P": ["XXXXXX.", "XX...XX", "XX...XX", "XXXXXX.", "XX.....", "XX.....", "XX....."],
    "Q": [".XXXXX.", "XX...XX", "XX...XX", "XX...XX", "XX.X.XX", "XX..XX.", ".XXX.XX"],
    "R": ["XXXXXX.", "XX...XX", "XX...XX", "XXXXXX.", "XX.XX..", "XX..XX.", "XX...XX"],
    "S": [".XXXXX.", "XX...XX", "XX.....", ".XXXXX.", ".....XX", "XX...XX", ".XXXXX."],
    "T": ["XXXXXX", "..XX..", "..XX..", "..XX..", "..XX..", "..XX..", "..XX.."],
    "U": ["XX...XX", "XX...XX", "XX...XX", "XX...XX", "XX...XX", "XX...XX", ".XXXXX."],
    "V": ["XX...XX", "XX...XX", "XX...XX", "XX...XX", ".XX.XX.", "..XXX..", "...X..."],
    "W": ["XX...XX", "XX...XX", "XX...XX", "XX.X.XX", "XXXXXXX", "XXX.XXX", "XX...XX"],
    "X": ["XX...XX", "XX...XX", ".XX.XX.", "..XXX..", ".XX.XX.", "XX...XX", "XX...XX"],
    "Y": ["XX..XX", "XX..XX", "XX..XX", ".XXXX.", "..XX..", "..XX..", "..XX.."],
    "Z": ["XXXXXXX", ".....XX", "....XX.", "...XX..", "..XX...", ".XX....", "XXXXXXX"],
    "0": [".XXXXX.", "XX...XX", "XX..XXX", "XX.X.XX", "XXX..XX", "XX...XX", ".XXXXX."],
    "1": ["..XX..", ".XXX..", "..XX..", "..XX..", "..XX..", "..XX..", "XXXXXX"],
    "2": [".XXXXX.", "XX...XX", ".....XX", "...XXX.", ".XXX...", "XX.....", "XXXXXXX"],
    "3": [".XXXXX.", "XX...XX", ".....XX", "..XXXX.", ".....XX", "XX...XX", ".XXXXX."],
    "4": ["...XXX.", "..XXXX.", ".XX.XX.", "XX..XX.", "XXXXXXX", "....XX.", "....XX."],
    "5": ["XXXXXXX", "XX.....", "XXXXXX.", ".....XX", ".....XX", "XX...XX", ".XXXXX."],
    "6": [".XXXXX.", "XX.....", "XX.....", "XXXXXX.", "XX...XX", "XX...XX", ".XXXXX."],
    "7": ["XXXXXXX", ".....XX", "....XX.", "...XX..", "..XX...", "..XX...", "..XX..."],
    "8": [".XXXXX.", "XX...XX", "XX...XX", ".XXXXX.", "XX...XX", "XX...XX", ".XXXXX."],
    "9": [".XXXXX.", "XX...XX", "XX...XX", ".XXXXXX", ".....XX", ".....XX", ".XXXXX."],
    "!": ["XX", "XX", "XX", "XX", "XX", "..", "XX"],
    ".": ["..", "..", "..", "..", "..", "..", "XX"],
    "-": [".....", ".....", ".....", "XXXXX", ".....", ".....", "....."],
    ":": ["..", "XX", "XX", "..", "XX", "XX", ".."],
    "'": ["XX", "XX", ".X", "..", "..", "..", ".."],
}
GLYPH_H = 7
LETTER_GAP = 1
SPACE_W = 3
DEPTH = 2  # 3D extrusion depth of the wordmark

# Colour schemes for wordmark segments ('|' in --name cycles through these).
SCHEMES = [
    {  # molten gold
        "hi": "#FFFBE6",
        "face": ["#FFF0A8", "#FFE070", "#FFCE45", "#FFB92B", "#FFA21E", "#FF8A17", "#F07012"],
        "extrude": ["#A8460B", "#6E2A07"],
    },
    {  # core cyan
        "hi": "#F0FEFF",
        "face": ["#C8F8FF", "#98EEFF", "#68E0FF", "#40CCFF", "#2BB2FA", "#2194EE", "#1B78DA"],
        "extrude": ["#13529E", "#0B336B"],
    },
    {  # violet
        "hi": "#F3EEFF",
        "face": ["#DCCFFF", "#C3B0FF", "#A890FF", "#9175FF", "#7C5DF5", "#6A4AE6", "#5838D0"],
        "extrude": ["#3A2391", "#24145E"],
    },
]


def outline_pass(px, w, h, color=OUTLINE):
    """Adds a 1px outline (8-neighbourhood) around every filled pixel in `px`."""
    add = {}
    for y in range(h):
        for x in range(w):
            if (x, y) in px:
                continue
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    if (x + dx, y + dy) in px:
                        add[(x, y)] = color
                        break
                else:
                    continue
                break
    px.update(add)


def to_image(px, w, h):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for (x, y), c in px.items():
        if 0 <= x < w and 0 <= y < h:
            img.putpixel((x, y), c)
    return img


def scale(img, factor):
    return img.resize((img.width * factor, img.height * factor), Image.NEAREST)


# ---------------------------------------------------------------------------------------------
# Emblem: isometric block with a glowing core + a sword-swing trail (32x32 logical pixels)
# ---------------------------------------------------------------------------------------------
EMBLEM = 32

SWOOSH = ["#9C3A14", "#C95216", "#EE7419", "#FF9A26", "#FFBD3A", "#FFDA62", "#FFF0A8", "#FFFCE8"]

CUBE = {
    "top": rgba("#9A80FF"),
    "top_hi": rgba("#D4C8FF"),
    "top_shade": rgba("#8366F7"),
    "left": rgba("#5D40D6"),
    "left_hi": rgba("#7559EA"),
    "left_shade": rgba("#4B32BA"),
    "right": rgba("#33208C"),
    "right_hi": rgba("#4129A3"),
    "right_shade": rgba("#28176F"),
    "seam": rgba("#56DCFF"),
    "seam_hi": rgba("#B4F6FF"),
    "glow": rgba("#2E9BE0"),
    "core": rgba("#FFFFFF"),
}


def draw_swoosh(px):
    """A sword-swing trail: a thin dashed tail that thickens into a bright, pointed blade tip."""
    cx, cy, radius = 16.0, 16.0, 15.0
    t0, t1 = math.radians(-165), math.radians(52)
    span = t1 - t0
    for y in range(EMBLEM):
        for x in range(EMBLEM):
            dx, dy = x + 0.5 - cx, y + 0.5 - cy
            r = math.hypot(dx, dy)
            th = math.atan2(dy, dx)
            while th < t0:
                th += 2 * math.pi
            u = (th - t0) / span
            if u > 1:
                continue
            width = 0.9 + 3.4 * min(u, 0.84) ** 1.4
            if u > 0.84:  # taper to a point at the leading edge
                width *= (1 - (u - 0.84) / 0.16) ** 0.7
            if not (radius - width <= r <= radius):
                continue
            if u < 0.2 and int(u * 30) % 3 == 2:  # speed-line breaks in the tail
                continue
            idx = u * (len(SWOOSH) - 2.5)
            if r > radius - 1.0:  # outer edge catches the light
                idx += 1.5
            elif r < radius - width + 1.0 and width > 2:
                idx -= 1
            px[(x, y)] = rgba(SWOOSH[max(0, min(len(SWOOSH) - 1, int(idx)))])


def draw_cube(px, top_y=6, half=10, side_h=11):
    """Isometric cube with 2:1 pixel edges, centred between columns 15 and 16."""
    cxl, cxr = 15, 16
    for x in range(cxl - half + 1, cxr + half):
        left = x <= cxl
        k = (cxl - x) if left else (x - cxr)  # 0 at the centre columns
        step = k // 2
        top_start = top_y + step
        top_end = top_y + 2 * (half // 2) - 1 - step
        side_start = top_end + 1
        side_end = top_end + side_h
        for y in range(top_start, top_end + 1):
            c = CUBE["top"]
            if y == top_start:
                c = CUBE["top_hi"]
            elif y >= top_end - 1 and k > 1:
                c = CUBE["top_shade"]
            px[(x, y)] = c
        face = "left" if left else "right"
        for y in range(side_start, side_end + 1):
            c = CUBE[face]
            if k == half - 1:
                c = CUBE[face + "_hi"]  # outer vertical edge
            elif y >= side_end - 1:
                c = CUBE[face + "_shade"]
            px[(x, y)] = c
        # glowing seams: where the top meets the sides, and down the front edge
        if k >= 1:
            px[(x, top_end)] = CUBE["seam"]
        if k == 0:
            for y in range(side_start, side_end + 1):
                px[(x, y)] = CUBE["seam_hi"] if left else CUBE["seam"]
        elif k == 1:
            for y in range(side_start + 1, side_end):
                px[(x, y)] = CUBE["glow"] if (y - side_start) % 3 != 2 else CUBE[face]

    # the core: a bright spark where the three seams meet
    vy = top_y + 2 * (half // 2) - 1
    for (x, y) in [(cxl, vy), (cxr, vy), (cxl, vy + 1), (cxr, vy + 1)]:
        px[(x, y)] = CUBE["core"]
    for (x, y) in [(cxl, vy - 1), (cxr, vy - 1), (cxl - 1, vy), (cxr + 1, vy),
                   (cxl - 1, vy + 1), (cxr + 1, vy + 1), (cxl, vy + 2), (cxr, vy + 2)]:
        px[(x, y)] = CUBE["seam_hi"]


def draw_sparkle(px, x, y, big=False):
    px[(x, y)] = rgba("#FFFFFF")
    arm = rgba("#9BEFFF")
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        px[(x + dx, y + dy)] = arm
        if big:
            px[(x + 2 * dx, y + 2 * dy)] = rgba("#3FB8F0")


def render_emblem():
    px = {}
    draw_swoosh(px)
    draw_cube(px)
    outline_pass(px, EMBLEM, EMBLEM)
    draw_sparkle(px, 4, 27, big=True)
    px[(9, 30)] = rgba("#9BEFFF")
    return px


# ---------------------------------------------------------------------------------------------
# Wordmark
# ---------------------------------------------------------------------------------------------
def parse_name(name):
    segs = [s for s in name.upper().split("|")]
    for s in segs:
        for ch in s:
            if ch != " " and ch not in FONT:
                raise SystemExit(f"Character {ch!r} is not in the pixel font.")
    return segs


def render_wordmark(segments):
    """Returns (pixels, width, height) for the 3D wordmark, outline included."""
    face, x = {}, 1
    for si, seg in enumerate(segments):
        for ch in seg:
            if ch == " ":
                x += SPACE_W
                continue
            glyph = FONT[ch]
            for gy, row in enumerate(glyph):
                for gx, c in enumerate(row):
                    if c == "X":
                        face[(x + gx, 1 + gy)] = si % len(SCHEMES)
            x += len(glyph[0]) + LETTER_GAP
    w, h = x - LETTER_GAP + 1, GLYPH_H + DEPTH + 2

    px = {}
    extrude = {}
    for d in range(1, DEPTH + 1):
        for (fx, fy), s in face.items():
            p = (fx, fy + d)
            if p not in face and p not in extrude:
                extrude[p] = (s, d)
    for p, (s, d) in extrude.items():
        px[p] = rgba(SCHEMES[s]["extrude"][d - 1])
    for (fx, fy), s in face.items():
        scheme = SCHEMES[s]
        c = scheme["face"][fy - 1]
        if (fx, fy - 1) not in face:
            c = scheme["hi"]
        px[(fx, fy)] = rgba(c)
    outline_pass(px, w, h)
    return px, w, h


# ---------------------------------------------------------------------------------------------
# Compositions
# ---------------------------------------------------------------------------------------------
BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def dithered(colors, t, x, y):
    """Picks from a list of colours for t in [0,1] with ordered dithering between steps."""
    t = max(0.0, min(1.0, t)) * (len(colors) - 1)
    i = int(t)
    frac = t - i
    if i >= len(colors) - 1:
        return colors[-1]
    return colors[i + 1] if frac > (BAYER4[y % 4][x % 4] + 0.5) / 16 else colors[i]


NIGHT = [rgba(c) for c in ("#06030D", "#0B0619", "#120A27", "#1A0F37", "#231449",
                           "#2D1A5C", "#382170", "#442984")]


def render_server_icon(emblem_px):
    px = {}
    for y in range(EMBLEM):
        for x in range(EMBLEM):
            d = math.hypot(x + 0.5 - 16, y + 0.5 - 16) / 22
            px[(x, y)] = dithered(NIGHT, 0.25 + 0.75 * max(0.0, 1 - d) ** 1.3, x, y)
    for p in ((0, 0), (EMBLEM - 1, 0), (0, EMBLEM - 1), (EMBLEM - 1, EMBLEM - 1)):
        del px[p]  # rounded corners
    px.update(emblem_px)
    return to_image(px, EMBLEM, EMBLEM)


def render_lockup(emblem_px, word_px, ww, wh, gap=2):
    w = max(EMBLEM, ww)
    h = EMBLEM + gap + wh
    px = {}
    ex = (w - EMBLEM) // 2
    for (x, y), c in emblem_px.items():
        px[(x + ex, y)] = c
    wx = (w - ww) // 2
    for (x, y), c in word_px.items():
        px[(x + wx, y + EMBLEM + gap)] = c
    return px, w, h


def render_banner(lockup_px, lw, lh, target_w=1600):
    W = max(160, lw + 40)
    H = round(W * 9 / 16)
    rng = random.Random(7)
    px = {}
    gcx, gcy = W / 2, (H - 12 - lh) / 2 + EMBLEM / 2
    for y in range(H):
        for x in range(W):
            d = math.hypot((x - gcx) / 1.8, y - gcy) / 48
            t = 0.4 * y / (H - 1) + 0.7 * max(0.0, 1 - d) ** 1.6
            px[(x, y)] = dithered(NIGHT, t, x, y)

    # stars
    for _ in range(W * H // 90):
        x, y = rng.randrange(W), rng.randrange(int(H * 0.75))
        px[(x, y)] = rgba(rng.choice(["#FFFFFF", "#CFC2FF", "#9BEFFF", "#7A68C9"]))
    for _ in range(6):
        x, y = rng.randrange(4, W - 4), rng.randrange(4, int(H * 0.55))
        if abs(x - W / 2) > lw / 2 + 4:
            draw_sparkle(px, x, y, big=rng.random() < 0.5)

    # blocky terrain silhouette: a far layer and a near layer built from 4x4 "blocks"
    for layer, (base, top_col, fill_col, amp) in enumerate([
        (H - 22, "#2A1A58", "#1A0F3A", 3),
        (H - 12, "#3B2580", "#0F0824", 2),
    ]):
        col = 0
        while col < W:
            hgt = base - 4 * rng.randint(0, amp)
            for x in range(col, min(W, col + 4 * rng.randint(1, 3))):
                for y in range(hgt, H):
                    px[(x, y)] = rgba(fill_col)
                px[(x, hgt)] = rgba(top_col)
                if layer == 1 and (x // 4 + hgt // 4) % 2 == 0:
                    px[(x, hgt + 1)] = rgba("#1E1245")
            col = x + 1

    ox, oy = (W - lw) // 2, (H - 12 - lh) // 2
    for (x, y), c in lockup_px.items():
        px[(x + ox, y + oy)] = c
    return to_image(px, W, H), max(1, round(target_w / W))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--name", default="ANIMATE|CORE", help="wordmark text; '|' switches colour")
    ap.add_argument("--out", default=os.path.join(ROOT, "branding"), help="output directory")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    emblem = render_emblem()
    icon = render_server_icon(emblem)
    scale(icon, 2).save(os.path.join(args.out, "server-icon.png"))
    scale(icon, 16).save(os.path.join(args.out, "icon-512.png"))

    word_px, ww, wh = render_wordmark(parse_name(args.name))
    lock_px, lw, lh = render_lockup(emblem, word_px, ww, wh)
    scale(to_image(lock_px, lw, lh), 12).save(os.path.join(args.out, "logo.png"))

    banner, factor = render_banner(lock_px, lw, lh)
    scale(banner, factor).save(os.path.join(args.out, "banner.png"))

    for f in ("server-icon.png", "icon-512.png", "logo.png", "banner.png"):
        im = Image.open(os.path.join(args.out, f))
        print(f"  {f:16s} {im.width}x{im.height}")


if __name__ == "__main__":
    main()
