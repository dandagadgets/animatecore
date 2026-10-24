// Shared toolkit for the Mine Radar shorts (1080x1920): easing, text styles,
// procedural block textures, a player sprite, the radar, and the branded end card.
// Each short calls MR.start({ duration, cover, setup, render, events }).
(() => {
  'use strict';

  const W = 1080, H = 1920, FPS = 30;
  const ASSETS = new URL('assets/', document.currentScript.src).href;
  const canvas = document.getElementById('ad');
  const ctx = canvas.getContext('2d');

  // ---------- math ----------
  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
  const easeInCubic = (x) => x * x * x;
  const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOutBack = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const appear = (t, t0, d = 0.45) => easeOutCubic(prog(t, t0, t0 + d));
  // visible between t0 and t1 with fades at both ends
  const window_ = (t, t0, t1, fin = 0.25, fout = 0.25) => Math.min(prog(t, t0, t0 + fin), 1 - prog(t, t1 - fout, t1));

  // accepts '#rrggbb' or 'rgb(r,g,b)' so mixed colours can be mixed again
  function rgb(col) {
    if (col.startsWith('rgb')) return col.match(/[\d.]+/g).slice(0, 3).map(Number);
    const n = parseInt(col.slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  function shade(hex, amt) {
    const f = (c) => clamp(Math.round(c + amt * 255), 0, 255);
    const [r, g, b] = rgb(hex);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }
  function mixColor(a, b, t) {
    const A = rgb(a), B = rgb(b);
    return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`;
  }

  // ---------- palette ----------
  const COL = {
    neon: '#39ff14', lime: '#a8ff2e', white: '#f3f7ef', ink: '#041004',
    shadow: '#0f3a06', panel: 'rgba(5, 16, 6, 0.92)', red: '#ff4d4d', yellow: '#ffe14d',
  };
  const NEON = (a) => `rgba(57,255,20,${a})`;
  const LIME = (a) => `rgba(168,255,46,${a})`;
  const MINT = (a) => `rgba(214,255,200,${a})`;

  // ---------- text ----------
  function accentFill(y, size) {
    const g = ctx.createLinearGradient(0, y - size * 0.42, 0, y + size * 0.42);
    g.addColorStop(0, '#f2ff4d');
    g.addColorStop(0.5, '#a8ff2e');
    g.addColorStop(1, '#3fd10f');
    return g;
  }

  // Blocky brand headline: drop shadow + dark outline + fill, like the logo lettering.
  // parts: [{ t, c }] where c is 'accent', a CSS colour, or undefined (white).
  function headline(parts, x, y, size, e = 1, maxW = 960, opts = {}) {
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
    ctx.globalAlpha *= clamp(e * 2);
    if (opts.slam) {
      const s = lerp(1.6, 1, e);
      ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-x, -y);
    } else {
      y += (1 - e) * 34;
    }
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    let cx = x - total / 2;
    parts.forEach((p, i) => {
      const d = size * 0.07;
      ctx.fillStyle = opts.shadow || COL.shadow;
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
        ctx.fillStyle = p.c || COL.white;
        ctx.fillText(p.t, cx, y);
      }
      cx += widths[i];
    });
    ctx.restore();
  }

  // Social-style caption: heavy sans, white with a thick black outline, pops in.
  // lines: [[{ t, c }...], ...]
  function caption(lines, x, y, size, e = 1, opts = {}) {
    if (e <= 0) return;
    ctx.save();
    ctx.font = `900 ${size}px "Inter"`;
    const maxW = opts.maxW || 940;
    const measure = () => lines.map((parts) => parts.map((p) => ctx.measureText(p.t).width));
    let widths = measure();
    const widest = Math.max(...widths.map((ws) => ws.reduce((a, b) => a + b, 0)));
    if (widest > maxW) {
      size = Math.floor(size * maxW / widest);
      ctx.font = `900 ${size}px "Inter"`;
      widths = measure();
    }
    const lh = size * 1.18;
    const s = opts.noPop ? 1 : lerp(0.8, 1, easeOutBack(clamp(e), 2.2));
    ctx.globalAlpha *= clamp(e * 3);
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (opts.rotate) ctx.rotate(opts.rotate);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    lines.forEach((parts, li) => {
      const total = widths[li].reduce((a, b) => a + b, 0);
      let cx = -total / 2;
      const ly = (li - (lines.length - 1) / 2) * lh;
      parts.forEach((p, i) => {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = size * 0.2;
        ctx.strokeText(p.t, cx, ly);
        ctx.fillStyle = p.c || '#ffffff';
        ctx.fillText(p.t, cx, ly);
        cx += widths[li][i];
      });
    });
    ctx.restore();
  }

  function label(text, x, y, size, color, align = 'left', spacing = 3, weight = 400, family = 'Silkscreen') {
    ctx.save();
    ctx.font = `${weight} ${size}px "${family}"`;
    ctx.letterSpacing = `${spacing}px`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function textWidth(text, font, spacing = 0) {
    ctx.save();
    ctx.font = font;
    ctx.letterSpacing = `${spacing}px`;
    const w = ctx.measureText(text).width;
    ctx.restore();
    return w;
  }

  function bodyText(text, x, y, size, e = 1, color = MINT(0.8)) {
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

  // ---------- shapes ----------
  function pixelSquare(x, y, s, color, glow = 0) {
    ctx.save();
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.round(s), Math.round(s));
    ctx.restore();
  }

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
    ctx.shadowColor = opts.glowColor || NEON(0.7);
    ctx.shadowBlur = opts.glow ?? 16;
    ctx.strokeStyle = opts.stroke || COL.neon;
    ctx.lineWidth = opts.line || 3;
    ctx.stroke();
    ctx.restore();
  }

  function chip(text, cx, cy, e, color, size = 24) {
    if (e <= 0) return;
    const tw = textWidth(text, `700 ${size}px "Silkscreen"`, 2);
    const w = tw + 86, h = size * 2.4;
    const sx = clamp(easeOutBack(clamp(e), 2.0), 0, 1.2);
    ctx.save();
    panel(cx - w * sx / 2, cy - h / 2, w * sx, h, 6);
    if (e > 0.6) {
      ctx.globalAlpha *= prog(e, 0.6, 1);
      const ix = cx - w / 2 + 30;
      pixelSquare(ix, cy, size * 0.8, color, 12);
      label(text, ix + 22, cy + 1, size, COL.white, 'left', 2, 700);
    }
    ctx.restore();
  }

  // ---------- backgrounds ----------
  let brandBg, scanLayer;

  function buildBackgrounds() {
    brandBg = document.createElement('canvas');
    brandBg.width = W; brandBg.height = H;
    const b = brandBg.getContext('2d');
    b.fillStyle = '#030703';
    b.fillRect(0, 0, W, H);
    const cell = 40;
    for (let y = 0; y < H / cell; y++) {
      for (let x = 0; x < W / cell; x++) {
        const g = 12 + Math.floor(hash(x * 31.7 + y * 97.3) * 14);
        b.fillStyle = `rgb(${Math.floor(g * 0.45)},${g},${Math.floor(g * 0.5)})`;
        b.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    const glow = b.createRadialGradient(540, 900, 0, 540, 900, 900);
    glow.addColorStop(0, NEON(0.08));
    glow.addColorStop(1, NEON(0));
    b.fillStyle = glow;
    b.fillRect(0, 0, W, H);
    const vig = b.createRadialGradient(540, 960, 500, 540, 960, 1250);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.8)');
    b.fillStyle = vig;
    b.fillRect(0, 0, W, H);

    scanLayer = document.createElement('canvas');
    scanLayer.width = W; scanLayer.height = H;
    const s = scanLayer.getContext('2d');
    s.fillStyle = 'rgba(0,0,0,0.13)';
    for (let y = 0; y < H; y += 4) s.fillRect(0, y, W, 2);
  }

  const drawBrandBg = () => ctx.drawImage(brandBg, 0, 0);
  const drawScanlines = () => ctx.drawImage(scanLayer, 0, 0);

  function vignette(strength = 0.6, color = '0,0,0') {
    const g = ctx.createRadialGradient(540, 960, 450, 540, 960, 1200);
    g.addColorStop(0, `rgba(${color},0)`);
    g.addColorStop(1, `rgba(${color},${strength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function skyGradient(stops) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    stops.forEach(([p, c]) => g.addColorStop(p, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function floatingPixels(t, n = 30, color = LIME, seed = 0) {
    for (let i = 0; i < n; i++) {
      const k = i + seed * 100;
      const sp = 18 + hash(k + 3) * 40;
      const x = hash(k) * W + Math.sin(t * 0.7 + i) * 14;
      const y = ((hash(k + 50) * (H + 80) - t * sp) % (H + 80) + H + 80) % (H + 80) - 40;
      const s = 4 + Math.floor(hash(k + 9) * 3) * 2;
      pixelSquare(x, y, s, color(0.12 + 0.25 * hash(k + 21)));
    }
  }

  // ---------- block textures (16x16, drawn with smoothing off) ----------
  const TEX = {};
  const WOOL = {
    red: '#c8302c', orange: '#ef7d1a', yellow: '#f4c82a', lime: '#73c21b', green: '#4d7a1c',
    cyan: '#169c9c', lightblue: '#3aaed8', blue: '#35399d', purple: '#7a2aad', magenta: '#bd44b3',
    pink: '#ee8dac', white: '#e9ecec', black: '#1c1c20',
  };

  function makeTex(name, paint) {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const g = c.getContext('2d');
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    paint(px, g);
    TEX[name] = c;
  }

  function noiseTex(name, colors, seed) {
    makeTex(name, (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        px(x, y, colors[Math.floor(hash(seed + x * 17 + y * 131) * colors.length)]);
      }
    });
  }

  function buildTextures() {
    const greens = ['#5fbf2a', '#4ea823', '#6fd23a', '#58b326'];
    const dirts = ['#8b5a2b', '#7a4c22', '#9c6a35', '#6b4220'];
    const stones = ['#8a8a8a', '#7d7d7d', '#959595', '#727272', '#888888'];
    noiseTex('dirt', dirts, 1);
    noiseTex('stone', stones, 2);
    noiseTex('sand', ['#dbcf8e', '#d1c482', '#e3d89a', '#cbbd78'], 3);
    noiseTex('gravel', ['#8c8580', '#7a736f', '#9c958f', '#6b6460', '#a8a29c'], 4);
    noiseTex('leaves', ['#2f7d1a', '#3b9122', '#26681a', '#468f2a', '#1d5214'], 5);
    noiseTex('obsidian', ['#140e1f', '#1d1330', '#25193d', '#0f0a17'], 6);
    noiseTex('netherrack', ['#6e2424', '#7d2c2c', '#5e1d1d', '#8a3434'], 7);
    makeTex('grass', (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const h = hash(x * 17 + y * 131 + 9);
        const drip = y === 3 && hash(x + 77) < 0.5 || y === 4 && hash(x + 91) < 0.2;
        px(x, y, y < 3 || drip ? greens[Math.floor(h * 4)] : dirts[Math.floor(h * 4)]);
      }
    });
    makeTex('cobble', (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const ox = (Math.floor(y / 4) % 2) * 2;
        const cell = hash(Math.floor((x + ox) / 5) * 7 + Math.floor(y / 4) * 13);
        const edge = (x + ox) % 5 === 0 || y % 4 === 0;
        const base = ['#7b7b7b', '#8f8f8f', '#6c6c6c', '#9a9a9a'][Math.floor(cell * 4)];
        px(x, y, edge ? '#4f4f4f' : shade(base, (hash(x * 3 + y * 7) - 0.5) * 0.08));
      }
    });
    const brickTex = (name, a, b, mortar) => makeTex(name, (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const row = Math.floor(y / 4);
        const ox = (row % 2) * 4;
        const isMortar = y % 4 === 3 || (x + ox) % 8 === 7;
        px(x, y, isMortar ? mortar : (hash(Math.floor((x + ox) / 8) + row * 5) < 0.5 ? a : b));
      }
    });
    brickTex('stonebrick', '#7f7f7f', '#767676', '#585858');
    brickTex('brick', '#9b4a3a', '#8a3f31', '#c9b8a8');
    makeTex('planks', (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const board = Math.floor(y / 4);
        const seam = y % 4 === 3 || (x === (board * 5 + 3) % 16);
        const base = ['#a8824e', '#9c7744', '#b38c57', '#a07a47'][board];
        px(x, y, seam ? '#6e5230' : shade(base, (hash(x * 5 + y * 3) - 0.5) * 0.06));
      }
    });
    makeTex('log', (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const streak = hash(x * 13) < 0.35;
        px(x, y, streak ? '#4a3318' : ['#6b4b25', '#5d4120', '#76532a'][Math.floor(hash(x * 7 + y * 29) * 3)]);
      }
    });
    makeTex('water', (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const wave = (x + y * 2) % 7 === 0;
        px(x, y, wave ? '#5a8cff' : ['#2f5fd0', '#3366dd', '#2b57c2'][Math.floor(hash(x * 3 + y * 11) * 3)]);
      }
    });
    makeTex('glass', (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const frame = x === 0 || y === 0 || x === 15 || y === 15;
        const shine = (x - y === 4 || x - y === 6) && x > 2 && x < 13;
        px(x, y, frame ? '#d8f0f4' : shine ? 'rgba(255,255,255,0.7)' : 'rgba(170,220,235,0.25)');
      }
    });
    makeTex('litwindow', (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const frame = x === 0 || y === 0 || x === 15 || y === 15 || x === 7 || x === 8 || y === 7;
        px(x, y, frame ? '#5d4120' : ['#ffd36b', '#ffc94d', '#ffe08a'][Math.floor(hash(x + y * 16) * 3)]);
      }
    });
    makeTex('lantern', (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        let c = null;
        if (x >= 4 && x <= 11 && y >= 3 && y <= 14) c = (x === 4 || x === 11 || y === 3 || y === 14) ? '#2e2e36' : (hash(x * 9 + y) < 0.5 ? '#ffb43b' : '#ffd86b');
        if (x >= 6 && x <= 9 && y < 3) c = '#2e2e36';
        if (c) px(x, y, c);
      }
    });
    const TNT_ROWS = ['.###..#..#.###.', '..#...##.#..#..', '..#...#.##..#..', '..#...#..#..#..'];
    makeTex('tnt', (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        let c = (x % 4 === 0) ? '#a8241c' : '#d63a2c';
        if (y >= 5 && y <= 10) c = '#e8e2d6';
        if (y >= 6 && y <= 9 && TNT_ROWS[y - 6][x] === '#') c = '#222';
        px(x, y, c);
      }
    });
    makeTex('chest', (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        let c = ['#a4702f', '#9a6a2c', '#b07a35'][Math.floor(hash(x * 7 + y * 3) * 3)];
        if (x === 0 || x === 15 || y === 0 || y === 15 || y === 6) c = '#3d2a12';
        if (x >= 7 && x <= 8 && y >= 5 && y <= 8) c = '#c9c9c9';
        px(x, y, c);
      }
    });
    const ore = (name, color) => makeTex(name, (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const spot = hash(Math.floor(x / 2) * 31 + Math.floor(y / 2) * 7 + name.length * 13) < 0.22;
        px(x, y, spot ? shade(color, (hash(x + y * 5) - 0.5) * 0.2) : stones[Math.floor(hash(x * 17 + y * 131 + 2) * 5)]);
      }
    });
    ore('ore_iron', '#d8af93');
    ore('ore_gold', '#fcee4b');
    ore('ore_diamond', '#5decf5');
    ore('ore_emerald', '#17dd62');
    Object.entries(WOOL).forEach(([k, c]) => makeTex(`wool_${k}`, (px) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, shade(c, (hash(x * 7 + y * 13 + k.length) - 0.5) * 0.09));
    }));
  }

  function block(name, x, y, size = 64) {
    const tex = TEX[name];
    if (!tex) return;
    ctx.drawImage(tex, Math.round(x), Math.round(y), size, size);
  }

  // Paints a grid of blocks into an offscreen canvas once; fn(col, row) -> texture name | null.
  function blockWorld(cols, rows, size, fn) {
    const c = document.createElement('canvas');
    c.width = cols * size; c.height = rows * size;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
      const name = fn(col, r);
      if (name && TEX[name]) g.drawImage(TEX[name], col * size, r * size, size, size);
    }
    return c;
  }

  // ---------- player sprite (front view, 16x32 px) ----------
  const PLAYERS = [
    { skin: '#f1c27d', hair: '#3b2416', shirt: '#2f9fd9', pants: '#2b3a8c' },
    { skin: '#c68642', hair: '#1a1a1a', shirt: '#d94a3a', pants: '#2d2d2d' },
    { skin: '#ffdbac', hair: '#e8c547', shirt: '#4caf50', pants: '#5a3d22' },
    { skin: '#8d5524', hair: '#2b1a10', shirt: '#9b59b6', pants: '#2b3a8c' },
    { skin: '#f6d5b8', hair: '#b5502b', shirt: '#f39c12', pants: '#3b3b3b' },
    { skin: '#e0ac69', hair: '#5a3a22', shirt: '#16a085', pants: '#1f2a44' },
    { skin: '#ffe0bd', hair: '#222831', shirt: '#e84393', pants: '#2d2d2d' },
    { skin: '#d9a066', hair: '#f5f5f5', shirt: '#f1c40f', pants: '#34495e' },
    { skin: '#a86b3c', hair: '#120c08', shirt: '#ecf0f1', pants: '#7f1d1d' },
  ];

  function drawPlayer(x, y, px, p, seed = 0) {
    // x, y = feet centre
    const x0 = Math.round(x - 8 * px), y0 = Math.round(y - 32 * px);
    const put = (c, r, col) => {
      ctx.fillStyle = shade(col, (hash(seed * 31 + c * 7 + r * 13) - 0.5) * 0.1);
      ctx.fillRect(x0 + c * px, y0 + r * px, px, px);
    };
    for (let r = 0; r < 32; r++) for (let c = 0; c < 16; c++) {
      let col = null;
      if (r < 8 && c >= 4 && c < 12) {
        col = p.skin;
        if (r < 2 || (r === 2 && (c === 4 || c === 11))) col = p.hair;
        if (r === 4 && (c === 5 || c === 10)) col = '#ffffff';
        if (r === 4 && (c === 6 || c === 9)) col = '#3a3ad0';
        if (r === 6 && (c === 7 || c === 8)) col = shade(p.skin, -0.25);
      } else if (r >= 8 && r < 20) {
        if (c >= 4 && c < 12) col = p.shirt;
        else if (c < 4 || c >= 12) col = r < 12 ? shade(p.shirt, -0.08) : p.skin;
      } else if (r >= 20 && c >= 4 && c < 12) {
        col = r >= 29 ? '#3a3a3a' : p.pants;
        if (c === 7 || c === 8) col = shade(col, -0.12);
      }
      if (col) put(c, r, col);
    }
  }

  // ---------- radar ----------
  function makeBlips(list, a0, period) {
    const omega = TAU / period;
    return list.map(([angle, rf]) => {
      let th = ((((angle - a0) % TAU) + TAU) % TAU) / omega;
      if (th < 0.35) th += period;
      return { angle, rf, hit0: th };
    });
  }

  function radar(t, o) {
    const { cx, cy, R } = o;
    const alpha = o.alpha ?? 1;
    if (alpha <= 0.002) return;
    const a0 = o.a0 ?? -Math.PI / 2;
    const period = o.period ?? 2;
    const lt = t - (o.t0 ?? 0);
    const draw = o.draw ?? easeOutCubic(prog(lt, 0, 0.8));
    ctx.save();
    ctx.globalAlpha *= alpha;
    const disc = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    disc.addColorStop(0, NEON(0.14));
    disc.addColorStop(0.7, NEON(0.05));
    disc.addColorStop(1, NEON(0.03));
    ctx.fillStyle = disc;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
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
    const a = a0 + TAU * lt / period;
    const wedge = 1.15;
    ctx.save();
    ctx.globalAlpha *= prog(lt, 0.1, 0.5);
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
    (o.blips || []).forEach((b) => {
      if (lt < b.hit0) return;
      const age = (lt - b.hit0) % period;
      const x = cx + Math.cos(b.angle) * R * b.rf, y = cy + Math.sin(b.angle) * R * b.rf;
      const I = 0.3 + 0.7 * Math.exp(-age * 1.6);
      const pop = 1 + 0.7 * (1 - prog(lt, b.hit0, b.hit0 + 0.25));
      pixelSquare(x, y, 16 * pop, LIME(I), 18 * I);
      if (age < 0.8) {
        const r = 10 + age * 55;
        ctx.strokeStyle = LIME(0.8 * (1 - age / 0.8));
        ctx.lineWidth = 3;
        ctx.strokeRect(x - r, y - r, 2 * r, 2 * r);
      }
    });
    pixelSquare(cx, cy, 14 + R * 0.02, COL.lime, 22);
    ctx.restore();
  }

  // ---------- effects ----------
  function flash(t, t0, strength = 0.92, decay = 6, color = '220,255,200') {
    if (t < t0) return;
    const a = strength * Math.exp(-(t - t0) * decay);
    if (a < 0.005) return;
    ctx.fillStyle = `rgba(${color},${a})`;
    ctx.fillRect(0, 0, W, H);
  }

  function shake(t, t0, amp = 16, dur = 0.45) {
    if (t < t0 || t > t0 + dur) return { x: 0, y: 0 };
    const s = amp * Math.pow(1 - (t - t0) / dur, 2);
    return { x: s * Math.sin(t * 97), y: s * Math.cos(t * 131) };
  }

  // ---------- branded end card ----------
  let LOGO = null;
  const BURST = Array.from({ length: 80 }, (_, i) => ({
    a: hash(i * 3.1) * TAU,
    v: 420 + hash(i * 7.7) * 1000,
    s: 6 + Math.floor(hash(i * 1.9) * 4) * 3,
    c: ['#39ff14', '#a8ff2e', '#e4ff3a', '#f3f7ef'][i % 4],
  }));

  // logo slam with glow, sweeping beam, pulse rings, shockwave and pixel burst
  function logoReveal(t, lt, lx, ly, size) {
    const gl = ctx.createRadialGradient(lx, ly, 0, lx, ly, size * 0.85);
    gl.addColorStop(0, NEON(0.3 * prog(lt, 0, 0.4)));
    gl.addColorStop(1, NEON(0));
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, W, H);

    const ba = 0.2 * prog(lt, 0.3, 0.9);
    if (ba > 0) {
      const a = -Math.PI / 2 + lt * 1.9;
      const cg = ctx.createConicGradient(a - 1.3, lx, ly);
      cg.addColorStop(0, NEON(0));
      cg.addColorStop(1.3 / TAU, NEON(ba));
      cg.addColorStop(1.3 / TAU + 0.0005, NEON(0));
      cg.addColorStop(1, NEON(0));
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.arc(lx, ly, size * 0.8, a - 1.3, a); ctx.closePath(); ctx.fill();
    }
    for (let k = 0; k < 6; k++) {
      const age = lt - k * 1.0;
      if (age < 0 || age > 2.0) continue;
      ctx.save();
      ctx.strokeStyle = NEON(0.45 * Math.pow(1 - age / 2, 1.5));
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(lx, ly, size * 0.48 + age * 280, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    if (lt < 0.8) {
      ctx.save();
      ctx.strokeStyle = LIME(1 - lt / 0.8);
      ctx.lineWidth = lerp(34, 2, lt / 0.8);
      ctx.shadowColor = COL.neon;
      ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(lx, ly, easeOutCubic(lt / 0.8) * 1200, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    if (lt < 1.8) {
      BURST.forEach((p) => {
        const d = p.v * (1 - Math.exp(-lt * 3)) / 3;
        pixelSquare(lx + Math.cos(p.a) * d, ly + Math.sin(p.a) * d, p.s, p.c, 10 * (1 - lt / 1.8));
      });
    }
    if (LOGO) {
      const le = prog(lt, 0, 0.65);
      const sc = lerp(0.25, 1, easeOutBack(le, 1.5)) * (1 + 0.012 * Math.sin(Math.max(0, lt - 0.65) * 2.4));
      ctx.save();
      ctx.globalAlpha = prog(lt, 0, 0.15);
      ctx.translate(lx, ly);
      ctx.rotate((1 - easeOutCubic(le)) * -0.35);
      ctx.scale(sc, sc);
      ctx.shadowColor = NEON(0.6);
      ctx.shadowBlur = 50;
      // the art's circle sits slightly up-left of the image centre
      ctx.drawImage(LOGO, -size * 315.5 / 640, -size * 310.5 / 640, size, size);
      ctx.restore();
    }
  }

  // o.top: optional headline lines above the logo, e.g. [[{t:'BUILT FOR'}], [{t:'SERVER OWNERS', c:'accent'}]]
  function endCard(t, t0, o = {}) {
    if (t < t0) return;
    const lt = t - t0;
    drawBrandBg();
    floatingPixels(t, 24);
    const lx = 540, ly = o.top ? 880 : 820, size = 640;

    logoReveal(t, lt, lx, ly, size);
    if (o.top) {
      o.top.forEach((parts, i) => headline(parts, 540, 300 + i * 112, 96, appear(t, t0 + 0.5 + i * 0.12)));
    }
    const tagY = ly + size / 2 + 95;
    const words = [{ t: 'FIND ' }, { t: 'YOUR ' }, { t: 'NEXT ' }, { t: 'WORLD.', c: 'accent' }];
    const widths = words.map((w) => textWidth(w.t, '700 80px "Pixelify Sans"'));
    const total = widths.reduce((a, b) => a + b, 0);
    let wx = 540 - total / 2;
    words.forEach((w, i) => {
      headline([w], wx + widths[i] / 2, tagY, 80, appear(t, t0 + 0.65 + i * 0.09, 0.4), 2000);
      wx += widths[i];
    });
    const pillY = tagY + 102;
    const pe = prog(lt, 1.3, 1.75);
    if (pe > 0) {
      const pw = textWidth('WEBSITE COMING SOON', '700 26px "Silkscreen"', 3) + 96;
      const w = pw * clamp(easeOutBack(pe, 1.8), 0, 1.1);
      panel(540 - w / 2, pillY - 33, w, 66, 6, { glow: 18 });
      const ta = prog(lt, 1.55, 1.8);
      if (ta > 0) {
        ctx.save();
        ctx.globalAlpha = ta;
        const x0 = 540 - pw / 2;
        if (Math.floor(t * 2) % 2 === 0 || lt < 2) pixelSquare(x0 + 36, pillY, 15, COL.neon, 14);
        label('WEBSITE COMING SOON', x0 + 60, pillY + 1, 26, COL.white, 'left', 3, 700);
        ctx.restore();
      }
    }
    ctx.save();
    ctx.globalAlpha = appear(t, t0 + 1.75, 0.5);
    label(o.footer || 'JOIN THE COMMUNITY ON DISCORD', 540, pillY + 72, 22, MINT(0.65), 'center', 3);
    ctx.restore();
  }


  // ---------- "join the Discord" end card ----------
  const BLURPLE = '#5865F2';
  const CTA_CHIPS = [['UPDATES', '#5cc8ff'], ['EVENTS', '#ffd23a'], ['GIVEAWAYS', '#ff5d9e'], ['SNEAK PEEKS', '#a8ff2e']];
  const CLICK_AT = 1.6;

  function chatBubbleIcon(x, y, p, color) {
    const rows = ['.########.', '##########', '##.##.##.#', '##########', '.########.', '...##.....', '..##......'];
    ctx.fillStyle = color;
    rows.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === '#') ctx.fillRect(x + c * p, y + r * p, p, p);
    }));
    ctx.fillStyle = BLURPLE;
    [[2, 2], [5, 2], [8, 2]].forEach(([c, r]) => ctx.fillRect(x + c * p, y + r * p, p, p));
  }

  function cursorSprite(x, y, s) {
    const map = ['X.........', 'XX........', 'XWX.......', 'XWWX......', 'XWWWX.....', 'XWWWWX....', 'XWWWWWX...',
      'XWWWWWWX..', 'XWWWWWWWX.', 'XWWWWXXXXX', 'XWWXWX....', 'XWX.XWX...', 'XX..XWX...', 'X....XWX..', '.....XX...'];
    map.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === '.') return;
      ctx.fillStyle = ch === 'X' ? '#000' : '#fff';
      ctx.fillRect(x + c * s, y + r * s, s, s);
    }));
  }

  // o.top: optional headline lines above the logo
  function discordCard(t, t0, o = {}) {
    if (t < t0) return;
    const lt = t - t0;
    drawBrandBg();
    floatingPixels(t, 24);
    const ly = o.top ? 700 : 620;
    logoReveal(t, lt, 540, ly, 500);
    if (o.top) o.top.forEach((parts, i) => headline(parts, 540, 250 + i * 104, 88, appear(t, t0 + 0.3 + i * 0.1)));
    const hy = ly + 370;
    headline([{ t: 'JOIN THE' }], 540, hy, 100, appear(t, t0 + 0.45, 0.2), 980, { slam: true });
    headline([{ t: 'DISCORD NOW', c: 'accent' }], 540, hy + 115, 128, appear(t, t0 + 0.6, 0.2), 980, { slam: true });

    const by = hy + 270;
    const be = prog(lt, 0.95, 1.3);
    if (be > 0) {
      const press = lt >= CLICK_AT && lt < CLICK_AT + 0.12 ? 0.92 : 1;
      const pulse = lt > CLICK_AT + 0.12 ? 1 + 0.03 * Math.sin((lt - CLICK_AT) * 6) : 1;
      const s = clamp(easeOutBack(be, 2.2), 0, 1.2) * press * pulse;
      for (let k = 0; k < 3; k++) {
        const age = lt - CLICK_AT - k * 0.18;
        if (age < 0 || age > 0.9) continue;
        const g = age / 0.9;
        ctx.save();
        ctx.strokeStyle = `rgba(150,160,255,${0.8 * (1 - g)})`;
        ctx.lineWidth = lerp(10, 2, g);
        pixelRectPath(540 - 330 - g * 160, by - 62 - g * 90, 660 + g * 320, 124 + g * 180, 10);
        ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.translate(540, by);
      ctx.scale(s, s);
      ctx.shadowColor = 'rgba(88,101,242,0.95)';
      ctx.shadowBlur = 36 + 14 * Math.sin(lt * 5);
      pixelRectPath(-330, -62, 660, 124, 10);
      ctx.fillStyle = BLURPLE;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#b8beff';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(-318, -52, 636, 14);
      chatBubbleIcon(-268, -26, 7, '#ffffff');
      label('JOIN THE DISCORD', -170, 3, 38, '#ffffff', 'left', 3, 700);
      ctx.restore();
      if (lt > CLICK_AT && lt < CLICK_AT + 1.0) {
        const st = lt - CLICK_AT;
        for (let i = 0; i < 26; i++) {
          const a = hash(i * 4.1) * TAU, d = (140 + hash(i * 2.7) * 360) * easeOutCubic(Math.min(st / 0.6, 1));
          pixelSquare(540 + Math.cos(a) * d, by + Math.sin(a) * d * 0.6, 10, ['#ffffff', '#b8beff', '#a8ff2e'][i % 3], 12 * (1 - st));
        }
      }
    }
    if (lt > 1.05 && lt < 2.4) {
      const mv = easeOutCubic(prog(lt, 1.05, CLICK_AT - 0.05));
      const cx = lerp(980, 600, mv), cy = lerp(by + 420, by + 10, mv);
      ctx.save();
      ctx.globalAlpha = 1 - prog(lt, 2.0, 2.4);
      cursorSprite(cx, cy, lt >= CLICK_AT && lt < CLICK_AT + 0.12 ? 5 : 6);
      ctx.restore();
    }

    const cy = by + 128;
    const widths = CTA_CHIPS.map(([txt]) => textWidth(txt, '700 20px "Silkscreen"', 2) + 70);
    const total = widths.reduce((a, b) => a + b, 0) + 12 * (CTA_CHIPS.length - 1);
    let x = 540 - total / 2;
    CTA_CHIPS.forEach(([txt, col], i) => {
      chip(txt, x + widths[i] / 2, cy, prog(lt, 1.85 + i * 0.1, 2.2 + i * 0.1), col, 20);
      x += widths[i] + 12;
    });
    ctx.save();
    ctx.globalAlpha = appear(t, t0 + 2.4, 0.4);
    label(o.footer || 'WEBSITE COMING SOON - LINK IN BIO', 540, cy + 80, 22, MINT(0.7), 'center', 3);
    ctx.restore();
  }

  // sound cues for discordCard, to merge into a short's cue sheet
  function discordCardEvents(t0) {
    const ev = [{ type: 'impact', t: t0 }, { type: 'pop', t: t0 + 0.47, note: 88 }, { type: 'pop', t: t0 + 0.62, note: 93 },
      { type: 'pop', t: t0 + 1.0, note: 84 }, { type: 'cta_click', t: t0 + CLICK_AT }];
    CTA_CHIPS.forEach((_, i) => ev.push({ type: 'pop', t: t0 + 1.9 + i * 0.1, note: 96 + [0, 2, 4, 7][i] }));
    return ev;
  }

  // ---------- pixel sprites ----------
  // rows: array of strings; palette: { char: colour }. '.' is transparent.
  function sprite(rows, palette) {
    const c = document.createElement('canvas');
    c.width = rows[0].length; c.height = rows.length;
    const g = c.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (palette[ch]) { g.fillStyle = palette[ch]; g.fillRect(x, y, 1, 1); }
    }));
    return c;
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

  async function start(def) {
    const [img] = await Promise.all([
      loadImage(`${ASSETS}logo.png`),
      ...['700 40px "Pixelify Sans"', '400 40px "Pixelify Sans"', '400 40px "Silkscreen"',
        '700 40px "Silkscreen"', '800 40px "Inter"', '900 40px "Inter"'].map((f) => document.fonts.load(f)),
    ]);
    LOGO = img;
    buildBackgrounds();
    buildTextures();
    ctx.imageSmoothingEnabled = false;
    if (def.setup) def.setup();
    const render = (t) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      if (def.transparent) {
        ctx.clearRect(0, 0, W, H);
      } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
      }
      ctx.shadowBlur = 0;
      ctx.imageSmoothingEnabled = false;
      def.render(t);
    };
    window.SHORT = {
      FPS, DURATION: def.duration, COVER: def.cover ?? def.duration - 1,
      events: def.events || (() => []),
      frame(t) { render(t); return canvas.toDataURL('image/png').split(',')[1]; },
    };
    window.AD_READY = true;
    if (new URLSearchParams(location.search).has('render')) return;
    const t0 = performance.now();
    const loop = (now) => {
      const t = ((now - t0) / 1000) % (def.duration + 1.5);
      render(Math.min(t, def.duration));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  window.MR = {
    W, H, FPS, ctx, canvas, TAU, COL, NEON, LIME, MINT, TEX, WOOL, PLAYERS,
    clamp, lerp, prog, hash, shade, mixColor, appear, window: window_,
    easeOutCubic, easeInCubic, easeInOutCubic, easeOutBack,
    headline, caption, label, bodyText, textWidth, accentFill,
    pixelSquare, pixelRectPath, panel, chip,
    drawBrandBg, drawScanlines, vignette, skyGradient, floatingPixels,
    block, blockWorld, drawPlayer, makeBlips, radar, flash, shake, endCard, start,
    logoReveal, discordCard, discordCardEvents, sprite, cursorSprite, BLURPLE,
    getLogo: () => LOGO,
  };
})();
