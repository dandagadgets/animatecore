"""Synthesises the Mine Radar ad soundtrack: a 120 BPM chiptune bed plus SFX
placed from the cue sheet that render.js exports (pings, pops, impact...).

    python3 make-audio.py cues.json out.wav
"""
import json
import sys
import wave

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(7)

dry = np.zeros((2, N))
send = np.zeros((2, N))  # reverb + delay bus


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def tv(d):
    return np.arange(int(d * SR)) / SR


def place(bus, sig, t0, gain=1.0, pan=0.0):
    i0 = int(round(t0 * SR))
    if i0 >= N or len(sig) == 0:
        return
    if i0 < 0:
        sig, i0 = sig[-i0:], 0
    sig = sig[: N - i0]
    th = (pan + 1) * np.pi / 4
    bus[0, i0:i0 + len(sig)] += sig * gain * np.cos(th) * np.sqrt(2)
    bus[1, i0:i0 + len(sig)] += sig * gain * np.sin(th) * np.sqrt(2)


def add(sig, t0, gain=1.0, pan=0.0, wet=0.0):
    place(dry, sig, t0, gain, pan)
    if wet:
        place(send, sig, t0, gain * wet, pan)


def band_noise(d, lo, hi):
    n = rng.standard_normal(max(int(d * SR), 2))
    spec = np.fft.rfft(n)
    f = np.fft.rfftfreq(len(n), 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    out = np.fft.irfft(spec, len(n))
    return out / (np.std(out) + 1e-9)


# ---------- instruments ----------
def square(f, t, harmonics=(1, 3, 5, 7, 9)):
    return sum(np.sin(2 * np.pi * f * k * t) / k for k in harmonics if f * k < 14000)


def pluck(f, d=0.25, decay=13.0):
    t = tv(d)
    return square(f, t) * np.minimum(1, t / 0.003) * np.exp(-t * decay) * 0.5


def kick():
    t = tv(0.42)
    f = 46 + 120 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5) * np.minimum(1, t / 0.002)


def hat():
    t = tv(0.05)
    return band_noise(0.05, 7000, 16000) * np.exp(-t * 80) * 0.18


def bass(f, d):
    t = tv(d)
    sig = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return sig * np.minimum(1, t / 0.004) * np.exp(-t * 4) * np.minimum(1, (d - t) / 0.015)


def pad(notes, d):
    t = tv(d)
    sig = sum(np.sin(2 * np.pi * hz(m) * (1 + det) * t + hash_phase)
              for i, m in enumerate(notes) for det, hash_phase in ((-0.004, i), (0.004, i * 2.1)))
    env = np.minimum(1, t / 0.35) * np.minimum(1, (d - t) / 0.35)
    return sig * env * (0.85 + 0.15 * np.sin(2 * np.pi * 0.5 * t)) / len(notes)


def ping(f):
    t = tv(1.2)
    sig = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.005 * t)
    return sig * np.minimum(1, t / 0.002) * np.exp(-t * 6)


def pop(f):
    t = tv(0.18)
    bend = f * (1 + 0.6 * np.exp(-t * 45))
    return np.sin(2 * np.pi * np.cumsum(bend) / SR) * np.minimum(1, t / 0.002) * np.exp(-t * 18)


def click():
    t = tv(0.012)
    return band_noise(0.012, 2000, 9000) * np.exp(-t * 500) * 0.25


def whoosh(d=0.8):
    t = tv(d)
    peak = 0.65
    env = np.where(t < d * peak, (t / (d * peak)) ** 2, ((d - t) / (d * (1 - peak))) ** 1.5)
    return band_noise(d, 500, 6000) * env * 0.35


def riser(d):
    t = tv(d)
    f = 180 + 1400 * (t / d) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    return (band_noise(d, 1500, 12000) * 0.3 + tone) * (t / d) ** 2.2


def impact():
    t = tv(2.6)
    f = 32 + 140 * np.exp(-t * 14)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    crash = band_noise(2.6, 4000, 16000) * np.exp(-t * 2.8) * 0.22
    thud = band_noise(2.6, 60, 900) * np.exp(-t * 12) * 0.5
    return sub + crash + thud


def thump():
    t = tv(0.35)
    f = 60 + 90 * np.exp(-t * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) * 0.8


