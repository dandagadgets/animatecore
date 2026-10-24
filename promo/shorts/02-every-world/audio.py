"""Soundtrack for Short 2: 120 BPM hype build -> drop on the first cut -> stutter -> slam -> outro."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shared'))
from synth import (Mix, hz, pad, pluck, kick, snare, clap, hat, saw_bass, bass, ping, pop, riser,  # noqa: E402
                   impact, hit, thump, band_noise, tv, sweep, rng)
import numpy as np  # noqa: E402

DUR = 18.0
DROP = 2.0
FLICKER = 10.0
SLAM = 11.5
END = 13.0
mix = Mix(DUR)

# --- hook (0 - 2): heartbeat, drone, riser ---
mix.add(pad([45, 52, 57], 2.2), 0.0, 0.25, wet=0.6)
for bt in (0.0, 0.5, 1.0, 1.5):
    mix.add(kick(0.6), bt, 0.55)
    mix.add(thump(), bt, 0.3)
mix.add(riser(1.0), 1.0, 0.6, wet=0.3)
for i in range(8):
    mix.add(snare(), 1.0 + i * 0.125, 0.12 + i * 0.04)

# --- main groove (2 - 10): Am F C G, two scenes per chord ---
CH = [(57, 60, 64, 45), (53, 57, 60, 41), (55, 60, 64, 48), (55, 59, 62, 43)]
for bar in range(4):
    start = DROP + bar * 2.0
    a, b, c, root = CH[bar]
    mix.add(pad([a, b, c, a + 12], 2.3, bright=0.6), start, 0.18, wet=0.5)
    for i in range(16):
        t = start + i * 0.125
        mix.add(pluck(hz([a, b, c, a + 12, c, b, a + 12, c][i % 8] + 12), 0.2, 16), t, 0.12, pan=0.4 if i % 2 else -0.4, wet=0.35)
    for i in range(8):
        t = start + i * 0.25
        mix.add(saw_bass(hz(root - 12) * (2 if i % 2 else 1), 0.23), t, 0.35)
for k in range(16):
    bt = DROP + k * 0.5
    mix.add(kick(), bt, 0.9)
    mix.add(hat(), bt + 0.25, 1.0, pan=0.25)
    mix.add(hat(), bt + 0.125, 0.45, pan=-0.25)
    mix.add(hat(), bt + 0.375, 0.45, pan=-0.25)
    if k % 2:
        mix.add(snare(), bt, 0.55, wet=0.3)
        mix.add(clap(), bt, 0.5, wet=0.3)

# --- stutter build (10 - 11.5) ---
for i in range(12):
    t = FLICKER + i * 0.125
    mix.add(kick(), t, 0.45 + i * 0.03)
    mix.add(snare(), t, 0.15 + i * 0.03, wet=0.2)
mix.add(riser(1.5), FLICKER, 0.65, wet=0.3)
mix.add(pad([57, 60, 64, 69], 1.6, bright=0.8), FLICKER, 0.15, wet=0.5)

# --- slam (11.5 - 13): sub drops + low pad ---
mix.add(pad([43, 50, 55, 59], 1.6), SLAM, 0.3, wet=0.6)
mix.add(bass(hz(31), 1.5, decay=1.5), SLAM, 0.6)

# --- end card (13 - 18) ---
mix.add(pad([48, 55, 60, 64, 67], 5.0, bright=0.4), END, 0.3, wet=0.6)
mix.add(bass(hz(36), 3.5, decay=1.2), END, 0.6)
for i in range(18):
    t = END + 0.25 + i * 0.25
    mix.add(pluck(hz([72, 76, 79, 84, 79, 76][i % 6])), t, 0.11 * (1 - i / 20), pan=0.35 if i % 2 else -0.35, wet=0.45)

# --- SFX ---
def clash():
    t = tv(0.9)
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in ((2350, 6), (3170, 7), (4410, 9), (1260, 5)))
    return ring * 0.25 + band_noise(0.9, 3000, 15000) * np.exp(-t * 20) * 0.6


def boom():
    t = tv(1.2)
    return (sweep(30 + 90 * np.exp(-t * 10), t) * np.exp(-t * 3) + band_noise(1.2, 80, 3000) * np.exp(-t * 5) * 0.8)


def tick():
    t = tv(0.08)
    return band_noise(0.08, 3000, 12000) * np.exp(-t * 60) * 0.4 + np.sin(2 * np.pi * 900 * t) * np.exp(-t * 50) * 0.3


for c in json.load(open(sys.argv[1])):
    t, kind = c['t'], c['type']
    if kind == 'cut':
        mix.add(hit(), t, 0.55 * c['gain'], wet=0.3)
    elif kind == 'clash':
        mix.add(clash(), t, 0.7, wet=0.6)
    elif kind == 'jump':
        mix.add(pop(hz(c['note'])), t, 0.3, wet=0.3)
    elif kind == 'boom':
        mix.add(boom(), t, 0.75, wet=0.3)
    elif kind == 'pop':
        mix.add(pop(hz(c['note'])), t, 0.22, pan=rng.uniform(-0.4, 0.4), wet=0.4)
    elif kind == 'tick':
        mix.add(tick(), t, 0.6)
    elif kind == 'hit':
        mix.add(hit(), t, 0.95, wet=0.5)
    elif kind == 'ping':
        mix.add(ping(hz(c['note'])), t, 0.2, wet=0.8)
    elif kind == 'impact':
        mix.add(impact(), t, 0.75, wet=0.5)

mix.write(sys.argv[2], drive=1.8)
