"""Soundtrack for PotSMP Ad 3: cheesy casino jingle under the spin -> sad 'womp' on 1x dirt and
bonks for every key offer -> potion splash into a bouncy G-major groove for PotSMP's crates
and the feature flex -> Season IV end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import (Mix, hz, pluck, bonk, trombone, thump, success, level_up, pad, play_common, outro,  # noqa: E402
                   groove)

DUR = 17.6
SWITCH, END = 4.4, 12.6
mix = Mix(DUR)

for c in json.load(open(sys.argv[1])):
    t, kind = c['t'], c['type']
    if play_common(mix, c):
        continue
    if kind == 'jingle':
        # casino arpeggio that climbs while the reel spins
        tt, i = t, 0
        while tt < c['end'] - 0.05:
            step = [0, 4, 7, 12, 7, 4][i % 6] + 2 * (i // 12)
            mix.add(pluck(hz(72 + step), 0.14, 20), tt, 0.12, pan=0.3 if i % 2 else -0.3)
            tt += 0.085
            i += 1
        mix.add(pad([60, 64, 67], c['end'] - t), t, 0.1)
    elif kind == 'womp':
        for k, (note, d) in enumerate([(55, 0.22), (54, 0.22), (53, 0.22), (52, 0.55)]):
            mix.add(trombone(hz(note), d), t + 0.1 + k * 0.22, 0.45, wet=0.3)
        mix.add(bonk(hz(40)), t, 0.4)
    elif kind == 'bonk':
        mix.add(bonk(hz(c['note'])), t, 0.45)
    elif kind == 'pick':
        mix.add(success(), t, 0.4, wet=0.6)
        mix.add(level_up(hz(74)), t + 0.05, 0.22, wet=0.5)
    elif kind == 'thump':
        mix.add(thump(), t, 0.6)

# PotSMP side: bouncy G major
groove(mix, SWITCH + 0.25, END - 0.25, [((67, 71, 74), 43), ((62, 66, 69), 38), ((64, 67, 71), 40), ((60, 64, 67), 36)],
       step=4 * 0.45, kick_gain=0.8, arp_gain=0.11, beat=0.45)
outro(mix, END, DUR - END, notes=(55, 62, 67, 71, 74))

mix.write(sys.argv[2], master=0.66, drive=2.0)
