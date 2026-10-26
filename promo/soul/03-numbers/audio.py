"""Soundtrack for Soul Launcher Ad 3: a 128 BPM A-minor groove from the first frame, an odometer
tick run into the ~125 MB slam, whoosh + hit on every slice cut, pops on each number line, a riser
into the OneClient install and the FPS gauge, a rubber-stamp thud on GPL-3.0 -> end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import Mix, hz, kick, thump, hit, play_common, outro, groove  # noqa: E402

B = 60 / 128
END = 25 * B
DUR = END + 5.0
mix = Mix(DUR)

for c in json.load(open(sys.argv[1])):
    t, kind = c['t'], c['type']
    if play_common(mix, c):
        continue
    if kind == 'stamp':
        mix.add(kick(1.4), t, 0.9)
        mix.add(thump(), t, 0.8)
        mix.add(hit(), t, 0.6, wet=0.4)

groove(mix, 0.0, END, [((69, 72, 76), 45), ((65, 69, 72), 41), ((60, 64, 67), 36), ((67, 71, 74), 43)],
       step=4 * B, kick_gain=0.85, arp_gain=0.12, beat=B)
outro(mix, END, DUR - END, notes=(45, 52, 57, 60, 64))

mix.write(sys.argv[2], master=0.76, drive=2.0)
