"""Soundtrack for Minetic Media Ad 1: limp elevator keys under the boring feed with swipe whooshes
and a sad 'womp' -> riser and a heavy stop impact + stamp -> a 128 BPM groove under the montage
(hit on every clip cut, slap on every sticker) -> breakdown on "your server could be next" -> end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import Mix, hz, keys, pad, trombone, bonk, kick, thump, hit, clap, play_common, outro, groove  # noqa: E402

B = 60 / 128
STOP, LOCK, MONT, NEXT, END, DUR = 3.0, 3.32, 4.3, 10.6, 12.6, 18.0
mix = Mix(DUR)

# boring feed: slightly sour, slow elevator keys
for i, chord in enumerate([(60, 64, 67, 71), (57, 60, 64, 67), (62, 65, 69, 72)]):
    for n in chord:
        mix.add(keys(hz(n) * 0.997, 1.1), 0.05 + i * 0.95, 0.17, wet=0.4)
    mix.add(kick(0.5), 0.05 + i * 0.95, 0.35)

for c in json.load(open(sys.argv[1])):
    t, kind = c['t'], c['type']
    if play_common(mix, c):
        continue
    if kind == 'womp':
        for k, (note, d) in enumerate([(55, 0.2), (54, 0.2), (53, 0.2), (52, 0.5)]):
            mix.add(trombone(hz(note), d), t + k * 0.2, 0.4, wet=0.3)
    elif kind == 'stamp':
        mix.add(kick(1.4), t, 1.0)
        mix.add(thump(), t, 0.8)
    elif kind == 'slap':
        mix.add(clap(), t, 0.55, wet=0.2)
        mix.add(bonk(hz(70)), t, 0.25)

# montage: 128 BPM groove in A minor, then a short breakdown before the end card
groove(mix, LOCK, NEXT, [((69, 72, 76), 45), ((65, 69, 72), 41), ((60, 64, 67), 36), ((67, 71, 74), 43)],
       step=4 * B, kick_gain=0.85, arp_gain=0.11, beat=B)
mix.add(pad([57, 64, 69, 72], END - NEXT + 0.3, bright=0.5), NEXT, 0.22, wet=0.6)
mix.add(hit(), NEXT, 0.6, wet=0.4)
outro(mix, END, DUR - END, notes=(45, 52, 57, 60, 64))

mix.write(sys.argv[2], master=0.8, drive=2.6)
