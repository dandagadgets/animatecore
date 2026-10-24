"""Soundtrack for Video 3: a warm lo-fi beat (85 BPM, vinyl crackle) where the chat dings and
reaction pops play the melody -> channel list whoosh -> Discord end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import (Mix, hz, keys, pad, kick, snare, hat, bass, vinyl, play_common, outro, rng)  # noqa: E402

DUR = 18.0
FLOOD, END = 7.3, 12.6
BEAT = 60 / 85
mix = Mix(DUR)

mix.add(vinyl(END + 0.5), 0.0, 0.8)
CHORDS = [((53, 57, 60, 64), 41), ((52, 55, 59, 62), 40), ((50, 53, 57, 60), 38), ((48, 52, 55, 59), 36)]
bar = 0
while bar * 4 * BEAT < END - 0.2:
    t0 = bar * 4 * BEAT
    notes, root = CHORDS[bar % 4]
    for i, n in enumerate(notes):
        mix.add(keys(hz(n + 12), 2.6), t0 + i * 0.03, 0.08, pan=-0.2 + i * 0.13, wet=0.6)
    mix.add(pad([n for n in notes], 4 * BEAT + 0.3), t0, 0.07, wet=0.6)
    mix.add(bass(hz(root), 1.2, decay=2.0), t0, 0.4)
    mix.add(bass(hz(root), 0.6, decay=3.0), t0 + 2.5 * BEAT, 0.3)
    for b in range(4):
        bt = t0 + b * BEAT
        if bt >= END - 0.1:
            break
        if b in (0, 2):
            mix.add(kick(0.7), bt + (0.5 * BEAT if b == 2 else 0), 0.7)
        if b in (1, 3):
            mix.add(snare(), bt, 0.3, wet=0.5)
        for h in range(2):
            ht = bt + h * BEAT / 2 + (0.06 if h else 0)  # lazy swing
            mix.add(hat(), ht, 0.55 if h else 0.8, pan=0.3)
            if bt > FLOOD:
                mix.add(hat(), ht + BEAT / 4, 0.35, pan=-0.3)
    bar += 1

outro(mix, END, DUR - END, notes=(53, 57, 60, 64, 69))

for c in json.load(open(sys.argv[1])):
    play_common(mix, c)

mix.write(sys.argv[2], master=0.76, drive=2.0)
