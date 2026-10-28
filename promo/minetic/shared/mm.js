// Minetic Media brand kit on top of the shorts toolkit (MR): navy / diamond-cyan / gold palette,
// the logo, diamond sparkles, phone mockups that play clips from the portfolio reel (frames cut
// by prep-reel.sh), and the "Join the Discord" end card. Ads call MM.start({...}) instead of MR.start.
(() => {
  'use strict';
  const M = MR;
  const { ctx, W, H, TAU } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic } = M;

  const C = {
    navy: '#020b1d', navy2: '#0a1a3a', cyan: '#3fe0e8', cyan2: '#a8f6ff', gold: '#ffc93c', gold2: '#ffe48a',
    white: '#f2fbff', ink: '#03101f', blurple: '#5865F2',
  };
  const CYAN = (a) => `rgba(63,224,232,${a})`;
  const GOLD = (a) => `rgba(255,201,60,${a})`;
  const H_OPTS = { outline: '#01060f', shadow: '#06314a' };
  const BASE = new URL('./', document.currentScript.src).href;
  const IMG = {};

  const loadImg = (url) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = url;
  });

  // ---------- portfolio reel: lazily loaded JPEG frames, kept in a small LRU cache ----------
  let REEL = { fps: 30, clips: {} };
  const cache = new Map();
  const want = new Set();
  const MAX_CACHE = 180;
  const frameUrl = (id, n) => `${BASE}reel/${id}/f${String(n + 1).padStart(3, '0')}.jpg`;

  function fetchFrame(url) {
    if (!cache.has(url)) {
      const entry = { img: null, p: null };
      entry.p = loadImg(url).then((im) => { entry.img = im; return im; }).catch(() => null);
      cache.set(url, entry);
      while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
    }
    return cache.get(url).p;
  }

  // the frame of clip `id` at clip-local time lt (loops); null until loaded
  function clip(id, lt) {
    const c = REEL.clips[id];
    if (!c) return null;
    const count = Math.round(c.dur * REEL.fps);
    const n = ((Math.floor(Math.max(0, lt) * REEL.fps) % count) + count) % count;
    const url = frameUrl(id, n);
    const e = cache.get(url);
    if (e?.img) {
      cache.delete(url); cache.set(url, e);
      return e.img;
    }
    want.add(url);
    fetchFrame(url);
    return null;
  }
  const clipLabel = (id) => REEL.clips[id]?.label || '';

  // ---------- background ----------
  let bgLayer;
  function buildBg() {
    bgLayer = document.createElement('canvas');
    bgLayer.width = W; bgLayer.height = H;
    const b = bgLayer.getContext('2d');
    const g = b.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04153a');
    g.addColorStop(0.55, '#020b1d');
    g.addColorStop(1, '#01050f');
    b.fillStyle = g;
    b.fillRect(0, 0, W, H);
    const cell = 60;
    for (let y = 0; y < H / cell; y++) for (let x = 0; x < W / cell; x++) {
      const h = hash(x * 13.7 + y * 71.3);
      if (h > 0.82) {
        b.fillStyle = `rgba(63,224,232,${0.03 + 0.05 * hash(x + y * 9)})`;
        b.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    b.strokeStyle = 'rgba(63,224,232,0.05)';
    b.lineWidth = 2;
    for (let x = 0; x <= W; x += cell) { b.beginPath(); b.moveTo(x, 0); b.lineTo(x, H); b.stroke(); }
    for (let y = 0; y <= H; y += cell) { b.beginPath(); b.moveTo(0, y); b.lineTo(W, y); b.stroke(); }
    const vig = b.createRadialGradient(540, 960, 520, 540, 960, 1250);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.7)');
    b.fillStyle = vig;
    b.fillRect(0, 0, W, H);
  }
  function blob(x, y, r, col) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function drawBg(t, glow = 1) {
    ctx.drawImage(bgLayer, 0, 0);
    blob(240 + 120 * Math.sin(t * 0.4), 480 + 80 * Math.cos(t * 0.33), 760, CYAN(0.16 * glow));
    blob(860 + 100 * Math.cos(t * 0.37), 1420 + 90 * Math.sin(t * 0.45), 780, GOLD(0.1 * glow));
  }

  // drifting diamond-ore pixels
  function sparkles(t, n = 26, seed = 0, alpha = 1) {
    for (let i = 0; i < n; i++) {
      const k = i + seed * 100;
      const sp = 0.04 + hash(k) * 0.07;
      const ph = (t * sp + hash(k * 3)) % 1;
      const cyc = Math.floor(t * sp + hash(k * 3));
      const x = hash(k * 7 + cyc * 13) * W + Math.sin(t * 1.2 + i) * 24;
      const y = H + 40 - ph * (H + 80);
      const s = 6 + (i % 3) * 5;
      const a = Math.sin(ph * Math.PI) * alpha;
      ctx.fillStyle = i % 5 === 0 ? GOLD(a) : i % 3 === 0 ? `rgba(242,251,255,${a})` : CYAN(a);
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
  }

  const BURST = Array.from({ length: 70 }, (_, i) => ({
    a: hash(i * 3.1) * TAU, v: 500 + hash(i * 7.7) * 1100, s: 8 + (i % 3) * 5,
    c: [C.cyan, C.gold, C.cyan2, '#ffffff'][i % 4],
  }));
  function burst(cx, cy, lt, dur = 1.3, scale = 1) {
    if (lt < 0 || lt > dur) return;
    BURST.forEach((p) => {
      const d = p.v * scale * (1 - Math.exp(-lt * 3)) / 3;
      ctx.globalAlpha = 1 - lt / dur;
      ctx.fillStyle = p.c;
      ctx.fillRect(cx + Math.cos(p.a) * d - p.s / 2, cy + Math.sin(p.a) * d - p.s / 2 + lt * lt * 140, p.s, p.s);
    });
    ctx.globalAlpha = 1;
  }
  function shockwave(cx, cy, lt, max = 1200, col = CYAN) {
    if (lt < 0 || lt > 0.8) return;
    ctx.save();
    ctx.strokeStyle = col(1 - lt / 0.8);
    ctx.lineWidth = lerp(30, 2, lt / 0.8);
    ctx.shadowColor = C.cyan;
    ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.arc(cx, cy, easeOutCubic(lt / 0.8) * max, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  function rays(cx, cy, t, alpha, n = 14) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.25);
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1200);
      g.addColorStop(0, (i % 2 ? GOLD : CYAN)(0.24 * alpha));
      g.addColorStop(1, CYAN(0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1200, a, a + TAU / n / 2.2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- text ----------
  const hl = (parts, x, y, size, e = 1, opts = {}) => M.headline(parts, x, y, size, e, opts.maxW || 980, { ...H_OPTS, ...opts });

  // ---------- logo ----------
  function shine(img, x, y, w, h, p) {
    if (p <= 0 || p >= 1) return;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w); c.height = Math.ceil(h);
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, w, h);
    g.globalCompositeOperation = 'source-atop';
    const sx = lerp(-w * 0.4, w * 1.4, p);
    const lg = g.createLinearGradient(sx - 130, 0, sx + 130, h);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(0.5, 'rgba(255,255,255,0.7)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg;
    g.fillRect(0, 0, w, h);
    ctx.drawImage(c, x, y);
  }
  // o.icon draws the pickaxe-only icon; o.shine 0..1 sweeps a highlight across it
  function logo(cx, cy, w, o = {}) {
    const img = o.icon ? IMG.icon : IMG.logo;
    const h = w * img.height / img.width;
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.translate(cx, cy);
    if (o.rot) ctx.rotate(o.rot);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    if (o.shine !== undefined) shine(img, -w / 2, -h / 2, w, h, o.shine);
    ctx.restore();
  }

  // ---------- phone mockup ----------
  // screen(x, y, w, h) paints the screen; or pass o.img to cover-fit an image (e.g. a reel frame)
  function phone(cx, cy, w, o = {}) {
    const h = w * 2.02;
    const r = w * 0.13;
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.translate(cx, cy);
    if (o.rot) ctx.rotate(o.rot);
    if (o.scale) ctx.scale(o.scale, o.scale);
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 24;
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r);
    ctx.fillStyle = '#0b0e14';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    if (o.glow) {
      ctx.shadowColor = o.glowColor || C.cyan;
      ctx.shadowBlur = o.glow;
    }
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = o.glow ? (o.glowColor || C.cyan) : '#2a3240';
    ctx.lineWidth = o.glow ? 6 : 4;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    const inset = w * 0.04;
    const sx = -w / 2 + inset, sy = -h / 2 + inset, sw = w - inset * 2, sh = h - inset * 2;
    ctx.save();
    ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, r * 0.75); ctx.clip();
    ctx.fillStyle = '#05070b';
    ctx.fillRect(sx, sy, sw, sh);
    if (o.img) {
      const k = Math.max(sw / o.img.width, sh / o.img.height);
      const iw = o.img.width * k, ih = o.img.height * k;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(o.img, sx + (sw - iw) / 2, sy + (sh - ih) / 2, iw, ih);
    }
    if (o.screen) o.screen(sx, sy, sw, sh);
    if (o.ui) shortsUi(sx, sy, sw, sh, o.ui === true ? {} : o.ui);
    ctx.restore();
    ctx.fillStyle = '#0b0e14';
    ctx.beginPath(); ctx.roundRect(-w * 0.14, sy + w * 0.025, w * 0.28, w * 0.065, w * 0.033); ctx.fill();
    ctx.restore();
  }

  // a generic short-video overlay: action icons on the right, channel line and progress bar
  function shortsUi(sx, sy, sw, sh, o) {
    const k = sw / 400;
    const rx = sx + sw - 44 * k;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    const g = ctx.createLinearGradient(0, sy + sh * 0.7, 0, sy + sh);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy + sh * 0.7, sw, sh * 0.3);
    [0, 1, 2].forEach((i) => {
      const y = sy + sh * 0.56 + i * 74 * k;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.arc(rx, y, 24 * k, 0, TAU); ctx.fill();
      ctx.fillStyle = i === 0 && o.liked ? '#ff4d6d' : '#ffffff';
      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(rx, y + 10 * k);
        ctx.bezierCurveTo(rx - 22 * k, y - 4 * k, rx - 10 * k, y - 18 * k, rx, y - 8 * k);
        ctx.bezierCurveTo(rx + 10 * k, y - 18 * k, rx + 22 * k, y - 4 * k, rx, y + 10 * k);
        ctx.fill();
      } else if (i === 1) {
        ctx.beginPath(); ctx.roundRect(rx - 12 * k, y - 10 * k, 24 * k, 17 * k, 5 * k); ctx.fill();
      } else {
        ctx.beginPath(); ctx.moveTo(rx - 10 * k, y + 9 * k); ctx.lineTo(rx + 12 * k, y); ctx.lineTo(rx - 10 * k, y - 9 * k); ctx.closePath(); ctx.fill();
      }
    });
    ctx.fillStyle = o.avatar || C.cyan;
    ctx.beginPath(); ctx.arc(sx + 34 * k, sy + sh - 62 * k, 15 * k, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(17 * k)}px "Inter"`;
    ctx.textBaseline = 'middle';
    ctx.fillText(o.name || '@yourserver', sx + 58 * k, sy + sh - 62 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(sx, sy + sh - 6 * k, sw, 4 * k);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx, sy + sh - 6 * k, sw * clamp(o.progress ?? 0.4), 4 * k);
    ctx.restore();
  }

  // ---------- discord call to action ----------
  function bubble(x, y, s, col) {
    ctx.save();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.roundRect(x - s, y - s * 0.72, s * 2, s * 1.4, s * 0.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - s * 0.5, y + s * 0.6); ctx.lineTo(x - s * 0.8, y + s * 1.1); ctx.lineTo(x - s * 0.05, y + s * 0.6); ctx.fill();
    ctx.fillStyle = C.blurple;
    [-0.5, 0, 0.5].forEach((d) => { ctx.beginPath(); ctx.arc(x + d * s, y, s * 0.15, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function discordButton(cx, cy, w, h, e, press = 0, glow = 40) {
    if (e <= 0) return;
    const s = clamp(easeOutBack(clamp(e), 2), 0, 1.2) * (1 - 0.07 * press);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    M.pixelRectPath(-w / 2, -h / 2, w, h, 12);
    ctx.fillStyle = C.blurple;
    ctx.shadowColor = 'rgba(88,101,242,0.9)';
    ctx.shadowBlur = glow;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(-w / 2 + 12, -h / 2, w - 24, h * 0.42);
    ctx.strokeStyle = '#c9cdfb';
    ctx.lineWidth = 5;
    M.pixelRectPath(-w / 2, -h / 2, w, h, 12);
    ctx.stroke();
    const label = 'JOIN THE DISCORD';
    const tw = M.textWidth(label, '700 40px "Silkscreen"', 3) - 3;
    const gx = -(64 + 24 + tw) / 2;
    bubble(gx + 32, -3, 30, '#ffffff');
    M.label(label, gx + 64 + 24, 3, 40, '#ffffff', 'left', 3, 700);
    ctx.restore();
  }
  function cursor(x, y, s = 6) { M.cursorSprite(x, y, s); }
  function downArrow(x, y, t, col = C.white) {
    const b = Math.abs(Math.sin(t * 5)) * 14;
    const rows = ['..###..', '..###..', '..###..', '#######', '.#####.', '..###..', '...#...'];
    ctx.fillStyle = col;
    rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') ctx.fillRect(x - 21 + c * 6, y + b + r * 6, 6, 6); }));
  }
  function chip(text, cx, cy, e, col = C.cyan, size = 24) {
    if (e <= 0) return;
    const tw = M.textWidth(text, `700 ${size}px "Silkscreen"`, 2);
    const w = tw + 76, h = size * 2.3;
    const sx = clamp(easeOutBack(clamp(e), 2), 0, 1.2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sx, 1);
    M.pixelRectPath(-w / 2, -h / 2, w, h, 6);
    ctx.fillStyle = 'rgba(3,16,31,0.92)';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (e > 0.6) {
      M.pixelSquare(-w / 2 + 28, 0, size * 0.6, col, 10);
      M.label(text, -w / 2 + 46, 1, size, C.white, 'left', 2, 700);
    }
    ctx.restore();
  }

  // ---------- end card ----------
  const CLICK = 1.7;
  const CHIPS = [['CUSTOM ANIMATION', C.cyan], ['NO-COPYRIGHT MUSIC', C.gold]];
  function endCard(t, t0, o = {}) {
    if (t < t0) return;
    const lt = t - t0;
    drawBg(t, 1.3);
    const ly = o.top ? 720 : 660;
    rays(540, ly, t, prog(lt, 0.1, 0.6));
    sparkles(t, 30, 7);
    if (o.top) o.top.forEach((parts, i) => hl(parts, 540, 215 + i * 105, 96, appear(t, t0 + 0.25 + i * 0.1)));
    const le = prog(lt, 0, 0.45);
    const sc = lerp(1.7, 1, easeOutBack(le, 1.4)) * (1 + 0.012 * Math.sin(Math.max(0, lt - 0.5) * 2.4));
    const lw = 600;
    shockwave(540, ly, lt - 0.3);
    burst(540, ly, lt - 0.3);
    logo(540, ly + Math.sin(lt * 2) * 6, lw * sc, { alpha: prog(lt, 0, 0.12), shine: ((lt - 0.8) % 2.4) / 0.9 });
    const ky = ly + 360;
    M.label('VIDEO ADS FOR MINECRAFT SERVERS', 540, ky + (1 - appear(t, t0 + 0.55)) * 20, 30, CYAN(appear(t, t0 + 0.55)), 'center', 3, 700);
    hl([{ t: 'Ads that ' }, { t: 'move players.', c: 'gold' }], 540, ky + 80, 64, appear(t, t0 + 0.7));
    const by = ky + 215;
    const press = lt > CLICK ? Math.exp(-(lt - CLICK) * 10) : 0;
    if (lt > CLICK) burst(540, by, lt - CLICK, 1.0, 0.45);
    discordButton(540, by, 720, 128, prog(lt, 0.95, 1.3), press, 40 + (lt > CLICK + 0.2 ? 16 * Math.sin((lt - CLICK) * 5) : 0));
    if (lt > CLICK && lt < CLICK + 0.6) {
      ctx.save();
      ctx.strokeStyle = `rgba(201,205,251,${1 - (lt - CLICK) / 0.6})`;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(540, by, 60 + (lt - CLICK) * 500, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    const cp = lt < CLICK ? easeOutCubic(prog(lt, 1.2, CLICK - 0.05)) : 1;
    if (lt > 1.2 && lt < CLICK + 1.2) cursor(lerp(980, 700, cp), lerp(1680, by + 6, cp) + (lt > CLICK ? (lt - CLICK) * 260 : 0), 6);
    const de = appear(t, t0 + CLICK + 0.25);
    if (de > 0) {
      ctx.save();
      ctx.globalAlpha *= de;
      const tw = M.textWidth('LINK IN DESCRIPTION', '700 28px "Silkscreen"', 3);
      const x0 = 540 - (tw + 56) / 2;
      M.label('LINK IN DESCRIPTION', x0, by + 118, 28, C.white, 'left', 3, 700);
      downArrow(x0 + tw + 34, by + 96, t, C.gold);
      ctx.restore();
    }
    const widths = CHIPS.map(([s]) => M.textWidth(s, '700 22px "Silkscreen"', 2) + 76);
    let x = 540 - (widths[0] + widths[1] + 20) / 2;
    CHIPS.forEach(([s, col], i) => {
      chip(s, x + widths[i] / 2, by + 205, prog(lt, 2.2 + i * 0.12, 2.5 + i * 0.12), col, 22);
      x += widths[i] + 20;
    });
  }
  function endCardEvents(t0) {
    return [
      { type: 'whoosh', t: t0 },
      { type: 'impact', t: t0 + 0.3 },
      { type: 'sparkle', t: t0 + 0.32, note: 86 },
      { type: 'pop', t: t0 + 0.57, note: 76 },
      { type: 'pop', t: t0 + 0.72, note: 79 },
      { type: 'pop', t: t0 + 0.97, note: 84 },
      { type: 'swipe', t: t0 + 1.45 },
      { type: 'cta_click', t: t0 + CLICK },
      { type: 'ding', t: t0 + CLICK + 0.27, note: 91 },
      { type: 'pop', t: t0 + 2.22, note: 88 },
      { type: 'pop', t: t0 + 2.34, note: 91 },
    ];
  }

  function start(def) {
    Promise.all([
      loadImg(`${BASE}assets/logo.png`).then((im) => { IMG.logo = im; }),
      loadImg(`${BASE}assets/icon.png`).then((im) => { IMG.icon = im; }),
      fetch(`${BASE}reel.json`).then((r) => r.json()).then((j) => { REEL = j; }),
    ]).then(() => M.start({
      ...def,
      setup() { buildBg(); if (def.setup) def.setup(); },
      // draw once to find which reel frames this moment needs, load them, then let MR render
      async prepare(t) {
        for (let pass = 0; pass < 3; pass++) {
          want.clear();
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          def.render(t);
          ctx.restore();
          if (!want.size) return;
          await Promise.all([...want].map(fetchFrame));
        }
      },
    }));
  }

  window.MM = {
    C, CYAN, GOLD, H_OPTS, IMG, drawBg, blob, sparkles, burst, shockwave, rays, hl, logo, shine, phone, shortsUi,
    clip, clipLabel, discordButton, bubble, cursor, downArrow, chip, endCard, endCardEvents, start,
  };
})();
