"""Soundtrack for Minetic Media Ad 3: a cozy chiptune loop while items drop into the crafting grid
(a block-place thunk and a rising note per item), a ticking riser while the arrow fills, a level-up
chime when the ad pops out, a 120 BPM groove when the phone is pulled out, achievement chimes on
each order step -> end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import Mix, hz, pluck, square, tv, bell, kick, hat, reel_tick, riser, pad, play_common, outro, groove  # noqa: E402
import numpy as np  # noqa: E402

CRAFT, OUTPUT, CLICK, PULLED, ORDER, END, DUR = 3.6, 4.05, 5.2, 5.75, 8.3, 11.9, 17.2
mix = Mix(DUR)


def chip(f, d=0.16):
    t = tv(d)
    return square(f, t, (1, 3, 5)) * np.exp(-t * 14) * 0.5


# cozy chiptune under the crafting: C major arpeggio + soft kick/hat
melody = [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84, 79, 76, 74, 71]
for i in range(int((CLICK - 0.04) / 0.25)):
    t = 0.04 + i * 0.25
    mix.add(chip(hz(melody[i % len(melody)])), t, 0.15, pan=0.25 if i % 2 else -0.25, wet=0.3)
    if i % 4 == 0:
        mix.add(kick(0.6), t, 0.6)
    if i % 4 == 2:
        mix.add(hat(), t, 0.8)
mix.add(pad([48, 55, 60, 64], CLICK, bright=0.3), 0.04, 0.12, wet=0.6)

for c in json.load(open(sys.argv[1])):
    t, kind = max(c['t'], 0.04), c['type']
    c['t'] = t
    if play_common(mix, c):
        continue
    if kind == 'craft':
        d = c['end'] - t
        mix.add(riser(d), t, 0.4, wet=0.3)
        for k in range(8):
            mix.add(reel_tick(), t + k * d / 8, 0.5)
    elif kind == 'toast':
        base = 79 + c['k'] * 2
        mix.add(bell(hz(base), 0.9, 0.8), t, 0.16, wet=0.6)
        mix.add(bell(hz(base + 7), 1.1, 0.8), t + 0.12, 0.16, wet=0.6)
        mix.add(pluck(hz(base + 12), 0.4, 8), t + 0.12, 0.14, wet=0.5)

groove(mix, PULLED, ORDER, [((60, 64, 67), 36), ((57, 60, 64), 33), ((65, 69, 72), 41), ((67, 71, 74), 43)],
       step=2.0, kick_gain=0.6, arp_gain=0.08, beat=0.5)
mix.add(pad([60, 64, 67, 72], END - ORDER + 0.3, bright=0.5), ORDER, 0.3, wet=0.6)
for i in range(int((END - ORDER) / 0.5)):
    mix.add(kick(0.5), ORDER + i * 0.5, 0.55)
    mix.add(hat(), ORDER + i * 0.5 + 0.25, 0.6)
outro(mix, END, DUR - END, notes=(48, 55, 60, 64, 67))

mix.write(sys.argv[2], master=0.64, drive=2.6)
