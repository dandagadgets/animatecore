// Short 1 — "Dead Servers": a relatable POV where every server join fails,
// until Mine Radar sweeps in. 20s, 1080x1920.
(() => {
  'use strict';
  const M = MR;
  const { ctx, W, H, NEON, COL } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInOutCubic } = M;

  const DUR = 20;
  const BRAND = 8.7;     // radar wipe starts
  const PUNCH = 11.6;    // "less scrolling / more playing"
  const END = 14.5;      // end card

  const SERVERS = [
    { name: 'Blockyland Network', motd: [['SEASON 4 IS LIVE!!!', '#ffaa00']], players: '3/1000', ping: 5, icon: 'grass' },
    { name: 'the smp (real)', motd: [['come join pls', '#aaaaaa']], players: '1/50', ping: 4, icon: 'wool_pink' },
    { name: 'Factions 1.8 Classic', motd: [['Updated for 1.8.9!', '#ff5555']], players: '???', ping: 0, icon: 'tnt' },
    { name: 'P2W Paradise', motd: [['VIP+ 50% OFF', '#ffff55'], [' TODAY ONLY', '#55ffff']], players: '12/200', ping: 3, icon: 'ore_gold' },
    { name: 'Laggy Minigames', motd: [['now with 30% less lag', '#55ff55']], players: '8/300', ping: 1, icon: 'wool_lightblue' },
  ];

  // screen timeline
  const SEG = [
    { t0: 0.0, kind: 'list', sel: 0 },
    { t0: 0.95, kind: 'connecting' },
    { t0: 1.5, kind: 'lost', title: 'Connection Lost', reason: 'Timed out' },
    { t0: 2.5, kind: 'list', sel: 1 },
    { t0: 2.8, kind: 'empty' },
    { t0: 4.5, kind: 'list', sel: 2 },
    { t0: 4.8, kind: 'lost', title: 'Failed to connect to the server', reason: 'Outdated server! Please use 1.8.9', red: true },
    { t0: 5.9, kind: 'list', sel: 3 },
    { t0: 6.15, kind: 'p2w' },
    { t0: 7.1, kind: 'montage' },
    { t0: 7.8, kind: 'better' },
    { t0: BRAND, kind: 'brand' },
  ];
  const segAt = (t) => { let s = SEG[0]; for (const x of SEG) if (t >= x.t0) s = x; return s; };

  const RED = '#ff4d4d', YEL = '#ffe14d';
  const CAPTIONS = [
    { t0: 0.0, lines: [[{ t: 'POV: you just want' }], [{ t: 'ONE good server', c: YEL }]] },
    { t0: 1.5, lines: [[{ t: 'server #1:' }], [{ t: 'timed out', c: RED }]] },
    { t0: 2.8, lines: [[{ t: 'server #2:' }], [{ t: 'completely empty', c: RED }]] },
    { t0: 4.8, lines: [[{ t: 'server #3:' }], [{ t: 'wrong version', c: RED }]] },
    { t0: 6.15, lines: [[{ t: 'server #4:' }], [{ t: 'pay to win', c: RED }]] },
    { t0: 7.1, lines: [[{ t: 'server #5, #6, #7...' }]] },
    { t0: 7.8, lines: [[{ t: 'there has to be' }], [{ t: 'a better way...' }]] },
    { t0: BRAND, lines: null },
  ];

  // double-clicks on a server row: [time, row]
  const CLICKS = [[0.72, 0], [2.6, 1], [4.6, 2], [5.98, 3]];
  const CURSOR = [[0, 760, 1560], [0.62, 520, 676], [0.95, 520, 676], [2.5, 520, 676], [2.58, 560, 826],
    [4.5, 560, 826], [4.58, 600, 976], [5.9, 600, 976], [5.96, 640, 1126]];

  const MONTAGE = ['Timed out', 'Server closed', 'You are not whitelisted', 'Outdated client!',
    'Banned: for joining', 'Connection refused', 'Internal exception'];
  const SPAM = [
    ['[SHOP] VIP+ is 50% OFF! /buy', '#ffaa00'], ['[SHOP] Crate keys on sale! /buy', '#ffff55'],
    ['[SHOP] Rank up for only $49.99!!', '#ff5555'], ['[SHOP] Don\'t miss out! /buy', '#55ffff'],
    ['[SHOP] MEGA bundle -> /buy', '#ff55ff'], ['[SHOP] VIP++ now available!!', '#ffaa00'],
    ['[SHOP] Limited time! /buy', '#ffff55'], ['[SHOP] Pay to skip the grind!', '#ff5555'],
  ];

  const CHIPS = [
    ['SURVIVAL', 205, 650, '#5fd12a'], ['SMP', 540, 650, '#a8ff2e'], ['SKYBLOCK', 870, 650, '#5cc8ff'],
    ['FACTIONS', 215, 1350, '#ff5d4d'], ['PVP', 540, 1350, '#ff9f1a'], ['MINIGAMES', 850, 1350, '#ffd23a'],
  ];
  const RADAR = { cx: 540, cy: 1000, R: 280 };
  const BLIPS = M.makeBlips([[-2.3, 0.7], [-1.3, 0.55], [-0.6, 0.8], [0.5, 0.45], [1.4, 0.75], [2.5, 0.6], [3.0, 0.3]], -Math.PI / 2, 2);

  let menuBg, world;

  function setup() {
    menuBg = document.createElement('canvas');
    menuBg.width = W; menuBg.height = H;
    const g = menuBg.getContext('2d');
    g.imageSmoothingEnabled = false;
    for (let y = 0; y < H; y += 96) for (let x = 0; x < W; x += 96) g.drawImage(M.TEX.dirt, x, y, 96, 96);
    g.fillStyle = 'rgba(0,0,0,0.62)';
    g.fillRect(0, 0, W, H);
    world = M.blockWorld(17, 30, 64, (c, r) => {
      if (r === 22) return 'grass';
      if (r > 22 && r < 25) return 'dirt';
      if (r >= 25) return hash(c * 7 + r) < 0.06 ? 'ore_iron' : 'stone';
      if (c === 2 && r >= 18 && r < 22) return 'log';
      if (r >= 15 && r < 19 && c >= 0 && c <= 4 && !(r === 15 && (c === 0 || c === 4))) return 'leaves';
      return null;
    });
  }

  // ---------- menu pieces ----------
  function mcText(text, x, y, size, color = '#ffffff', align = 'left') {
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

  function mcButton(text, x, y, w, h, hover = false) {
    ctx.save();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, hover ? '#8a93c9' : '#8b8b8b');
    g.addColorStop(1, hover ? '#5e67a5' : '#5f5f5f');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = hover ? '#ffffff' : '#111';
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.restore();
    mcText(text, x + w / 2, y + h / 2, 38, hover ? '#ffffa0' : '#e0e0e0', 'center');
  }

  function pingBars(x, y, n) {
    const col = n >= 4 ? '#3fd13f' : n >= 2 ? '#e8d23a' : '#e84a3a';
    for (let i = 0; i < 5; i++) {
      const h = 8 + i * 7;
      ctx.fillStyle = n === 0 ? '#3a3a3a' : i < n ? col : '#3a3a3a';
      ctx.fillRect(x + i * 10, y + 22 - h, 7, h);
    }
    if (n === 0) {
      ctx.strokeStyle = '#ff3b3b';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x - 2, y - 14); ctx.lineTo(x + 48, y + 22); ctx.moveTo(x + 48, y - 14); ctx.lineTo(x - 2, y + 22); ctx.stroke();
    }
  }

  function drawList(t, sel) {
    ctx.drawImage(menuBg, 0, 0);
    mcText('Play Multiplayer', 540, 530, 46, '#ffffff', 'center');
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 590, W, 770);
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 586, W, 4); ctx.fillRect(0, 1360, W, 4);
    SERVERS.forEach((s, i) => {
      const y0 = 602 + i * 150;
      const clickT = CLICKS.find((c) => c[1] === i);
      const active = i === sel && clickT && t >= clickT[0] - 0.12;
      if (active) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(36, y0 - 4, W - 72, 140);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(36, y0 - 4, W - 72, 140);
      }
      M.block(s.icon, 50, y0 + 6, 120);
      mcText(s.name, 196, y0 + 38, 40);
      let mx = 196;
      s.motd.forEach(([txt, col]) => {
        mcText(txt, mx, y0 + 92, 32, col);
        mx += M.textWidth(txt, '400 32px "Pixelify Sans"');
      });
      mcText(s.players, 958, y0 + 38, 32, '#aaaaaa', 'right');
      pingBars(972, y0 + 30, s.ping);
    });
    mcButton('Join Server', 60, 1395, 470, 90, false);
    mcButton('Add Server', 550, 1395, 470, 90, false);
  }

  function drawCursor(t) {
    let x = CURSOR[0][1], y = CURSOR[0][2];
    for (let i = 0; i < CURSOR.length - 1; i++) {
      const [ta, xa, ya] = CURSOR[i], [tb, xb, yb] = CURSOR[i + 1];
      if (t >= ta && t <= tb) {
        const e = easeInOutCubic(prog(t, ta, tb));
        x = lerp(xa, xb, e); y = lerp(ya, yb, e);
        break;
      }
      if (t > tb) { x = xb; y = yb; }
    }
    const pressed = CLICKS.some(([ct]) => (t >= ct && t < ct + 0.05) || (t >= ct + 0.1 && t < ct + 0.15));
    const s = pressed ? 5 : 6;
    const map = ['X.........', 'XX........', 'XWX.......', 'XWWX......', 'XWWWX.....', 'XWWWWX....', 'XWWWWWX...',
      'XWWWWWWX..', 'XWWWWWWWX.', 'XWWWWXXXXX', 'XWWXWX....', 'XWX.XWX...', 'XX..XWX...', 'X....XWX..', '.....XX...'];
    map.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === '.') return;
      ctx.fillStyle = ch === 'X' ? '#000' : '#fff';
      ctx.fillRect(x + c * s, y + r * s, s, s);
    }));
  }

  function failScreen(t, seg) {
    ctx.drawImage(menuBg, 0, 0);
    const lt = t - seg.t0;
    const e = easeOutBack(prog(lt, 0, 0.25), 2.5);
    ctx.save();
    ctx.translate(540, 700);
    ctx.scale(lerp(2, 1, e), lerp(2, 1, e));
    ctx.globalAlpha = prog(lt, 0, 0.08);
    ctx.fillStyle = '#ff3b3b';
    const p = 18;
    for (let i = -3; i <= 3; i++) {
      ctx.fillRect(i * p - p / 2, i * p - p / 2, p, p);
      ctx.fillRect(-i * p - p / 2, i * p - p / 2, p, p);
    }
    ctx.restore();
    mcText(seg.title, 540, 860, 44, '#a0a0a0', 'center');
    mcText(seg.reason, 540, 940, 40, seg.red ? '#ff5555' : '#ffffff', 'center');
    mcButton('Back to server list', 190, 1060, 700, 90, lt > 0.6);
  }

  function connecting(t, seg) {
    ctx.drawImage(menuBg, 0, 0);
    const dots = '.'.repeat(1 + Math.floor((t - seg.t0) * 8) % 3);
    mcText(`Connecting to the server${dots}`, 540, 900, 44, '#ffffff', 'center');
    if (t - seg.t0 > 0.25) mcText('Logging in...', 540, 980, 36, '#a0a0a0', 'center');
  }

  function inWorld(t, players) {
    M.skyGradient([[0, '#6aa9ff'], [0.7, '#bfe0ff'], [1, '#d8ecff']]);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    [[120, 700, 5], [620, 820, 4], [880, 640, 3]].forEach(([x, y, n], i) => {
      const dx = (t * 12 + i * 90) % 1300 - 100;
      for (let k = 0; k < n; k++) ctx.fillRect(x + dx + k * 48 - 200, y + (k % 2) * -24, 64, 40);
    });
    ctx.drawImage(world, 0, 0);
    M.drawPlayer(760, 1408, 4, M.PLAYERS[0], 1);
    // tab list
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(290, 500, 500, 110);
    mcText(`Players online: ${players}`, 540, 530, 34, '#ffffff', 'center');
    mcText('You', 540, 580, 30, '#cfcfcf', 'center');
  }

  function chatLines(lines, bottomY) {
    lines.forEach((ln, i) => {
      const y = bottomY - (lines.length - 1 - i) * 56;
      const w = M.textWidth(ln[0], '400 36px "Pixelify Sans"') + 30;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(30, y - 26, w, 54);
      mcText(ln[0], 44, y, 36, ln[1] || '#ffffff');
    });
  }

  function emptyServer(t, seg) {
    inWorld(t, '1/500');
    const lines = [];
    if (t > 3.0) lines.push(['<You> hello?']);
    if (t > 3.5) lines.push(['<You> anyone here?']);
    if (t > 4.0) lines.push(['<You> ...']);
    chatLines(lines, 1300);
    // dead bush rolling past
    const p = prog(t, 3.1, 4.5);
    if (p > 0 && p < 1) {
      const bx = lerp(-80, 1160, p), by = 1376 - Math.abs(Math.sin(p * 18)) * 30;
      for (let i = 0; i < 14; i++) {
        const a = i * 0.9 + p * 20;
        ctx.fillStyle = i % 2 ? '#8a6a3a' : '#6e5026';
        ctx.fillRect(bx + Math.cos(a) * 22 - 5, by + Math.sin(a) * 22 - 5, 10, 10);
      }
    }
  }

  function p2wServer(t, seg) {
    inWorld(t, '12/200');
    ctx.fillStyle = 'rgba(0,0,0,0.0)';
    const bw = 700;
    ctx.fillStyle = '#3b0a4a';
    ctx.fillRect(540 - bw / 2, 660, bw, 18);
    ctx.fillStyle = '#c03ad8';
    ctx.fillRect(540 - bw / 2, 660, bw * (0.35 + 0.1 * Math.sin(t * 9)), 18);
    mcText('VIP SALE ENDS SOON!!!', 540, 636, 32, '#ff77ff', 'center');
    const n = Math.min(SPAM.length * 2, Math.floor((t - seg.t0) / 0.11) + 1);
    const lines = [];
    for (let i = Math.max(0, n - 10); i < n; i++) lines.push(SPAM[i % SPAM.length]);
    chatLines(lines, 1300);
  }

  function montage(t, upto, dim = 0) {
    ctx.drawImage(menuBg, 0, 0);
    MONTAGE.forEach((reason, k) => {
      const t0 = 7.1 + k * 0.1;
      if (upto < t0) return;
      const e = easeOutBack(prog(upto, t0, t0 + 0.12), 2);
      const x = 540 + (hash(k * 5.3) - 0.5) * 200, y = 600 + k * 115 + (hash(k * 2.1) - 0.5) * 40;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((hash(k * 9.7) - 0.5) * 0.22);
      ctx.scale(lerp(1.5, 1, e), lerp(1.5, 1, e));
      ctx.fillStyle = 'rgba(40,40,40,0.95)';
      ctx.fillRect(-380, -80, 760, 160);
      ctx.strokeStyle = '#ff3b3b';
      ctx.lineWidth = 6;
      ctx.strokeRect(-380, -80, 760, 160);
      mcText('Connection Lost', 0, -28, 40, '#a0a0a0', 'center');
      mcText(reason, 0, 30, 40, '#ff6b6b', 'center');
      ctx.restore();
    });
    if (dim) {
      ctx.fillStyle = `rgba(0,0,0,${dim})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ---------- brand section ----------
  function brand(t) {
    M.drawBrandBg();
    M.floatingPixels(t, 30);
    const back = prog(t, PUNCH, PUNCH + 0.4);
    ctx.save();
    ctx.globalAlpha = lerp(1, 0.22, back);
    M.radar(t, { ...RADAR, t0: BRAND, blips: BLIPS });
    CHIPS.forEach(([txt, x, y, col], i) => {
      const t0 = 9.7 + i * 0.12;
      const e = prog(t, t0, t0 + 0.4);
      if (e <= 0) return;
      ctx.save();
      ctx.globalAlpha *= 0.6 * clamp(e * 2);
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -t * 40;
      ctx.strokeStyle = NEON(0.8);
      ctx.lineWidth = 2.5;
      const a = Math.atan2(y - RADAR.cy, x - RADAR.cx);
      ctx.beginPath();
      ctx.moveTo(RADAR.cx + Math.cos(a) * RADAR.R * 0.55, RADAR.cy + Math.sin(a) * RADAR.R * 0.55);
      ctx.lineTo(lerp(RADAR.cx, x, easeOutCubic(e)), lerp(RADAR.cy, y, easeOutCubic(e)));
      ctx.stroke();
      ctx.restore();
      M.chip(txt, x, y + Math.sin(t * 2.2 + i) * 4, e, col, 24);
    });
    ctx.restore();

    const hOut = 1 - back;
    if (hOut > 0) {
      ctx.save();
      ctx.globalAlpha = hOut;
      M.headline([{ t: 'MEET' }], 540, 300, 84, appear(t, 9.05));
      M.headline([{ t: 'MINE RADAR', c: 'accent' }], 540, 420, 136, appear(t, 9.2), 980, { slam: true });
      ctx.restore();
    }
    M.headline([{ t: 'LESS SCROLLING.' }], 540, 860, 124, appear(t, PUNCH + 0.2, 0.18), 980, { slam: true });
    M.headline([{ t: 'MORE PLAYING.', c: 'accent' }], 540, 1010, 124, appear(t, PUNCH + 0.8, 0.18), 980, { slam: true });
  }

  function sweepWipe(t, drawOld, drawNew) {
    const p = easeInOutCubic(prog(t, BRAND, BRAND + 0.7));
    drawOld();
    if (p <= 0) return;
    const a0 = -Math.PI / 2, a1 = a0 + M.TAU * p;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(540, 960);
    ctx.arc(540, 960, 2400, a0, a1);
    ctx.closePath();
    ctx.clip();
    drawNew();
    ctx.restore();
    if (p < 1) {
      ctx.save();
      ctx.strokeStyle = COL.lime;
      ctx.lineWidth = 10;
      ctx.shadowColor = COL.neon;
      ctx.shadowBlur = 40;
      ctx.beginPath(); ctx.moveTo(540, 960); ctx.lineTo(540 + Math.cos(a1) * 2400, 960 + Math.sin(a1) * 2400); ctx.stroke();
      ctx.restore();
    }
  }

  // ---------- frame ----------
  function render(t) {
    const seg = segAt(t);
    const sh = M.shake(t, 1.5, 12, 0.3);
    const sh2 = M.shake(t, 4.8, 12, 0.3);
    ctx.save();
    ctx.translate(sh.x + sh2.x, sh.y + sh2.y);
    if (sh.x || sh2.x) { ctx.translate(540, 960); ctx.scale(1.03, 1.03); ctx.translate(-540, -960); }
    if (t >= END) {
      M.endCard(t, END, { top: [[{ t: 'YOUR NEXT SERVER' }], [{ t: 'IS ON THE RADAR', c: 'accent' }]] });
    } else if (seg.kind === 'brand' || seg.kind === 'better') {
      const old = () => {
        const z = 1 + prog(t, 7.8, BRAND + 0.7) * 0.08;
        ctx.save();
        ctx.translate(540, 960); ctx.scale(z, z); ctx.translate(-540, -960);
        montage(t, 7.8, 0.55);
        ctx.restore();
      };
      if (t < BRAND) old(); else sweepWipe(t, old, () => brand(t));
    } else if (seg.kind === 'list') { drawList(t, seg.sel); drawCursor(t); }
    else if (seg.kind === 'connecting') connecting(t, seg);
    else if (seg.kind === 'lost') failScreen(t, seg);
    else if (seg.kind === 'empty') emptyServer(t, seg);
    else if (seg.kind === 'p2w') p2wServer(t, seg);
    else if (seg.kind === 'montage') {
      const sm = M.shake(t, Math.floor((t - 7.1) / 0.1) * 0.1 + 7.1, 10, 0.1);
      ctx.translate(540 + sm.x, 960 + sm.y); ctx.scale(1.03, 1.03); ctx.translate(-540, -960);
      montage(t, t);
    }
    ctx.restore();

    if (t < BRAND + 0.4) {
      let cap = CAPTIONS[0];
      for (const c of CAPTIONS) if (t >= c.t0) cap = c;
      if (cap.lines) {
        const e = cap.t0 === 0 ? 1 : appear(t, cap.t0, 0.22);
        ctx.save();
        ctx.globalAlpha = 1 - prog(t, BRAND, BRAND + 0.3);
        M.caption(cap.lines, 540, 330, 76, e);
        ctx.restore();
      }
    }
    M.drawScanlines();
    M.flash(t, END, 0.92, 6);
    M.flash(t, BRAND + 0.7, 0.35, 8);
  }

  function events() {
    const ev = [];
    CLICKS.forEach(([ct]) => { ev.push({ type: 'uiclick', t: ct }); ev.push({ type: 'uiclick', t: ct + 0.1 }); });
    ev.push({ type: 'bonk', t: 1.5, note: 45 });
    ev.push({ type: 'bonk', t: 4.8, note: 43 });
    [3.0, 3.5, 4.0].forEach((ct) => ev.push({ type: 'chat', t: ct }));
    ev.push({ type: 'crickets', t: 3.0, end: 4.5 });
    for (let i = 0; i < 9; i++) ev.push({ type: 'spam', t: 6.15 + i * 0.11 });
    MONTAGE.forEach((_, k) => ev.push({ type: 'bonk', t: 7.1 + k * 0.1, note: 40 + k * 2, gain: 0.7 }));
    ev.push({ type: 'trombone', t: 7.85 });
    ev.push({ type: 'scratch', t: BRAND - 0.05 });
    ev.push({ type: 'whoosh', t: BRAND + 0.6 });
    BLIPS.forEach((b) => ev.push({ type: 'ping', t: BRAND + b.hit0, note: 88 + Math.round(b.angle * 2 + 6) % 12 }));
    CHIPS.forEach((_, i) => ev.push({ type: 'pop', t: 9.7 + i * 0.12 + 0.15, note: [84, 86, 88, 91, 93, 96][i] }));
    ev.push({ type: 'hit', t: PUNCH + 0.2 });
    ev.push({ type: 'hit', t: PUNCH + 0.8 });
    ev.push({ type: 'riser', t: END - 1.0, end: END });
    ev.push({ type: 'impact', t: END });
    ev.push({ type: 'pop', t: END + 1.32, note: 96 });
    return ev.sort((a, b) => a.t - b.t);
  }

  M.start({ duration: DUR, cover: 0.4, setup, render, events });
})();
