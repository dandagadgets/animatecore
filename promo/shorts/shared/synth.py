"""Tiny synth + mixer shared by the shorts' soundtracks (numpy only).

Each short's audio.py builds a Mix, places instruments/SFX on a timeline and
calls mix.write(path). Cue times come from the cue sheet the page exports.
"""
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def tv(d):
    return np.arange(max(int(d * SR), 1)) / SR


def band_noise(d, lo, hi):
    n = rng.standard_normal(max(int(d * SR), 2))
    spec = np.fft.rfft(n)
    f = np.fft.rfftfreq(len(n), 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    out = np.fft.irfft(spec, len(n))
    return out / (np.std(out) + 1e-9)


def sweep(f, t):
    """Sine whose frequency follows the array f (same length as t)."""
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# ---------- instruments ----------
def square(f, t, harmonics=(1, 3, 5, 7, 9)):
    return sum(np.sin(2 * np.pi * f * k * t) / k for k in harmonics if f * k < 14000)


def pluck(f, d=0.25, decay=13.0):
    t = tv(d)
    return square(f, t) * np.minimum(1, t / 0.003) * np.exp(-t * decay) * 0.5


def keys(f, d=1.6):
    """Soft electric-piano-ish note."""
    t = tv(d)
    sig = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3) + 0.1 * np.sin(6 * np.pi * f * t) * np.exp(-t * 6)
    return sig * np.minimum(1, t / 0.006) * np.exp(-t * 2.2) * np.minimum(1, (d - t) / 0.05)


def kick(punch=1.0):
    t = tv(0.42)
    f = 46 + 120 * punch * np.exp(-t * 30)
    return sweep(f, t) * np.exp(-t * 7.5) * np.minimum(1, t / 0.002)


def snare():
    t = tv(0.25)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) * 0.5
    return (band_noise(0.25, 1200, 12000) * np.exp(-t * 16) * 0.6 + body)


def clap():
    t = tv(0.3)
    env = sum(np.exp(-np.maximum(t - o, 0) * 60) * (t >= o) for o in (0, 0.01, 0.022)) + np.exp(-t * 9) * 0.4
    return band_noise(0.3, 900, 7000) * env * 0.35


def hat(open_=False):
    d = 0.18 if open_ else 0.05
    t = tv(d)
    return band_noise(d, 7000, 16000) * np.exp(-t * (18 if open_ else 80)) * 0.18


def bass(f, d, decay=4.0):
    t = tv(d)
    sig = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return sig * np.minimum(1, t / 0.004) * np.exp(-t * decay) * np.minimum(1, (d - t) / 0.015)


def saw_bass(f, d):
    t = tv(d)
    sig = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 9))
    return sig * np.minimum(1, t / 0.004) * np.exp(-t * 3) * np.minimum(1, (d - t) / 0.015) * 0.6


def pad(notes, d, bright=0.0):
    t = tv(d)
    sig = sum(np.sin(2 * np.pi * hz(m) * (1 + det) * t + i * ph) + bright * 0.3 * np.sin(4 * np.pi * hz(m) * t)
              for i, m in enumerate(notes) for det, ph in ((-0.004, 1.0), (0.004, 2.1)))
    env = np.minimum(1, t / 0.35) * np.minimum(1, (d - t) / 0.35)
    return sig * env * (0.85 + 0.15 * np.sin(2 * np.pi * 0.5 * t)) / len(notes)


def ping(f):
    t = tv(1.2)
    sig = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.005 * t)
    return sig * np.minimum(1, t / 0.002) * np.exp(-t * 6)


def pop(f):
    t = tv(0.18)
    return sweep(f * (1 + 0.6 * np.exp(-t * 45)), t) * np.minimum(1, t / 0.002) * np.exp(-t * 18)


def click():
    t = tv(0.012)
    return band_noise(0.012, 2000, 9000) * np.exp(-t * 500) * 0.25


def ui_click():
    t = tv(0.05)
    return (np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 120) + band_noise(0.05, 2000, 8000) * np.exp(-t * 200) * 0.3) * 0.5


