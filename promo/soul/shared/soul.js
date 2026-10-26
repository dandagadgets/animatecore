// Soul Launcher brand kit on top of the shorts toolkit (MR): website palette, aurora background,
// pixel soul fire, the logo rebuilt as a 20x20 grid (so it can assemble pixel by pixel),
// website-style cards/buttons/cursor, and the download end card. Ads call SOUL.start({...}).
(() => {
  'use strict';
  const M = MR;
  const { ctx, W, H, TAU } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInOutCubic } = M;

  const C = {
    bg: '#07090d', card: '#13171d', card2: '#1a1f27', line: 'rgba(255,255,255,0.10)',
    text: '#eef3f8', dim: '#9aa5b4', faint: '#5d6876', mint: '#5eead4', mint2: '#2dd4bf', ink: '#03302a',
    gold: '#f2b403', navy: '#0a2d67', blue: '#0f74b8', sky: '#56bde8', cyan: '#0ad6d2', ice: '#a2e8ec',
    red: '#ff5c6c', amber: '#ffb547',
  };
  const MINT = (a) => `rgba(94,234,212,${a})`;
  const CYAN = (a) => `rgba(10,214,210,${a})`;
  const BLUE = (a) => `rgba(15,116,184,${a})`;
  const REPO = 'github.com/unmid/SoulLauncher';

  // ---------- logo (traced from the 256px icon: a 20x20 grid) ----------
  const LOGO_ROWS = [
    'aabbaaaaaaaaaaaabbaa', 'aaaaaabbccccbbaaaaaa', 'aaaaaabbccccbbaaaaaa', 'ddbbaabbccccbbaabbdd',
    'ddbbeeeecccceeeebbdd', 'aaaaeeeecccceeeeaaaa', 'aaaaeeffccccffeeaaaa', 'aaggeeffccccffeeggaa',
    'aaggddddhhhhddddggaa', 'aaggddddhhhhddddggaa', 'aaggddhhffffhhddggaa', 'aacccchhffffhhccccaa',
    'aaccccffffffffccccaa', 'aaccccffffffffccccaa', 'aaccccffffffffccccaa', 'iicccceeddddeeccccii',
    'iicccceeddddeeccccii', 'jjggkkccccccccccggjj', 'jjggkkccccccccccggjj', 'ccllkkcckkcckkkkllcc',
  ];
  const LOGO_PAL = {
    a: '#f2b403', b: '#0f74b8', c: '#0a2d67', d: '#0f2650', e: '#a2e8ec', f: '#fefffe',
    g: '#56bde8', h: '#0ad6d2', i: '#bd8705', j: '#815e02', k: '#0d569d', l: '#79dff2',
  };
  let logoImg;
  const LOGO_PX = [];
  function buildLogo() {
    logoImg = M.sprite(LOGO_ROWS, LOGO_PAL);
    LOGO_ROWS.forEach((row, y) => [...row].forEach((ch, x) => {
      LOGO_PX.push({ x, y, col: LOGO_PAL[ch], h: hash(x * 13.1 + y * 7.7), a: hash(x * 3.3 + y * 17.9) * TAU });
    }));
  }

  // o.assemble 0..1 flies the pixels in; o.glow adds a cyan halo; o.rot tilts it
  function logo(cx, cy, size, o = {}) {
    const a = o.assemble ?? 1;
    const px = size / 20;
    ctx.save();
    if (o.glow) {
      const g = ctx.createRadialGradient(cx, cy, size * 0.2, cx, cy, size * 1.1);
      g.addColorStop(0, CYAN(0.35 * o.glow));
      g.addColorStop(1, CYAN(0));
      ctx.fillStyle = g;
      ctx.fillRect(cx - size * 1.2, cy - size * 1.2, size * 2.4, size * 2.4);
    }
    ctx.translate(cx, cy);
    if (o.rot) ctx.rotate(o.rot);
    if (a >= 1) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = size * 0.12;
      ctx.shadowOffsetY = size * 0.05;
      ctx.beginPath();
      ctx.roundRect(-size / 2, -size / 2, size, size, size * 0.1);
      ctx.fillStyle = '#0a2d67';
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-size / 2, -size / 2, size, size, size * 0.1);
      ctx.clip();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(logoImg, -size / 2, -size / 2, size, size);
      ctx.restore();
    } else {
      LOGO_PX.forEach((p) => {
        const d = clamp((a - p.h * 0.45) / 0.55);
        if (d <= 0) return;
        const e = easeOutCubic(d);
        const dist = (1 - e) * (500 + p.h * 700);
        const x = -size / 2 + p.x * px + Math.cos(p.a) * dist;
        const y = -size / 2 + p.y * px + Math.sin(p.a) * dist;
        const s = px * lerp(0.5, 1, e);
        ctx.globalAlpha = clamp(d * 3);
        ctx.fillStyle = p.col;
        ctx.fillRect(x + (px - s) / 2, y + (px - s) / 2, s + 0.6, s + 0.6);
      });
    }
    ctx.restore();
  }

  // ---------- background ----------
  let bgLayer;
  function buildBg() {
    bgLayer = document.createElement('canvas');
    bgLayer.width = W; bgLayer.height = H;
    const b = bgLayer.getContext('2d');
    const g = b.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0f15');
    g.addColorStop(1, '#06080b');
    b.fillStyle = g;
    b.fillRect(0, 0, W, H);
    for (let y = 27; y < H; y += 54) for (let x = 27; x < W; x += 54) {
      b.fillStyle = `rgba(255,255,255,${0.03 + 0.03 * hash(x * 0.37 + y * 1.31)})`;
      b.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    const vig = b.createRadialGradient(540, 960, 520, 540, 960, 1250);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.75)');
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
  // o.mint / o.blue scale the two aurora glows
  function drawBg(t, o = {}) {
    ctx.drawImage(bgLayer, 0, 0);
    blob(260 + 140 * Math.sin(t * 0.37), 520 + 90 * Math.cos(t * 0.29), 760, MINT(0.13 * (o.mint ?? 1)));
    blob(840 + 110 * Math.cos(t * 0.33), 1360 + 100 * Math.sin(t * 0.41), 860, BLUE(0.26 * (o.blue ?? 1)));
    blob(560 + 200 * Math.sin(t * 0.21 + 2), 980, 600, CYAN(0.05));
  }

  // ---------- soul fire + embers ----------
  const FIRE = ['#0b4f6b', '#0c8fa6', '#18cfc8', '#86fbf0', '#efffff'];
  function soulFire(cx, by, cols, rows, px, t, seed = 0, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const g = ctx.createRadialGradient(cx, by - rows * px * 0.35, 0, cx, by - rows * px * 0.35, cols * px * 1.3);
    g.addColorStop(0, CYAN(0.35));
    g.addColorStop(1, CYAN(0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - cols * px * 1.3, by - rows * px * 1.6, cols * px * 2.6, rows * px * 2.2);
    const tick = Math.floor(t * 14);
    for (let y = 0; y < rows; y++) {
      const ny = (y + 0.5) / rows;
      const half = 0.5 * Math.pow(ny, 0.75) + 0.04;
      for (let x = 0; x < cols; x++) {
        const nx = (x + 0.5) / cols - 0.5;
        const shape = 1 - Math.abs(nx) / half;
        if (shape <= 0) continue;
        const n1 = hash(seed * 31.7 + x * 7.13 + (y + tick) * 3.71);
        const n2 = hash(seed * 17.3 + x * 3.1 + Math.floor((y + tick) / 2) * 5.3);
        const v = shape * (0.3 + ny * 0.85) * (0.6 + 0.5 * n1) - (1 - ny) * 0.35 * n2;
        if (v < 0.16) continue;
        const ci = v > 0.92 ? 4 : v > 0.7 ? 3 : v > 0.48 ? 2 : v > 0.3 ? 1 : 0;
        ctx.fillStyle = FIRE[ci];
        ctx.fillRect(Math.round(cx - cols * px / 2 + x * px), Math.round(by - rows * px + y * px), px, px);
      }
    }
    ctx.restore();
  }

  function embers(t, n = 24, seed = 0, alpha = 1) {
    if (alpha <= 0) return;
    for (let i = 0; i < n; i++) {
      const k = i + seed * 100;
      const sp = 0.05 + hash(k) * 0.08;
      const ph = (t * sp + hash(k * 3)) % 1;
      const cyc = Math.floor(t * sp + hash(k * 3));
      const x = hash(k * 7 + cyc * 13) * W + Math.sin(t * 1.3 + i) * 30;
      const y = H + 40 - ph * (H + 80);
      const s = 6 + (i % 3) * 4;
      const a = Math.sin(ph * Math.PI) * alpha;
      ctx.fillStyle = i % 4 === 0 ? `rgba(239,255,255,${a})` : i % 4 === 1 ? MINT(a) : CYAN(a * 0.9);
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
  }

  // ---------- text ----------
  const FILLS = {
    mint: ['#b9fff3', '#5eead4', '#1fbfa8'],
    gold: ['#ffe9a0', '#f2b403', '#c98a00'],
    sky: ['#d4f6ff', '#56bde8', '#2a86c9'],
    red: ['#ffb3ba', '#ff5c6c', '#d6283c'],
  };
  function gradFill(y, size, kind) {
    const g = ctx.createLinearGradient(0, y - size * 0.4, 0, y + size * 0.4);
    FILLS[kind].forEach((c, i) => g.addColorStop(i / 2, c));
    return g;
  }

  // Website-style display headline (Baloo 2 ExtraBold). parts: [{ t, c }], c = 'mint' | 'gold' | css colour.
  // opts.slam scales in from big; opts.dark draws dark text (for mint backgrounds).
  function title(parts, x, y, size, e = 1, opts = {}) {
    if (e <= 0) return;
    ctx.save();
    const font = (s) => `800 ${s}px "Baloo 2"`;
    ctx.font = font(size);
    let widths = parts.map((p) => ctx.measureText(p.t).width);
    let total = widths.reduce((a, b) => a + b, 0);
    const maxW = opts.maxW || 960;
    if (total > maxW) {
      size = Math.floor(size * maxW / total);
      ctx.font = font(size);
      widths = parts.map((p) => ctx.measureText(p.t).width);
      total = widths.reduce((a, b) => a + b, 0);
    }
    ctx.globalAlpha *= clamp(e * 2.5);
    if (opts.slam) {
      const s = lerp(1.7, 1, easeOutCubic(clamp(e)));
      ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-x, -y);
    } else {
      y += (1 - easeOutCubic(clamp(e))) * 40;
    }
    // Baloo's em box sits low; nudge so y is the visual middle of the caps
    const yy = y + size * 0.08;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    let cx = opts.align === 'left' ? x : x - total / 2;
    parts.forEach((p, i) => {
      ctx.save();
      if (!opts.dark) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillText(p.t, cx, yy + size * 0.05);
      }
      if (FILLS[p.c]) {
        ctx.shadowColor = p.c === 'mint' ? MINT(0.45) : 'rgba(242,180,3,0.4)';
        ctx.shadowBlur = 30;
        ctx.fillStyle = gradFill(yy, size, p.c);
      } else {
        ctx.fillStyle = p.c || (opts.dark ? C.ink : C.text);
      }
      ctx.fillText(p.t, cx, yy);
      ctx.restore();
      cx += widths[i];
    });
    ctx.restore();
  }

  function text(str, x, y, size, color = C.text, align = 'center', weight = 600, family = 'Inter', spacing = 0) {
    ctx.save();
    ctx.font = `${weight} ${size}px "${family}"`;
    ctx.letterSpacing = `${spacing}px`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  const width = (str, size, weight = 600, family = 'Inter', spacing = 0) =>
    M.textWidth(str, `${weight} ${size}px "${family}"`, spacing);

  function kicker(str, x, y, e = 1, color = C.mint, size = 26) {
    if (e <= 0) return;
    ctx.save();
    ctx.globalAlpha *= clamp(e * 2);
    text(str, x, y + (1 - e) * 16, size, color, 'center', 700, 'Inter', 6);
    ctx.restore();
  }

  // ---------- UI pieces ----------
  function card(x, y, w, h, o = {}) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, o.r ?? 26);
    if (o.shadow !== false) {
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 50;
      ctx.shadowOffsetY = 18;
    }
    ctx.fillStyle = o.fill || C.card;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    if (o.glow) {
      ctx.shadowColor = o.glowColor || MINT(0.7);
      ctx.shadowBlur = o.glow;
    }
    ctx.strokeStyle = o.stroke || C.line;
    ctx.lineWidth = o.lw || 2;
    ctx.stroke();
    ctx.restore();
  }

  function pill(str, cx, cy, e = 1, o = {}) {
    if (e <= 0) return;
    const size = o.size || 28;
    const pad = o.pad ?? 34;
    const dot = o.dot ? size * 0.9 : 0;
    const w = width(str, size, o.weight || 700, o.family || 'Inter', o.spacing ?? 1) + pad * 2 + dot;
    const h = size * 2.1;
    const s = clamp(easeOutBack(clamp(e), 2), 0, 1.2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
    ctx.fillStyle = o.fill || 'rgba(19,23,29,0.92)';
    if (o.glow) { ctx.shadowColor = o.glowColor || MINT(0.6); ctx.shadowBlur = o.glow; }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = o.stroke || C.line;
    ctx.lineWidth = o.lw || 2;
    ctx.stroke();
    if (o.dot) {
      ctx.fillStyle = o.dot;
      ctx.beginPath(); ctx.arc(-w / 2 + pad + size * 0.25, 0, size * 0.25, 0, TAU); ctx.fill();
    }
    text(str, -w / 2 + pad + dot, 1, size, o.color || C.text, 'left', o.weight || 700, o.family || 'Inter', o.spacing ?? 1);
    ctx.restore();
    return w;
  }

  // mint call-to-action button; o.press 0..1 squashes it, o.icon: 'download' | 'play'
  function button(str, cx, cy, w, h, e = 1, o = {}) {
    if (e <= 0) return;
    const s = clamp(easeOutBack(clamp(e), 2), 0, 1.2) * (1 - 0.07 * (o.press || 0));
    const size = o.size || h * 0.4;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
    const fill = o.disabled ? '#2a313b' : (o.fill || C.mint);
    ctx.shadowColor = o.disabled ? 'transparent' : (o.glowColor || MINT(0.55));
    ctx.shadowBlur = o.glow ?? 40;
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.shadowBlur = 0;
    if (!o.disabled) {
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, 'rgba(255,255,255,0.28)');
      g.addColorStop(0.5, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fill();
    }
    const ink = o.disabled ? '#6b7684' : (o.ink || C.ink);
    const tw = width(str, size, 800, 'Baloo 2');
    const iw = o.icon ? size * 1.1 : 0;
    const x0 = -(tw + iw) / 2;
    if (o.icon) icon(o.icon, x0 + size * 0.4, 0, size * 0.85, ink);
    text(str, x0 + iw, size * 0.08, size, ink, 'left', 800, 'Baloo 2');
    ctx.restore();
  }

  function icon(name, cx, cy, s, col) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = s * 0.14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (name === 'download') {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.45); ctx.lineTo(0, s * 0.18);
      ctx.moveTo(-s * 0.28, -s * 0.08); ctx.lineTo(0, s * 0.2); ctx.lineTo(s * 0.28, -s * 0.08);
      ctx.moveTo(-s * 0.42, s * 0.42); ctx.lineTo(s * 0.42, s * 0.42);
      ctx.stroke();
    } else if (name === 'play') {
      ctx.beginPath();
      ctx.moveTo(-s * 0.28, -s * 0.38); ctx.lineTo(s * 0.4, 0); ctx.lineTo(-s * 0.28, s * 0.38);
      ctx.closePath(); ctx.fill();
    } else if (name === 'check') {
      ctx.beginPath();
      ctx.moveTo(-s * 0.32, 0); ctx.lineTo(-s * 0.08, s * 0.24); ctx.lineTo(s * 0.36, -s * 0.26);
      ctx.stroke();
    } else if (name === 'cross') {
      ctx.beginPath();
      ctx.moveTo(-s * 0.28, -s * 0.28); ctx.lineTo(s * 0.28, s * 0.28);
      ctx.moveTo(s * 0.28, -s * 0.28); ctx.lineTo(-s * 0.28, s * 0.28);
      ctx.stroke();
    } else if (name === 'link') {
      ctx.lineWidth = s * 0.12;
      [[-0.18, -0.18], [0.18, 0.18]].forEach(([dx, dy]) => {
        ctx.save();
        ctx.translate(dx * s, dy * s);
        ctx.rotate(-Math.PI / 4);
        ctx.beginPath(); ctx.roundRect(-s * 0.32, -s * 0.15, s * 0.64, s * 0.3, s * 0.15); ctx.stroke();
        ctx.restore();
      });
    } else if (name === 'gear') {
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const r = i % 2 ? s * 0.34 : s * 0.46;
        const a = i / 16 * TAU;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.15, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // round badge with a check or cross
  function badge(kind, cx, cy, s, e = 1) {
    if (e <= 0) return;
    const sc = clamp(easeOutBack(clamp(e), 2.4), 0, 1.3);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, TAU);
    ctx.fillStyle = kind === 'check' ? C.mint : C.red;
    ctx.shadowColor = kind === 'check' ? MINT(0.7) : 'rgba(255,92,108,0.6)';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;
    icon(kind, 0, 0, s * 0.8, kind === 'check' ? C.ink : '#fff');
    ctx.restore();
  }

  function spinner(cx, cy, r, t, col = C.mint) {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = r * 0.28;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, r, t * 9, t * 9 + 4.2); ctx.stroke();
    ctx.restore();
  }

  // vector arrow cursor (tip at x, y)
  function cursor(x, y, s = 1, press = 0) {
    const k = 1.9 * s * (1 - 0.12 * press);
    const pts = [[0, 0], [0, 34], [9, 26], [15, 40], [21, 37], [15, 24], [27, 24]];
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px * k, py * k) : ctx.moveTo(px * k, py * k)));
    ctx.closePath();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#0b0e13';
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  // keyframed position: keys = [[t, x, y], ...], eased between keys
  function path(t, keys) {
    if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2] };
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [t0, x0, y0] = keys[i - 1], [t1, x1, y1] = keys[i];
        const e = easeInOutCubic((t - t0) / (t1 - t0));
        return { x: lerp(x0, x1, e), y: lerp(y0, y1, e) };
      }
    }
    const k = keys[keys.length - 1];
    return { x: k[1], y: k[2] };
  }

  function ripple(cx, cy, lt, col = MINT, max = 160) {
    if (lt < 0 || lt > 0.6) return;
    const p = lt / 0.6;
    ctx.save();
    ctx.strokeStyle = col(0.9 * (1 - p));
    ctx.lineWidth = 6 * (1 - p) + 1;
    ctx.beginPath(); ctx.arc(cx, cy, 20 + easeOutCubic(p) * max, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  // pixel burst in the logo colours
  const BURST = Array.from({ length: 70 }, (_, i) => ({
    a: hash(i * 3.1) * TAU, v: 500 + hash(i * 7.7) * 1100, s: 8 + (i % 3) * 5,
    c: [C.mint, C.gold, C.sky, '#ffffff', C.cyan][i % 5],
  }));
  function burst(cx, cy, lt, dur = 1.4, scale = 1) {
    if (lt < 0 || lt > dur) return;
    BURST.forEach((p) => {
      const d = p.v * scale * (1 - Math.exp(-lt * 3)) / 3;
      ctx.globalAlpha = 1 - lt / dur;
      ctx.fillStyle = p.c;
      ctx.fillRect(cx + Math.cos(p.a) * d - p.s / 2, cy + Math.sin(p.a) * d - p.s / 2 + lt * lt * 160, p.s, p.s);
    });
    ctx.globalAlpha = 1;
  }

  function shockwave(cx, cy, lt, col = 'rgba(94,234,212,A)', max = 1200) {
    if (lt < 0 || lt > 0.8) return;
    ctx.save();
    ctx.strokeStyle = col.replace('A', String(1 - lt / 0.8));
    ctx.lineWidth = lerp(30, 2, lt / 0.8);
    ctx.beginPath(); ctx.arc(cx, cy, easeOutCubic(lt / 0.8) * max, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  // rotating soft beams behind the logo
  function beams(cx, cy, t, alpha, n = 12) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.25);
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1100);
      g.addColorStop(0, (i % 2 ? CYAN : MINT)(0.22 * alpha));
      g.addColorStop(1, CYAN(0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1100, a, a + TAU / n / 2.2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // logo + wordmark side by side, centred on cx
  function lockup(cx, cy, size, e = 1) {
    if (e <= 0) return;
    const ts = size * 0.62;
    const tw = width('Soul Launcher', ts, 800, 'Baloo 2');
    const total = size + size * 0.28 + tw;
    const x0 = cx - total / 2;
    ctx.save();
    ctx.globalAlpha *= clamp(e * 2);
    const s = lerp(0.85, 1, easeOutBack(clamp(e), 2));
    ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
    logo(x0 + size / 2, cy, size);
    title([{ t: 'Soul ' }, { t: 'Launcher', c: 'mint' }], x0 + size * 1.28, cy, ts, 1, { align: 'left' });
    ctx.restore();
  }

  // ---------- download end card ----------
  const CLICK = 1.85;
  const CHIPS = [['FREE', C.mint], ['OPEN SOURCE', C.sky], ['WINDOWS', C.gold]];
  function endCard(t, t0, o = {}) {
    if (t < t0) return;
    const lt = t - t0;
    drawBg(t, { mint: 1.4 });
    const ly = o.top ? 640 : 580;
    beams(540, ly, t, prog(lt, 0.6, 1.2));
    embers(t, 34, 4, prog(lt, 0, 0.6));
    soulFire(120, 1600, 11, 18, 12, t, 1, 0.8 * prog(lt, 0.4, 1));
    soulFire(960, 1600, 11, 18, 12, t + 0.3, 2, 0.8 * prog(lt, 0.4, 1));
    if (o.top) o.top.forEach((parts, i) => title(parts, 540, 245 + i * 100, 88, appear(t, t0 + 0.15 + i * 0.12)));
    // logo assembles, then locks in with a flash, shockwave and burst
    const as = prog(lt, 0, 0.7);
    const lock = lt - 0.7;
    const pulse = lock > 0 ? 1 + 0.12 * Math.exp(-lock * 9) + 0.015 * Math.sin(lock * 2.6) : 1;
    logo(540, ly, 290 * pulse, { assemble: as, glow: prog(lt, 0.5, 0.9) });
    shockwave(540, ly, lock);
    burst(540, ly, lock);
    if (lock > 0 && lock < 0.25) {
      ctx.fillStyle = `rgba(150,255,240,${0.28 * Math.pow(1 - lock / 0.25, 2)})`;
      ctx.fillRect(0, 0, W, H);
    }
    title([{ t: 'Soul ' }, { t: 'Launcher', c: 'mint' }], 540, ly + 250, 124, appear(t, t0 + 0.75, 0.35), { slam: true });
    pill('v1.0.0-beta  ·  OUT NOW', 540, ly + 360, prog(lt, 0.95, 1.3), { size: 28, dot: C.mint, stroke: MINT(0.5), color: C.mint });
    title([{ t: 'Minecraft, ' }, { t: 'minus the chores.', c: 'mint' }], 540, ly + 455, 60, appear(t, t0 + 1.1, 0.4));
    // the download button gets clicked
    const by = ly + 600;
    const press = lt > CLICK ? Math.exp(-(lt - CLICK) * 10) : 0;
    const glow = 40 + (lt > CLICK + 0.2 ? 18 * Math.sin((lt - CLICK) * 5) : 0);
    if (lt > CLICK) burst(540, by, lt - CLICK, 1.0, 0.45);
    button('Download free', 540, by, 660, 140, prog(lt, 1.3, 1.65), { icon: 'download', press, glow, size: 58 });
    ripple(540, by, lt - CLICK, MINT, 300);
    const cp = path(lt, [[1.35, 1010, 1700], [CLICK - 0.08, 700, by + 30], [CLICK + 0.6, 700, by + 30], [CLICK + 1.3, 1150, by + 400]]);
    if (lt > 1.35 && lt < CLICK + 1.3) cursor(cp.x, cp.y, 1, press);
    const ue = appear(t, t0 + 1.55, 0.35);
    if (ue > 0) {
      ctx.save();
      ctx.globalAlpha *= ue;
      text(REPO, 540, by + 120 + (1 - ue) * 16, 34, C.dim, 'center', 500, 'JetBrains Mono');
      ctx.restore();
    }
    const ws = CHIPS.map(([s]) => width(s, 24, 700, 'Inter', 3) + 82);
    let x = 540 - (ws.reduce((a, b) => a + b, 0) + 20 * (ws.length - 1)) / 2;
    CHIPS.forEach(([s, col], i) => {
      pill(s, x + ws[i] / 2, by + 215, prog(lt, 2.1 + i * 0.12, 2.45 + i * 0.12), { size: 24, dot: col, spacing: 3, pad: 24 });
      x += ws[i] + 20;
    });
  }

  function endCardEvents(t0) {
    const ev = [
      { type: 'whoosh', t: t0 + 0.1 },
      { type: 'sparkle', t: t0 + 0.05, note: 84 },
      { type: 'impact', t: t0 + 0.7 },
      { type: 'pop', t: t0 + 0.78, note: 72 },
      { type: 'pop', t: t0 + 0.98, note: 76 },
      { type: 'pop', t: t0 + 1.13, note: 79 },
      { type: 'pop', t: t0 + 1.33, note: 84 },
      { type: 'swipe', t: t0 + 1.6 },
      { type: 'cta_click', t: t0 + CLICK },
    ];
    CHIPS.forEach((_, i) => ev.push({ type: 'ding', t: t0 + 2.12 + i * 0.12, note: 88 + [0, 4, 7][i] }));
    return ev;
  }

  function start(def) {
    const fonts = ['800 40px "Baloo 2"', '700 40px "Baloo 2"', '500 40px "Inter"', '600 40px "Inter"',
      '700 40px "Inter"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"'];
    Promise.all(fonts.map((f) => document.fonts.load(f))).then(() => M.start({
      ...def,
      setup() { buildBg(); buildLogo(); if (def.setup) def.setup(); },
    }));
  }

  window.SOUL = {
    C, MINT, CYAN, BLUE, REPO, drawBg, blob, soulFire, embers, logo, lockup, title, text, width, kicker,
    card, pill, button, icon, badge, spinner, cursor, path, ripple, burst, shockwave, beams,
    endCard, endCardEvents, start, FILLS, gradFill,
  };
})();