# ---------- music bed (A minor -> C major) ----------
CHORDS = [  # start, end, triad (midi), bass root (midi)
    (0.0, 2.0, (57, 60, 64), 45),   # Am
    (2.0, 4.0, (53, 57, 60), 41),   # F
    (4.0, 6.0, (55, 60, 64), 48),   # C
    (6.0, 8.0, (55, 59, 62), 43),   # G
    (8.0, 9.5, (57, 60, 64), 45),   # Am
    (9.5, 11.0, (55, 59, 62), 43),  # G
    (11.0, 15.0, (55, 60, 64), 36), # C
]

for start, end, triad, root in CHORDS:
    g = 0.22 if start < 11 else 0.32
    add(pad([m - 12 for m in triad] + [triad[0]], end - start + 0.35), start, g, wet=0.6)

    # arpeggio: 16ths in the build, 8ths over the end card, silent under the riser
    step = 0.125 if start < 11 else 0.25
    pattern = [0, 1, 2, 1, 2, 0, 1, 2]
    i = 0
    t = start
    while t < end - 1e-6:
        if (2.0 <= t < 10.5) or (11.0 <= t < 14.25):
            note = triad[pattern[i % len(pattern)]] + 12 + (12 if (i % 8) == 3 and start >= 11 else 0)
            lvl = 0.10 if t < 4 else 0.15 if t < 11 else 0.12 * (1 - (t - 11) / 4)
            add(pluck(hz(note)), t, lvl, pan=0.35 if i % 2 else -0.35, wet=0.35)
        i += 1
        t += step

    # bass: 8th-note pulse in the build, one long note under the logo
    if start >= 11:
        add(bass(hz(root), 3.5), start, 0.55)
    else:
        t = start
        while t < end - 1e-6:
            if 4.0 <= t < 10.5:
                add(bass(hz(root) * (2 if (round(t / 0.25) % 4) == 3 else 1), 0.24), t, 0.32)
            t += 0.25

# drums
for k in range(int(4.0 / BEAT), int(10.5 / BEAT)):
    add(kick(), k * BEAT, 0.8)
    add(hat(), k * BEAT + 0.25, 1.0, pan=0.2)
    if k % 2:
        add(hat(), k * BEAT + 0.125, 0.5, pan=-0.2)

# ---------- SFX from the animation's cue sheet ----------
cues = json.load(open(sys.argv[1]))
for c in cues:
    t = c['t']
    kind = c['type']
    if kind == 'ping':
        add(ping(hz(c['note'])), t, 0.22 * c['gain'], pan=rng.uniform(-0.4, 0.4), wet=0.7)
    elif kind == 'click':
        add(click(), t, 0.6, pan=rng.uniform(-0.2, 0.2))
    elif kind == 'chip':
        add(pop(hz(c['note'])), t, 0.22, pan=rng.uniform(-0.5, 0.5), wet=0.4)
    elif kind == 'pop':
        add(pop(hz(c['note'])), t, 0.26, pan=rng.uniform(-0.4, 0.4), wet=0.4)
    elif kind == 'whoosh':
        add(whoosh(), t - 0.52, 0.9, wet=0.3)
    elif kind == 'thump':
        add(thump(), t, 0.7)
    elif kind == 'stamp':
        add(thump(), t, 0.8)
        add(ping(hz(96)), t, 0.18, wet=0.8)
    elif kind == 'riser':
        add(riser(c['end'] - t), t, 0.55, wet=0.3)
    elif kind == 'impact':
        add(impact(), t, 1.0, wet=0.5)

# ---------- effects & master ----------
ir_len = int(1.6 * SR)
tir = np.arange(ir_len) / SR
wet = np.zeros_like(send)
for ch in range(2):
    ir = rng.standard_normal(ir_len) * np.exp(-tir * 3.2)
    ir[: int(0.012 * SR)] = 0
    size = 1 << int(np.ceil(np.log2(N + ir_len)))
    wet[ch] = np.fft.irfft(np.fft.rfft(send[ch], size) * np.fft.rfft(ir, size), size)[:N]
wet /= (np.max(np.abs(wet)) + 1e-9)
wet *= np.max(np.abs(send)) * 0.6

delay = np.zeros_like(send)
d = int(0.375 * SR)
for tap, g in enumerate((0.32, 0.16, 0.08), start=1):
    src = send[(tap + 1) % 2]
    delay[tap % 2, tap * d:] += src[: N - tap * d] * g

mix = dry + wet + delay
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.4) / np.tanh(1.4) * 0.84
fade = int(0.8 * SR)
mix[:, -fade:] *= np.linspace(1, 0, fade) ** 2
mix[:, :int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))

with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print(sys.argv[2])