def bonk(f=220):
    """Comedic error buzz: low square with a falling pitch."""
    t = tv(0.42)
    fr = f * (1 - 0.35 * t / 0.42)
    sig = sum(np.sin(2 * np.pi * np.cumsum(fr) * k / SR) / k for k in (1, 3, 5, 7))
    return sig * np.minimum(1, t / 0.004) * np.exp(-t * 5) * 0.55


def cricket():
    t = tv(0.32)
    chirp = np.sin(2 * np.pi * 4600 * t) * (np.sin(2 * np.pi * 45 * t) > 0.2)
    return chirp * np.where(t < 0.12, 1, 0) * 0.25 + np.sin(2 * np.pi * 4600 * t) * ((t > 0.2) & (t < 0.3)) * (np.sin(2 * np.pi * 45 * t) > 0.2) * 0.2


def trombone(f, d):
    """Sad 'wah' note: brassy additive tone with vibrato and a mute-like filter wobble."""
    t = tv(d)
    vib = 1 + 0.012 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.3)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    wah = 0.5 + 0.5 * np.sin(np.pi * np.minimum(t / max(d, 1e-3), 1))
    sig = sum(np.sin(ph * k) * (wah ** (k - 1)) / k for k in range(1, 8))
    return sig * np.minimum(1, t / 0.04) * np.minimum(1, (d - t) / 0.08) * 0.45


def scratch(d=0.45):
    t = tv(d)
    f = 300 + 1800 * np.abs(np.sin(2 * np.pi * 3.2 * t))
    return (band_noise(d, 300, 5000) * 0.4 + sweep(f, t) * 0.3) * np.exp(-t * 3)


def whoosh(d=0.8):
    t = tv(d)
    peak = 0.65
    env = np.where(t < d * peak, (t / (d * peak)) ** 2, ((d - t) / (d * (1 - peak))) ** 1.5)
    return band_noise(d, 500, 6000) * env * 0.35


def riser(d):
    t = tv(d)
    tone = sweep(180 + 1400 * (t / d) ** 2, t) * 0.25
    return (band_noise(d, 1500, 12000) * 0.3 + tone) * (t / d) ** 2.2 * np.minimum(1, (d - t) / 0.04)


def impact(d=2.6):
    t = tv(d)
    sub = sweep(32 + 140 * np.exp(-t * 14), t) * np.exp(-t * 2.2)
    crash = band_noise(d, 4000, 16000) * np.exp(-t * 2.8) * 0.22
    thud = band_noise(d, 60, 900) * np.exp(-t * 12) * 0.5
    return sub + crash + thud


def hit():
    """Short cinematic cut hit."""
    t = tv(0.6)
    return sweep(40 + 160 * np.exp(-t * 20), t) * np.exp(-t * 6) + band_noise(0.6, 2000, 14000) * np.exp(-t * 14) * 0.25


def thump():
    t = tv(0.35)
    return sweep(60 + 90 * np.exp(-t * 25), t) * np.exp(-t * 11) * 0.8


def rain(d):
    t = tv(d)
    hiss = band_noise(d, 1500, 9000) * 0.12
    drops = np.zeros_like(t)
    for _ in range(int(d * 40)):
        i = rng.integers(0, len(t) - 600)
        drops[i:i + 600] += band_noise(600 / SR, 2500, 8000)[:600] * np.exp(-np.arange(600) / 60) * rng.uniform(0.1, 0.35)
    return hiss + drops


def coin(f=hz(88)):
    t1, t2 = tv(0.07), tv(0.35)
    a = square(f, t1) * 0.4
    b = square(f * 4 / 3, t2) * np.exp(-t2 * 9) * 0.4
    return np.concatenate([a, b])



# ---------- satisfying SFX (Discord promo set) ----------
PENTA = (0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24)


def bell(f, d=1.4, bright=1.0):
    t = tv(d)
    partials = ((1.0, 1.0, 2.2), (2.01, 0.5, 3.5), (3.02, 0.28 * bright, 5.0), (4.13, 0.15 * bright, 7.0), (5.4, 0.08 * bright, 9.0))
    sig = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * k) for r, a, k in partials)
    return sig * np.minimum(1, t / 0.002) * 0.5


