// PotSMP brand kit on top of the shorts toolkit (MR): palette, background, twinkles, bats,
// potion-splash transition and the Season IV end card. Ads call POT.start({...}) instead of
// MR.start so the brand images are loaded first.
(() => {
  'use strict';
  const M = MR;
  const { ctx, W, H, TAU } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInCubic } = M;

  const C = {
    pink: '#ff4fa3', pink2: '#ff8fd0', gold: '#ffc93c', gold2: '#ffe17a',
    plum: '#2a0a1e', shadow: '#5a1240', ink: '#1a0614', white: '#fff4fb',
  };
  const PINK = (a) => `rgba(255,79,163,${a})`;
  const GOLD = (a) => `rgba(255,201,60,${a})`;
  const H_OPTS = { outline: C.plum, shadow: C.shadow };
  const IP = 'POTSMP.FUN', PORT = '19132';

  const IMG = {};
  const ASSETS = new URL('assets/', document.currentScript.src).href;
  function load(name, file) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => { IMG[name] = im; res(); };
      im.onerror = rej;
      im.src = ASSETS + file;
    });
  }

  let bg;
  function buildBg() {
    bg = document.createElement('canvas');
    bg.width = W; bg.height = H;
    const b = bg.getContext('2d');
    b.fillStyle = '#12040f';
    b.fillRect(0, 0, W, H);
    const cell = 40;
    for (let y = 0; y < H / cell; y++) for (let x = 0; x < W / cell; x++) {
      const h = hash(x * 31.7 + y * 97.3);
      const g = 14 + Math.floor(h * 14);
      b.fillStyle = `rgb(${g + 8},${Math.floor(g * 0.35)},${g})`;
      b.fillRect(x * cell, y * cell, cell, cell);
    }
    const glow = b.createRadialGradient(540, 900, 0, 540, 900, 950);
    glow.addColorStop(0, PINK(0.16));
    glow.addColorStop(1, PINK(0));
    b.fillStyle = glow;
    b.fillRect(0, 0, W, H);
    const vig = b.createRadialGradient(540, 960, 500, 540, 960, 1250);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.8)');
    b.fillStyle = vig;
    b.fillRect(0, 0, W, H);
  }
  const drawBg = () => ctx.drawImage(bg, 0, 0);

  function twinkles(t, n = 26, seed = 0) {
    for (let i = 0; i < n; i++) {
      const k = i + seed * 50;
      const ph = (t * (0.5 + hash(k) * 0.6) + hash(k * 3)) % 1;
      const cyc = Math.floor(t * (0.5 + hash(k) * 0.6) + hash(k * 3));
      const x = hash(k * 7 + cyc * 13) * W, y = hash(k * 11 + cyc * 5) * H;
      const s = Math.sin(ph * Math.PI) * (16 + hash(k * 2) * 18);
      ctx.fillStyle = i % 3 ? `rgba(255,143,208,${Math.sin(ph * Math.PI)})` : `rgba(255,225,122,${Math.sin(ph * Math.PI)})`;
      ctx.fillRect(x - s / 2, y - 2, s, 4);
      ctx.fillRect(x - 2, y - s / 2, 4, s);
    }
  }

  const BAT = ['..#.....#..', '.###...###.', '#####.#####', '###########', '.#.#####.#.', '....###....'];
  const BAT_UP = ['...........', '#.........#', '##..###..##', '###########', '.#.#####.#.', '....###....'];
  function bats(t, n = 5, seed = 0, alpha = 0.85) {
    for (let i = 0; i < n; i++) {
      const k = i + seed * 10;
      const sp = 140 + hash(k) * 120;
      const x = ((hash(k * 3) * (W + 400) + t * sp * (i % 2 ? 1 : -1)) % (W + 400) + W + 400) % (W + 400) - 200;
      const y = 200 + hash(k * 5) * 1300 + Math.sin(t * 3 + i) * 40;
      const p = 5 + Math.floor(hash(k * 7) * 3);
      const rows = Math.floor(t * 9 + i) % 2 ? BAT : BAT_UP;
      ctx.fillStyle = `rgba(20,4,16,${alpha})`;
      rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') ctx.fillRect(x + c * p, y + r * p, p, p); }));
      ctx.fillStyle = `rgba(255,79,163,${alpha})`;
      ctx.fillRect(x + 4 * p, y + 3 * p, p, p);
      ctx.fillRect(x + 6 * p, y + 3 * p, p, p);
    }
  }

  // potion splash wipe: a pink blob floods the frame, then drains from the centre
  function splash(t, t0, col = C.pink) {
    const lt = t - t0;
    if (lt < 0 || lt > 0.55) return;
    const grow = easeOutCubic(clamp(lt / 0.22));
    const hole = easeInCubic(clamp((lt - 0.24) / 0.3));
    const R = grow * 1300;
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = i / 48 * TAU;
      const r = R * (1 + 0.08 * Math.sin(a * 5 + lt * 9) + 0.05 * Math.sin(a * 9));
      const x = 540 + Math.cos(a) * r, y = 960 + Math.sin(a) * r;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
    if (hole > 0) {
      ctx.moveTo(540 + hole * 1400, 960);
      ctx.arc(540, 960, hole * 1400, 0, TAU, true);
    }
    ctx.fillStyle = col;
    ctx.fill('evenodd');
    ctx.restore();
    for (let i = 0; i < 22; i++) {
      const a = hash(i * 3.3) * TAU, v = 900 + hash(i * 5.1) * 900;
      const d = v * lt;
      const s = 18 + hash(i) * 26;
      ctx.fillStyle = i % 3 ? col : C.gold;
      ctx.globalAlpha = 1 - clamp(lt / 0.55);
      ctx.fillRect(540 + Math.cos(a) * d - s / 2, 960 + Math.sin(a) * d - s / 2 + lt * lt * 900, s, s);
    }
    ctx.globalAlpha = 1;
  }

  function potion(x, y, size, t, rot = 0) {
    const bob = Math.sin(t * 2.4) * 12;
    for (let i = 0; i < 8; i++) {
      const ph = (t * 0.7 + i / 8) % 1;
      const bx = x + Math.sin(i * 2.3 + t) * size * 0.12;
      const by = y - size * 0.45 - ph * size * 0.9 + bob;
      ctx.strokeStyle = `rgba(255,190,230,${0.8 * (1 - ph)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bx, by, 6 + ph * 10, 0, TAU); ctx.stroke();
    }
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(rot + Math.sin(t * 1.7) * 0.06);
    ctx.shadowColor = PINK(0.8);
    ctx.shadowBlur = 40;
    ctx.drawImage(IMG.potion, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  function rays(cx, cy, t, alpha, n = 16) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.3);
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1300);
      g.addColorStop(0, i % 2 ? GOLD(0.3 * alpha) : PINK(0.3 * alpha));
      g.addColorStop(1, PINK(0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1300, a, a + TAU / n / 2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function shine(img, x, y, w, h, p) {
    // diagonal light sweep clipped to the image's own alpha
    if (p <= 0 || p >= 1) return;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w); c.height = Math.ceil(h);
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, w, h);
    g.globalCompositeOperation = 'source-in';
    const sx = lerp(-w * 0.4, w * 1.4, p);
    const lg = g.createLinearGradient(sx - 120, 0, sx + 120, h);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(0.5, 'rgba(255,255,255,0.75)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg;
    g.fillRect(0, 0, w, h);
    ctx.drawImage(c, x, y);
  }

  function ribbon(text, cx, cy, e, fill = C.gold, ink = C.ink, size = 34) {
    if (e <= 0) return;
    const tw = M.textWidth(text, `700 ${size}px "Silkscreen"`, 4) + 80;
    const s = clamp(easeOutBack(clamp(e), 2.2), 0, 1.2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.rotate(-0.03);
    ctx.fillStyle = M.shade(fill, -0.25);
    ctx.fillRect(-tw / 2 - 40, -22, 50, 56);
    ctx.fillRect(tw / 2 - 10, -22, 50, 56);
    M.pixelRectPath(-tw / 2, -size, tw, size * 2, 8);
    ctx.fillStyle = fill;
    ctx.shadowColor = GOLD(0.7);
    ctx.shadowBlur = 24;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = C.plum;
    ctx.lineWidth = 5;
    ctx.stroke();
    M.label(text, 0, 2, size, ink, 'center', 4, 700);
    ctx.restore();
  }

  function downArrow(x, y, t, col = C.white) {
    const b = Math.abs(Math.sin(t * 5)) * 16;
    const rows = ['..###..', '..###..', '..###..', '#######', '.#####.', '..###..', '...#...'];
    ctx.fillStyle = col;
    rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') ctx.fillRect(x - 21 + c * 6, y + b + r * 6, 6, 6); }));
  }

  // ---------- Season IV end card ----------
  function endCard(t, t0, o = {}) {
    if (t < t0) return;
    const lt = t - t0;
    drawBg();
    rays(540, 640, t, prog(lt, 0.1, 0.6));
    twinkles(t, 30);
    bats(t, 4, 3, 0.6);
    // logo slam with shockwave
    const le = prog(lt, 0, 0.55);
    const s = lerp(0.3, 1, easeOutBack(le, 1.6)) * (1 + 0.012 * Math.sin(Math.max(0, lt - 0.6) * 2.4));
    const lw = 720, lh = lw * 567 / 768, ly = o.top ? 660 : 600;
    if (lt < 0.8) {
      ctx.save();
      ctx.strokeStyle = `rgba(255,143,208,${1 - lt / 0.8})`;
      ctx.lineWidth = lerp(36, 2, lt / 0.8);
      ctx.beginPath(); ctx.arc(540, ly, easeOutCubic(lt / 0.8) * 1200, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    potion(880, ly - lh / 2 - 10, 230, t, 0.25);
    ctx.save();
    ctx.globalAlpha = prog(lt, 0, 0.12);
    ctx.translate(540, ly);
    ctx.scale(s, s);
    ctx.shadowColor = PINK(0.7);
    ctx.shadowBlur = 50;
    ctx.drawImage(IMG.stacked, -lw / 2, -lh / 2, lw, lh);
    ctx.shadowBlur = 0;
    shine(IMG.stacked, -lw / 2, -lh / 2, lw, lh, ((lt - 0.7) % 2.2) / 0.8);
    ctx.restore();
    if (lt < 1.6) {
      for (let i = 0; i < 60; i++) {
        const a = hash(i * 3.1) * TAU, v = 400 + hash(i * 7.7) * 900;
        const d = v * (1 - Math.exp(-lt * 3)) / 3;
        M.pixelSquare(540 + Math.cos(a) * d, ly + Math.sin(a) * d, 8 + (i % 3) * 4, [C.pink, C.gold, C.pink2, '#fff'][i % 4], 10 * (1 - lt / 1.6));
      }
    }
    if (o.top) o.top.forEach((parts, i) => M.headline(parts, 540, 200 + i * 100, 84, appear(t, t0 + 0.3 + i * 0.1), 980, H_OPTS));
    const ry = ly + lh / 2 + 60;
    ribbon('SEASON IV', 540, ry, prog(lt, 0.45, 0.8));
    M.headline([{ t: 'OUT NOW', c: 'pink' }], 540, ry + 130, 140, appear(t, t0 + 0.7, 0.18), 980, { ...H_OPTS, slam: true });
    // the server address, front and centre
    const pe = prog(lt, 1.0, 1.35);
    if (pe > 0) {
      const py = ry + 250;
      const w = M.textWidth(`IP: ${IP}`, '700 44px "Silkscreen"', 4) + 100;
      const sc = clamp(easeOutBack(pe, 2), 0, 1.2) * (1 + 0.025 * Math.sin(lt * 6));
      ctx.save();
      ctx.translate(540, py);
      ctx.scale(sc, sc);
      M.pixelRectPath(-w / 2, -50, w, 100, 10);
      ctx.fillStyle = C.pink;
      ctx.shadowColor = PINK(0.9);
      ctx.shadowBlur = 30 + 12 * Math.sin(lt * 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffd1ec';
      ctx.lineWidth = 5;
      ctx.stroke();
      M.label(`IP: ${IP}`, 0, 3, 44, C.white, 'center', 4, 700);
      ctx.restore();
    }
    ribbon(`BEDROCK PORT: ${PORT}`, 540, ry + 352, prog(lt, 1.25, 1.55), C.gold, C.ink, 26);
    const chips = [['JAVA + BEDROCK', C.gold], ['PROXIMITY VOICE CHAT', C.pink2]];
    const widths = chips.map(([txt]) => M.textWidth(txt, '700 22px "Silkscreen"', 2) + 76);
    let x = 540 - (widths[0] + widths[1] + 16) / 2;
    chips.forEach(([txt, col], i) => {
      const e = prog(lt, 1.5 + i * 0.12, 1.85 + i * 0.12);
      if (e > 0) {
        const w = widths[i];
        const sc = clamp(easeOutBack(e, 2), 0, 1.2);
        ctx.save();
        ctx.translate(x + w / 2, ry + 445);
        ctx.scale(sc, 1);
        M.pixelRectPath(-w / 2, -28, w, 56, 6);
        ctx.fillStyle = 'rgba(26,6,20,0.92)';
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.stroke();
        if (e > 0.6) {
          M.pixelSquare(-w / 2 + 28, 0, 14, col, 10);
          M.label(txt, -w / 2 + 46, 1, 22, C.white, 'left', 2, 700);
        }
        ctx.restore();
      }
      x += widths[i] + 16;
    });
  }

  // small always-on server address tag at the top of the frame
  function ipTag(t, alpha = 1) {
    if (alpha <= 0) return;
    const txt = `IP: ${IP}`;
    const w = M.textWidth(txt, '700 32px "Silkscreen"', 3) + 84;
    ctx.save();
    ctx.globalAlpha *= alpha;
    M.pixelRectPath(540 - w / 2, 112, w, 72, 8);
    ctx.fillStyle = 'rgba(26,6,20,0.88)';
    ctx.fill();
    ctx.strokeStyle = C.pink;
    ctx.lineWidth = 3;
    ctx.shadowColor = PINK(0.7);
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;
    M.pixelSquare(540 - w / 2 + 30, 148, 16, Math.floor(t * 2) % 2 ? C.pink2 : C.gold, 10);
    M.label(txt, 540 - w / 2 + 54, 149, 32, C.white, 'left', 3, 700);
    ctx.restore();
  }

  function endCardEvents(t0) {
    return [
      { type: 'impact', t: t0 }, { type: 'sparkle', t: t0 + 0.1, note: 88 },
      { type: 'hit', t: t0 + 0.47, gain: 0.7 }, { type: 'hit', t: t0 + 0.72 },
      { type: 'cta_click', t: t0 + 1.02 }, { type: 'pop', t: t0 + 1.28, note: 91 },
      { type: 'pop', t: t0 + 1.55, note: 88 }, { type: 'pop', t: t0 + 1.67, note: 93 },
    ];
  }

  // ---------- sprites ----------
  const BOSS_ROWS = [
    '......HHHHHHHH......',
    '....HHHHHHHHHHHH....',
    '..HHHHHHHWWHHHHHHH..',
    '.GGGGGGGGGGGGGGGGGG.',
    '....SSSSSSSSSSSS....',
    '....SsSSSSSSSSsS....',
    '....SEESSSSSSEES....',
    '....SSSSSsSsSSSS....',
    '....SSSMMMMMMSSS....',
    '....sSSSSSSSSSSs....',
    '.....kkSSSSSSkk.....',
    '...CCCCCCCCCCCCCC...',
    '..CCCCCCYCCYCCCCCC..',
    '.SCCCCCCCCCCCCCCCCS.',
    '.SCCCCCCYCCYCCCCCCS.',
    '.SSCCCCCCCCCCCCCCSS.',
    '.SS.CCCCYCCYCCCC.SS.',
    '.SS.CCCCCCCCCCCC.SS.',
    '.ss.CCCCCCCCCCCC.ss.',
    '....CkCCCCCCCCkC....',
    '....CCCC.CC.CCCC....',
    '.....DDD....DDD.....',
    '.....DDD....DDD.....',
    '.....DDD....DDD.....',
    '.....DDD....DDD.....',
    '.....sss....sss.....',
  ];
  const BOSS_PAL = { H: '#1b1b26', W: '#e8e8e0', G: '#d9a520', S: '#4fa59a', s: '#3a7f76', E: '#7ffcff', M: '#1d3b37',
    k: '#2f7d3a', C: '#1e2a4a', Y: '#ffd23f', D: '#2a2f3a' };
  let bossImg, chestBody, chestLid;

  function buildSprites() {
    bossImg = M.sprite(BOSS_ROWS, BOSS_PAL);
    const body = ['OOOOOOOOOOOOOO', 'OppPppppppPppO', 'OPpppppppppPpO', 'OppppGGGGppppO', 'OPpppGYYGpppPO',
      'OppppGGGGppppO', 'OPpppppppppppO', 'OppPpppppPpppO', 'OOOOOOOOOOOOOO'];
    const lid = ['.OOOOOOOOOOOO.', 'OppPppppppPppO', 'OPpppppppppPpO', 'OppppppppppppO', 'OddddddddddddO', 'OOOOOOOOOOOOOO'];
    const pal = { O: '#2b1a08', p: '#a8722e', P: '#8c5c22', G: '#c9c9c9', Y: C.gold, d: '#6e4618' };
    chestBody = M.sprite(body, pal);
    chestLid = M.sprite(lid, pal);
  }

  // feet-centre anchored; px = size of one sprite pixel
  function boss(cx, feetY, px, t, o = {}) {
    const w = 20 * px, h = 26 * px;
    const x0 = cx - w / 2, y0 = feetY - h;
    // trident in the right hand
    ctx.fillStyle = '#c99a1e';
    ctx.fillRect(x0 + 18.4 * px, y0 + 2 * px, px * 0.9, 20 * px);
    ctx.fillStyle = C.gold;
    [[17, 1], [18.2, 0], [19.4, 1]].forEach(([c, r]) => ctx.fillRect(x0 + c * px, y0 + r * px, px * 0.9, 3 * px));
    ctx.fillRect(x0 + 17 * px, y0 + 3.6 * px, 3.3 * px, px * 0.8);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bossImg, x0, y0, w, h);
    const glow = o.eyes ?? 1;
    if (glow > 0) {
      ctx.save();
      ctx.shadowColor = '#7ffcff';
      ctx.shadowBlur = 30 * glow;
      ctx.fillStyle = `rgba(160,255,255,${glow})`;
      [[5, 6], [6, 6], [13, 6], [14, 6]].forEach(([c, r]) => ctx.fillRect(x0 + c * px, y0 + r * px, px, px));
      ctx.restore();
    }
  }

  function eyesOnly(cx, cy, px, a) {
    ctx.save();
    ctx.shadowColor = '#7ffcff';
    ctx.shadowBlur = 40 * a;
    ctx.fillStyle = `rgba(160,255,255,${a})`;
    [[-4.5, 0], [-3.5, 0], [3.5, 0], [4.5, 0]].forEach(([c]) => ctx.fillRect(cx + c * px - px / 2, cy - px / 2, px, px));
    ctx.restore();
  }

  function chest(cx, cy, px, open = 0) {
    const bw = 14 * px;
    ctx.imageSmoothingEnabled = false;
    if (open > 0) {
      const g = ctx.createRadialGradient(cx, cy - 40, 0, cx, cy - 40, 12 * px);
      g.addColorStop(0, `rgba(255,220,140,${0.9 * open})`);
      g.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - 14 * px, cy - 14 * px, 28 * px, 28 * px);
    }
    ctx.drawImage(chestBody, cx - bw / 2, cy, bw, 9 * px);
    ctx.save();
    ctx.translate(cx, cy - easeOutBack(open, 2) * 4 * px);
    ctx.rotate(-0.5 * easeOutCubic(open));
    ctx.drawImage(chestLid, -bw / 2, -6 * px, bw, 6 * px);
    ctx.restore();
  }

  function sword(cx, cy, px, angle, blade = '#ff8fd0', edge = '#ffd1ec', glow = 0) {
    const cells = [[14, 1, edge]];
    for (let i = 0; i < 9; i++) {
      const x = 13 - i, y = 2 + i;
      cells.push([x, y, blade], [x - 1, y, edge], [x, y + 1, M.shade(blade, -0.2)]);
    }
    [[2, 9], [3, 10], [4, 11], [5, 12], [6, 13]].forEach(([x, y]) => cells.push([x, y, C.gold]));
    cells.push([3, 12, '#6b3a5a'], [2, 13, '#6b3a5a'], [1, 14, C.gold]);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    if (glow) { ctx.shadowColor = PINK(0.9); ctx.shadowBlur = glow; }
    cells.forEach(([x, y]) => { ctx.fillStyle = '#1a0614'; ctx.fillRect((x - 8) * px - 4, (y - 8) * px - 4, px + 8, px + 8); });
    ctx.shadowBlur = 0;
    cells.forEach(([x, y, c]) => { ctx.fillStyle = c; ctx.fillRect((x - 8) * px, (y - 8) * px, px, px); });
    ctx.restore();
  }

  function lightning(x1, y1, x2, y2, seed, alpha = 1, width = 12) {
    if (alpha <= 0) return;
    const pts = [[x1, y1]];
    const n = 9;
    for (let i = 1; i < n; i++) {
      const f = i / n;
      pts.push([lerp(x1, x2, f) + (hash(seed + i * 3.7) - 0.5) * 160, lerp(y1, y2, f)]);
    }
    pts.push([x2, y2]);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.lineJoin = 'miter';
    [[width * 3, 'rgba(180,200,255,0.35)', 40], [width, '#fff6b8', 30], [width * 0.4, '#ffffff', 0]].forEach(([lw, col, blur]) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.shadowColor = '#d8e4ff';
      ctx.shadowBlur = blur;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    });
    // a couple of branches
    for (let b = 0; b < 2; b++) {
      const [bx, by] = pts[3 + b * 3];
      ctx.lineWidth = width * 0.4;
      ctx.strokeStyle = '#fff6b8';
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + (hash(seed + b) - 0.5) * 300, by + 120 + hash(seed * 2 + b) * 120);
      ctx.stroke();
    }
    ctx.restore();
  }

  function coin(x, y, s, t, k = 0) {
    const w = s * Math.max(0.15, Math.abs(Math.cos(t * 5 + k)));
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(x - w / 2 - 3, y - s / 2 - 3, w + 6, s + 6);
    ctx.fillStyle = C.gold;
    ctx.fillRect(x - w / 2, y - s / 2, w, s);
    ctx.fillStyle = C.gold2;
    ctx.fillRect(x - w / 2 + w * 0.15, y - s / 2 + s * 0.15, w * 0.25, s * 0.5);
  }

  function crown(cx, cy, px) {
    const rows = ['#..#..#..#', '##.###.###', '##########', '#R##B##R##', '##########'];
    rows.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === '.') return;
      ctx.fillStyle = ch === 'R' ? '#ff4d6d' : ch === 'B' ? '#5cc8ff' : C.gold;
      ctx.fillRect(cx - 5 * px + c * px, cy - 2.5 * px + r * px, px, px);
    }));
  }

  function check(cx, cy, s, col = '#5dff7a') {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = s * 0.22;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.4, cy);
    ctx.lineTo(cx - s * 0.1, cy + s * 0.3);
    ctx.lineTo(cx + s * 0.45, cy - s * 0.35);
    ctx.stroke();
    ctx.restore();
  }

  function start(def) {
    Promise.all([load('potion', 'potion.png'), load('stacked', 'logo-stacked.png'), load('wide', 'logo-wide.png')])
      .then(() => M.start({
        ...def,
        setup() { buildBg(); buildSprites(); if (def.setup) def.setup(); },
      }));
  }

  window.POT = {
    C, PINK, GOLD, H_OPTS, IMG, drawBg, twinkles, bats, splash, potion, rays, shine, ribbon, downArrow,
    IP, PORT, ipTag, endCard, endCardEvents, start, boss, eyesOnly, chest, sword, lightning, coin, crown, check,
  };
})();
