"""Soundtrack for Video 1: sleepy cave plucks under crunchy mining -> silence on the snap ->
charge-up -> drop on the wall shatter -> Discord end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import (Mix, hz, pad, pluck, keys, dig, block_break, latch, pop, riser, snare, saw_bass,  # noqa: E402
                   play_common, outro, groove, rng)

DUR = 18.0
SNAP, UPGRADE, STRIKE, END = 6.25, 6.85, 7.9, 12.8
mix = Mix(DUR)

# --- underground plod (0 - 6.25): low plucks + soft pad, a bit sleepy ---
mix.add(pad([48, 55, 63], SNAP), 0.0, 0.14, wet=0.6)
for i, note in enumerate([36, 43, 39, 43, 36, 43, 41, 39] * 2):
    t = 0.2 + i * 0.39
    if t < SNAP - 0.1:
        mix.add(pluck(hz(note + 12), 0.3, 9), t, 0.2, wet=0.3)
for i, note in enumerate([67, 63, 62, 60]):
    mix.add(keys(hz(note + 12), 1.6), 0.8 + i * 1.4, 0.07, wet=0.7)

# --- upgrade build (6.85 - 7.9): snare roll + charge riser ---
for i in range(8):
    mix.add(snare(), UPGRADE + 0.5 + i * 0.065, 0.12 + i * 0.05, wet=0.2)

# --- drop (7.9 - 12.8) ---
groove(mix, STRIKE, END - 0.25, [((57, 60, 64), 45), ((53, 57, 60), 41), ((55, 60, 64), 48), ((55, 59, 62), 43)],
       step=1.0, bass_fn=saw_bass)

# --- end card ---
outro(mix, END, DUR - END)

for c in json.load(open(sys.argv[1])):
    t, kind = c['t'], c['type']
    if play_common(mix, c):
        continue
    if kind == 'dig':
        mix.add(dig(c['k']), t, 0.75 * c['gain'], pan=rng.uniform(-0.15, 0.15), wet=0.15)
    elif kind == 'pickup':
        mix.add(pop(hz(91 + int(rng.integers(0, 3)) * 2)), t, 0.2, wet=0.3)
    elif kind == 'snap':
        mix.add(block_break(), t, 0.6)
        mix.add(latch(), t, 0.5, wet=0.4)
    elif kind == 'charge':
        mix.add(riser(c['end'] - t), t, 0.7, wet=0.4)

mix.write(sys.argv[2], drive=1.7)
