// Video 2 — "Loot Reel": a chest unlocks into a case-opening reel of game modes that ticks
// down and lands on a legendary card: your next favourite server. 17s, 1080x1920.
(() => {
  'use strict';
  const M = MR;
  const { ctx, W, H, TAU, COL, NEON } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInCubic, easeInOutCubic } = M;

  const DUR = 17;
  const TAP = 0.8, OPEN = 1.7, SPIN0 = 2.3, SPIN1 = 7.6, WORLD = 9.6, LOVE = 10.8, END = 12.0;
  const PITCH = 300, CW = 280, CH = 380, REEL_Y = 1010;
  const GOLD = '#ffc21a';

  const RARITY = {
    common: { name: 'COMMON', col: '#9aa4ad', bg: ['#2a3036', '#14181c'] },
    rare: { name: 'RARE', col: '#3a8cff', bg: ['#14305e', '#0a1630'] },
    epic: { name: 'EPIC', col: '#b14dff', bg: ['#3a1460', '#1a0a30'] },
    legendary: { name: 'LEGENDARY', col: GOLD, bg: ['#5e3e08', '#2a1a02'] },
  };
  const POOL = [
    ['SURVIVAL', 'grass'], ['SKYBLOCK', 'wool_lightblue'], ['MINIGAMES', 'wool_yellow'], ['SMP', 'planks'],
    ['PVP', 'ore_diamond'], ['FACTIONS', 'tnt'], ['PRISON', 'stonebrick'], ['CREATIVE', 'wool_magenta'],
    ['PARKOUR', 'wool_lime'], ['RPG', 'ore_emerald'], ['ANARCHY', 'obsidian'], ['BEDWARS', 'wool_red'],
  ];
  const K = 44;
  const CARDS = Array.from({ length: K + 4 }, (_, i) => {
    const [name, tex] = POOL[Math.floor(hash(i * 3.7) * POOL.length)];
    const h = hash(i * 9.1);
    return { name, tex, rarity: h < 0.55 ? 'common' : h < 0.85 ? 'rare' : 'epic' };
  });
  Object.assign(CARDS[K - 3], { name: 'CREATIVE', tex: 'wool_magenta', rarity: 'epic' });
  Object.assign(CARDS[K - 2], { name: 'SKYBLOCK', tex: 'wool_lightblue', rarity: 'rare' });
  Object.assign(CARDS[K - 1], { name: 'PVP', tex: 'ore_diamond', rarity: 'epic' });
  Object.assign(CARDS[K], { name: 'YOUR NEXT|FAVORITE SERVER', tex: 'logo', rarity: 'legendary' });
  Object.assign(CARDS[K + 1], { name: 'SMP', tex: 'planks', rarity: 'rare' });
  const D = K * PITCH;

  const reelX = (t) => D * (1 - Math.pow(1 - prog(t, SPIN0, SPIN1), 4));
  // when the marker crosses each card boundary — the reel's ticks
  const TICKS = Array.from({ length: K }, (_, j) => SPIN0 + (1 - Math.pow(1 - (j + 0.5) / K, 0.25)) * (SPIN1 - SPIN0));

  let chestBody, chestLid;

  function setup() {
    const body = [
      'OOOOOOOOOOOOOO',
      'OppPppppppPppO',
      'OPpppppppppPpO',
      'OppppGGGGppppO',
      'OPpppGYYGpppPO',
      'OppppGGGGppppO',
      'OPpppppppppppO',
      'OppPpppppPpppO',
      'OOOOOOOOOOOOOO',
    ];
    const lid = [
      '.OOOOOOOOOOOO.',
      'OppPppppppPppO',
      'OPpppppppppPpO',
      'OppppppppppppO',
      'OddddddddddddO',
      'OOOOOOOOOOOOOO',
    ];
    const pal = { O: '#2b1a08', p: '#a8722e', P: '#8c5c22', G: '#c9c9c9', Y: '#ffe14d', d: '#6e4618' };
    chestBody = M.sprite(body, pal);
    chestLid = M.sprite(lid, pal);
  }

  // ---------- pieces ----------
  function rays(cx, cy, t, alpha, color = '255,210,90', n = 14) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.35);
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1200);
      g.addColorStop(0, `rgba(${color},${0.35 * alpha})`);
      g.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 1200, a, a + TAU / n / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function chest(t) {
    const cx = 540, cy = 1040, px = 30;
    const shakeAmt = t >= TAP && t < OPEN ? 4 + 14 * prog(t, TAP, OPEN) : 0;
    const sx = shakeAmt * Math.sin(t * 70), rot = shakeAmt * 0.004 * Math.sin(t * 53);
    const open = prog(t, OPEN, OPEN + 0.35);
    const idle = t < TAP ? Math.sin(t * 4) * 6 : 0;
    ctx.save();
    ctx.translate(cx + sx, cy + idle);
    ctx.rotate(rot);
    ctx.imageSmoothingEnabled = false;
    const bw = 14 * px;
    if (open > 0) {
      const g = ctx.createRadialGradient(0, -40, 0, 0, -40, 380);
      g.addColorStop(0, `rgba(255,230,140,${0.9 * open})`);
      g.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-400, -440, 800, 800);
    }
    ctx.drawImage(chestBody, -bw / 2, -40, bw, 9 * px);
    if (t >= TAP && t < OPEN) {
      ctx.fillStyle = `rgba(255,225,77,${0.4 + 0.4 * Math.sin(t * 30)})`;
      ctx.fillRect(-bw / 2 + px, -40 - 3, bw - 2 * px, 6);
    }
    ctx.save();
    const lift = easeOutBack(open, 2) * 120;
    ctx.translate(0, -40 - lift);
    ctx.rotate(-0.5 * easeOutCubic(open));
    ctx.drawImage(chestLid, -bw / 2, -6 * px, bw, 6 * px);
    ctx.restore();
    ctx.restore();
    if (t < OPEN) {
      // idle sparkles around the chest
      for (let k = 0; k < 8; k++) {
        const ph = (t * 0.9 + k / 8) % 1, cyc = Math.floor(t * 0.9 + k / 8);
        const sx = cx - 300 + hash(k * 7 + cyc * 13) * 600, sy = cy - 320 + hash(k * 3 + cyc * 5) * 520;
        const s = Math.sin(ph * Math.PI) * 28;
        ctx.fillStyle = `rgba(255,230,120,${Math.sin(ph * Math.PI)})`;
        ctx.fillRect(sx - s / 2, sy - 2, s, 5);
        ctx.fillRect(sx - 2, sy - s / 2, 5, s);
      }
    }
    if (t < TAP + 0.1) {
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 7);
      M.label('TAP TO OPEN', 540, 1360, 34, '#ffffff', 'center', 6, 700);
      ctx.restore();
    }
  }

  function card(c, x, y, s, t, shine = 0) {
    const R = RARITY[c.rarity];
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const g = ctx.createLinearGradient(0, -CH / 2, 0, CH / 2);
    g.addColorStop(0, R.bg[0]);
    g.addColorStop(1, R.bg[1]);
    M.pixelRectPath(-CW / 2, -CH / 2, CW, CH, 10);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowColor = R.col;
    ctx.shadowBlur = c.rarity === 'legendary' ? 50 : 16;
    ctx.strokeStyle = R.col;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = R.col;
    ctx.fillRect(-CW / 2 + 10, CH / 2 - 18, CW - 20, 8);
    const glow = ctx.createRadialGradient(0, -30, 0, 0, -30, 150);
    glow.addColorStop(0, R.col + '66');
    glow.addColorStop(1, R.col + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(-CW / 2, -CH / 2, CW, CH);
    if (c.tex === 'logo') {
      ctx.drawImage(M.getLogo(), -95, -150, 190, 190);
    } else {
      M.block(c.tex, -64, -110, 128);
    }
    M.label(R.name, 0, -CH / 2 + 32, 18, R.col, 'center', 3, 700);
    const lines = c.name.split('|');
    lines.forEach((ln, i) => M.label(ln, 0, 108 + i * 32 - (lines.length - 1) * 16, lines.length > 1 ? 19 : 28, '#ffffff', 'center', lines.length > 1 ? 1 : 2, 700));
    if (shine > 0) {
      ctx.save();
      M.pixelRectPath(-CW / 2, -CH / 2, CW, CH, 10);
      ctx.clip();
      const sx = lerp(-CW, CW, shine);
      const sg = ctx.createLinearGradient(sx - 60, 0, sx + 60, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.5, 'rgba(255,255,255,0.55)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.rotate(0.3);
      ctx.fillRect(-CW, -CH, CW * 2, CH * 2);
      ctx.restore();
    }
    ctx.restore();
  }

  function reel(t) {
    const x = reelX(t);
    const speed = (reelX(t + 1 / 60) - reelX(t)) * 60;
    const into = easeOutCubic(prog(t, OPEN + 0.3, SPIN0));
    const win = prog(t, SPIN1, SPIN1 + 0.6);
    ctx.save();
    ctx.globalAlpha = into * (1 - win);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, REEL_Y - CH / 2 - 40, W, CH + 80);
    ctx.fillStyle = NEON(0.6);
    ctx.fillRect(0, REEL_Y - CH / 2 - 44, W, 4);
    ctx.fillRect(0, REEL_Y + CH / 2 + 40, W, 4);
    ctx.restore();
    CARDS.forEach((c, i) => {
      const cx = 540 + i * PITCH - x + (1 - into) * 1200;
      if (cx < -CW || cx > W + CW) return;
      const isWin = i === K;
      if (isWin && win > 0) return;
      ctx.save();
      ctx.globalAlpha = into * (isWin ? 1 : 1 - win);
      if (speed > 1500) {
        ctx.globalAlpha *= 0.35;
        card(c, cx + speed * 0.012, REEL_Y, 1, t);
        ctx.globalAlpha /= 0.35;
      }
      const near = 1 - clamp(Math.abs(cx - 540) / PITCH);
      card(c, cx, REEL_Y, 1 + 0.06 * near, t);
      ctx.restore();
    });
    if (into > 0 && win < 1) {
      const lastTick = TICKS.filter((tk) => tk <= t).pop();
      const flash = lastTick ? Math.exp(-(t - lastTick) * 18) : 0;
      ctx.save();
      ctx.globalAlpha = into * (1 - win);
      ctx.shadowColor = COL.neon;
      ctx.shadowBlur = 20 + 30 * flash;
      ctx.fillStyle = flash > 0.3 ? '#ffffff' : COL.lime;
      ctx.fillRect(538, REEL_Y - CH / 2 - 60, 5, CH + 120);
      ctx.beginPath(); ctx.moveTo(518, REEL_Y - CH / 2 - 64); ctx.lineTo(562, REEL_Y - CH / 2 - 64); ctx.lineTo(540, REEL_Y - CH / 2 - 30); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(518, REEL_Y + CH / 2 + 64); ctx.lineTo(562, REEL_Y + CH / 2 + 64); ctx.lineTo(540, REEL_Y + CH / 2 + 30); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  function coins(t, t0) {
    const lt = t - t0;
    if (lt < 0) return;
    for (let i = 0; i < 60; i++) {
      const delay = hash(i * 2.9) * 1.6;
      const ft = lt - delay;
      if (ft < 0 || ft > 2.2) continue;
      const x = hash(i * 7.3) * W + Math.sin(ft * 3 + i) * 30;
      const y = -40 + ft * (700 + hash(i) * 500) + ft * ft * 200;
      const w = 22 * Math.abs(Math.cos(ft * 8 + i));
      ctx.fillStyle = i % 5 === 0 ? '#ffffff' : i % 2 ? GOLD : '#ffe680';
      ctx.fillRect(x - w / 2, y - 11, Math.max(w, 4), 22);
    }
  }

  function render(t) {
    if (t >= END) {
      M.discordCard(t, END, { top: [[{ t: 'YOUR ADVENTURE' }], [{ t: 'STARTS HERE.', c: 'accent' }]] });
      M.drawScanlines();
      M.flash(t, END, 0.92, 6);
      return;
    }
    M.drawBrandBg();
    M.floatingPixels(t, 30);
    const winE = prog(t, SPIN1, SPIN1 + 0.6);
    rays(540, t < SPIN0 ? 1020 : 980, t, Math.max(prog(t, OPEN, OPEN + 0.3) * (1 - prog(t, OPEN + 0.4, SPIN0)), winE), t >= SPIN1 ? '255,200,60' : '255,230,140');
    const sh = M.shake(t, OPEN, 22, 0.4);
    ctx.save();
    ctx.translate(sh.x, sh.y);
    if (t < SPIN0) {
      ctx.save();
      const away = easeInCubic(prog(t, OPEN + 0.3, SPIN0));
      ctx.globalAlpha = 1 - away;
      ctx.translate(0, away * 500);
      chest(t);
      ctx.restore();
    }
    reel(t);
    if (winE > 0) {
      const e = easeOutBack(winE, 1.6);
      const bob = Math.sin((t - SPIN1) * 2.2) * 10;
      const s = lerp(1.06, 1.55, e) * (1 + 0.02 * Math.sin(t * 5));
      card(CARDS[K], 540, lerp(REEL_Y, 1000, e) + bob, s, t, ((t - SPIN1 - 0.3) % 1.6) / 0.8);
    }
    ctx.restore();

    if (t > OPEN && t < OPEN + 1.2) {
      const lt = t - OPEN;
      for (let i = 0; i < 44; i++) {
        const a = -Math.PI / 2 + (hash(i * 3.1) - 0.5) * 2.4;
        const v = 600 + hash(i * 5.7) * 900;
        const x = 540 + Math.cos(a) * v * lt, y = 1000 + Math.sin(a) * v * lt + 1400 * lt * lt;
        M.pixelSquare(x, y, 12 + (i % 3) * 4, ['#ffe14d', '#ff5d9e', '#5cc8ff', '#a8ff2e', '#ffffff'][i % 5], 8);
      }
    }
    coins(t, SPIN1 + 0.1);

    if (t < SPIN1 - 0.3) {
      const out = prog(t, SPIN0 - 0.3, SPIN0);
      ctx.save();
      ctx.globalAlpha = 1 - out;
      M.headline([{ t: 'WHAT WILL YOU' }], 540, 330, 104);
      M.headline([{ t: 'FIND NEXT?', c: 'accent' }], 540, 460, 130);
      ctx.restore();
      if (t >= SPIN0 - 0.3) {
        M.caption([[{ t: 'Survival? Skyblock?' }], [{ t: 'Something completely different?', c: '#ffe14d' }]], 540, 420, 62, appear(t, SPIN0 - 0.1, 0.25));
      }
    }
    if (t >= SPIN1 && t < WORLD) {
      M.headline([{ t: 'LEGENDARY!', c: GOLD }], 540, 420, 150, appear(t, SPIN1 + 0.15, 0.18), 980, { slam: true, shadow: '#4a2e00' });
    }
    if (t >= WORLD && t < LOVE) M.caption([[{ t: 'There\'s a whole world' }], [{ t: 'of servers out there.' }]], 540, 420, 72, appear(t, WORLD, 0.22));
    if (t >= LOVE) M.caption([[{ t: 'We\'ll help you find' }], [{ t: 'one you\'ll love.', c: '#a8ff2e' }]], 540, 420, 72, appear(t, LOVE, 0.22));

    if (t >= 0.35 && t < TAP + 0.3) {
      const mv = easeOutCubic(prog(t, 0.35, TAP - 0.05));
      M.cursorSprite(lerp(940, 600, mv), lerp(1700, 1120, mv), t >= TAP && t < TAP + 0.1 ? 5 : 6);
    }
    M.drawScanlines();
    M.flash(t, OPEN, 0.8, 7, '255,240,190');
    M.flash(t, SPIN1, 0.7, 6, '255,225,140');
  }

  function events() {
    const ev = [{ type: 'uiclick', t: TAP }];
    for (let i = 0; i < 9; i++) ev.push({ type: 'rattle', t: TAP + 0.05 + i * 0.1, gain: 0.4 + i * 0.07 });
    ev.push({ type: 'latch', t: OPEN - 0.05 });
    ev.push({ type: 'open', t: OPEN });
    ev.push({ type: 'whoosh', t: SPIN0 });
    TICKS.forEach((tk, j) => ev.push({ type: 'tick', t: tk, gain: j < 20 ? 0.45 : 0.75 }));
    ev.push({ type: 'win', t: SPIN1 });
    ev.push({ type: 'hit', t: SPIN1 + 0.15 });
    for (let i = 0; i < 14; i++) ev.push({ type: 'coin', t: SPIN1 + 0.2 + hash(i * 2.9) * 1.6 });
    ev.push({ type: 'pop', t: WORLD, note: 88 });
    ev.push({ type: 'pop', t: LOVE, note: 91 });
    ev.push({ type: 'riser', t: END - 0.9, end: END });
    ev.push(...M.discordCardEvents(END));
    return ev.sort((a, b) => a.t - b.t);
  }

  M.start({ duration: DUR, cover: 0.2, setup, render, events });
})();
