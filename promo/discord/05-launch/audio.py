"""Soundtrack for Video 5: drone + countdown beeps -> rumble and liftoff impact -> driving
anthem through the climb -> spacey breakdown with beacon pings, player pops and fireworks ->
Discord end card."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shorts', 'shared'))
from synth import (Mix, hz, pad, bell, rumble, latch, saw_bass, play_common, outro, groove, rng)  # noqa: E402

DUR = 18.0
LIFT, ORBIT, END = 4.0, 9.8, 12.8
mix = Mix(DUR)

# pre-launch drone
mix.add(pad([40, 47, 52], LIFT + 0.3), 0.0, 0.2, wet=0.6)

# the climb: E minor anthem
groove(mix, LIFT, ORBIT, [((64, 67, 71), 40), ((60, 64, 67), 36), ((62, 67, 71), 43), ((62, 66, 69), 38)],
       step=1.0, kick_gain=0.9, arp_gain=0.13, bass_fn=saw_bass)

# space breakdown: wide pad + slow bells
mix.add(pad([52, 59, 64, 71], END - ORBIT + 0.3, bright=0.3), ORBIT, 0.22, wet=0.8)
for i, n in enumerate([83, 86, 88, 91, 88, 95]):
    mix.add(bell(hz(n), 1.8, 0.7), ORBIT + 0.2 + i * 0.45, 0.08, pan=0.4 if i % 2 else -0.4, wet=0.8)

outro(mix, END, DUR - END, notes=(52, 59, 64, 67, 71))

for c in json.load(open(sys.argv[1])):
    t, kind = c['t'], c['type']
    if play_common(mix, c):
        continue
    if kind == 'rumble':
        mix.add(rumble(c['end'] - t), t, 0.55)
    elif kind == 'latch':
        mix.add(latch(), t, 0.6, wet=0.5)

mix.write(sys.argv[2], master=0.8, drive=1.7)
