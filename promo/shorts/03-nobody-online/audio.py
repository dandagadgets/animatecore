"""Soundtrack for Short 3: lonely keys + rain -> radar ping -> warm upbeat arrival groove."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shared'))
from synth import (Mix, hz, keys, pad, pluck, kick, clap, hat, bass, ping, pop, cricket, rain,  # noqa: E402
                   riser, impact, hit, band_noise, tv, rng, SR)
import numpy as np  # noqa: E402

DUR = 22.0
PING = 11.3
ARRIVE = 12.4
END = 17.2
mix = Mix(DUR)

# --- lonely intro (0 - 11.3): slow keys, A minor ---
SAD = [(0.0, (57, 60, 64)), (3.0, (53, 57, 60)), (6.0, (48, 55, 60)), (8.25, (55, 59, 62)), (9.75, (57, 60, 64))]
for i, (start, triad) in enumerate(SAD):
    end = SAD[i + 1][0] if i + 1 < len(SAD) else PING
    mix.add(pad([m - 12 for m in triad], end - start + 0.4), start, 0.14, wet=0.7)
    t, k = start, 0
    while t < end - 1e-6:
        note = [triad[0], triad[2], triad[1] + 12, triad[2]][k % 4] + 12
        mix.add(keys(hz(note), 2.0), t, 0.13 * (0.85 if k % 2 else 1), pan=0.3 if k % 2 else -0.3, wet=0.7)
        t += 0.75
        k += 1
# a lonely melody line over the empty spawn
for t, note in [(6.0, 76), (6.75, 74), (7.5, 72), (8.6, 71), (9.4, 69)]:
    mix.add(keys(hz(note + 12), 2.2), t, 0.1, wet=0.8)

# rain + crickets
wet_rain = rain(PING + 0.7 - 6.3)
wet_rain[:int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR))
wet_rain[-int(0.7 * SR):] *= np.linspace(1, 0, int(0.7 * SR))
mix.add(wet_rain, 6.3, 0.38, wet=0.2)
t = 6.6
while t < 9.4:
    mix.add(cricket(), t, 0.28, pan=rng.uniform(-0.6, 0.6), wet=0.5)
    t += 0.5


def thunder():
    d = 2.8
    tt = tv(d)
    crack = band_noise(d, 800, 9000) * np.exp(-tt * 9) * 0.7
    rumble = band_noise(d, 30, 220) * (np.exp(-tt * 1.2) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * tt)))
    return crack + rumble * 1.4


# --- ping + lift (11.3 - 12.4) ---
mix.duck(PING - 0.08, PING, 0.25)
mix.add(riser(1.1), PING, 0.35, wet=0.4)
mix.add(pad([48, 55, 60, 64], 1.4, bright=0.5), PING, 0.22, wet=0.7)

# --- arrival groove (12.4 - 17.2): C G Am F, 120 BPM ---
GROOVE = [(60, 64, 67, 48), (55, 59, 62, 43), (57, 60, 64, 45), (53, 57, 60, 41), (60, 64, 67, 48)]
for bar, (a, b, c, root) in enumerate(GROOVE):
    start = ARRIVE + bar * 1.0
    end = min(start + 1.0, END)
    mix.add(pad([a, b, c], end - start + 0.3, bright=0.5), start, 0.16, wet=0.5)
    i, t = 0, start
    while t < end - 1e-6:
        mix.add(pluck(hz([a, b, c, b][i % 4] + 12)), t, 0.12, pan=0.35 if i % 2 else -0.35, wet=0.35)
        mix.add(bass(hz(root) * (2 if i % 4 == 3 else 1), 0.24), t, 0.3)
        t += 0.25
        i += 1
k = 0
while ARRIVE + k * 0.5 < END - 0.25:
    bt = ARRIVE + k * 0.5
    mix.add(kick(), bt, 0.8)
    mix.add(hat(), bt + 0.25, 1.0, pan=0.2)
    if k % 2:
        mix.add(clap(), bt, 0.6, wet=0.3)
    k += 1

# --- end card (17.2 - 22) ---
mix.add(pad([48, 55, 60, 64, 67], 4.8, bright=0.4), END, 0.3, wet=0.6)
mix.add(bass(hz(36), 3.5, decay=1.2), END, 0.55)
for i in range(16):
    mix.add(pluck(hz([72, 76, 79, 84][i % 4])), END + 0.25 + i * 0.25, 0.11 * (1 - i / 18), pan=0.35 if i % 2 else -0.35, wet=0.45)

# --- SFX ---
for c in json.load(open(sys.argv[1])):
    t, kind = c['t'], c['type']
    if kind == 'pop':
        mix.add(pop(hz(c['note'])), t, 0.22, wet=0.4)
    elif kind == 'chat':
        mix.add(pop(hz(91)), t, 0.14, wet=0.3)
    elif kind == 'thunder':
        mix.add(thunder(), t, 0.8, wet=0.5)
    elif kind == 'ping':
        mix.add(ping(hz(c['note'])), t, 0.3, wet=0.8)
    elif kind == 'hit':
        mix.add(hit(), t, 0.7, wet=0.4)
    elif kind == 'arrive':
        mix.add(pop(hz(c['note'])), t, 0.22, pan=rng.uniform(-0.5, 0.5), wet=0.5)
    elif kind == 'impact':
        mix.add(impact(), t, 0.75, wet=0.5)

mix.write(sys.argv[2], master=0.8, drive=2.8)
