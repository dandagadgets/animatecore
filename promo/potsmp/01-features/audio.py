"""Soundtrack for PotSMP Ad 1: bubbly build-up -> 150 BPM pop-EDM drop under the feature cards
(D minor: Dm Bb F C) -> big hit on +342 MORE -> Season IV end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import (Mix, hz, pad, snare, riser, bubbles, saw_bass, play_common, outro, groove)  # noqa: E402

DUR = 20.0
BEAT = 0.4
HOOK, MORE, END = 1.6, 13.6, 14.8
mix = Mix(DUR)

# hook: bubbling potion + riser + snare roll into the drop
mix.add(bubbles(HOOK), 0.0, 0.8, wet=0.4)
mix.add(pad([50, 57, 62], HOOK + 0.2, bright=0.4), 0.0, 0.18, wet=0.6)
mix.add(riser(HOOK), 0.0, 0.45, wet=0.3)
for i in range(8):
    mix.add(snare(), HOOK - 0.8 + i * 0.1, 0.1 + i * 0.05, wet=0.2)

# feature run
groove(mix, HOOK, MORE, [((62, 65, 69), 38), ((58, 62, 65), 34), ((57, 60, 65), 41), ((60, 64, 67), 36)],
       step=4 * BEAT, kick_gain=0.9, arp_gain=0.12, bass_fn=saw_bass, beat=BEAT)
# +342 MORE: half-time stab, then into the outro
mix.add(pad([53, 57, 60, 65], END - MORE + 0.3, bright=0.7), MORE, 0.24, wet=0.6)
outro(mix, END, DUR - END, notes=(50, 57, 62, 65, 69))

for c in json.load(open(sys.argv[1])):
    play_common(mix, c)

mix.write(sys.argv[2], master=0.8, drive=2.5)