def sparkle(f0, n=6, step=0.055):
    """Rising pentatonic bell run."""
    out = np.zeros(int((step * n + 1.3) * SR))
    for i in range(n):
        b = bell(f0 * 2 ** (PENTA[i % len(PENTA)] / 12), 1.2, 1.4)
        i0 = int(i * step * SR)
        out[i0:i0 + len(b)] += b * (0.9 - i * 0.05)
    return out


def dig(k=0):
    """One crunchy mining hit."""
    t = tv(0.11)
    crunch = band_noise(0.11, 350 + 40 * (k % 4), 4200) * np.exp(-t * 42)
    thud = np.sin(2 * np.pi * (130 + 12 * (k % 3)) * t) * np.exp(-t * 38)
    return (crunch * 0.55 + thud * 0.7) * 0.9


def block_break():
    t = tv(0.4)
    grit = band_noise(0.4, 250, 6000) * np.exp(-t * 12) * (0.6 + 0.4 * (rng.random(len(t)) > 0.5))
    thud = sweep(60 + 170 * np.exp(-t * 9), t) * np.exp(-t * 11)
    return grit * 0.55 + thud * 0.8


def place(k=0):
    """Satisfying block-place 'thock'."""
    t = tv(0.17)
    body = sweep(230 + 35 * (k % 5) + 150 * np.exp(-t * 60), t) * np.exp(-t * 28)
    click = band_noise(0.17, 1800, 8000) * np.exp(-t * 170) * 0.45
    return body * 0.85 + click


def ding(f=hz(88)):
    """Two-tone notification ping."""
    a, b = bell(f, 0.9, 0.8), bell(f * 1.335, 1.0, 0.8)
    out = np.zeros(len(b) + int(0.09 * SR))
    out[:len(a)] += a
    out[int(0.09 * SR):] += b
    return out * 0.8


def beep(f, d=0.2):
    t = tv(d)
    return square(f, t, (1, 3, 5)) * np.minimum(1, t / 0.002) * np.minimum(1, (d - t) / 0.02) * 0.4


def rumble(d):
    t = tv(d)
    return band_noise(d, 25, 280) * np.minimum(1, t / 0.4) * (0.8 + 0.2 * np.sin(2 * np.pi * 7 * t))


def firework():
    t = tv(1.8)
    boom = band_noise(1.8, 60, 2500) * np.exp(-t * 6) * 0.8
    crackle = np.zeros_like(t)
    for _ in range(70):
        i = int(rng.uniform(0.15, 1.5) * SR)
        n = int(0.012 * SR)
        crackle[i:i + n] += band_noise(0.012, 3000, 12000)[:n] * np.exp(-np.arange(n) / 80) * rng.uniform(0.2, 0.6)
    return boom + crackle * np.exp(-t * 1.2)


def reel_tick():
    t = tv(0.035)
    return band_noise(0.035, 2500, 9000) * np.exp(-t * 220) * 0.7 + np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 160) * 0.45


def latch():
    t = tv(0.3)
    metal = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in ((1850, 30), (2930, 40), (4700, 55)))
    return metal * 0.3 + band_noise(0.3, 1000, 6000) * np.exp(-t * 90) * 0.5


def level_up(f0=hz(72)):
    out = np.zeros(int(1.3 * SR))
    for i, st in enumerate((0, 4, 7, 12, 16, 19, 24)):
        n = pluck(f0 * 2 ** (st / 12), 0.35, 10)
        i0 = int(i * 0.06 * SR)
        out[i0:i0 + len(n)] += n
    return out


def vinyl(d):
    t = tv(d)
    hiss = band_noise(d, 3000, 12000) * 0.02
    crackle = np.zeros_like(t)
    for _ in range(int(d * 18)):
        i = rng.integers(0, len(t) - 200)
        crackle[i:i + 200] += band_noise(200 / SR, 2000, 10000)[:200] * np.exp(-np.arange(200) / 25) * rng.uniform(0.05, 0.25)
    return hiss + crackle


def typing():
    t = tv(0.03)
    return band_noise(0.03, 1500, 7000) * np.exp(-t * 260) * 0.35


def success():
    out = np.zeros(int(1.6 * SR))
    for i, st in enumerate((0, 4, 7, 12)):
        b = bell(hz(84 + st), 1.3, 1.2)
        i0 = int(i * 0.07 * SR)
        out[i0:i0 + len(b)] += b
    return out * 0.8


