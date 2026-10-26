"""Soundtrack for PotSMP Ad 2: underwater drone + heartbeat -> sting when the eyes open ->
rumble/growl as the boss rises -> taiko + low ostinato for the fight -> heartbeat on the dare
-> Season IV end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import (Mix, hz, pad, bell, kick, thump, snare, rumble, bubbles, braam, saw_bass, sweep, tv,  # noqa: E402
                   band_noise, play_common, outro)
import numpy as np  # noqa: E402

DUR = 18.5
EYES, RISE, TITLE, FIGHT, ENRAGE, DARE, END = 2.6, 4.2, 6.0, 7.2, 11.2, 11.8, 13.4
mix = Mix(DUR)


def tom(f=hz(41)):
    t = tv(0.7)
    return sweep(f * (1 + 0.8 * np.exp(-t * 18)), t) * np.exp(-t * 5) + band_noise(0.7, 80, 1200) * np.exp(-t * 30) * 0.3


# --- the deep: drone, bubbles, heartbeat, a crooked bell motif ---
mix.add(pad([38, 45, 50, 51], DARE + 0.3), 0.0, 0.2, wet=0.7)
mix.add(bubbles(DARE), 0.0, 0.7, wet=0.5)
t = 0.0
while t < RISE:
    gap = 0.8 if t < EYES else 0.5
    mix.add(kick(0.4), t, 0.5)
    mix.add(thump(), t + 0.16, 0.25)
    t += gap
for i, n in enumerate([86, 85, 81, 86, 82]):
    mix.add(bell(hz(n), 1.8, 0.4), 0.2 + i * 0.5, 0.06, wet=0.9)

# --- eyes / rise / title ---
mix.add(braam(hz(37), 2.0), EYES, 0.5, wet=0.5)
for n in (93, 94, 98):
    mix.add(bell(hz(n), 1.4, 1.4), EYES, 0.05, wet=0.9)
mix.add(rumble(2.2), RISE, 0.7)
mix.add(braam(hz(33), 2.4), RISE, 0.55, wet=0.5)
mix.add(braam(hz(38), 1.6), TITLE, 0.6, wet=0.5)

# --- fight: taiko + 8th-note low ostinato in D minor ---
beat = 0.5
k = 0
while FIGHT + k * beat < ENRAGE:
    bt = FIGHT + k * beat
    mix.add(tom(hz(38 if k % 2 == 0 else 43)), bt, 0.75, wet=0.3)
    if k % 4 == 2:
        mix.add(snare(), bt, 0.35, wet=0.5)
    k += 1
for i in range(int((ENRAGE - FIGHT) / 0.25)):
    root = [38, 38, 41, 36][(i // 8) % 4]
    mix.add(saw_bass(hz(root + (12 if i % 4 == 3 else 0)), 0.22), FIGHT + i * 0.25, 0.28)
mix.add(pad([50, 53, 57, 62], ENRAGE - FIGHT, bright=0.6), FIGHT, 0.14, wet=0.7)

# --- dare: heartbeat in the dark ---
t = DARE
while t < END - 0.1:
    mix.add(kick(0.5), t, 0.7)
    mix.add(thump(), t + 0.16, 0.35)
    t += 0.8
mix.add(pad([38, 45, 50], END - DARE), DARE, 0.12, wet=0.8)

outro(mix, END, DUR - END, notes=(53, 60, 65, 69, 72))

for c in json.load(open(sys.argv[1])):
    tt, kind = c['t'], c['type']
    if play_common(mix, c):
        continue
    if kind == 'sting':
        mix.add(band_noise(0.6, 2000, 9000) * np.exp(-tv(0.6) * 6) * 0.3, tt, 0.6, wet=0.6)
    elif kind == 'rise':
        mix.add(bubbles(1.2) * 2, tt, 0.6, wet=0.4)
    elif kind == 'bar':
        mix.add(braam(hz(45), 1.0), tt, 0.35, wet=0.4)
    elif kind == 'braam':
        mix.add(braam(hz(36), 2.0), tt, 0.5, wet=0.5)

mix.write(sys.argv[2], master=0.8, drive=2.2)
