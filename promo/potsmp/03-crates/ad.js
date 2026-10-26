// PotSMP Ad 3 — "Crates That Aren't Gambling": other servers' crates land on 1x dirt and beg
// for keys; PotSMP's selective crates let you pick. Then a quick feature flex. 17.6s.
(() => {
  'use strict';
  const M = MR, P = POT;
  const { ctx, W, H, TAU } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInCubic, easeInOutCubic } = M;
  const C = P.C, HO = P.H_OPTS;

  const DUR = 17.6;
  const SPIN0 = 0.5, SPIN1 = 2.6, BEG = 2.9, SWITCH = 4.4, OPEN = 4.9, PICK = 7.3, FLEX = 9.4, END = 12.6;
  const RW = 270, RP = 290, RY = 940;

  const REEL = [
    ['DIAMONDS', 'ore_diamond'], ['GOD SWORD', 'sword'], ['EMERALDS', 'ore_emerald'], ['LEGENDARY', 'tnt'],
    ['DIAMONDS', 'ore_diamond'], ['GOLD', 'ore_gold'], ['GOD SWORD', 'sword'], ['EMERALDS', 'ore_emerald'],
    ['DIAMONDS', 'ore_diamond'], ['LEGENDARY', 'tnt'], ['GOD SWORD', 'sword'], ['GOLD', 'ore_gold'],
    ['DIAMONDS', 'ore_diamond'], ['GOD SWORD', 'sword'], ['1x DIRT', 'dirt'], ['DIAMONDS', 'ore_diamond'], ['GOLD', 'ore_gold'],
  ];
  const LAND = 14;
  const reelX = (t) => LAND * RP * (1 - Math.pow(1 - prog(t, SPIN0, SPIN1), 3.5));
  const TICKS = Array.from({ length: LAND }, (_, j) => SPIN0 + (1 - Math.pow(1 - (j + 0.5) / LAND, 1 / 3.5)) * (SPIN1 - SPIN0));
  const POPUPS = [[BEG + 0.1, 520, 1260, -0.06], [BEG + 0.45, 600, 1150, 0.05], [BEG + 0.8, 470, 1360, -0.03], [BEG + 1.1, 560, 1230, 0.07]];

  const REWARDS = [
    { name: 'WITCH HAT', tag: 'COSMETIC', draw: 'hat' },
    { name: 'LIMITED BLADE', tag: 'LIMITED', draw: 'sword' },
    { name: 'PUMPKIN HEAD', tag: 'COSMETIC', draw: 'pumpkin' },
  ];
  const HOVER = [[5.5, 0], [6.1, 1], [6.7, 2], [7.0, 0]];
  const CHOSEN = 0;

  const FLEX_ROWS = [
    ['AUCTION HOUSE & ORDERS', 'coin', C.gold],
    ['PROXIMITY VOICE CHAT', 'mic', C.pink2],
    ['JAVA & BEDROCK', 'grass', '#5cd6ff'],
    ['CUSTOM BOSS FIGHTS', 'boss', '#7ffcff'],
  ];

  function setup() {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      g.fillStyle = ['#2a2a2a', '#565656', '#3d3d3d', '#1a1a1a', '#707070'][Math.floor(hash(x * 17 + y * 131 + 21) * 5)];
      g.fillRect(x, y, 1, 1);
    }
    M.TEX.bedrock = c;
  }

  // ---------- sprites ----------
  function witchHat(cx, cy, px) {
    const rows = ['......##......', '.....###......', '.....####.....', '....#####.....', '....######....', '...#######....',
      '...GGGGGGGG...', '..##########..', '##############'];
    rows.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === '.') return;
      ctx.fillStyle = ch === 'G' ? C.gold : r < 6 ? '#5a2a8a' : '#3e1a66';
      ctx.fillRect(cx - 7 * px + c * px, cy - 4.5 * px + r * px, px, px);
    }));
  }
  function pumpkin(cx, cy, px, t) {
    const rows = ['.....GG.....', '....GG......', '.##########.', '############', '##YY####YY##', '#YYYY##YYYY#',
      '############', '##Y######Y##', '###YYYYYY###', '.##########.'];
    const glow = 0.7 + 0.3 * Math.sin(t * 6);
    rows.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === '.') return;
      ctx.fillStyle = ch === 'G' ? '#3a7d1a' : ch === 'Y' ? `rgba(255,225,77,${glow})` : (c % 3 === 0 ? '#e06a00' : '#ff8a1e');
      ctx.fillRect(cx - 6 * px + c * px, cy - 5 * px + r * px, px, px);
    }));
  }
  function micIcon(cx, cy, px) {
    const mic = ['.##.', '####', '####', '####', '.##.', '#..#', '.##.', '.##.'];
    mic.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') { ctx.fillStyle = C.pink2; ctx.fillRect(cx - 2 * px + c * px, cy - 4 * px + r * px, px, px); } }));
  }

  // ---------- part 1: other servers ----------
  function others(t) {
    M.skyGradient([[0, '#1c1c20'], [1, '#0c0c0e']]);
    M.vignette(0.6);
    const fw = 1000, fh = 500;
    M.pixelRectPath(540 - fw / 2, RY - fh / 2, fw, fh, 14);
    ctx.fillStyle = '#2b2b31';
    ctx.fill();
    ctx.strokeStyle = '#6b6b75';
    ctx.lineWidth = 6;
    ctx.stroke();
    M.label('MYSTERY CRATE', 540, RY - fh / 2 - 44, 34, '#c9c9d1', 'center', 6, 700);
    // reel window
    ctx.save();
    ctx.beginPath();
    ctx.rect(540 - fw / 2 + 20, RY - 180, fw - 40, 360);
    ctx.clip();
    const x = reelX(t);
    REEL.forEach(([name, tex], i) => {
      const cx = 540 + i * RP - x;
      if (cx < -RW || cx > W + RW) return;
      const dirt = name === '1x DIRT';
      M.pixelRectPath(cx - RW / 2, RY - 170, RW, 340, 8);
      ctx.fillStyle = dirt ? '#3a2a1e' : '#1e1e24';
      ctx.fill();
      ctx.strokeStyle = dirt && t > SPIN1 ? '#ff4d4d' : '#55555f';
      ctx.lineWidth = 4;
      ctx.stroke();
      if (tex === 'sword') P.sword(cx, RY - 36, 10, 0, '#9ad8ff', '#e0f4ff');
      else M.block(tex, cx - 70, RY - 110, 140);
      M.label(name, cx, RY + 110, 26, dirt ? '#ffb38a' : '#e0e0e8', 'center', 2, 700);
    });
    ctx.restore();
    ctx.fillStyle = t > SPIN1 ? '#ff4d4d' : '#ffd23f';
    ctx.fillRect(536, RY - 205, 8, 410);
    // the verdict
    if (t > SPIN1) {
      const e = easeOutBack(prog(t, SPIN1, SPIN1 + 0.25), 2.5);
      ctx.save();
      ctx.translate(540, RY + 360);
      ctx.scale(e, e);
      ctx.rotate(-0.04);
      M.headline([{ t: '1x DIRT.', c: '#ff6b6b' }], 0, 0, 130, 1, 980, { outline: '#1a0000', shadow: '#3a0000' });
      ctx.restore();
    }
    POPUPS.forEach(([pt, x0, y0, rot], i) => {
      if (t < pt) return;
      const e = easeOutBack(prog(t, pt, pt + 0.18), 2.2);
      ctx.save();
      ctx.translate(x0, y0 - 240);
      ctx.rotate(rot);
      ctx.scale(e, e);
      ctx.fillStyle = '#ececec';
      ctx.fillRect(-300, -110, 600, 220);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(-300, -110, 600, 46);
      M.label('OFFER!', -280, -86, 22, '#ffffff', 'left', 3, 700);
      M.label('X', 276, -86, 24, '#ffffff', 'right', 0, 700);
      ctx.font = '800 40px "Inter"';
      ctx.fillStyle = '#222';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BUY MORE KEYS?', 0, -14);
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(-120, 30, 240, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 32px "Inter"';
      ctx.fillText(['$9.99', '$19.99', '$49.99', '$99.99'][i], 0, 61);
      ctx.restore();
    });
  }

  // ---------- part 2: PotSMP ----------
  function rewardCard(r, i, x, y, s, hover, chosen, t) {
    ctx.save();
    ctx.translate(x, y - hover * 30);
    ctx.scale(s, s);
    M.pixelRectPath(-130, -170, 260, 340, 10);
    const g = ctx.createLinearGradient(0, -170, 0, 170);
    g.addColorStop(0, chosen ? '#5e3e08' : '#3a0f2e');
    g.addColorStop(1, '#14040f');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowColor = chosen ? P.GOLD(0.95) : P.PINK(0.7);
    ctx.shadowBlur = 20 + hover * 30;
    ctx.strokeStyle = chosen ? C.gold : hover > 0.5 ? '#ffffff' : C.pink2;
    ctx.lineWidth = 5 + hover * 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (r.draw === 'hat') witchHat(0, -40, 14);
    if (r.draw === 'sword') P.sword(0, -40, 9, 0, '#ff8fd0', '#ffd1ec');
    if (r.draw === 'pumpkin') pumpkin(0, -40, 13, t);
    M.label(r.tag, 0, -138, 16, chosen ? C.gold2 : C.pink2, 'center', 3, 700);
    M.label(r.name, 0, 110, 20, '#ffffff', 'center', 1, 700);
    ctx.restore();
  }

  function potsmp(t) {
    P.drawBg();
    P.twinkles(t, 22);
    P.bats(t, 4, 2, 0.6);
    const pe = prog(t, PICK, PICK + 0.5);
    P.rays(540, 860, t, pe);
    P.chest(540, 1290, 20, prog(t, OPEN, OPEN + 0.3));
    let hovered = -1;
    HOVER.forEach(([ht, i]) => { if (t >= ht) hovered = i; });
    REWARDS.forEach((r, i) => {
      const e = easeOutBack(prog(t, OPEN + 0.2 + i * 0.08, OPEN + 0.55 + i * 0.08), 1.8);
      if (e <= 0) return;
      const chosen = i === CHOSEN && t >= PICK;
      const others = i !== CHOSEN && t >= PICK;
      const bx = (i - 1) * 300 + 540, by = lerp(1250, 860, e);
      const cx = chosen ? lerp(bx, 540, easeOutCubic(pe)) : bx;
      const cy = chosen ? lerp(by, 840, easeOutCubic(pe)) : by;
      const s = (chosen ? lerp(1, 1.45, easeOutBack(pe, 1.6)) : 1) * e;
      ctx.save();
      if (others) { ctx.globalAlpha = 1 - prog(t, PICK, PICK + 0.3); ctx.translate((i - CHOSEN) * 200 * pe, 300 * pe); }
      rewardCard(r, i, cx, cy, s, hovered === i && t < PICK ? 1 : 0, chosen, t);
      ctx.restore();
    });
    if (t > PICK && t < PICK + 1.2) {
      const lt = t - PICK;
      for (let i = 0; i < 40; i++) {
        const a = hash(i * 3.1) * TAU, d = (200 + hash(i * 5.3) * 600) * easeOutCubic(Math.min(lt / 0.8, 1));
        M.pixelSquare(540 + Math.cos(a) * d, 840 + Math.sin(a) * d, 12, [C.gold, C.pink, '#ffffff'][i % 3], 12 * (1 - lt / 1.2));
      }
    }
    // cursor
    if (t >= OPEN + 0.5 && t < PICK + 0.4) {
      const path = [[OPEN + 0.5, 900, 1650], ...HOVER.map(([ht, i]) => [ht, 540 + (i - 1) * 300 + 20, 880])];
      let px = path[0][1], py = path[0][2];
      for (let k = 0; k < path.length; k++) {
        const [pt, x1, y1] = path[k];
        const prev = path[k - 1] || path[0];
        if (t >= prev[0]) {
          const f = easeInOutCubic(prog(t, prev[0], pt));
          px = lerp(prev[1], x1, f); py = lerp(prev[2], y1, f);
        }
      }
      ctx.save();
      ctx.globalAlpha = 1 - prog(t, PICK + 0.1, PICK + 0.4);
      M.cursorSprite(px, py, t >= PICK - 0.06 && t < PICK + 0.06 ? 5 : 6);
      ctx.restore();
    }
    if (t >= PICK) {
      M.headline([{ t: 'YOU PICK.', c: 'gold' }], 540, 420, 140, appear(t, PICK + 0.1, 0.18), 980, { ...HO, slam: true });
      const se = prog(t, PICK + 0.8, PICK + 1.0);
      if (se > 0) {
        ctx.save();
        ctx.translate(540, 1320);
        ctx.rotate(-0.06);
        ctx.scale(lerp(2.2, 1, easeOutCubic(se)), lerp(2.2, 1, easeOutCubic(se)));
        ctx.globalAlpha = clamp(se * 2);
        M.pixelRectPath(-400, -80, 800, 160, 12);
        ctx.strokeStyle = C.pink;
        ctx.lineWidth = 10;
        ctx.stroke();
        M.headline([{ t: 'NO GAMBLING.', c: 'pink' }], 0, 4, 110, 1, 760, HO);
        ctx.restore();
      }
    }
  }

  function flex(t) {
    P.drawBg();
    P.twinkles(t, 26);
    P.bats(t, 5, 4, 0.6);
    FLEX_ROWS.forEach(([txt, icon, col], i) => {
      const t0 = FLEX + 0.35 + i * 0.55;
      const e = prog(t, t0, t0 + 0.25);
      if (e <= 0) return;
      const y = 620 + i * 190;
      const side = i % 2 ? 1 : -1;
      const x = 540 + side * (1 - easeOutBack(e, 1.6)) * 900;
      ctx.save();
      ctx.translate(x, y);
      M.pixelRectPath(-450, -75, 900, 150, 12);
      ctx.fillStyle = 'rgba(26,6,20,0.94)';
      ctx.fill();
      ctx.shadowColor = col;
      ctx.shadowBlur = 24;
      ctx.strokeStyle = col;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (icon === 'coin') { P.coin(-370, -10, 70, t, 0); P.coin(-345, 18, 70, t, 1); }
      if (icon === 'mic') micIcon(-360, 0, 14);
      if (icon === 'grass') { M.block('grass', -420, -45, 70); M.block('bedrock', -345, -25, 70); }
      if (icon === 'boss') { ctx.save(); ctx.beginPath(); ctx.rect(-420, -70, 140, 140); ctx.clip(); P.boss(-350, 160, 7, t); ctx.restore(); }
      M.label(txt, -250, 3, 34, '#ffffff', 'left', 3, 700);
      ctx.restore();
    });
    M.caption([[{ t: 'And that\'s not all:' }]], 540, 400, 72, appear(t, FLEX + 0.1, 0.22));
    const me = appear(t, FLEX + 2.65, 0.15);
    if (me > 0) M.headline([{ t: '+342 MORE', c: 'gold' }], 540, 1420, 130, me, 980, { ...HO, slam: true });
  }

  function render(t) {
    if (t >= END) {
      P.endCard(t, END, { top: [[{ t: 'NO GAMBLING.' }], [{ t: 'JUST REWARDS.', c: 'gold' }]] });
      M.drawScanlines();
      M.flash(t, END, 0.85, 6, '255,220,240');
      return;
    }
    const sh = M.shake(t, SPIN1, 14, 0.3);
    ctx.save();
    ctx.translate(sh.x, sh.y);
    if (t < SWITCH + 0.22) others(t);
    else if (t < FLEX) potsmp(t);
    else flex(t);
    ctx.restore();
    if (t < SWITCH + 0.22) {
      M.caption([[{ t: 'Other servers\'', c: '#ff6b6b' }], [{ t: 'crates:' }]], 540, 360, 84, 1);
    } else if (t < PICK) {
      M.caption([[{ t: 'PotSMP\'s', c: '#ff8fd0' }], [{ t: 'crates:' }]], 540, 360, 84, appear(t, SWITCH + 0.25, 0.22));
    }
    P.splash(t, SWITCH, C.pink);
    P.splash(t, FLEX - 0.24, C.gold);
    P.ipTag(t);
    M.drawScanlines();
    M.flash(t, PICK, 0.6, 7, '255,235,190');
  }

  function events() {
    const ev = [{ type: 'jingle', t: SPIN0, end: SPIN1 }];
    TICKS.forEach((tk, j) => ev.push({ type: 'tick', t: tk, gain: j < 6 ? 0.5 : 0.8 }));
    ev.push({ type: 'womp', t: SPIN1 + 0.05 });
    POPUPS.forEach(([pt], i) => ev.push({ type: 'bonk', t: pt, note: 45 + i * 2 }));
    ev.push({ type: 'splash', t: SWITCH });
    ev.push({ type: 'latch', t: OPEN }, { type: 'sparkle', t: OPEN + 0.15, note: 84 });
    REWARDS.forEach((_, i) => ev.push({ type: 'pop', t: OPEN + 0.3 + i * 0.08, note: 86 + i * 3 }));
    HOVER.forEach(([ht]) => ev.push({ type: 'tick', t: ht, gain: 0.7 }));
    ev.push({ type: 'uiclick', t: PICK }, { type: 'pick', t: PICK + 0.02 }, { type: 'hit', t: PICK + 0.1 });
    ev.push({ type: 'hit', t: PICK + 0.8, gain: 0.9 }, { type: 'thump', t: PICK + 0.8 });
    ev.push({ type: 'splash', t: FLEX - 0.24, gain: 0.8 });
    FLEX_ROWS.forEach((_, i) => { ev.push({ type: 'swipe', t: FLEX + 0.35 + i * 0.55 + 0.15, gain: 0.6 }); ev.push({ type: 'pop', t: FLEX + 0.35 + i * 0.55 + 0.2, note: 86 + i * 3 }); });
    ev.push({ type: 'hit', t: FLEX + 2.65 }, { type: 'firework', t: FLEX + 2.7 });
    ev.push({ type: 'riser', t: END - 0.8, end: END });
    ev.push(...P.endCardEvents(END));
    return ev.sort((a, b) => a.t - b.t);
  }

  P.start({ duration: DUR, cover: 2.8, setup, render, events });
})();