def cta_click(mix, t):
    """Button press on the Discord end card: click, thump, success chime, sparkle."""
    mix.add(ui_click(), t, 0.9)
    mix.add(thump(), t, 0.5)
    mix.add(success(), t + 0.03, 0.4, wet=0.6)
    mix.add(sparkle(hz(91), 6, 0.05), t + 0.1, 0.22, wet=0.7)



def play_common(mix, c):
    """Plays cue types shared by the Discord promo set. Returns False for unknown types."""
    t, kind = c['t'], c['type']
    g = c.get('gain', 1.0)
    if kind == 'impact':
        mix.add(impact(), t, 0.75 * g, wet=0.5)
    elif kind == 'pop':
        mix.add(pop(hz(c['note'])), t, 0.24 * g, pan=rng.uniform(-0.4, 0.4), wet=0.4)
    elif kind == 'cta_click':
        cta_click(mix, t)
    elif kind == 'hit':
        mix.add(hit(), t, 0.8 * g, wet=0.4)
    elif kind == 'whoosh':
        mix.add(whoosh(), t - 0.52, 0.8 * g, wet=0.3)
    elif kind == 'riser':
        mix.add(riser(c['end'] - t), t, 0.5 * g, wet=0.3)
    elif kind == 'ping':
        mix.add(ping(hz(c['note'])), t, 0.2 * g, wet=0.8)
    elif kind == 'sparkle':
        mix.add(sparkle(hz(c['note']), 5, 0.05), t, 0.2 * g, pan=rng.uniform(-0.4, 0.4), wet=0.7)
    elif kind == 'ding':
        mix.add(ding(hz(c.get('note', 88))), t, 0.3 * g, pan=rng.uniform(-0.3, 0.3), wet=0.5)
    elif kind == 'place':
        mix.add(place(c.get('k', 0)), t, 0.5 * g, pan=rng.uniform(-0.3, 0.3), wet=0.15)
    elif kind == 'break':
        mix.add(block_break(), t, 0.6 * g, pan=rng.uniform(-0.3, 0.3), wet=0.2)
    elif kind == 'beep':
        mix.add(beep(hz(c['note']), c.get('d', 0.2)), t, 0.5 * g, wet=0.3)
    elif kind == 'firework':
        mix.add(firework(), t, 0.5 * g, pan=rng.uniform(-0.5, 0.5), wet=0.5)
    elif kind == 'tick':
        mix.add(reel_tick(), t, 0.6 * g, pan=rng.uniform(-0.2, 0.2))
    elif kind == 'typing':
        mix.add(typing(), t, 0.5 * g, pan=rng.uniform(-0.2, 0.2))
    elif kind == 'levelup':
        mix.add(level_up(hz(c.get('note', 72))), t, 0.25 * g, wet=0.5)
    else:
        return False
    return True


def outro(mix, t0, dur, notes=(48, 55, 60, 64, 67)):
    """End-card bed: warm pad, sub note and a fading pluck arpeggio."""
    mix.add(pad(list(notes), dur, bright=0.4), t0, 0.28, wet=0.6)
    mix.add(bass(hz(notes[0] - 12), 3.5, decay=1.2), t0, 0.5)
    arp = [n + 12 for n in notes[1:]]
    for i in range(int((dur - 0.6) / 0.25)):
        mix.add(pluck(hz(arp[i % len(arp)] + 12)), t0 + 0.25 + i * 0.25, 0.1 * (1 - i / (dur * 4.5)),
                pan=0.35 if i % 2 else -0.35, wet=0.45)


