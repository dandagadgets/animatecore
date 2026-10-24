// Mine Radar — 15s square promo. Everything is drawn from render(t), so the same
// code plays live in a browser and renders frame-exact video (see render/).
(() => {
  'use strict';

  const W = 1080, H = 1080, FPS = 30, DURATION = 15;
  const SCENE = { B: 4.0, C: 7.5, D: 11.0 };

  const canvas = document.getElementById('ad');
  const ctx = canvas.getContext('2d');

  // ---------- palette & math ----------
  const COL = {
    neon: '#39ff14',
    lime: '#a8ff2e',
    white: '#f3f7ef',
    ink: '#041004',
    shadow: '#0f3a06',
    panel: 'rgba(5, 16, 6, 0.92)',
  };
  const NEON = (a) => `rgba(57,255,20,${a})`;
  const LIME = (a) => `rgba(168,255,46,${a})`;
  const MINT = (a) => `rgba(214,255,200,${a})`;

  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
  const easeInCubic = (x) => x * x * x;
  const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOutBack = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => clamp(Math.round(c + amt * 255), 0, 255);
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }

  // ---------- radar timing ----------
  const PERIOD = 2.0;
  const OMEGA = TAU / PERIOD;
  const A0 = -Math.PI / 2 - 0.15 * Math.PI;
  const sweepAngle = (t) => A0 + OMEGA * t;
  const REF = { cx: 540, cy: 600 }; // chip directions are measured from here

  function firstHit(angle) {
    const off = (((angle - A0) % TAU) + TAU) % TAU;
    let th = off / OMEGA;
    if (th < 0.4) th += PERIOD;
    return th;
  }

  const CHIPS = [
    { label: 'SKYBLOCK', x: 868, y: 420, rf: 0.78, color: '#5cc8ff' },
    { label: 'MINIGAMES', x: 896, y: 600, rf: 0.62, color: '#ffd23a' },
    { label: 'PRISON', x: 862, y: 780, rf: 0.7, color: '#c3ccd6' },
    { label: 'SMP', x: 222, y: 780, rf: 0.55, color: '#a8ff2e' },
    { label: 'FACTIONS', x: 186, y: 600, rf: 0.8, color: '#ff5d4d' },
    { label: 'SURVIVAL', x: 212, y: 420, rf: 0.66, color: '#5fd12a' },
  ];
  const PING_NOTES = [88, 91, 93, 96, 98, 100, 103, 105, 107];

  const BLIPS = [];
  CHIPS.forEach((c) => {
    c.angle = Math.atan2(c.y - REF.cy, c.x - REF.cx);
    BLIPS.push({ angle: c.angle, rf: c.rf, chip: c });
  });
  [[1.75, 0.42], [-1.62, 0.86], [3.35, 0.36]].forEach(([a, rf]) => BLIPS.push({ angle: a, rf }));
  BLIPS.forEach((b) => { b.hit0 = firstHit(b.angle); });
  [...BLIPS].sort((a, b) => a.hit0 - b.hit0).forEach((b, i) => { b.note = PING_NOTES[i % PING_NOTES.length]; });
  [...CHIPS].sort((a, b) => a.angle - b.angle).forEach((c, i) => { c.launch = SCENE.B + 0.05 + i * 0.1; });

  function lastHit(b, t) {
    if (t < b.hit0) return null;
    return b.hit0 + Math.floor((t - b.hit0) / PERIOD) * PERIOD;
  }

  function radarState(t) {
    const ab = easeInOutCubic(prog(t, 3.75, 4.35));
    const bc = easeInOutCubic(prog(t, 7.25, 7.95));
    const cd = prog(t, 10.5, 10.95);
    const cy = lerp(650, REF.cy, ab);
    let R = lerp(290, 215, ab);
    R = lerp(R, 760, bc);
    const alpha = lerp(0.35, 1, prog(t, 0, 0.3)) * lerp(1, 0.2, bc) * (1 - cd);
    return { cx: REF.cx, cy, R, alpha };
  }

  // ---------- one-time layers ----------
  let LOGO = null;
  let bgLayer, scanLayer;

  function buildStatic() {
    bgLayer = document.createElement('canvas');
    bgLayer.width = W; bgLayer.height = H;
    const b = bgLayer.getContext('2d');
    b.fillStyle = '#030703';
    b.fillRect(0, 0, W, H);
    const cell = 36;
    for (let y = 0; y < H / cell; y++) {
      for (let x = 0; x < W / cell; x++) {
        const h = hash(x * 31.7 + y * 97.3);
        const g = 12 + Math.floor(h * 14);
        b.fillStyle = `rgb(${Math.floor(g * 0.45)},${g},${Math.floor(g * 0.5)})`;
        b.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    const glow = b.createRadialGradient(540, 560, 0, 540, 560, 620);
    glow.addColorStop(0, NEON(0.07));
    glow.addColorStop(1, NEON(0));
    b.fillStyle = glow;
    b.fillRect(0, 0, W, H);
    const vig = b.createRadialGradient(540, 540, 360, 540, 540, 820);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.8)');
    b.fillStyle = vig;
    b.fillRect(0, 0, W, H);

    scanLayer = document.createElement('canvas');
    scanLayer.width = W; scanLayer.height = H;
    const s = scanLayer.getContext('2d');
    s.fillStyle = 'rgba(0,0,0,0.16)';
    for (let y = 0; y < H; y += 4) s.fillRect(0, y, W, 2);
  }

  function measureChips() {
    ctx.font = '700 25px "Silkscreen"';
    CHIPS.forEach((c) => { c.w = Math.ceil(ctx.measureText(c.label).width) + 86; c.h = 60; });
  }

  // ---------- drawing helpers ----------
  function pixelRectPath(x, y, w, h, s) {
    ctx.beginPath();
    ctx.moveTo(x + s, y); ctx.lineTo(x + w - s, y); ctx.lineTo(x + w - s, y + s); ctx.lineTo(x + w, y + s);
    ctx.lineTo(x + w, y + h - s); ctx.lineTo(x + w - s, y + h - s); ctx.lineTo(x + w - s, y + h); ctx.lineTo(x + s, y + h);
    ctx.lineTo(x + s, y + h - s); ctx.lineTo(x, y + h - s); ctx.lineTo(x, y + s); ctx.lineTo(x + s, y + s);
    ctx.closePath();
  }

  function panel(x, y, w, h, step, opts = {}) {
    ctx.save();
    pixelRectPath(x, y, w, h, step);
    ctx.fillStyle = opts.fill || COL.panel;
    ctx.fill();
    ctx.shadowColor = NEON(0.7);
    ctx.shadowBlur = opts.glow ?? 16;
    ctx.strokeStyle = opts.stroke || COL.neon;
    ctx.lineWidth = opts.line || 3;
    ctx.stroke();
    ctx.restore();
  }

  function accentFill(y, size) {
    const g = ctx.createLinearGradient(0, y - size * 0.42, 0, y + size * 0.42);
    g.addColorStop(0, '#f2ff4d');
    g.addColorStop(0.5, '#a8ff2e');
    g.addColorStop(1, '#3fd10f');
    return g;
  }

  // Blocky headline: drop shadow + dark outline + fill, like the logo lettering.
  function headline(parts, x, y, size, e = 1, maxW = 960) {
    if (e <= 0) return;
    ctx.save();
    ctx.font = `700 ${size}px "Pixelify Sans"`;
    let widths = parts.map((p) => ctx.measureText(p.t).width);
    let total = widths.reduce((a, b) => a + b, 0);
    if (total > maxW) {
      size = Math.floor(size * maxW / total);
      ctx.font = `700 ${size}px "Pixelify Sans"`;
      widths = parts.map((p) => ctx.measureText(p.t).width);
      total = widths.reduce((a, b) => a + b, 0);
    }
    ctx.globalAlpha *= e;
    y += (1 - e) * 34;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    let cx = x - total / 2;
    parts.forEach((p, i) => {
      const d = size * 0.07;
      ctx.fillStyle = COL.shadow;
      ctx.fillText(p.t, cx + d, y + d);
      ctx.strokeStyle = '#020802';
      ctx.lineWidth = size * 0.1;
      ctx.strokeText(p.t, cx, y);
      if (p.c === 'accent') {
        ctx.save();
        ctx.shadowColor = NEON(0.55);
        ctx.shadowBlur = 26;
        ctx.fillStyle = accentFill(y, size);
        ctx.fillText(p.t, cx, y);
        ctx.restore();
      } else {
        ctx.fillStyle = COL.white;
        ctx.fillText(p.t, cx, y);
      }
      cx += widths[i];
    });
    ctx.restore();
  }

  function bodyText(text, x, y, size, e = 1, color = MINT(0.78)) {
    if (e <= 0) return;
    ctx.save();
    ctx.globalAlpha *= e;
    ctx.font = `400 ${size}px "Pixelify Sans"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, x, y + (1 - e) * 20);
    ctx.restore();
  }

  function label(text, x, y, size, color, align = 'left', spacing = 3, weight = 400) {
    ctx.save();
    ctx.font = `${weight} ${size}px "Silkscreen"`;
    ctx.letterSpacing = `${spacing}px`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  const appear = (t, t0, d = 0.5) => easeOutCubic(prog(t, t0, t0 + d));

  function pixelSquare(x, y, s, color, glow = 0) {
    ctx.save();
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.round(s), Math.round(s));
    ctx.restore();
  }

  // ---------- background & HUD ----------
  function drawParticles(t) {
    for (let i = 0; i < 30; i++) {
      const sp = 18 + hash(i + 3) * 40;
      const x = hash(i) * W + Math.sin(t * 0.7 + i) * 14;
      const y = ((hash(i + 50) * (H + 80) - t * sp) % (H + 80) + H + 80) % (H + 80) - 40;
      const s = 4 + Math.floor(hash(i + 9) * 3) * 2;
      const a = 0.12 + 0.25 * hash(i + 21);
      pixelSquare(x, y, s, LIME(a));
    }
  }

  function drawHUD(t) {
    const a = prog(t, 0.05, 0.5);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = NEON(0.75);
    const inset = 34, len = 54, th = 4;
    [[inset, inset, 1, 1], [W - inset, inset, -1, 1], [inset, H - inset, 1, -1], [W - inset, H - inset, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.fillRect(sx > 0 ? x : x - len, sy > 0 ? y : y - th, len, th);
      ctx.fillRect(sx > 0 ? x : x - th, sy > 0 ? y : y - len, th, len);
    });
    const hud = 1 - prog(t, 10.4, 10.8);
    if (hud > 0) {
      ctx.globalAlpha = a * hud;
      const X = -1024 + Math.floor(t * 61);
      const Z = 512 - Math.floor(t * 37);
      label(`XYZ ${X} / 64 / ${Z}`, 66, H - 58, 18, NEON(0.6), 'left', 2);
      const status = t < SCENE.B ? 'SCANNING' : t < SCENE.C ? 'SIGNALS FOUND' : 'PINGING PLAYERS';
      label(status, W - 66, H - 58, 18, NEON(0.6), 'right', 2);
      ctx.measureText('');
      ctx.font = '400 18px "Silkscreen"';
      ctx.letterSpacing = '2px';
      const sw = ctx.measureText(status).width;
      ctx.letterSpacing = '0px';
      if (Math.floor(t * 2.5) % 2 === 0) pixelSquare(W - 66 - sw - 18, H - 58, 10, COL.neon, 10);
    }
    ctx.restore();
  }

  function drawScanBar(t, t0) {
    const p = prog(t, t0 - 0.2, t0 + 0.2);
    if (p <= 0 || p >= 1) return;
    const y = lerp(-80, H + 80, easeInOutCubic(p));
    ctx.save();
    const g = ctx.createLinearGradient(0, y - 90, 0, y + 6);
    g.addColorStop(0, NEON(0));
    g.addColorStop(1, NEON(0.22));
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 90, W, 96);
    ctx.shadowColor = COL.neon;
    ctx.shadowBlur = 24;
    ctx.fillStyle = LIME(0.9);
    ctx.fillRect(0, y, W, 4);
    ctx.restore();
  }

  // ---------- radar (scenes A–C) ----------
  function drawRadar(t) {
    const { cx, cy, R, alpha } = radarState(t);
    if (alpha <= 0.002) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const disc = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    disc.addColorStop(0, NEON(0.14));
    disc.addColorStop(0.7, NEON(0.05));
    disc.addColorStop(1, NEON(0.03));
    ctx.fillStyle = disc;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();

    const draw = easeOutCubic(prog(t, 0.0, 0.9));
    for (let i = 1; i <= 4; i++) {
      const d = clamp(draw * 1.5 - (i - 1) * 0.12);
      if (d <= 0) continue;
      ctx.save();
      ctx.strokeStyle = NEON(i === 4 ? 0.9 : 0.3);
      ctx.lineWidth = i === 4 ? 5 : 2.5;
      if (i === 4) { ctx.shadowColor = NEON(0.9); ctx.shadowBlur = 20; }
      ctx.beginPath();
      ctx.arc(cx, cy, R * i / 4, -Math.PI / 2, -Math.PI / 2 + TAU * d);
      ctx.stroke();
      ctx.restore();
    }

    ctx.strokeStyle = NEON(0.22);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - R * draw, cy); ctx.lineTo(cx + R * draw, cy);
    ctx.moveTo(cx, cy - R * draw); ctx.lineTo(cx, cy + R * draw);
    ctx.stroke();

    ctx.strokeStyle = NEON(0.45);
    for (let k = 0; k < 72; k++) {
      if (k / 72 > draw) break;
      const a = -Math.PI / 2 + k * TAU / 72;
      const len = k % 6 === 0 ? 16 : 7;
      ctx.lineWidth = k % 6 === 0 ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (R + 8), cy + Math.sin(a) * (R + 8));
      ctx.lineTo(cx + Math.cos(a) * (R + 8 + len), cy + Math.sin(a) * (R + 8 + len));
      ctx.stroke();
    }

    const sw = prog(t, 0.15, 0.6);
    if (sw > 0) {
      const a = sweepAngle(t);
      const wedge = 1.15;
      ctx.save();
      ctx.globalAlpha = alpha * sw;
      const cg = ctx.createConicGradient(a - wedge, cx, cy);
      cg.addColorStop(0, NEON(0));
      cg.addColorStop(wedge / TAU, NEON(0.42));
      cg.addColorStop(wedge / TAU + 0.0005, NEON(0));
      cg.addColorStop(1, NEON(0));
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a - wedge, a); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = LIME(0.95);
      ctx.lineWidth = 4;
      ctx.shadowColor = COL.neon;
      ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
      ctx.restore();
    }

    BLIPS.forEach((b) => drawBlip(b, t, cx, cy, R));

    pixelSquare(cx, cy, 14 + R * 0.02, COL.lime, 22);
    ctx.restore();
  }

  function blipPos(b, cx, cy, R) {
    return { x: cx + Math.cos(b.angle) * R * b.rf, y: cy + Math.sin(b.angle) * R * b.rf };
  }

  function drawBlip(b, t, cx, cy, R) {
    const lh = lastHit(b, t);
    if (lh === null) return;
    const age = t - lh;
    const { x, y } = blipPos(b, cx, cy, R);
    const launched = b.chip && t >= b.chip.launch;
    const intensity = 0.3 + 0.7 * Math.exp(-age * 1.6);
    const pop = 1 + 0.7 * (1 - prog(t, b.hit0, b.hit0 + 0.25));
    const size = (launched ? 9 : 16) * pop * clamp(R / 290, 0.75, 1.4);
    pixelSquare(x, y, size, LIME(intensity), 18 * intensity);
    if (age < 0.8) {
      ctx.save();
      ctx.strokeStyle = LIME(0.8 * (1 - age / 0.8));
      ctx.lineWidth = 3;
      ctx.strokeRect(x - (10 + age * 55), y - (10 + age * 55), 2 * (10 + age * 55), 2 * (10 + age * 55));
      ctx.restore();
    }
  }

  // ---------- scene B: blips become game-mode chips ----------
  function drawChips(t) {
    if (t < SCENE.B || t > 8.2) return;
    const { cx, cy, R, alpha } = radarState(t);
    CHIPS.forEach((c, j) => {
      const b = BLIPS[j];
      const f = easeOutCubic(prog(t, c.launch, c.launch + 0.45));
      if (f <= 0) return;
      const out = easeInCubic(prog(t, 7.15 + j * 0.04, 7.55 + j * 0.04));
      const dir = { x: Math.cos(c.angle), y: Math.sin(c.angle) };
      const bob = Math.sin(t * 2.2 + j * 1.3) * 4;
      const tx = c.x + dir.x * out * 420;
      const ty = c.y + bob + dir.y * out * 420;
      const anchor = blipPos(b, cx, cy, R);
      const hx = lerp(anchor.x, tx, f);
      const hy = lerp(anchor.y, ty, f);

      ctx.save();
      ctx.globalAlpha = 1 - out;

      ctx.save();
      ctx.globalAlpha *= Math.min(alpha * 1.4, 1) * 0.7;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -t * 40;
      ctx.strokeStyle = NEON(0.8);
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(anchor.x, anchor.y); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.restore();

      const u = prog(t, c.launch + 0.3, c.launch + 0.62);
      if (u < 1) pixelSquare(hx, hy, 18, COL.lime, 20);
      if (u > 0) {
        const sx = clamp(easeOutBack(u, 2.0), 0, 1.2);
        const w = c.w * sx;
        const h = c.h * lerp(0.5, 1, clamp(u * 1.5));
        panel(tx - w / 2, ty - h / 2, w, h, 6);
        const ta = prog(t, c.launch + 0.5, c.launch + 0.75);
        if (ta > 0) {
          ctx.globalAlpha *= ta;
          const ix = tx - c.w / 2 + 30;
          pixelSquare(ix, ty, 20, c.color, 12);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(ix - 10, ty + 4, 20, 6);
          label(c.label, ix + 22, ty + 1, 25, COL.white, 'left', 2, 700);
        }
      }
      ctx.restore();
    });
  }

  // ---------- scene text ----------
  function drawSceneAText(t) {
    const out = easeInCubic(prog(t, 3.6, 3.95));
    if (out >= 1) return;
    ctx.save();
    ctx.globalAlpha = 1 - out;
    ctx.translate(0, -out * 24);

    const text = 'SCANNING FOR SERVERS';
    const n = Math.floor(text.length * prog(t, 0.15, 0.8));
    ctx.font = '400 26px "Silkscreen"';
    ctx.letterSpacing = '4px';
    const fullW = ctx.measureText(text).width;
    const shownW = ctx.measureText(text.slice(0, n)).width;
    ctx.letterSpacing = '0px';
    const x0 = 540 - fullW / 2;
    label(text.slice(0, n), x0, 92, 26, NEON(0.95), 'left', 4);
    if (n < text.length || Math.floor(t * 3) % 2 === 0) {
      ctx.fillStyle = NEON(0.95);
      ctx.fillRect(x0 + shownW + 4, 80, 14, 24);
    }

    headline([{ t: 'LOOKING FOR YOUR' }], 540, 165, 76, appear(t, 0.45));
    headline([{ t: 'NEXT ' }, { t: 'SERVER?', c: 'accent' }], 540, 262, 104, appear(t, 0.65));
    ctx.restore();
  }

  function drawSceneBText(t) {
    if (t < SCENE.B || t > 7.7) return;
    const out = easeInCubic(prog(t, 7.2, 7.55));
    ctx.save();
    ctx.globalAlpha = 1 - out;
    ctx.translate(0, -out * 30);
    headline([{ t: 'DISCOVER YOUR' }], 540, 132, 76, appear(t, 4.1));
    headline([{ t: 'NEXT ' }, { t: 'ADVENTURE', c: 'accent' }], 540, 228, 100, appear(t, 4.25));
    bodyText('Your next favorite server might be one discovery away.', 540, 935, 33, appear(t, 4.9));
    ctx.restore();
  }

  // ---------- scene C: built for server owners ----------
  const HEADS = [
    { skin: '#f1c27d', hair: '#3b2416', shirt: '#2f7bd9' },
    { skin: '#c68642', hair: '#1a1a1a', shirt: '#d94a3a' },
    { skin: '#ffdbac', hair: '#e8c547', shirt: '#4caf50' },
    { skin: '#8d5524', hair: '#2b1a10', shirt: '#9b59b6' },
    { skin: '#f6d5b8', hair: '#b5502b', shirt: '#f39c12' },
    { skin: '#e0ac69', hair: '#5a3a22', shirt: '#16a085' },
    { skin: '#ffe0bd', hair: '#222831', shirt: '#e84393' },
  ];

  function drawHead(cx, cy, size, h, seed) {
    const p = size / 8;
    const x0 = cx - size / 2, y0 = cy - size / 2;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        let col = h.skin;
        if (r < 2 || (r === 2 && (c === 0 || c === 7))) col = h.hair;
        if (r === 4 && (c === 1 || c === 6)) col = '#ffffff';
        if (r === 4 && (c === 2 || c === 5)) col = '#3a3ad0';
        if (r === 6 && (c === 3 || c === 4)) col = shade(h.skin, -0.28);
        if (r === 7) col = h.shirt;
        const v = (hash(seed * 13 + r * 8 + c) - 0.5) * 0.12;
        ctx.fillStyle = shade(col, v);
        ctx.fillRect(Math.round(x0 + c * p), Math.round(y0 + r * p), Math.ceil(p), Math.ceil(p));
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x0, y0, size, size);
  }

  function drawGrassBlock(x, y, size) {
    const p = size / 8;
    const greens = ['#5fbf2a', '#4ea823', '#6fd23a', '#58b326'];
    const dirts = ['#8b5a2b', '#7a4c22', '#9c6a35', '#6b4220'];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const h = hash(r * 17 + c * 5 + 3);
        let col;
        if (r < 2) col = greens[Math.floor(h * 4)];
        else if (r === 2) col = h < 0.55 ? greens[Math.floor(h * 7) % 4] : dirts[Math.floor(h * 4)];
        else if (r === 3 && h < 0.18) col = greens[1];
        else col = dirts[Math.floor(h * 4)];
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x + c * p), Math.round(y + r * p), Math.ceil(p), Math.ceil(p));
      }
    }
    ctx.strokeStyle = '#0b1a06';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, size, size);
  }

  const CARD = { x: 170, y: 395, w: 740, h: 250 };
  const BADGE_T = 8.85;
  const HEAD_T = 9.2;

  function drawSceneC(t) {
    if (t < 7.45 || t > 11.0) return;
    const out = easeInCubic(prog(t, 10.5, 10.92));
    ctx.save();
    const s = 1 - out * 0.3;
    ctx.translate(540, 560); ctx.scale(s, s); ctx.translate(-540, -560);
    ctx.globalAlpha = 1 - out;

    headline([{ t: 'OWN A ' }, { t: 'SERVER?', c: 'accent' }], 540, 140, 104, appear(t, 7.6));
    bodyText('Give it more visibility. Show off what makes it unique.', 540, 236, 32, appear(t, 7.85));

    const ccx = CARD.x + CARD.w / 2, ccy = CARD.y + CARD.h / 2;
    for (let k = 0; k < 4; k++) {
      const age = t - (BADGE_T - 0.05 + k * 0.85);
      if (age < 0 || age > 1.8) continue;
      ctx.save();
      ctx.strokeStyle = NEON(0.4 * (1 - age / 1.8));
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(ccx, ccy, 220 + age * 340, 0, TAU); ctx.stroke();
      ctx.restore();
    }

    const ce = prog(t, 7.85, 8.45);
    if (ce > 0) {
      const e = easeOutBack(ce, 1.4);
      ctx.save();
      ctx.globalAlpha *= prog(t, 7.85, 8.1);
      ctx.translate(ccx, ccy + (1 - e) * 70);
      const cs = 0.85 + 0.15 * e;
      ctx.scale(cs, cs);
      ctx.translate(-ccx, -ccy);
      const { x, y, w, h } = CARD;
      panel(x, y, w, h, 10, { glow: 26, line: 4 });
      ctx.fillStyle = NEON(0.06);
      ctx.fillRect(x + 10, y + 10, w - 20, 6);
      drawGrassBlock(x + 40, y + 50, 150);
      ctx.save();
      ctx.font = '700 58px "Pixelify Sans"';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COL.shadow;
      ctx.fillText('YOUR SERVER', x + 226, y + 96);
      ctx.fillStyle = COL.white;
      ctx.fillText('YOUR SERVER', x + 222, y + 92);
      ctx.restore();
      label('play.your.server', x + 224, y + 142, 21, MINT(0.6), 'left', 1);
      ctx.font = '700 20px "Silkscreen"';
      ctx.letterSpacing = '2px';
      const onW = ctx.measureText('ONLINE').width;
      ctx.letterSpacing = '0px';
      if (Math.floor(t * 2.5) % 2 === 0 || t < 8.6) pixelSquare(x + w - 34 - onW - 16, y + 142, 12, COL.neon, 12);
      label('ONLINE', x + w - 34, y + 142, 20, COL.neon, 'right', 2, 700);
      let tx = x + 224;
      ['SURVIVAL', 'SMP', 'EVENTS'].forEach((tag, i) => {
        const te = appear(t, 8.25 + i * 0.1, 0.3);
        ctx.save();
        ctx.font = '400 18px "Silkscreen"';
        ctx.letterSpacing = '2px';
        const tw = ctx.measureText(tag).width + 28;
        ctx.restore();
        ctx.save();
        ctx.globalAlpha *= te;
        pixelRectPath(tx, y + 172, tw, 40, 4);
        ctx.fillStyle = NEON(0.1);
        ctx.fill();
        ctx.strokeStyle = NEON(0.65);
        ctx.lineWidth = 2;
        ctx.stroke();
        label(tag, tx + 14, y + 193, 18, MINT(0.9), 'left', 2);
        ctx.restore();
        tx += tw + 14;
      });
      ctx.restore();
    }

    const be = prog(t, BADGE_T, BADGE_T + 0.35);
    if (be > 0) {
      const bs = lerp(1.9, 1, easeOutBack(be, 2.2));
      const bx = CARD.x + CARD.w - 150, by = CARD.y - 4;
      ctx.save();
      ctx.globalAlpha *= prog(t, BADGE_T, BADGE_T + 0.12);
      ctx.translate(bx, by);
      ctx.rotate(-0.07);
      ctx.scale(bs, bs);
      ctx.font = '700 22px "Silkscreen"';
      ctx.letterSpacing = '2px';
      const bw = ctx.measureText('ON THE RADAR').width + 84;
      ctx.letterSpacing = '0px';
      panel(-bw / 2, -28, bw, 56, 6, { fill: COL.neon, stroke: '#d8ff9a', glow: 30 });
      ctx.strokeStyle = COL.ink;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-bw / 2 + 32, 0, 12, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-bw / 2 + 32, 0); ctx.lineTo(-bw / 2 + 41, -8); ctx.stroke();
      ctx.fillStyle = COL.ink;
      ctx.fillRect(-bw / 2 + 29, -3, 6, 6);
      label('ON THE RADAR', -bw / 2 + 56, 1, 22, COL.ink, 'left', 2, 700);
      ctx.restore();
    }

    const size = 70, gap = 20;
    const rowW = HEADS.length * size + (HEADS.length - 1) * gap;
    HEADS.forEach((h, i) => {
      const ht = HEAD_T + i * 0.11;
      const pe = prog(t, ht, ht + 0.32);
      if (pe <= 0) return;
      const hx = 540 - rowW / 2 + size / 2 + i * (size + gap);
      const hy = 790 + Math.sin(t * 3 + i) * 3 * prog(t, ht + 0.3, ht + 0.6);
      const sc = easeOutBack(pe, 2.4);
      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(sc, sc);
      ctx.shadowColor = NEON(0.5);
      ctx.shadowBlur = 18;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.shadowBlur = 0;
      drawHead(0, 0, size, h, i + 1);
      ctx.restore();
      const fa = prog(t, ht, ht + 0.75);
      if (fa < 1) {
        ctx.save();
        ctx.globalAlpha *= 1 - easeInCubic(fa);
        label('+1', hx, hy - 58 - fa * 40, 22, COL.neon, 'center', 1, 700);
        ctx.restore();
      }
    });

    headline([{ t: 'GROW YOUR ' }, { t: 'COMMUNITY', c: 'accent' }], 540, 925, 66, appear(t, 9.75));
    ctx.restore();
  }

  // ---------- scene D: logo end card ----------
  const BURST = Array.from({ length: 70 }, (_, i) => ({
    a: hash(i * 3.1) * TAU,
    v: 380 + hash(i * 7.7) * 900,
    s: 6 + Math.floor(hash(i * 1.9) * 4) * 3,
    c: ['#39ff14', '#a8ff2e', '#e4ff3a', '#f3f7ef'][i % 4],
  }));

  function drawRiser(t) {
    const p = prog(t, 10.2, 11.0);
    if (p <= 0 || t >= 11.0) return;
    const r = lerp(40, 380, p * p);
    ctx.save();
    const g = ctx.createRadialGradient(540, 520, 0, 540, 520, r);
    g.addColorStop(0, LIME(0.7 * p * p));
    g.addColorStop(1, LIME(0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawSceneD(t) {
    if (t < SCENE.D) return;
    const lt = t - SCENE.D;
    const lx = 540, ly = 440, size = 580;

    const le = prog(t, 11.0, 11.65);
    const gl = ctx.createRadialGradient(lx, ly, 0, lx, ly, size * 0.8);
    gl.addColorStop(0, NEON(0.3 * prog(t, 11.0, 11.4)));
    gl.addColorStop(1, NEON(0));
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, W, H);

    const ba = 0.2 * prog(t, 11.3, 11.9);
    if (ba > 0) {
      const a = sweepAngle(t) * 0.6;
      const cg = ctx.createConicGradient(a - 1.3, lx, ly);
      cg.addColorStop(0, NEON(0));
      cg.addColorStop(1.3 / TAU, NEON(ba));
      cg.addColorStop(1.3 / TAU + 0.0005, NEON(0));
      cg.addColorStop(1, NEON(0));
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.arc(lx, ly, size * 0.78, a - 1.3, a); ctx.closePath(); ctx.fill();
    }

    for (let k = 0; k < 5; k++) {
      const age = lt - k * 1.0;
      if (age < 0 || age > 2.0) continue;
      ctx.save();
      ctx.strokeStyle = NEON(0.45 * Math.pow(1 - age / 2, 1.5));
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(lx, ly, size * 0.48 + age * 260, 0, TAU); ctx.stroke();
      ctx.restore();
    }

    if (lt < 0.8) {
      ctx.save();
      ctx.strokeStyle = LIME(1 - lt / 0.8);
      ctx.lineWidth = lerp(34, 2, lt / 0.8);
      ctx.shadowColor = COL.neon;
      ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(lx, ly, easeOutCubic(lt / 0.8) * 900, 0, TAU); ctx.stroke();
      ctx.restore();
    }

    if (lt < 1.8) {
      BURST.forEach((p) => {
        const d = p.v * (1 - Math.exp(-lt * 3)) / 3;
        const a = 1 - lt / 1.8;
        pixelSquare(lx + Math.cos(p.a) * d, ly + Math.sin(p.a) * d, p.s, p.c, 10 * a);
      });
    }

    if (LOGO) {
      const e = easeOutBack(le, 1.5);
      const breathe = 1 + 0.012 * Math.sin(Math.max(0, t - 11.65) * 2.4);
      const sc = lerp(0.25, 1, e) * breathe;
      ctx.save();
      ctx.globalAlpha = prog(t, 11.0, 11.15);
      ctx.translate(lx, ly);
      ctx.rotate((1 - easeOutCubic(le)) * -0.35);
      ctx.scale(sc, sc);
      ctx.shadowColor = NEON(0.6);
      ctx.shadowBlur = 50;
      // the art's circle sits slightly up-left of the image centre
      ctx.drawImage(LOGO, -size * 315.5 / 640, -size * 310.5 / 640, size, size);
      ctx.restore();
    }

    const words = [{ t: 'FIND ' }, { t: 'YOUR ' }, { t: 'NEXT ' }, { t: 'WORLD.', c: 'accent' }];
    ctx.save();
    ctx.font = '700 76px "Pixelify Sans"';
    const widths = words.map((w) => ctx.measureText(w.t).width);
    ctx.restore();
    const total = widths.reduce((a, b) => a + b, 0);
    let wx = 540 - total / 2;
    words.forEach((w, i) => {
      headline([w], wx + widths[i] / 2, 818, 76, appear(t, 11.65 + i * 0.09, 0.4), 2000);
      wx += widths[i];
    });

    const pe = prog(t, 12.3, 12.75);
    if (pe > 0) {
      ctx.save();
      ctx.font = '700 24px "Silkscreen"';
      ctx.letterSpacing = '3px';
      const pw = ctx.measureText('WEBSITE COMING SOON').width + 92;
      ctx.letterSpacing = '0px';
      const w = pw * clamp(easeOutBack(pe, 1.8), 0, 1.1);
      ctx.restore();
      panel(540 - w / 2, 912 - 30, w, 60, 6, { glow: 18 });
      const ta = prog(t, 12.55, 12.8);
      if (ta > 0) {
        ctx.save();
        ctx.globalAlpha = ta;
        const x0 = 540 - pw / 2;
        if (Math.floor(t * 2) % 2 === 0 || t < 13) pixelSquare(x0 + 34, 912, 14, COL.neon, 14);
        label('WEBSITE COMING SOON', x0 + 58, 913, 24, COL.white, 'left', 3, 700);
        ctx.restore();
      }
    }

    ctx.save();
    ctx.globalAlpha = appear(t, 12.75, 0.5);
    label('JOIN THE COMMUNITY ON DISCORD', 540, 992, 20, MINT(0.65), 'center', 3);
    ctx.restore();
  }

  function drawFlash(t) {
    if (t < SCENE.D) return;
    const a = 0.92 * Math.exp(-(t - SCENE.D) * 6);
    if (a < 0.005) return;
    ctx.fillStyle = `rgba(220,255,200,${a})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ---------- frame ----------
  function render(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.drawImage(bgLayer, 0, 0);

    ctx.save();
    const sh = 16 * Math.pow(1 - prog(t, 11.0, 11.45), 2) * (t >= 11.0 ? 1 : 0);
    ctx.translate(sh * Math.sin(t * 97), sh * Math.cos(t * 131));
    drawParticles(t);
    drawRadar(t);
    drawChips(t);
    drawSceneAText(t);
    drawSceneBText(t);
    drawSceneC(t);
    drawRiser(t);
    drawSceneD(t);
    ctx.restore();

    drawScanBar(t, SCENE.B);
    drawScanBar(t, SCENE.C);
    drawHUD(t);
    ctx.drawImage(scanLayer, 0, 0);
    drawFlash(t);
  }

  // Cue sheet for the soundtrack (render/make-audio.py reads this).
  function events() {
    const ev = [];
    BLIPS.forEach((b) => {
      for (let th = b.hit0; th < SCENE.B - 0.1; th += PERIOD) {
        ev.push({ type: 'ping', t: th, gain: th === b.hit0 ? 1 : 0.3, note: b.note });
      }
    });
    const typed = 'SCANNING FOR SERVERS';
    for (let i = 1; i <= typed.length; i++) ev.push({ type: 'click', t: 0.15 + 0.65 * i / typed.length });
    CHIPS.forEach((c, i) => ev.push({ type: 'chip', t: c.launch + 0.32, note: 84 + [0, 2, 4, 7, 9, 12][i] }));
    ev.push({ type: 'whoosh', t: SCENE.B });
    ev.push({ type: 'whoosh', t: SCENE.C });
    ev.push({ type: 'thump', t: 7.95 });
    ev.push({ type: 'stamp', t: BADGE_T });
    HEADS.forEach((_, i) => ev.push({ type: 'pop', t: HEAD_T + i * 0.11, note: [84, 86, 88, 91, 93, 96, 98][i] }));
    ev.push({ type: 'riser', t: 10.1, end: SCENE.D });
    ev.push({ type: 'impact', t: SCENE.D });
    ev.push({ type: 'chip', t: 12.32, note: 96 });
    return ev.sort((a, b) => a.t - b.t);
  }

  // ---------- boot ----------
  function loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  }

  async function boot() {
    const [img] = await Promise.all([
      loadImage('assets/logo.png'),
      document.fonts.load('700 40px "Pixelify Sans"'),
      document.fonts.load('400 40px "Pixelify Sans"'),
      document.fonts.load('400 40px "Silkscreen"'),
      document.fonts.load('700 40px "Silkscreen"'),
    ]);
    LOGO = img;
    buildStatic();
    measureChips();
    window.AD = {
      W, H, FPS, DURATION, render, events,
      frame(t) { render(t); return canvas.toDataURL('image/png').split(',')[1]; },
    };
    window.AD_READY = true;
    if (new URLSearchParams(location.search).has('render')) return;
    const t0 = performance.now();
    const loop = (now) => {
      const t = ((now - t0) / 1000) % (DURATION + 1.5);
      render(Math.min(t, DURATION));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  boot();
})();
