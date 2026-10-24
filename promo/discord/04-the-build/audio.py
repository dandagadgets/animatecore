"""Soundtrack for Video 4: airy ASMR bed where the block 'thocks' are the rhythm -> radar
power-up and a bright major drop -> loading ticks and level-up -> Discord end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import (Mix, hz, pad, bell, keys, riser, play_common, outro, groove, rng)  # noqa: E402

DUR = 18.0
LIVE, END = 8.2, 12.6
mix = Mix(DUR)

# airy bed in D major, slow bell melody
CH = [(50, 57, 62, 66), (47, 54, 59, 62), (43, 50, 55, 59), (45, 52, 57, 61)]
for i in range(4):
    mix.add(pad(list(CH[i]), 2.4), i * 2.05, 0.12, wet=0.7)
for i, n in enumerate([78, 81, 83, 81, 78, 76, 74, 76, 78, 85, 83, 81]):
    mix.add(bell(hz(n), 1.6, 0.6), 0.3 + i * 0.65, 0.07, pan=0.3 if i % 2 else -0.3, wet=0.8)
mix.add(riser(1.2), LIVE - 1.2, 0.45, wet=0.4)

groove(mix, LIVE, END - 0.25, [((62, 66, 69), 50), ((59, 62, 66), 47), ((55, 59, 62), 43), ((57, 61, 64), 45)],
       step=1.0, arp_gain=0.11)
outro(mix, END, DUR - END, notes=(50, 57, 62, 66, 69))

for c in json.load(open(sys.argv[1])):
    play_common(mix, c)

mix.write(sys.argv[2], master=0.8, drive=2.4)
