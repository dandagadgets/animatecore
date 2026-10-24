"""Soundtrack for Short 1: calm menu keys -> comedic failures -> beat drop on Mine Radar."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shared'))
from synth import (Mix, hz, keys, pad, pluck, kick, hat, clap, bass, ping, pop, ui_click, bonk, cricket,  # noqa: E402
                   trombone, scratch, whoosh, riser, impact, hit, coin, rng)

DUR = 20.0
BRAND = 8.7
END = 14.5
mix = Mix(DUR)

# --- calm "multiplayer menu" keys (0 - 7.8) ---
MENU = [(0.0, (57, 60, 64)), (2.0, (53, 57, 60)), (4.0, (48, 55, 60)), (6.0, (55, 59, 62))]
for i, (start, triad) in enumerate(MENU):
    end = min(start + 2.0, 7.8)
    mix.add(pad([m - 12 for m in triad], end - start + 0.3), start, 0.16, wet=0.6)
    for k, note in enumerate([triad[0], triad[2], triad[1] + 12, triad[2]]):
        t = start + k * 0.5
        if t < 7.7:
            mix.add(keys(hz(note + 12), 1.4), t, 0.12, pan=0.3 if k % 2 else -0.3, wet=0.5)

# --- upbeat groove from the radar wipe (8.7 - 14.5) ---
GROOVE = [(8.7, (60, 64, 67), 48), (9.7, (55, 59, 62), 43), (10.7, (57, 60, 64), 45),
          (11.7, (53, 57, 60), 41), (12.7, (60, 64, 67), 48), (13.7, (55, 59, 62), 43)]
for start, triad, root in GROOVE:
    end = min(start + 1.0, END)
    mix.add(pad(list(triad), end - start + 0.3, bright=0.5), start, 0.16, wet=0.5)
    t, i = start, 0
    while t < end - 1e-6:
        note = triad[[0, 1, 2, 1][i % 4]] + 12
        mix.add(pluck(hz(note)), t, 0.13, pan=0.35 if i % 2 else -0.35, wet=0.35)
        if t < 14.0:
            mix.add(bass(hz(root) * (2 if i % 4 == 3 else 1), 0.24), t, 0.32)
        t += 0.25
        i += 1
k = 0
while BRAND + k * 0.5 < 14.0:
    bt = BRAND + k * 0.5
    mix.add(kick(), bt, 0.8)
    mix.add(hat(), bt + 0.25, 1.0, pan=0.2)
    if k % 2:
        mix.add(clap(), bt, 0.7, wet=0.3)
    k += 1

# --- end card (14.5 - 20) ---
mix.add(pad([48, 55, 60, 64], 5.5, bright=0.3), END, 0.3, wet=0.6)
mix.add(bass(hz(36), 3.5, decay=1.2), END, 0.55)
for i in range(16):
    t = END + 0.25 + i * 0.25
    note = [72, 76, 79, 84][i % 4]
    mix.add(pluck(hz(note)), t, 0.11 * (1 - i / 18), pan=0.35 if i % 2 else -0.35, wet=0.4)

# --- SFX from the cue sheet ---
for c in json.load(open(sys.argv[1])):
    t, kind = c['t'], c['type']
    if kind == 'uiclick':
        mix.add(ui_click(), t, 0.7)
    elif kind == 'bonk':
        mix.add(bonk(hz(c['note'])), t, 0.55 * c.get('gain', 1.0), pan=rng.uniform(-0.3, 0.3))
    elif kind == 'chat':
        mix.add(pop(hz(91)), t, 0.18, wet=0.3)
    elif kind == 'crickets':
        ct = t
        while ct < c['end']:
            mix.add(cricket(), ct, 0.35, pan=rng.uniform(-0.6, 0.6), wet=0.5)
            ct += 0.45
    elif kind == 'spam':
        mix.add(coin(hz(84 + int(rng.integers(0, 3)) * 2)), t, 0.16, pan=rng.uniform(-0.5, 0.5))
    elif kind == 'trombone':
        for k, (note, d) in enumerate([(55, 0.2), (54, 0.2), (53, 0.2), (52, 0.42)]):
            mix.add(trombone(hz(note), d), t + k * 0.2, 0.5, wet=0.3)
    elif kind == 'scratch':
        mix.add(scratch(), t, 0.7)
    elif kind == 'whoosh':
        mix.add(whoosh(), t - 0.52, 0.8, wet=0.3)
    elif kind == 'ping':
        mix.add(ping(hz(c['note'])), t, 0.16, pan=rng.uniform(-0.4, 0.4), wet=0.7)
    elif kind == 'pop':
        mix.add(pop(hz(c['note'])), t, 0.24, pan=rng.uniform(-0.4, 0.4), wet=0.4)
    elif kind == 'hit':
        mix.add(hit(), t, 0.8, wet=0.4)
    elif kind == 'riser':
        mix.add(riser(c['end'] - t), t, 0.5, wet=0.3)
    elif kind == 'impact':
        mix.add(impact(), t, 0.75, wet=0.5)

mix.write(sys.argv[2], drive=2.0)
