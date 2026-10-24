"""Soundtrack for Video 2: suspense + chest rattles -> burst open -> reel ticks over a rising
drumroll -> legendary fanfare and coin shower -> celebratory groove -> Discord end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import (Mix, hz, pad, kick, thump, snare, latch, ui_click, hit, sparkle, firework, level_up,  # noqa: E402
                   success, coin, riser, play_common, outro, groove, rng)

DUR = 17.0
TAP, OPEN, SPIN0, SPIN1, END = 0.8, 1.7, 2.3, 7.6, 12.0
mix = Mix(DUR)

# suspense: low pad + heartbeat
mix.add(pad([45, 52, 57], SPIN1 + 0.3), 0.0, 0.16, wet=0.6)
for bt in (0.0, 0.6, 1.2):
    mix.add(kick(0.5), bt, 0.45)
    mix.add(thump(), bt + 0.2, 0.25)

# reel: tension riser + accelerating-then-thinning drumroll
mix.add(riser(SPIN1 - SPIN0), SPIN0, 0.35, wet=0.4)
t = SPIN0 + 1.2
while t < SPIN1 - 0.1:
    mix.add(snare(), t, 0.06 + 0.12 * (t - SPIN0) / (SPIN1 - SPIN0), wet=0.2)
    t += 0.09
mix.add(pad([52, 59, 64, 68], SPIN1 - SPIN0, bright=0.6), SPIN0, 0.1, wet=0.6)

# win groove
groove(mix, SPIN1 + 0.5, END - 0.25, [((60, 64, 67), 48), ((55, 59, 62), 43), ((57, 60, 64), 45), ((53, 57, 60), 41)],
       step=1.0)
outro(mix, END, DUR - END)

for c in json.load(open(sys.argv[1])):
    t, kind = c['t'], c['type']
    if play_common(mix, c):
        continue
    if kind == 'uiclick':
        mix.add(ui_click(), t, 0.8)
    elif kind == 'rattle':
        mix.add(latch(), t, 0.22 * c['gain'], pan=rng.uniform(-0.4, 0.4))
        mix.add(thump(), t, 0.25 * c['gain'])
    elif kind == 'latch':
        mix.add(latch(), t, 0.6, wet=0.4)
    elif kind == 'open':
        mix.add(hit(), t, 0.9, wet=0.5)
        mix.add(sparkle(hz(84), 7, 0.045), t + 0.05, 0.3, wet=0.7)
        mix.add(firework(), t + 0.1, 0.35, wet=0.5)
    elif kind == 'win':
        mix.add(hit(), t, 1.0, wet=0.5)
        mix.add(level_up(hz(72)), t + 0.05, 0.3, wet=0.5)
        mix.add(success(), t + 0.4, 0.45, wet=0.6)
        mix.add(sparkle(hz(88), 8, 0.05), t + 0.2, 0.25, wet=0.7)
    elif kind == 'coin':
        mix.add(coin(hz(88 + int(rng.integers(0, 4)) * 2)), t, 0.13, pan=rng.uniform(-0.6, 0.6), wet=0.3)

mix.write(sys.argv[2], drive=1.6)
