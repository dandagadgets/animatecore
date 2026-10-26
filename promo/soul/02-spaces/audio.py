"""Soundtrack for Soul Launcher Ad 2: an airy F-major pad and marimba plinks as the Space gets
packed, pops as Spaces multiply, then a soft groove under the category sync (dings as the server
lands in each Space, ticks on the slider, typing and link latches on the file tree) -> end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import Mix, hz, pad, pluck, bell, thump, play_common, outro, groove  # noqa: E402

DUR = 18.1
GRID, END = 2.4, 13.2
mix = Mix(DUR)

CHORDS = [((65, 69, 72), 41), ((62, 65, 69), 38), ((58, 62, 65), 34), ((60, 64, 67), 36)]

# intro: pad + a soft arpeggio while the first Space is packed
for i, (triad, root) in enumerate(CHORDS[:2]):
    mix.add(pad(list(triad) + [root + 12], 1.4, bright=0.3), i * 1.2, 0.3, wet=0.6)
for i in range(int(GRID / 0.25)):
    triad = CHORDS[(i // 4) % 2][0]
    mix.add(pluck(hz(triad[i % 3] + 12), 0.2, 14), i * 0.25, 0.1, pan=0.3 if i % 2 else -0.3, wet=0.5)

for c in json.load(open(sys.argv[1])):
    t, kind = c['t'], c['type']
    g = c.get('gain', 1.0)
    if play_common(mix, c):
        continue
    if kind == 'plink':
        mix.add(pluck(hz(c['note']), 0.35, 9), t, 0.42 * g, wet=0.5)
        mix.add(bell(hz(c['note'] + 12), 0.8, 0.5), t, 0.08 * g, wet=0.8)
    elif kind == 'thump':
        mix.add(thump(), t, 0.7)

groove(mix, GRID, END, CHORDS, step=2.0, kick_gain=0.7, arp_gain=0.08, beat=0.5)
outro(mix, END, DUR - END, notes=(53, 60, 65, 69, 72))

mix.write(sys.argv[2], master=0.72, drive=1.9)
