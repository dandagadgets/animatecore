"""Soundtrack for Minetic Media Ad 2: a 128 BPM E-minor club groove from the first frame, hits on
the intro words, a riser into the carousel, a whoosh + hit on every phone slide, a second riser
into the video wall drop -> end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import Mix, hz, kick, saw_bass, pad, play_common, outro, groove  # noqa: E402

B = 60 / 128
CAR0, WALL, END = 4 * B, 20 * B, 24 * B
DUR = END + 5.25
mix = Mix(DUR)

# intro: four-on-the-floor kicks with a sub stab under each word
# (the first hit starts 40 ms in: a full-level transient on sample 0 makes AAC overshoot)
for k in range(4):
    mix.add(kick(1.2), max(k * B, 0.04), 0.9)
    mix.add(saw_bass(hz(40), B * 0.8), max(k * B, 0.04), 0.3)
mix.add(pad([52, 59, 64, 67], CAR0, bright=0.6), 0.0, 0.14, wet=0.6)

for c in json.load(open(sys.argv[1])):
    c['t'] = max(c['t'], 0.04)
    play_common(mix, c)

chords = [((64, 67, 71), 40), ((60, 64, 67), 36), ((62, 66, 69), 38), ((59, 62, 66), 35)]
groove(mix, CAR0, WALL, chords, step=4 * B, kick_gain=0.9, arp_gain=0.12, beat=B)
groove(mix, WALL, END, chords[:2], step=2 * B, kick_gain=1.0, arp_gain=0.14, beat=B)
outro(mix, END, DUR - END, notes=(40, 47, 52, 55, 59))

mix.write(sys.argv[2], master=0.68, drive=2.2)