def groove(mix, t0, t1, chords, step=2.0, kick_gain=0.85, arp_gain=0.12, bass_fn=None):
    """Four-on-the-floor build: kick/clap/hats, 8th-note bass, 16th arpeggio. chords: [(triad, root)]."""
    bass_fn = bass_fn or (lambda f, d: bass(f, d))
    k = 0
    while t0 + k * 0.5 < t1 - 1e-6:
        bt = t0 + k * 0.5
        mix.add(kick(), bt, kick_gain)
        mix.add(hat(), bt + 0.25, 1.0, pan=0.25)
        mix.add(hat(), bt + 0.125, 0.4, pan=-0.25)
        if k % 2:
            mix.add(clap(), bt, 0.6, wet=0.3)
        k += 1
    i = 0
    t = t0
    while t < t1 - 1e-6:
        triad, root = chords[int((t - t0) // step) % len(chords)]
        mix.add(pluck(hz([triad[0], triad[1], triad[2], triad[1]][i % 4] + 12), 0.2, 15), t, arp_gain,
                pan=0.35 if i % 2 else -0.35, wet=0.35)
        if i % 2 == 0:
            mix.add(bass_fn(hz(root) * (2 if i % 8 == 6 else 1), 0.24), t, 0.32)
        if i % 16 == 0:
            mix.add(pad(list(triad), step + 0.3, bright=0.5), t, 0.14, wet=0.5)
        t += 0.125
        i += 1


class Mix:
    def __init__(self, duration):
        self.N = int(SR * duration)
        self.dry = np.zeros((2, self.N))
        self.send = np.zeros((2, self.N))

    def _place(self, bus, sig, t0, gain, pan):
        i0 = int(round(t0 * SR))
        if i0 >= self.N or len(sig) == 0:
            return
        if i0 < 0:
            sig, i0 = sig[-i0:], 0
        sig = sig[: self.N - i0]
        th = (pan + 1) * np.pi / 4
        bus[0, i0:i0 + len(sig)] += sig * gain * np.cos(th) * np.sqrt(2)
        bus[1, i0:i0 + len(sig)] += sig * gain * np.sin(th) * np.sqrt(2)

    def add(self, sig, t0, gain=1.0, pan=0.0, wet=0.0):
        self._place(self.dry, sig, t0, gain, pan)
        if wet:
            self._place(self.send, sig, t0, gain * wet, pan)

    def duck(self, t0, t1, amount=0.0):
        """Silence (or attenuate) the mix between t0 and t1 with short ramps."""
        i0, i1 = int(t0 * SR), int(t1 * SR)
        r = int(0.01 * SR)
        env = np.ones(self.N)
        env[i0:i1] = amount
        env[max(i0 - r, 0):i0] = np.linspace(1, amount, i0 - max(i0 - r, 0))
        env[i1:i1 + r] = np.linspace(amount, 1, len(env[i1:i1 + r]))
        self.dry *= env
        self.send *= env

    def write(self, path, master=0.84, drive=1.4):
        N = self.N
        ir_len = int(1.6 * SR)
        tir = np.arange(ir_len) / SR
        wet = np.zeros_like(self.send)
        for ch in range(2):
            ir = rng.standard_normal(ir_len) * np.exp(-tir * 3.2)
            ir[: int(0.012 * SR)] = 0
            size = 1 << int(np.ceil(np.log2(N + ir_len)))
            wet[ch] = np.fft.irfft(np.fft.rfft(self.send[ch], size) * np.fft.rfft(ir, size), size)[:N]
        wet /= (np.max(np.abs(wet)) + 1e-9)
        wet *= np.max(np.abs(self.send)) * 0.6
        delay = np.zeros_like(self.send)
        d = int(0.375 * SR)
        for tap, g in enumerate((0.3, 0.15, 0.07), start=1):
            delay[tap % 2, tap * d:] += self.send[(tap + 1) % 2][: N - tap * d] * g
        mix = self.dry + wet + delay
        mix /= np.max(np.abs(mix)) + 1e-9
        mix = np.tanh(mix * drive) / np.tanh(drive)
        # band-limit before the final level so AAC has nothing above ~16 kHz to overshoot on
        spec = np.fft.rfft(mix, axis=1)
        f = np.fft.rfftfreq(N, 1 / SR)
        mix = np.fft.irfft(spec * np.clip((17000 - f) / 2000, 0, 1), N, axis=1)
        mix *= master / (np.max(np.abs(mix)) + 1e-9)
        fade = int(0.8 * SR)
        mix[:, -fade:] *= np.linspace(1, 0, fade) ** 2
        mix[:, :int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
        with wave.open(path, 'wb') as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((mix.T * 32767).astype('<i2').tobytes())
        print(path)
