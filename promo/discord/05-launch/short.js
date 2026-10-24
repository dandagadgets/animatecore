// Video 5 — "Launch": got a server? Countdown, liftoff, a climb through sky into space, and
// the server deploys as a beacon that players stream towards. 18s, 1080x1920.
(() => {
  'use strict';
  const M = MR;
  const { ctx, W, H, TAU, COL, NEON } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInCubic, easeInOutCubic, mixColor } = M;

  const DUR = 18;
  const COUNT = [1.6, 2.4, 3.2], LIFT = 4.0, ORBIT = 9.8, DEPLOY = 10.0, BEACON = 10.3, OUT = 10.5, END = 12.8;
  const GROUND = 1400, RPX = 11;

  const CAPTIONS = [
    { t0: 5.0, t1: 6.6, lines: [[{ t: 'Showcase what' }], [{ t: 'makes it special.', c: '#ffe14d' }]] },
    { t0: 6.6, t1: 8.2, lines: [[{ t: 'Reach new players.', c: '#7fd0ff' }]] },
    { t0: 8.2, t1: ORBIT, lines: [[{ t: 'Find people looking for' }], [{ t: 'a new place to call home.', c: '#a8ff2e' }]] },
  ];

  let rocket, ground;
  const STARS = Array.from({ length: 120 }, (_, i) => [hash(i * 1.7) * W, hash(i * 3.9) * H, hash(i * 5.3)]);
  const CLOUDS = Array.from({ length: 9 }, (_, i) => ({ alt: 900 + i * 520, x: hash(i * 7.7) * 900 - 100, n: 4 + Math.floor(hash(i * 2.1) * 4) }));
  const HEADS = Array.from({ length: 22 }, (_, i) => ({ a: hash(i * 4.3) * TAU, d: 700 + hash(i * 2.2) * 500, t: BEACON + 0.4 + i * 0.085, p: i % M.PLAYERS.length }));
  const FIREWORKS = [[11.15, 260, 640, '#ff5d9e'], [11.45, 820, 560, '#ffd23a'], [11.8, 540, 400, '#5cc8ff'], [12.1, 230, 1180, '#a8ff2e']];

  function setup() {
    const map = [
      '.....RR.....',
      '....RRrr....',
      '...RRRRrr...',
      '...WWWWww...',
      '..WWWWWWww..',
      '..WWGGGGww..',
      '..WWGGGGww..',
      '..WWGGGGww..',
      '..WWGGGGww..',
      '..WWWWWWww..',
      '..WWWWWWww..',
      '..WLLLLLlw..',
      '..WLLLLLlw..',
      '..WWWWWWww..',
      '..WWWWWWww..',
      '..WWWWWWww..',
      '.RWWWWWWwwR.',
      'RRWWWWWWwwrR',
      'RRWWWWWWwwrr',
      'RR.WWWWww.rr',
      'R...DDDD...r',
      '....DDDD....',
    ];
    rocket = M.sprite(map, { R: '#e8413b', r: '#b02a26', W: '#f2f4f6', w: '#c5ccd3', G: '#5fbf2a', L: '#39ff14', l: '#25b80c', D: '#3a3f46' });
    // put a little grass-block texture in the window
    const g = rocket.getContext('2d');
    g.drawImage(M.TEX.grass, 0, 0, 16, 16, 4, 5, 4, 4);
    ground = M.blockWorld(17, 9, 64, (c, r) => {
      if (r === 0) return c >= 6 && c <= 10 ? 'stonebrick' : 'grass';
      if (r < 3) return 'dirt';
      return 'stone';
    });
  }

  // rocket altitude (px of climb) and camera altitude
  function rocketAlt(t) {
    if (t < LIFT) return 0;
    if (t < LIFT + 1) return 450 * (t - LIFT) ** 2;
    const u = Math.min(t, ORBIT) - LIFT - 1;
    let a = 450 + 900 * u + 1400 * u * u;
    if (t > ORBIT) a += (t - ORBIT) * 200;
    return a;
  }
  const camAlt = (t) => Math.max(0, rocketAlt(t) - 300);
  const screenY = (alt, t) => GROUND - (alt - camAlt(t));

  function sky(t) {
    const c = camAlt(t);
    const day = ['#3a7be0', '#8cc3ff', '#d6ecff'];
    const dusk = ['#0f1c4a', '#3b3f8f', '#8a6bb8'];
    const space = ['#01020a', '#050a1e', '#0a1030'];
    const k1 = clamp(c / 6000), k2 = clamp((c - 6000) / 8000);
    const stops = day.map((d, i) => mixColor(mixColor(d, dusk[i], k1), space[i], k2));
    M.skyGradient([[0, stops[0]], [0.6, stops[1]], [1, stops[2]]]);
    const sa = clamp((c - 5000) / 7000);
    if (sa > 0) {
      STARS.forEach(([x, y, k], i) => {
        const yy = ((y + c * 0.05 * (0.3 + k)) % H);
        const tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
        ctx.fillStyle = `rgba(255,255,255,${sa * tw * (0.4 + k * 0.6)})`;
        const s = k > 0.85 ? 6 : 4;
        ctx.fillRect(x, yy, s, s);
      });
    }
  }

  function clouds(t) {
    CLOUDS.forEach((cl, i) => {
      const y = screenY(cl.alt, t);
      if (y < -200 || y > H + 200) return;
      for (let k = 0; k < cl.n; k++) {
        const x = cl.x + k * 90 + Math.sin(i + k) * 20;
        const yy = y - (k % 2) * 40;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fillRect(x, yy, 130, 70);
        ctx.fillStyle = 'rgba(200,215,235,0.9)';
        ctx.fillRect(x, yy + 50, 130, 20);
      }
    });
  }

  function speedLines(t) {
    const v = (rocketAlt(t + 0.02) - rocketAlt(t)) / 0.02;
    const a = clamp((v - 800) / 3000) * (1 - prog(t, ORBIT - 0.3, ORBIT));
    if (a <= 0) return;
    ctx.fillStyle = `rgba(255,255,255,${0.35 * a})`;
    for (let i = 0; i < 26; i++) {
      const x = hash(i * 3.1) * W;
      const len = 120 + hash(i * 1.3) * 300;
      const y = ((hash(i * 7.9) * H + t * v * 0.9) % (H + len)) - len;
      ctx.fillRect(x, y, 4, len);
    }
  }

  function flame(x, y, t, power) {
    if (power <= 0) return;
    const layers = [['#fff3b0', 0.4], ['#ffc23a', 0.7], ['#ff6a2a', 1.0]];
    for (let i = layers.length - 1; i >= 0; i--) {
      const [col, k] = layers[i];
      const len = power * (120 + 80 * Math.sin(t * 40 + i)) * k * 1.6;
      const w = (40 + 14 * i) * Math.min(1, power + 0.3);
      ctx.fillStyle = col;
      for (let s = 0; s < len; s += 16) {
        const ww = w * (1 - s / (len + 1)) + (hash(Math.floor(t * 30) + s) - 0.5) * 10;
        ctx.fillRect(x - ww / 2, y + s, ww, 16);
      }
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y + 60, 0, x, y + 60, 260 * power);
    g.addColorStop(0, `rgba(255,170,60,${0.6 * power})`);
    g.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 300, y - 200, 600, 600);
    ctx.restore();
  }

  function smoke(t) {
    if (t < 3.0) {
      for (let i = 0; i < 4; i++) {
        const ph = (t * 0.8 + i / 4) % 1;
        const x = 540 + (i % 2 ? 1 : -1) * (120 + ph * 80), y = GROUND - 40 - ph * 120;
        ctx.fillStyle = `rgba(235,240,245,${0.6 * (1 - ph)})`;
        ctx.fillRect(x - 20 - ph * 30, y - 20 - ph * 30, 40 + ph * 60, 40 + ph * 60);
      }
    }
    const st = t - 3.4;
    if (st < 0 || st > 5) return;
    for (let i = 0; i < 40; i++) {
      const delay = hash(i * 2.7) * 1.2;
      const lt = st - delay;
      if (lt < 0 || lt > 3) continue;
      const dir = i % 2 ? 1 : -1;
      const x = 540 + dir * (60 + lt * (180 + hash(i) * 260)), y = screenY(0, t) - 30 - lt * 60 * hash(i * 3);
      const s = 60 + lt * 90;
      ctx.fillStyle = `rgba(225,230,236,${0.75 * (1 - lt / 3)})`;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
  }

  function render(t) {
    if (t >= END) {
      M.discordCard(t, END, { top: [[{ t: 'GOT A SERVER?' }], [{ t: 'WE\'VE GOT YOU.', c: 'accent' }]] });
      M.drawScanlines();
      M.flash(t, END, 0.92, 6);
      return;
    }
    const rumble = t < LIFT ? 10 * prog(t, 3.2, LIFT) : t < ORBIT ? 6 * (1 - prog(t, LIFT + 1, ORBIT)) + 2 : 0;
    const boom = M.shake(t, LIFT, 26, 0.5);
    ctx.save();
    ctx.translate(rumble * Math.sin(t * 83) + boom.x, rumble * Math.cos(t * 71) + boom.y);
    ctx.translate(540, 960); ctx.scale(1.03, 1.03); ctx.translate(-540, -960);
    sky(t);
    clouds(t);
    const gy = screenY(0, t);
    if (gy < H + 600) {
      ctx.drawImage(ground, -4, gy);
      // launch tower
      for (let k = 0; k < 9; k++) M.block('stonebrick', 300, gy - 64 * (k + 1), 64);
      ctx.fillStyle = '#5a5f66';
      for (let k = 0; k < 4; k++) ctx.fillRect(364, gy - 140 - k * 130, 110, 14);
      M.block('lantern', 300, gy - 64 * 10, 64);
    }
    smoke(t);
    speedLines(t);

    // the rocket
    const alt = rocketAlt(t);
    const sep = prog(t, DEPLOY, DEPLOY + 1.2);
    const rx = 540;
    const rw = 12 * RPX, rh = 22 * RPX;
    const bodyY = screenY(alt, t) - rh;
    const power = t < 3.4 ? 0 : t < LIFT ? 0.3 + 0.4 * prog(t, 3.4, LIFT) : t < ORBIT ? 1 : 1 - prog(t, ORBIT, ORBIT + 0.4);
    if (sep < 1) {
      ctx.save();
      const drift = easeInCubic(sep);
      ctx.globalAlpha = 1 - drift;
      ctx.translate(rx, bodyY + rh / 2 + drift * 700);
      ctx.rotate(drift * 0.8);
      flame(0, rh / 2 - 10, t, power);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(rocket, -rw / 2, -rh / 2, rw, rh);
      ctx.restore();
      if (t < LIFT + 0.2) M.label('YOUR SERVER', rx + 170, bodyY + rh * 0.3, 22, '#ffffff', 'left', 3, 700);
    }
    ctx.restore();

    // deployed server beacon
    if (t >= DEPLOY) {
      const by = 860;
      const e = easeOutBack(prog(t, DEPLOY, DEPLOY + 0.6), 1.8);
      const bx = 540, size = 150 * e;
      for (let k = 0; k < 6; k++) {
        const age = t - BEACON - k * 0.5;
        if (age < 0 || age > 2) continue;
        ctx.strokeStyle = NEON(0.6 * (1 - age / 2));
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(bx, by, 90 + age * 420, 0, TAU); ctx.stroke();
      }
      const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 360);
      glow.addColorStop(0, NEON(0.45 * e));
      glow.addColorStop(1, NEON(0));
      ctx.fillStyle = glow;
      ctx.fillRect(bx - 360, by - 360, 720, 720);
      ctx.save();
      ctx.translate(bx, by + Math.sin(t * 2) * 8);
      ctx.rotate(Math.sin(t * 1.3) * 0.08);
      ctx.shadowColor = COL.neon;
      ctx.shadowBlur = 40;
      M.block('grass', -size / 2, -size / 2, size);
      ctx.restore();
      if (e > 0.5) M.label('YOUR SERVER', bx, by + 130, 26, '#ffffff', 'center', 4, 700);
      HEADS.forEach((h, i) => {
        const lt = t - h.t;
        if (lt < 0 || lt > 0.9) return;
        const f = easeInCubic(clamp(lt / 0.7));
        const a = h.a + f * 1.2;
        const d = h.d * (1 - f);
        const x = bx + Math.cos(a) * d, y = by + Math.sin(a) * d;
        if (lt < 0.7) {
          const P = M.PLAYERS[h.p];
          const s = 44 * (1 - f * 0.5);
          ctx.fillStyle = P.skin;
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
          ctx.fillStyle = P.hair;
          ctx.fillRect(x - s / 2, y - s / 2, s, s * 0.28);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x - s * 0.32, y, s * 0.16, s * 0.12);
          ctx.fillRect(x + s * 0.16, y, s * 0.16, s * 0.12);
          ctx.fillStyle = `rgba(168,255,46,${0.5 * (1 - f)})`;
          ctx.fillRect(x - s / 2 - 6, y - s / 2 - 6, s + 12, s + 12);
        } else {
          const k = (lt - 0.7) / 0.2;
          M.pixelSquare(bx, by, 160 + k * 60, `rgba(220,255,200,${0.25 * (1 - k)})`);
        }
      });
      FIREWORKS.forEach(([ft, fx, fy, col], i) => {
        const lt = t - ft;
        if (lt < 0 || lt > 1.4) return;
        for (let k = 0; k < 28; k++) {
          const a = k * TAU / 28;
          const d = 260 * easeOutCubic(Math.min(lt / 0.8, 1));
          M.pixelSquare(fx + Math.cos(a) * d, fy + Math.sin(a) * d + lt * lt * 120, 12, k % 3 ? col : '#ffffff', 14 * (1 - lt / 1.4));
        }
      });
    }

    // countdown
    COUNT.forEach((ct, i) => {
      const lt = t - ct;
      if (lt < 0 || lt > 0.8) return;
      const s = lerp(1.8, 1, easeOutCubic(clamp(lt / 0.15)));
      ctx.save();
      ctx.globalAlpha = 1 - prog(lt, 0.55, 0.8);
      ctx.translate(540, 820);
      ctx.scale(s, s);
      M.headline([{ t: String(3 - i), c: i === 2 ? 'accent' : '#ffffff' }], 0, 0, 380, 1, 2000);
      ctx.restore();
    });
    if (t >= LIFT && t < LIFT + 1.0) {
      M.headline([{ t: 'LIFTOFF!', c: 'accent' }], 540, 760, 170, appear(t, LIFT, 0.15), 980, { slam: true });
    }

    if (t < COUNT[0]) {
      M.headline([{ t: 'GOT A' }], 540, 300, 120, 1);
      M.headline([{ t: 'SERVER?', c: 'accent' }], 540, 430, 150, 1);
      M.caption([[{ t: 'Let\'s get it out there.' }]], 540, 580, 62, 1);
    }
    CAPTIONS.forEach((c) => {
      if (t < c.t0 || t >= c.t1) return;
      M.caption(c.lines, 540, 330, 72, appear(t, c.t0, 0.22));
    });
    if (t >= OUT) {
      M.headline([{ t: 'LET\'S GET IT' }], 540, 300, 120, appear(t, OUT, 0.18), 980, { slam: true });
      M.headline([{ t: 'OUT THERE.', c: 'accent' }], 540, 430, 140, appear(t, OUT + 0.2, 0.18), 980, { slam: true });
    }
    M.vignette(0.45);
    M.drawScanlines();
    M.flash(t, LIFT, 0.85, 6, '255,235,200');
    M.flash(t, BEACON, 0.5, 6);
  }

  function events() {
    const ev = [];
    COUNT.forEach((ct) => ev.push({ type: 'beep', t: ct, note: 81, d: 0.22 }));
    ev.push({ type: 'beep', t: LIFT, note: 93, d: 0.45 });
    ev.push({ type: 'rumble', t: 3.2, end: ORBIT + 0.3 });
    ev.push({ type: 'impact', t: LIFT });
    ev.push({ type: 'whoosh', t: LIFT + 0.6 });
    ev.push({ type: 'hit', t: LIFT });
    CAPTIONS.forEach((c) => ev.push({ type: 'pop', t: c.t0, note: 88 }));
    CLOUDS.forEach((cl) => {
      // whoosh as each cloud passes the rocket
      for (let tt = LIFT; tt < ORBIT; tt += 0.01) {
        if (screenY(cl.alt, tt) > GROUND - 450) { ev.push({ type: 'whoosh', t: tt, gain: 0.35 }); break; }
      }
    });
    ev.push({ type: 'latch', t: DEPLOY });
    for (let k = 0; k < 6; k++) ev.push({ type: 'ping', t: BEACON + k * 0.5, note: 93 + (k % 2) * 3, gain: 0.9 });
    HEADS.forEach((h, i) => ev.push({ type: 'pop', t: h.t + 0.7, note: 84 + [0, 2, 4, 7, 9][i % 5] + 12 * Math.floor(i / 11), gain: 0.6 }));
    FIREWORKS.forEach(([ft]) => ev.push({ type: 'firework', t: ft }));
    ev.push({ type: 'hit', t: OUT });
    ev.push({ type: 'hit', t: OUT + 0.2 });
    ev.push({ type: 'riser', t: END - 0.9, end: END });
    ev.push(...M.discordCardEvents(END));
    return ev.sort((a, b) => a.t - b.t);
  }

  M.start({ duration: DUR, cover: 0.0, setup, render, events });
})();
