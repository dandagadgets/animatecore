"""Soundtrack for Soul Launcher Ad 1: a stressed drone, speeding clock and error chimes while the
desktop fills with popups -> record scratch and silence on the freeze -> soul-fire crackle and an
impact -> a bright D-major groove under the launcher's 4 steps -> end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import (Mix, SR, hz, tv, pad, pluck, beep, kick, thump, scratch, riser, whoosh, band_noise,  # noqa: E402
                   play_common, outro, groove, saw_bass)
import numpy as np  # noqa: E402

DUR = 20.9
FREEZE, BURN0, BURN1, END = 6.3, 6.85, 7.55, 16.0
mix = Mix(DUR)
rng = np.random.default_rng(7)
cues = json.load(open(sys.argv[1]))


def layer(*parts):
    """Sum (signal, offset_seconds) pairs into one buffer."""
    n = max(int(off * SR) + len(sig) for sig, off in parts)
    out = np.zeros(n)
    for sig, off in parts:
        out[int(off * SR):int(off * SR) + len(sig)] += sig
    return out


def err_chime(n=76):
    return layer((pluck(hz(n), 0.18, 16) * 0.8, 0), (beep(hz(n), 0.07) * 0.25, 0),
                 (pluck(hz(n - 5), 0.3, 11) * 0.8, 0.085), (beep(hz(n - 5), 0.12) * 0.25, 0.085))


def crackle(d):
    sig = band_noise(d, 900, 7000) * 0.25
    for _ in range(int(d * 45)):
        i = int(rng.uniform(0, d - 0.02) * SR)
        pop = band_noise(0.006, 1500, 9000)
        sig[i:i + len(pop)] += pop * rng.uniform(0.4, 1.0) * np.exp(-np.arange(len(pop)) / 60)
    return sig * np.minimum(1, tv(d) / 0.1)


# --- stress bed under the chaos ---
mix.add(pad([38, 44, 51], FREEZE + 0.2, bright=0.2), 0.0, 0.24, wet=0.5)
mix.add(riser(FREEZE), 0.0, 0.26, wet=0.3)
t, k = 0.0, 0
while t < FREEZE:
    mix.add(saw_bass(hz(38 + (k % 4 == 3) * 3), 0.16), t, 0.32 + 0.14 * t / FREEZE)
    mix.add(kick(0.7), t, 0.45)
    t += 0.5 - 0.3 * (t / FREEZE)
    k += 1

for c in cues:
    if c['t'] >= FREEZE:
        continue
    if play_common(mix, c):
        continue
    if c['type'] == 'err':
        if c['crash']:
            mix.add(beep(hz(64 + c['k'] % 17), 0.06), c['t'], 0.24, pan=float(rng.uniform(-0.5, 0.5)))
            mix.add(pluck(hz(76 + c['k'] % 17), 0.12, 20), c['t'], 0.26)
        else:
            mix.add(err_chime(79 - c['k']), c['t'], 0.62, wet=0.3)

# the freeze: everything stops dead
mix.duck(FREEZE, BURN0, 0.0)

for c in cues:
    if c['t'] < FREEZE:
        continue
    if play_common(mix, c):
        continue
    if c['type'] == 'scratch':
        mix.add(scratch(0.5), c['t'], 0.9)
    elif c['type'] == 'burn':
        d = c['end'] - c['t']
        mix.add(crackle(d + 0.3), c['t'], 0.7, wet=0.3)
        mix.add(riser(d), c['t'], 0.45, wet=0.3)
        mix.add(whoosh(1.0), c['t'] + d - 0.7, 0.6, wet=0.3)

# --- the launcher: bright D-major groove ---
mix.add(kick(), BURN1, 1.0)
groove(mix, BURN1, END, [((62, 66, 69), 38), ((59, 62, 66), 35), ((55, 59, 62), 31), ((57, 61, 64), 33)],
       step=2.0, kick_gain=0.8, arp_gain=0.1, beat=0.5)
outro(mix, END, DUR - END, notes=(50, 57, 62, 66, 69))

mix.write(sys.argv[2], master=0.8, drive=2.7)
