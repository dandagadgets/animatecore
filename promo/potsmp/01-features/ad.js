// PotSMP Ad 1 — "10 Features in 15 Seconds": a story-style speedrun through Season IV's
// features, cut on the beat (150 BPM), ending on +342 MORE and the Season IV card. 20s.
(() => {
  'use strict';
  const M = MR, P = POT;
  const { ctx, W, H, TAU } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInCubic, easeInOutCubic } = M;
  const C = P.C, HO = P.H_OPTS;

  const DUR = 20;
  const BEAT = 0.4, HOOK = 1.6, CARD = 1.2, MORE = 13.6, END = 14.8;
  const cardT = (i) => HOOK + i * CARD;
  const SPLASH = [3, 6];   // these cards enter with the potion splash instead of a swipe

  const FEATURES = [
    { title: [[{ t: 'NEW SPAWN' }], [{ t: '& LOBBY', c: 'pink' }]], sub: 'a fresh spawn this season', tint: '255,79,163' },
    { title: [[{ t: 'PROXIMITY' }], [{ t: 'VOICE CHAT', c: 'gold' }]], sub: 'talk to players near you', tint: '255,201,60' },
    { title: [[{ t: 'JAVA &' }], [{ t: 'BEDROCK', c: 'pink' }]], sub: 'join from either edition', tint: '120,200,255' },
    { title: [[{ t: 'NEW' }], [{ t: 'KOTH', c: 'gold' }]], sub: 'rebuilt in the spawn warzone', tint: '255,201,60' },
    { title: [[{ t: 'CUSTOM' }], [{ t: 'WEAPONS', c: 'pink' }]], sub: 'lightning, slowness, blindness', tint: '200,170,255' },
    { title: [[{ t: 'NEW BOSS:' }], [{ t: 'DROWNED CAPTAIN', c: 'gold' }]], sub: 'think you can defeat him?', tint: '80,220,210' },
    { title: [[{ t: 'SELECTIVE' }], [{ t: 'CRATES', c: 'pink' }]], sub: 'you pick the reward. no gambling.', tint: '255,143,208' },
    { title: [[{ t: 'AUCTION HOUSE' }], [{ t: '& ECONOMY', c: 'gold' }]], sub: 'orders, shop & spawners', tint: '255,201,60' },
    { title: [[{ t: 'EVERYTHING' }], [{ t: 'IMPROVED', c: 'pink' }]], sub: 'bounties, kits, warps & more', tint: '255,79,163' },
    { title: [[{ t: 'END WAR' }], [{ t: 'EVENT', c: 'gold' }]], sub: 'week one. winner gets rewards.', tint: '190,120,255' },
  ];

  function setup() {
    const noise = (name, cols) => {
      const c = document.createElement('canvas');
      c.width = c.height = 16;
      const g = c.getContext('2d');
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        g.fillStyle = cols[Math.floor(hash(x * 17 + y * 131 + name.length * 3) * cols.length)];
        g.fillRect(x, y, 1, 1);
      }
      M.TEX[name] = c;
    };
    noise('bedrock', ['#2a2a2a', '#565656', '#3d3d3d', '#1a1a1a', '#707070']);
    noise('endstone', ['#dbdba0', '#cfcf92', '#e6e6b0', '#c4c487']);
  }

  // ---------- icons (drawn around 0,0) ----------
  function popIn(lt, d, k = 0) { return clamp(easeOutBack(clamp((lt - d) / 0.18), 2.4), 0, 1.3) * (1 + 0 * k); }

  function iconSpawn(lt, t) {
    const S = 80;
    const cells = [];
    for (let c = -3; c <= 3; c++) cells.push([c, 0, c === 0 ? 'obsidian' : 'stonebrick'], [c, 1, c === 0 ? 'obsidian' : 'stonebrick']);
    [-3, -1, 0, 1, 3].forEach((c) => cells.push([c, 2, 'stonebrick']));
    cells.push([-3, 3, 'stonebrick'], [3, 3, 'stonebrick'], [0, 3, 'stonebrick'], [-3, 4, 'stonebrick'], [3, 4, 'stonebrick']);
    cells.push([-3, 5, 'wool_pink'], [3, 5, 'wool_pink'], [0, 4, 'wool_yellow']);
    cells.forEach(([c, r, tex], i) => {
      const s = popIn(lt, i * 0.018);
      if (s <= 0) return;
      const x = c * S, y = 200 - r * S;
      const sz = S * s;
      M.block(tex, x - sz / 2, y - sz / 2, sz);
    });
  }

  function iconVoice(lt, t) {
    const mic = ['..####..', '.######.', '.#=##=#.', '.######.', '.#=##=#.', '.######.', '..####..', '#..##..#', '.#.##.#.', '..####..', '...##...', '..####..'];
    const s = popIn(lt, 0);
    ctx.save();
    ctx.scale(s, s);
    mic.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === '.') return;
      ctx.fillStyle = ch === '=' ? C.plum : C.gold;
      ctx.fillRect(-4 * 26 + c * 26, -220 + r * 26, 26, 26);
    }));
    ctx.restore();
    for (let k = 0; k < 3; k++) {
      const ph = ((t - cardT(1)) * 2.2 + k / 3) % 1;
      ctx.strokeStyle = `rgba(255,201,60,${(1 - ph) * 0.9})`;
      ctx.lineWidth = 10;
      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.arc(0, -70, 150 + ph * 160, side > 0 ? -0.6 : Math.PI - 0.6, side > 0 ? 0.6 : Math.PI + 0.6);
        ctx.stroke();
      });
    }
    [[-260, 2], [260, 4]].forEach(([x, p], i) => {
      const e = popIn(lt, 0.15 + i * 0.1);
      if (e <= 0) return;
      ctx.save();
      ctx.translate(x, 230);
      ctx.scale(e, e);
      M.drawPlayer(0, 0, 4, M.PLAYERS[p], i + 3);
      ctx.restore();
      if (lt > 0.4 + i * 0.25) {
        const txt = i ? 'gg!' : 'hey!';
        const bw = M.textWidth(txt, '700 30px "Silkscreen"', 2) + 40;
        ctx.fillStyle = '#ffffff';
        M.pixelRectPath(x - bw / 2, -40, bw, 60, 6);
        ctx.fill();
        M.label(txt, x, -9, 30, C.ink, 'center', 2, 700);
      }
    });
  }

  function iconEditions(lt, t) {
    const hitT = 0.22;
    const e = easeInCubic(clamp(lt / hitT));
    const dx = lerp(700, 190, e);
    const bob = lt > hitT ? Math.sin(t * 4) * 8 : 0;
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.4)';
    ctx.shadowBlur = 30;
    M.block('grass', -dx - 120, -120 + bob, 240);
    M.block('bedrock', dx - 120, -120 - bob, 240);
    ctx.restore();
    if (lt > hitT) {
      const s = easeOutBack(clamp((lt - hitT) / 0.2), 3);
      ctx.save();
      ctx.scale(s, s);
      M.headline([{ t: '+', c: 'gold' }], 0, -10, 200, 1, 2000, HO);
      ctx.restore();
      M.label('JAVA', -190, 180, 36, '#ffffff', 'center', 4, 700);
      M.label('BEDROCK', 190, 180, 36, '#ffffff', 'center', 4, 700);
    }
  }

  function iconKoth(lt, t) {
    const S = 76;
    let i = 0;
    [[7, 0], [5, 1], [3, 2], [1, 3]].forEach(([n, r]) => {
      for (let c = 0; c < n; c++) {
        const s = popIn(lt, i++ * 0.02);
        const x = (c - (n - 1) / 2) * S, y = 230 - r * S;
        M.block('grass', x - S * s / 2, y - S * s / 2, S * s);
      }
    });
    const ce = popIn(lt, 0.38);
    if (ce > 0) {
      const g = ctx.createRadialGradient(0, -110, 0, 0, -110, 200);
      g.addColorStop(0, P.GOLD(0.6));
      g.addColorStop(1, P.GOLD(0));
      ctx.fillStyle = g;
      ctx.fillRect(-200, -310, 400, 400);
      ctx.save();
      ctx.translate(0, -120 - Math.abs(Math.sin(t * 5)) * 30);
      ctx.scale(ce, ce);
      P.crown(0, 0, 22);
      ctx.restore();
    }
  }

  function iconWeapons(lt, t) {
    P.sword(0, 40, 24, -0.15, '#ff8fd0', '#ffd1ec', 30);
    const st = 0.18;
    if (lt > st && lt < st + 0.45) {
      const a = 1 - prog(lt, st + 0.25, st + 0.45);
      P.lightning(60, -1100, 150, -110, Math.floor(lt * 20), a, 14);
      ctx.fillStyle = `rgba(255,255,230,${0.5 * a})`;
      ctx.fillRect(-W, -H, W * 2, H * 2);
    }
    [['LIGHTNING', -230, -250, C.gold], ['SLOWNESS', 250, -80, '#5cd6ff'], ['BLINDNESS', -220, 250, '#b78cff']].forEach(([txt, x, y, col], i) => {
      M.chip(txt, x, y, prog(lt, 0.45 + i * 0.12, 0.75 + i * 0.12), col, 22, { stroke: col });
    });
  }

  function bossBar(x, y, w, frac, name) {
    M.label(name, x, y - 36, 24, '#ffffff', 'center', 3, 700);
    ctx.fillStyle = '#2a0a1e';
    ctx.fillRect(x - w / 2 - 4, y - 14, w + 8, 28);
    ctx.fillStyle = '#7a1a5a';
    ctx.fillRect(x - w / 2, y - 10, w, 20);
    ctx.fillStyle = C.pink;
    ctx.fillRect(x - w / 2, y - 10, w * frac, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x - w / 2, y - 10, w * frac, 5);
  }

  function iconBoss(lt, t) {
    for (let i = 0; i < 14; i++) {
      const ph = ((t - cardT(5)) * 0.8 + i / 14) % 1;
      ctx.strokeStyle = `rgba(160,255,250,${0.7 * (1 - ph)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-260 + hash(i) * 520, 260 - ph * 560, 6 + hash(i * 3) * 10, 0, TAU); ctx.stroke();
    }
    const rise = easeOutCubic(clamp(lt / 0.35));
    ctx.save();
    ctx.translate(0, (1 - rise) * 200);
    ctx.globalAlpha = rise;
    P.boss(0, 270, 17, t, { eyes: 0.6 + 0.4 * Math.sin(t * 6) });
    ctx.restore();
    bossBar(0, -300, 560, 1 - 0.0 * lt, 'THE DROWNED CAPTAIN');
  }

  function iconCrates(lt, t) {
    P.chest(0, 140, 18, prog(lt, 0.05, 0.3));
    const rewards = [['potion'], ['sword'], ['crown']];
    rewards.forEach(([kind], i) => {
      const e = easeOutBack(prog(lt, 0.2 + i * 0.06, 0.45 + i * 0.06), 1.8);
      if (e <= 0) return;
      const x = (i - 1) * 250, y = lerp(120, -170, e);
      const picked = i === 1 && lt > 0.75;
      const dim = lt > 0.75 && i !== 1 ? 0.35 : 1;
      ctx.save();
      ctx.globalAlpha = dim;
      ctx.translate(x, y);
      ctx.scale(e * (picked ? 1.12 : 1), e * (picked ? 1.12 : 1));
      M.pixelRectPath(-100, -130, 200, 260, 10);
      ctx.fillStyle = '#2a0a1e';
      ctx.fill();
      ctx.strokeStyle = picked ? C.gold : C.pink2;
      ctx.lineWidth = picked ? 8 : 4;
      ctx.shadowColor = picked ? P.GOLD(0.9) : P.PINK(0.6);
      ctx.shadowBlur = picked ? 40 : 14;
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (kind === 'potion') ctx.drawImage(P.IMG.potion, -80, -100, 160, 160);
      if (kind === 'sword') P.sword(0, -20, 9, 0, '#ff8fd0', '#ffd1ec');
      if (kind === 'crown') P.crown(0, -20, 15);
      M.label(['POTION', 'LEGENDARY', 'COSMETIC'][i], 0, 92, 18, '#ffffff', 'center', 2, 700);
      ctx.restore();
    });
    if (lt > 0.62 && lt < 1.0) M.cursorSprite(lerp(320, 20, easeOutCubic(prog(lt, 0.62, 0.74))), lerp(160, -120, easeOutCubic(prog(lt, 0.62, 0.74))), lt > 0.74 && lt < 0.8 ? 5 : 6);
    if (lt > 0.76) P.check(70, -260, 90);
  }

  function iconEconomy(lt, t) {
    [[-90, 8], [90, 5]].forEach(([sx, n]) => {
      for (let k = 0; k < n; k++) {
        const y = 250 - k * 24;
        ctx.fillStyle = '#8a5a00';
        ctx.fillRect(sx - 80, y - 10, 160, 24);
        ctx.fillStyle = k === n - 1 ? C.gold2 : C.gold;
        ctx.fillRect(sx - 76, y - 12, 152, 16);
      }
    });
    for (let i = 0; i < 12; i++) {
      const ph = ((t - cardT(7)) * 0.9 + i / 12) % 1;
      P.coin(-320 + hash(i * 3) * 640, -380 + ph * 640, 46, t, i);
    }
    [['AUCTION HOUSE', -170, -170], ['ORDERS', 210, -60], ['SHOP', -200, 60], ['SPAWNERS', 190, 170]].forEach(([txt, x, y], i) => {
      M.chip(txt, x, y, prog(lt, 0.15 + i * 0.12, 0.45 + i * 0.12), [C.gold, C.pink2, '#5cd6ff', '#a8ff2e'][i], 22, { stroke: [C.gold, C.pink2, '#5cd6ff', '#a8ff2e'][i] });
    });
  }

  const IMPROVED = ['BOUNTIES', 'DAILY REWARDS', 'AFK HOUSE', 'KITS', 'RANDOM TP', 'WARPS', 'LEADERBOARDS'];
  function iconImproved(lt, t) {
    const pw = 620, ph = IMPROVED.length * 68 + 40;
    M.pixelRectPath(-pw / 2, -ph / 2, pw, ph, 12);
    ctx.fillStyle = 'rgba(26,6,20,0.92)';
    ctx.fill();
    ctx.strokeStyle = C.pink;
    ctx.lineWidth = 4;
    ctx.stroke();
    IMPROVED.forEach((txt, k) => {
      const y = -ph / 2 + 54 + k * 68;
      const on = lt > 0.08 + k * 0.1;
      ctx.fillStyle = on ? '#1f6b34' : '#3a1a30';
      ctx.fillRect(-pw / 2 + 30, y - 22, 44, 44);
      if (on) {
        const s = easeOutBack(clamp((lt - 0.08 - k * 0.1) / 0.12), 3);
        ctx.save();
        ctx.translate(-pw / 2 + 52, y);
        ctx.scale(s, s);
        P.check(0, 0, 44);
        ctx.restore();
      }
      M.label(txt, -pw / 2 + 100, y + 2, 28, on ? '#ffffff' : 'rgba(255,255,255,0.45)', 'left', 2, 700);
    });
  }

  function iconEndWar(lt, t) {
    for (let c = -3; c <= 3; c++) for (let r = 0; r < 2; r++) {
      if (r === 1 && Math.abs(c) === 3) continue;
      M.block('endstone', c * 76 - 38, 200 + r * 76 - 38, 76);
    }
    const cy = -60 + Math.sin(t * 2.5) * 20;
    const g = ctx.createRadialGradient(0, cy, 0, 0, cy, 260);
    g.addColorStop(0, 'rgba(255,120,220,0.6)');
    g.addColorStop(1, 'rgba(255,120,220,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-260, cy - 260, 520, 520);
    ctx.save();
    ctx.translate(0, cy);
    ctx.rotate(t * 2);
    ctx.strokeStyle = '#e8d8ff';
    ctx.lineWidth = 10;
    ctx.strokeRect(-90, -90, 180, 180);
    ctx.rotate(-t * 3.2);
    ctx.strokeStyle = '#b78cff';
    ctx.strokeRect(-64, -64, 128, 128);
    ctx.fillStyle = C.pink;
    ctx.fillRect(-36, -36, 72, 72);
    ctx.restore();
    const se = popIn(lt, 0.25);
    if (se > 0) {
      ctx.save();
      ctx.scale(se, se);
      P.sword(-90, 150, 12, -0.8, '#b78cff', '#e8d8ff');
      ctx.scale(-1, 1);
      P.sword(-90, 150, 12, -0.8, C.gold, C.gold2);
      ctx.restore();
    }
    P.ribbon('WEEK 1', 0, -280, prog(lt, 0.35, 0.65), C.gold, C.ink, 30);
  }

  const ICONS = [iconSpawn, iconVoice, iconEditions, iconKoth, iconWeapons, iconBoss, iconCrates, iconEconomy, iconImproved, iconEndWar];

  function card(i, lt, t) {
    const F = FEATURES[i];
    const glow = ctx.createRadialGradient(540, 880, 0, 540, 880, 700);
    glow.addColorStop(0, `rgba(${F.tint},0.28)`);
    glow.addColorStop(1, `rgba(${F.tint},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 200, W, 1400);
    M.headline([{ t: `#${i + 1}`, c: 'gold' }], 540, 470, 120, popIn(lt, 0), 980, { ...HO, slam: false });
    ctx.save();
    ctx.translate(540, 880);
    ICONS[i](lt, t);
    ctx.restore();
    const te = appear(t, cardT(i) + 0.05, 0.18);
    F.title.forEach((parts, k) => M.headline(parts, 540, 1300 + k * 112, 104, te, 960, HO));
    M.caption([[{ t: F.sub }]], 540, 1515, 48, appear(t, cardT(i) + 0.15, 0.2));
  }

  function segments(t) {
    const n = FEATURES.length, x0 = 60, w = (W - 120 - (n - 1) * 10) / n;
    for (let i = 0; i < n; i++) {
      const f = clamp((t - cardT(i)) / CARD);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x0 + i * (w + 10), 232, w, 10);
      ctx.fillStyle = C.pink2;
      ctx.fillRect(x0 + i * (w + 10), 232, w * f, 10);
    }
    const left = 15 * (1 - prog(t, HOOK, END));
    const txt = `${left.toFixed(1)}s`;
    const bw = M.textWidth(txt, '700 30px "Silkscreen"', 2) + 40;
    M.pixelRectPath(W - 60 - bw, 268, bw, 56, 6);
    ctx.fillStyle = 'rgba(26,6,20,0.9)';
    ctx.fill();
    ctx.strokeStyle = left < 3 ? '#ff4d4d' : C.gold;
    ctx.lineWidth = 3;
    ctx.stroke();
    M.label(txt, W - 60 - bw / 2, 297, 30, left < 3 ? '#ff6b6b' : C.gold2, 'center', 2, 700);
  }

  function hook(t) {
    const pulse = 1 + 0.05 * Math.exp(-Math.max(0, t - 0.8) * 10) * (t >= 0.8 ? 1 : 0);
    const lw = 980, lh = lw * 290 / 1280;
    ctx.save();
    ctx.translate(540, 520);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = P.PINK(0.7);
    ctx.shadowBlur = 40;
    ctx.drawImage(P.IMG.wide, -lw / 2, -lh / 2, lw, lh);
    ctx.shadowBlur = 0;
    P.shine(P.IMG.wide, -lw / 2, -lh / 2, lw, lh, (t % 1.4) / 0.9);
    ctx.restore();
    P.ribbon('SEASON IV', 540, 720, 1);
    P.potion(540, 1040, 300, t);
    M.headline([{ t: '10 NEW THINGS' }], 540, 1330, 112, 1, 980, HO);
    M.headline([{ t: 'IN 15 SECONDS', c: 'pink' }], 540, 1450, 112, 1, 980, HO);
  }

  function more(t) {
    const lt = t - MORE;
    for (let i = 0; i < 70; i++) {
      const a = hash(i * 2.3) * TAU, v = 500 + hash(i * 4.1) * 1100;
      const d = v * (1 - Math.exp(-lt * 3)) / 3;
      M.pixelSquare(540 + Math.cos(a) * d, 900 + Math.sin(a) * d + lt * lt * 300, 10 + (i % 3) * 5, [C.pink, C.gold, C.pink2, '#fff', '#b78cff'][i % 5]);
    }
    P.bats(t, 8, 5);
    const pumpkins = [[200, 1250], [880, 1180], [150, 620], [930, 650]];
    pumpkins.forEach(([x, y], i) => {
      const s = popIn(lt, 0.2 + i * 0.08);
      if (s <= 0) return;
      ctx.save();
      ctx.translate(x, y + Math.sin(t * 4 + i) * 10);
      ctx.scale(s, s);
      ctx.fillStyle = '#ff8a1e';
      ctx.fillRect(-60, -50, 120, 100);
      ctx.fillStyle = '#e06a00';
      ctx.fillRect(-60, -50, 20, 100);
      ctx.fillRect(10, -50, 16, 100);
      ctx.fillStyle = '#3a7d1a';
      ctx.fillRect(-10, -72, 20, 24);
      ctx.fillStyle = '#ffe14d';
      ctx.fillRect(-40, -20, 22, 20); ctx.fillRect(18, -20, 22, 20); ctx.fillRect(-34, 16, 68, 14);
      ctx.restore();
    });
    M.headline([{ t: '+342', c: 'gold' }], 540, 820, 280, appear(t, MORE, 0.15), 980, { ...HO, slam: true });
    M.headline([{ t: 'MORE', c: 'pink' }], 540, 1040, 190, appear(t, MORE + 0.12, 0.15), 980, { ...HO, slam: true });
    M.caption([[{ t: '& spooky surprises.' }]], 540, 1230, 64, appear(t, MORE + 0.3, 0.2));
  }

  function render(t) {
    if (t >= END) {
      P.endCard(t, END);
      M.drawScanlines();
      M.flash(t, END, 0.85, 6, '255,220,240');
      return;
    }
    P.drawBg();
    P.twinkles(t, 22);
    if (t < HOOK) {
      P.bats(t, 4, 1, 0.7);
      hook(t);
    } else if (t < MORE) {
      const i = Math.min(9, Math.floor((t - HOOK) / CARD));
      const lt = t - cardT(i);
      const swipe = !SPLASH.includes(i) && i > 0 ? easeOutCubic(clamp(lt / 0.22)) : 1;
      if (swipe < 1) {
        ctx.save();
        ctx.translate(-swipe * W, 0);
        card(i - 1, lt + CARD, t);
        ctx.restore();
      }
      ctx.save();
      ctx.translate((1 - swipe) * W, 0);
      ctx.rotate((1 - swipe) * 0.04);
      card(i, lt, t);
      ctx.restore();
      segments(t);
    } else {
      more(t);
    }
    SPLASH.forEach((i) => P.splash(t, cardT(i) - 0.24, i % 2 ? C.gold : C.pink));
    P.splash(t, MORE - 0.12, C.pink);
    P.ipTag(t);
    M.drawScanlines();
    M.flash(t, HOOK, 0.4, 10, '255,220,240');
    M.flash(t, MORE, 0.7, 7, '255,220,240');
  }

  function events() {
    const ev = [];
    FEATURES.forEach((_, i) => {
      const t0 = cardT(i);
      ev.push({ type: SPLASH.includes(i) ? 'splash' : 'swipe', t: SPLASH.includes(i) ? t0 - 0.24 : t0 });
      ev.push({ type: 'pop', t: t0 + 0.02, note: 84 + [0, 2, 4, 7, 9, 12, 14, 16, 19, 21][i] });
    });
    // per-icon satisfying bits
    for (let k = 0; k < 22; k++) ev.push({ type: 'place', t: cardT(0) + k * 0.018 + 0.15, k, gain: 0.35 });
    ev.push({ type: 'ding', t: cardT(1) + 0.4, note: 91 }, { type: 'ding', t: cardT(1) + 0.65, note: 95 });
    ev.push({ type: 'hit', t: cardT(2) + 0.22 });
    ev.push({ type: 'sparkle', t: cardT(3) + 0.38, note: 88 });
    ev.push({ type: 'zap', t: cardT(4) + 0.18 });
    for (let i = 0; i < 3; i++) ev.push({ type: 'pop', t: cardT(4) + 0.5 + i * 0.12, note: 88 + i * 3, gain: 0.6 });
    ev.push({ type: 'growl', t: cardT(5) + 0.05 });
    ev.push({ type: 'latch', t: cardT(6) + 0.05 }, { type: 'uiclick', t: cardT(6) + 0.75 }, { type: 'sparkle', t: cardT(6) + 0.78, note: 91 });
    for (let i = 0; i < 4; i++) ev.push({ type: 'coin', t: cardT(7) + 0.18 + i * 0.12 });
    IMPROVED.forEach((_, k) => ev.push({ type: 'tick', t: cardT(8) + 0.08 + k * 0.1, gain: 0.8 }, { type: 'pop', t: cardT(8) + 0.09 + k * 0.1, note: 86 + k * 2, gain: 0.4 }));
    ev.push({ type: 'hit', t: cardT(9) + 0.25, gain: 0.7 });
    ev.push({ type: 'impact', t: MORE, gain: 0.8 }, { type: 'firework', t: MORE + 0.05 }, { type: 'hit', t: MORE + 0.12 });
    ev.push({ type: 'riser', t: END - 0.8, end: END });
    ev.push(...P.endCardEvents(END));
    return ev.sort((a, b) => a.t - b.t);
  }

  P.start({ duration: DUR, cover: 0.0, setup, render, events });
})();
