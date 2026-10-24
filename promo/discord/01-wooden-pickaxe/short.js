// Video 1 — "Wooden Pickaxe": mining for a good server with a wooden pickaxe is slow and
// finds nothing; the Mine Radar upgrade shatters the wall and reveals diamond-ore game modes.
// 18s, 1080x1920.
(() => {
  'use strict';
  const M = MR;
  const { ctx, W, H, TAU, COL, NEON } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInCubic, easeInOutCubic } = M;

  const DUR = 18;
  const T = 120, COLS = 9, ROWS = 16;
  const SNAP = 6.25, UPGRADE = 6.85, STRIKE = 7.9, LOVE = 9.9, END = 12.8;
  const YEL = '#ffe14d';

  // wooden-pickaxe phase: which block, first hit, number of hits, spacing, what it drops
  const MINE = [
    { c: 4, r: 9, t0: 0.35, n: 8, dt: 0.26, drop: 'cobble' },
    { c: 3, r: 9, t0: 2.65, n: 8, dt: 0.24, drop: 'gravel' },
    { c: 4, r: 8, t0: 4.65, n: 4, dt: 0.085, drop: 'dirt' },
    { c: 5, r: 9, t0: 5.05, n: 4, dt: 0.085, drop: 'cobble' },
    { c: 3, r: 8, t0: 5.45, n: 4, dt: 0.085, drop: 'cobble' },
    { c: 4, r: 10, t0: 5.85, n: 4, dt: 0.085, drop: 'dirt' },
  ];
  MINE.forEach((m) => {
    m.hits = Array.from({ length: m.n }, (_, i) => m.t0 + i * m.dt);
    m.brk = m.hits[m.n - 1] + 0.02;
    m.x = m.c * T + T / 2; m.y = m.r * T + T / 2;
  });
  const HITS = MINE.flatMap((m, mi) => m.hits.map((h, k) => ({ t: h, m: mi, k })));
  const DROP_NAME = { cobble: 'Cobblestone', gravel: 'Gravel', dirt: 'Dirt' };
  const DROP_TEX = { cobble: 'cobble', gravel: 'gravel', dirt: 'dirt' };
  const SLOT_OF = { cobble: 1, gravel: 2, dirt: 3 };

  const CAPTIONS = [
    { t0: 0.0, t1: 2.3, lines: [[{ t: 'Searching for a good server' }], [{ t: 'with a wooden pickaxe:', c: YEL }]] },
    { t0: 2.3, t1: 4.6, lines: [[{ t: 'hour 1:' }], [{ t: 'still nothing.', c: '#ff6b6b' }]] },
    { t0: 4.6, t1: SNAP, lines: [[{ t: 'hour 9:' }], [{ t: 'STILL nothing.', c: '#ff6b6b' }]] },
    { t0: SNAP, t1: UPGRADE, lines: [[{ t: '(it broke.)' }]] },
  ];

  const ORES = [
    ['SURVIVAL', 270, 860, '#5fd12a'], ['SKYBLOCK', 810, 800, '#5cc8ff'], ['MINIGAMES', 540, 1110, '#ffd23a'],
    ['SMP', 250, 1370, '#a8ff2e'], ['PVP', 830, 1350, '#ff5d4d'], ['SOMETHING NEW', 540, 1610, '#ff8fd0'],
  ];
  const ORE_T = 8.45;

  let wall, back, pickWood, pickNeon, crackPix;
  const NO_PICK = document.createElement('canvas');
  const blockTex = (c, r) => {
    const m = MINE.find((x) => x.c === c && x.r === r);
    if (m) return m.drop === 'cobble' ? 'stone' : m.drop;
    const h = hash(c * 17.3 + r * 7.1);
    if (h < 0.07) return 'ore_coal';
    if (h < 0.11) return 'ore_iron';
    if (h < 0.2) return 'gravel';
    if (h < 0.3) return 'dirt';
    return 'stone';
  };

  function makePickaxe(head, light, outline, stick, stickDark) {
    const cells = new Map();
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x + 0.5 - 4, y + 0.5 - 12);
      const a = Math.atan2(y + 0.5 - 12, x + 0.5 - 4) * 180 / Math.PI;
      if (d >= 8.4 && d <= 10.6 && a >= -100 && a <= 4) cells.set(`${x},${y}`, d < 9.4 ? light : head);
    }
    for (let x = 1; x <= 10; x++) {
      cells.set(`${x},${15 - x}`, stick);
      if (x < 10) cells.set(`${x + 1},${15 - x}`, stickDark);
    }
    const c = document.createElement('canvas');
    c.width = 18; c.height = 18;
    const g = c.getContext('2d');
    // mirrored so the handle sits bottom-right; 1px margin for the outline
    const put = (x, y, col) => { g.fillStyle = col; g.fillRect(16 - x, y + 1, 1, 1); };
    cells.forEach((_, key) => {
      const [x, y] = key.split(',').map(Number);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        if (!cells.has(`${x + dx},${y + dy}`)) put(x + dx, y + dy, outline);
      });
    });
    cells.forEach((col, key) => { const [x, y] = key.split(',').map(Number); put(x, y, col); });
    return c;
  }

  function setup() {
    // coal ore isn't in the shared set; derive it from stone
    const coal = document.createElement('canvas');
    coal.width = coal.height = 16;
    const cg = coal.getContext('2d');
    cg.drawImage(M.TEX.stone, 0, 0);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (hash(Math.floor(x / 2) * 31 + Math.floor(y / 2) * 7 + 99) < 0.2) { cg.fillStyle = hash(x + y * 3) < 0.5 ? '#1e1e1e' : '#2e2e2e'; cg.fillRect(x, y, 1, 1); }
    }
    M.TEX.ore_coal = coal;
    wall = M.blockWorld(COLS, ROWS, T, blockTex);
    back = document.createElement('canvas');
    back.width = W; back.height = H;
    const b = back.getContext('2d');
    b.imageSmoothingEnabled = false;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) b.drawImage(M.TEX.stone, c * T, r * T, T, T);
    b.fillStyle = 'rgba(0,0,0,0.72)';
    b.fillRect(0, 0, W, H);
    pickWood = makePickaxe('#8f6a3a', '#b9905a', '#22160a', '#7a5530', '#5a3d1e');
    pickNeon = makePickaxe('#2ee6d6', '#b8fff7', '#033a34', '#7a5530', '#5a3d1e');
    // crack pixels ordered from the centre outwards along random walks
    crackPix = [];
    for (let w = 0; w < 6; w++) {
      let x = 7 + (w % 2), y = 7 + (w > 2 ? 1 : 0);
      for (let s = 0; s < 9; s++) {
        crackPix.push([x, y]);
        const a = hash(w * 13 + s * 7) * TAU + w;
        x = clamp(Math.round(x + Math.cos(a) * 1.4), 0, 15);
        y = clamp(Math.round(y + Math.sin(a) * 1.4), 0, 15);
      }
    }
  }

  // ---------- pickaxe swing ----------
  const PX = 18;
  const PIVOT = [14 * PX + PX, 14.8 * PX + PX];   // handle end in sprite px (18px sprite, mirrored)
  const TIP = [1.4 * PX + PX, 12.7 * PX + PX];
  const RAISE = 0.75, STRIKE_A = -0.18;
  const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  const tipVec = [TIP[0] - PIVOT[0], TIP[1] - PIVOT[1]];
  function pivotFor(tx, ty) {
    const v = rot(tipVec, STRIKE_A);
    return [tx + T / 2 - 10 - v[0], ty + 14 - v[1]];
  }

  function swingAngle(t, hits) {
    let ang = RAISE;
    for (let i = 0; i < hits.length; i++) {
      const h = hits[i], prev = i ? hits[i - 1] : h - 0.4;
      const gap = Math.min(h - prev, 0.4);
      const down = Math.min(0.16, gap * 0.6), up = gap * 0.4;
      if (t >= h - down && t < h) return lerp(RAISE, STRIKE_A, easeInCubic(prog(t, h - down, h)));
      const next = hits[i + 1] ?? h + 0.4;
      if (t >= h && t < Math.min(h + up + 0.1, next - Math.min(0.16, (next - h) * 0.6))) {
        return lerp(STRIKE_A, RAISE, easeOutCubic(prog(t, h, h + Math.max(up, 0.08))));
      }
    }
    return ang;
  }

  function drawPick(img, px, py, ang, glow = 0) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    // first-person arm holding the handle
    ctx.save();
    ctx.rotate(0.75);
    ctx.fillStyle = '#c9925f';
    ctx.fillRect(-40, -66, 300, 132);
    ctx.fillStyle = '#b07d4f';
    ctx.fillRect(-40, 30, 300, 36);
    ctx.fillStyle = '#d9a571';
    ctx.fillRect(-40, -66, 300, 20);
    ctx.fillStyle = '#2f9fd9';
    ctx.fillRect(250, -72, 520, 144);
    ctx.fillStyle = '#2580b3';
    ctx.fillRect(250, 34, 520, 38);
    ctx.fillStyle = '#5ab6e6';
    ctx.fillRect(250, -72, 520, 20);
    ctx.restore();
    if (glow) { ctx.shadowColor = '#5decf5'; ctx.shadowBlur = glow; }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -PIVOT[0], -PIVOT[1], 18 * PX, 18 * PX);
    ctx.restore();
  }

  // ---------- pieces ----------
  function crack(x, y, stage) {
    const n = Math.floor(crackPix.length * stage / 9);
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    const p = T / 16;
    for (let i = 0; i < n; i++) ctx.fillRect(x - T / 2 + crackPix[i][0] * p, y - T / 2 + crackPix[i][1] * p, p, p);
  }

  function chunks(x, y, t0, t, tex, n, power, seed) {
    const lt = t - t0;
    if (lt < 0 || lt > 1.1) return;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (hash(seed + i * 3.3) - 0.5) * 2.6;
      const v = power * (0.5 + hash(seed + i * 7.1));
      const px = x + Math.cos(a) * v * lt + (hash(seed + i) - 0.5) * 40;
      const py = y + Math.sin(a) * v * lt + 1800 * lt * lt;
      const s = 14 + hash(seed + i * 2) * 14;
      ctx.globalAlpha = 1 - prog(lt, 0.6, 1.1);
      ctx.drawImage(M.TEX[tex], Math.floor(hash(seed + i) * 12), Math.floor(hash(seed + i * 5) * 12), 4, 4, px - s / 2, py - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  function mcText(text, x, y, size, color = '#ffffff', align = 'center') {
    ctx.save();
    ctx.font = `400 ${size}px "Pixelify Sans"`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    const d = Math.max(3, Math.round(size / 12));
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillText(text, x + d, y + d);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  const SLOT = 100, HB_Y = 1395;
  const slotX = (i) => 540 - 4.5 * SLOT + i * SLOT + SLOT / 2;
  function hotbar(t, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(20,20,20,0.75)';
    ctx.fillRect(540 - 4.5 * SLOT - 6, HB_Y - SLOT / 2 - 6, 9 * SLOT + 12, SLOT + 12);
    for (let i = 0; i < 9; i++) {
      ctx.strokeStyle = '#8b8b8b';
      ctx.lineWidth = 4;
      ctx.strokeRect(slotX(i) - SLOT / 2 + 4, HB_Y - SLOT / 2 + 4, SLOT - 8, SLOT - 8);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(slotX(0) - SLOT / 2, HB_Y - SLOT / 2, SLOT, SLOT);
    if (t < SNAP) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(pickWood, slotX(0) - 40, HB_Y - 40, 80, 80);
      const used = HITS.filter((h) => h.t <= t).length / HITS.length;
      const w = 70 * (1 - used);
      ctx.fillStyle = '#000';
      ctx.fillRect(slotX(0) - 36, HB_Y + 32, 72, 8);
      ctx.fillStyle = used < 0.5 ? '#3fdc3f' : used < 0.8 ? '#e8d23a' : '#ff3b3b';
      ctx.fillRect(slotX(0) - 35, HB_Y + 33, Math.max(w, 2), 5);
    }
    const counts = {};
    MINE.forEach((m) => { if (t >= m.brk + 0.45) counts[m.drop] = (counts[m.drop] || 0) + 1; });
    Object.entries(counts).forEach(([k, n]) => {
      const x = slotX(SLOT_OF[k]);
      M.block(DROP_TEX[k], x - 32, HB_Y - 32, 64);
      mcText(String(n), x + 30, HB_Y + 28, 30, '#ffffff', 'right');
    });
    ctx.restore();
  }

  function drops(t) {
    MINE.forEach((m, i) => {
      const lt = t - m.brk;
      if (lt < 0 || lt > 1.4) return;
      const f = easeInOutCubic(clamp(lt / 0.45));
      const tx = slotX(SLOT_OF[m.drop]), ty = HB_Y;
      const x = lerp(m.x, tx, f), y = lerp(m.y, ty, f) - Math.sin(f * Math.PI) * 120;
      if (lt < 0.45) M.block(DROP_TEX[m.drop], x - 22 + Math.sin(t * 9) * 2, y - 22, 44);
      ctx.save();
      ctx.globalAlpha = 1 - prog(lt, 0.9, 1.4);
      mcText(`+1 ${DROP_NAME[m.drop]}`, m.x, m.y - 90 - lt * 50, 44);
      ctx.restore();
    });
  }

  // ---------- diamond cavern ----------
  function cavern(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#070818');
    g.addColorStop(0.5, '#120a2e');
    g.addColorStop(1, '#05060f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.drawImage(back, 0, 0);
    ctx.restore();
    M.floatingPixels(t, 36, (a) => `rgba(110,240,255,${a})`, 3);
    ORES.forEach(([name, x, y, col], i) => {
      const bob = Math.sin(t * 1.8 + i) * 8;
      const glow = ctx.createRadialGradient(x, y + bob, 0, x, y + bob, 220);
      glow.addColorStop(0, 'rgba(93,236,245,0.45)');
      glow.addColorStop(1, 'rgba(93,236,245,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 220, y + bob - 220, 440, 440);
      ctx.save();
      ctx.shadowColor = '#5decf5';
      ctx.shadowBlur = 40;
      M.block('ore_diamond', x - 80, y + bob - 80, 160);
      ctx.restore();
      for (let k = 0; k < 3; k++) {
        const ph = (t * 1.3 + i * 0.37 + k * 0.33) % 1;
        const sx = x - 70 + hash(i * 9 + k + Math.floor(t * 1.3 + i * 0.37 + k * 0.33)) * 140;
        const sy = y + bob - 70 + hash(i * 5 + k * 3 + Math.floor(t * 1.3 + i * 0.37 + k * 0.33)) * 140;
        const s = Math.sin(ph * Math.PI) * 22;
        ctx.fillStyle = `rgba(255,255,255,${Math.sin(ph * Math.PI)})`;
        ctx.fillRect(sx - s / 2, sy - 2, s, 4);
        ctx.fillRect(sx - 2, sy - s / 2, 4, s);
      }
      M.chip(name, x, y + bob + 128, prog(t, ORE_T + i * 0.12, ORE_T + 0.4 + i * 0.12), col, 22);
    });
    const sw = prog(t, 8.7, 9.8);
    if (sw > 0 && sw < 1) {
      const a = -Math.PI / 2 + TAU * easeInOutCubic(sw);
      const cg = ctx.createConicGradient(a - 1.0, 540, 1150);
      cg.addColorStop(0, NEON(0));
      cg.addColorStop(1.0 / TAU, NEON(0.28));
      cg.addColorStop(1.0 / TAU + 0.0005, NEON(0));
      cg.addColorStop(1, NEON(0));
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.moveTo(540, 1150); ctx.arc(540, 1150, 1500, a - 1.0, a); ctx.closePath(); ctx.fill();
    }
    M.vignette(0.5);
  }

  function flyingWall(t) {
    const ix = 600, iy = 1150;
    ctx.imageSmoothingEnabled = false;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (MINE.some((m) => m.c === c && m.r === r)) continue;
      const cx = c * T + T / 2, cy = r * T + T / 2;
      const dx = cx - ix, dy = cy - iy, d = Math.hypot(dx, dy) || 1;
      const lt = t - (STRIKE + d / 2600);
      if (lt < 0) {
        ctx.drawImage(wall, c * T, r * T, T, T, c * T, r * T, T, T);
        continue;
      }
      if (lt > 1.3) continue;
      const v = 900 + hash(c * 3 + r * 11) * 900;
      const x = cx + dx / d * v * lt;
      const y = cy + dy / d * v * lt - 500 * lt + 2200 * lt * lt;
      const s = T * (1 + 0.5 * lt);
      ctx.save();
      ctx.globalAlpha = 1 - prog(lt, 0.7, 1.3);
      ctx.translate(x, y);
      ctx.rotate((hash(c + r * 9) - 0.5) * 8 * lt);
      ctx.drawImage(wall, c * T, r * T, T, T, -s / 2, -s / 2, s, s);
      ctx.restore();
    }
  }

  // ---------- frame ----------
  function render(t) {
    if (t >= END) {
      M.discordCard(t, END, { top: [[{ t: 'FIND A SERVER' }], [{ t: 'YOU\'LL LOVE.', c: 'accent' }]] });
      M.drawScanlines();
      M.flash(t, END, 0.92, 6);
      return;
    }
    const hit = HITS.filter((h) => h.t <= t).pop();
    let sh = { x: 0, y: 0 };
    if (hit && t - hit.t < 0.08) sh = { x: 4 * Math.sin(t * 300), y: 3 * Math.cos(t * 270) };
    const big = M.shake(t, STRIKE, 34, 0.6);
    ctx.save();
    ctx.translate(sh.x + big.x, sh.y + big.y);
    if (big.x) { ctx.translate(540, 960); ctx.scale(1.05, 1.05); ctx.translate(-540, -960); }

    if (t < STRIKE) {
      ctx.drawImage(wall, 0, 0);
      MINE.forEach((m) => {
        if (t < m.brk) return;
        ctx.drawImage(back, m.c * T, m.r * T, T, T, m.c * T, m.r * T, T, T);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 10;
        ctx.strokeRect(m.c * T + 5, m.r * T + 5, T - 10, T - 10);
      });
      const cur = MINE.find((m) => t >= m.t0 && t < m.brk);
      if (cur) crack(cur.x, cur.y, cur.hits.filter((h) => h <= t).length / cur.n * 9);
    } else {
      cavern(t);
      flyingWall(t);
    }
    ctx.restore();

    if (t < STRIKE) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, 0, W, H);
      // warm torchlight around the dig site
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const fl = 0.16 + 0.03 * Math.sin(t * 17) + 0.02 * Math.sin(t * 29);
      const g = ctx.createRadialGradient(560, 1080, 0, 560, 1080, 620);
      g.addColorStop(0, `rgba(255,170,80,${fl})`);
      g.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      M.vignette(0.6);
    }
    HITS.forEach((h, i) => {
      const m = MINE[h.m];
      chunks(m.x + 40, m.y, h.t, t, m.drop === 'cobble' ? 'stone' : m.drop, 5, 500, i * 11);
    });
    MINE.forEach((m, i) => chunks(m.x, m.y, m.brk, t, m.drop === 'cobble' ? 'stone' : m.drop, 16, 800, i * 31 + 7));
    drops(t);

    // the wooden pickaxe at work
    if (t < SNAP) {
      let target = MINE[0];
      for (const m of MINE) if (t >= m.t0 - 0.2) target = m;
      const prev = MINE[Math.max(0, MINE.indexOf(target) - 1)];
      const mv = easeInOutCubic(prog(t, target.t0 - 0.2, target.t0 - 0.02));
      const p0 = pivotFor(prev.x, prev.y), p1 = pivotFor(target.x, target.y);
      const bob = Math.sin(t * 3) * 6;
      drawPick(pickWood, lerp(p0[0], p1[0], mv), lerp(p0[1], p1[1], mv) + bob, swingAngle(t, HITS.map((h) => h.t)));
    } else if (t < UPGRADE) {
      const lt = t - SNAP;
      const [px, py] = pivotFor(MINE[5].x, MINE[5].y);
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (hash(i * 4.4) - 0.5) * 3;
        const v = 500 + hash(i * 2.2) * 500;
        const x = px - 150 + Math.cos(a) * v * lt, y = py - 60 + Math.sin(a) * v * lt + 2000 * lt * lt;
        ctx.save();
        ctx.globalAlpha = 1 - prog(lt, 0.3, 0.6);
        ctx.translate(x, y);
        ctx.rotate(lt * (hash(i) - 0.5) * 14);
        ctx.drawImage(pickWood, 3 + (i % 3) * 4, 2 + Math.floor(i / 3) * 4, 6, 6, -40, -40, 80, 80);
        ctx.restore();
      }
      ctx.save();
      ctx.translate(0, easeInCubic(clamp(lt / 0.4)) * 600);
      drawPick(NO_PICK, px, py, RAISE + lt * 0.5);
      ctx.restore();
    } else if (t < STRIKE + 0.35) {
      const [px, py] = pivotFor(MINE[0].x, MINE[0].y);
      const enter = easeOutBack(prog(t, UPGRADE, UPGRADE + 0.45), 1.4);
      let ang = RAISE;
      if (t >= 7.35) ang = lerp(RAISE, 1.15, easeOutCubic(prog(t, 7.35, 7.75)));
      if (t >= 7.75) ang = lerp(1.15, STRIKE_A, easeInCubic(prog(t, 7.75, STRIKE)));
      if (t >= STRIKE) ang = STRIKE_A;
      const charge = prog(t, 7.35, STRIKE);
      for (let k = 0; k < 3; k++) {
        const age = ((t - UPGRADE) * 1.6 + k / 3) % 1;
        ctx.strokeStyle = `rgba(93,236,245,${0.5 * (1 - age) * (0.5 + charge)})`;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(px - 120, py - 140, 120 + age * 260, 0, TAU); ctx.stroke();
      }
      ctx.save();
      ctx.globalAlpha = 1 - prog(t, STRIKE + 0.1, STRIKE + 0.35);
      drawPick(pickNeon, px + (1 - enter) * 500, py + (1 - enter) * 500, ang, 30 + 40 * charge);
      ctx.restore();
    }
    if (t >= STRIKE && t < STRIKE + 0.8) {
      const lt = t - STRIKE;
      ctx.save();
      ctx.strokeStyle = `rgba(184,255,247,${1 - lt / 0.8})`;
      ctx.lineWidth = lerp(40, 2, lt / 0.8);
      ctx.shadowColor = '#5decf5';
      ctx.shadowBlur = 40;
      ctx.beginPath(); ctx.arc(600, 1150, easeOutCubic(lt / 0.8) * 1500, 0, TAU); ctx.stroke();
      ctx.restore();
    }

    hotbar(t, 1 - prog(t, SNAP + 0.2, SNAP + 0.5));

    CAPTIONS.forEach((c) => {
      if (t < c.t0 || t >= c.t1) return;
      M.caption(c.lines, 540, 330, 70, c.t0 === 0 ? 1 : appear(t, c.t0, 0.22));
    });
    if (t >= UPGRADE && t < LOVE) {
      ctx.save();
      ctx.globalAlpha = 1 - prog(t, LOVE - 0.25, LOVE);
      M.headline([{ t: 'UPGRADE' }], 540, 300, 120, appear(t, UPGRADE + 0.05, 0.18), 980, { slam: true });
      M.headline([{ t: 'YOUR SEARCH.', c: 'accent' }], 540, 430, 120, appear(t, UPGRADE + 0.25, 0.18), 980, { slam: true });
      ctx.restore();
    }
    if (t >= LOVE) {
      M.headline([{ t: 'MINE RADAR', c: 'accent' }], 540, 330, 140, appear(t, LOVE, 0.2), 980, { slam: true });
      M.caption([[{ t: 'Survival, Skyblock, minigames' }], [{ t: 'or something completely different.' }]], 540, 520, 50, appear(t, LOVE + 0.35, 0.3));
    }
    M.drawScanlines();
    M.flash(t, UPGRADE, 0.85, 7);
    M.flash(t, STRIKE, 0.95, 5, '210,255,250');
  }

  function events() {
    const ev = [];
    HITS.forEach((h, i) => ev.push({ type: 'dig', t: h.t, k: i, gain: MINE[h.m].dt < 0.1 ? 0.7 : 1 }));
    MINE.forEach((m) => { ev.push({ type: 'break', t: m.brk }); ev.push({ type: 'pickup', t: m.brk + 0.45 }); });
    ev.push({ type: 'snap', t: SNAP });
    ev.push({ type: 'whoosh', t: UPGRADE });
    ev.push({ type: 'hit', t: UPGRADE + 0.05 });
    ev.push({ type: 'hit', t: UPGRADE + 0.25 });
    ev.push({ type: 'charge', t: 7.35, end: STRIKE });
    ev.push({ type: 'impact', t: STRIKE });
    for (let i = 0; i < 10; i++) ev.push({ type: 'break', t: STRIKE + 0.04 + i * 0.05, gain: 0.5 });
    ORES.forEach((_, i) => ev.push({ type: 'sparkle', t: ORE_T + i * 0.12 + 0.1, note: 84 + [0, 2, 4, 7, 9, 12][i] }));
    ev.push({ type: 'ping', t: 8.7, note: 96 });
    ev.push({ type: 'hit', t: LOVE });
    ev.push({ type: 'riser', t: END - 0.9, end: END });
    ev.push(...M.discordCardEvents(END));
    return ev.sort((a, b) => a.t - b.t);
  }

  M.start({ duration: DUR, cover: 0.9, setup, render, events });
})();
