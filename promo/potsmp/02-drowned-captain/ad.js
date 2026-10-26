// PotSMP Ad 2 — "The Drowned Captain": spooky boss trailer. Eyes open in a flooded dungeon,
// the boss rises, a legendary weapon fights it with lightning / slowness / blindness, then
// "Think you can defeat him?" and the Season IV card. 18.5s.
(() => {
  'use strict';
  const M = MR, P = POT;
  const { ctx, W, H, TAU } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInCubic, easeInOutCubic } = M;
  const C = P.C, HO = P.H_OPTS;

  const DUR = 18.5;
  const EYES = 2.6, RISE = 4.2, TITLE = 6.0, FIGHT = 7.2, ENRAGE = 11.2, DARE = 11.8, END = 13.4;
  const HITS = [
    { t: 7.6, hp: 0.78, fx: 'LIGHTNING', col: C.gold },
    { t: 8.6, hp: 0.6, fx: 'SLOWNESS', col: '#5cd6ff' },
    { t: 9.6, hp: 0.42, fx: 'BLINDNESS', col: '#b78cff' },
    { t: 10.6, hp: 0.2, fx: 'CRITICAL!', col: C.pink },
  ];
  const FEET = 1460, BPX = 26;

  const CAPTIONS = [
    { t0: 0, t1: EYES, lines: [[{ t: 'Something is waiting' }], [{ t: 'in the dungeons...', c: '#7ffcff' }]] },
    { t0: EYES, t1: RISE, lines: [[{ t: 'It\'s awake.', c: '#ff6b8a' }]] },
    { t0: FIGHT, t1: 9.2, lines: [[{ t: 'Legendary weapons' }], [{ t: 'with real abilities.', c: '#ffd23f' }]] },
    { t0: 9.2, t1: ENRAGE, lines: [[{ t: 'Earn them in events' }], [{ t: '& boss fights.', c: '#ff8fd0' }]] },
  ];

  let walls;
  function setup() {
    const noise = (name, cols) => {
      const c = document.createElement('canvas');
      c.width = c.height = 16;
      const g = c.getContext('2d');
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const edge = y % 8 === 7 || (x + (Math.floor(y / 8) % 2) * 4) % 8 === 7;
        g.fillStyle = edge ? '#1d4a45' : cols[Math.floor(hash(x * 17 + y * 131 + name.length) * cols.length)];
        g.fillRect(x, y, 1, 1);
      }
      M.TEX[name] = c;
    };
    noise('prismarine', ['#3f8f84', '#4aa093', '#367d73', '#5bb0a2']);
    walls = M.blockWorld(17, 30, 64, (c, r) => {
      if (r >= 23) return r === 23 ? 'sand' : hash(c + r * 7) < 0.3 ? 'gravel' : 'sand';
      if (c <= 2 || c >= 14) return hash(c * 3 + r * 5) < 0.15 ? 'stonebrick' : 'prismarine';
      if (r <= 2) return 'prismarine';
      if (r === 3 && (c === 3 || c === 13)) return 'prismarine';
      return null;
    });
  }

  // ---------- scene ----------
  function water(t) {
    M.skyGradient([[0, '#03202a'], [0.5, '#04161d'], [1, '#010709']]);
    // light shafts from the surface
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const x = 120 + i * 170 + Math.sin(t * 0.6 + i) * 40;
      const g = ctx.createLinearGradient(0, 0, 0, 1500);
      g.addColorStop(0, `rgba(120,255,240,${0.09 + 0.04 * Math.sin(t + i)})`);
      g.addColorStop(1, 'rgba(120,255,240,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - 30, 0); ctx.lineTo(x + 50, 0); ctx.lineTo(x + 220, 1500); ctx.lineTo(x + 40, 1500);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function kelp(t) {
    [[230, 9], [300, 6], [790, 8], [860, 5], [520, 4]].forEach(([x, n], i) => {
      for (let k = 0; k < n; k++) {
        const sway = Math.sin(t * 1.4 + i + k * 0.5) * k * 5;
        ctx.fillStyle = k % 2 ? '#2f7d3a' : '#3c9a48';
        ctx.fillRect(x + sway, 23 * 64 - (k + 1) * 44, 26, 46);
      }
    });
  }

  function bubbles(t, n = 30, burst = 0) {
    for (let i = 0; i < n; i++) {
      const sp = 120 + hash(i * 3) * 160;
      const y = ((hash(i) * (H + 200) - t * sp) % (H + 200) + H + 200) % (H + 200) - 100;
      const x = hash(i * 7) * W + Math.sin(t * 2 + i) * 20;
      const r = 5 + hash(i * 5) * 12;
      ctx.strokeStyle = `rgba(170,255,250,${0.35 + 0.3 * hash(i * 2)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    }
    if (burst > 0) {
      for (let i = 0; i < 40; i++) {
        const a = -Math.PI / 2 + (hash(i * 1.7) - 0.5) * 2.6;
        const v = 400 + hash(i * 4.4) * 900;
        const x = 540 + Math.cos(a) * v * burst, y = FEET - 200 + Math.sin(a) * v * burst;
        ctx.strokeStyle = `rgba(200,255,255,${1 - burst})`;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(x, y, 8 + hash(i) * 16, 0, TAU); ctx.stroke();
      }
    }
  }

  function particles(t) {
    for (let i = 0; i < 40; i++) {
      const x = (hash(i * 2.1) * W + t * (10 + hash(i) * 20)) % W;
      const y = (hash(i * 5.3) * H + Math.sin(t + i) * 30);
      ctx.fillStyle = `rgba(190,255,240,${0.15 + 0.2 * hash(i * 9)})`;
      ctx.fillRect(x, y, 4, 4);
    }
  }

  function bossBar(t) {
    const e = easeOutCubic(prog(t, RISE + 0.6, RISE + 1.1));
    if (e <= 0 || t >= DARE) return;
    const fill = prog(t, RISE + 0.8, RISE + 1.8);
    let hp = 1;
    HITS.forEach((h) => { if (t >= h.t) hp = h.hp; });
    const lastHit = HITS.filter((h) => t >= h.t).pop();
    const lag = lastHit ? lerp(HITS[HITS.indexOf(lastHit) - 1]?.hp ?? 1, hp, easeOutCubic(prog(t, lastHit.t + 0.15, lastHit.t + 0.6))) : 1;
    const w = 760, x = 540, y = 390 - (1 - e) * 120;
    ctx.save();
    ctx.globalAlpha = e;
    M.label('THE DROWNED CAPTAIN', x, y - 42, 28, '#ffffff', 'center', 4, 700);
    ctx.fillStyle = '#12040f';
    ctx.fillRect(x - w / 2 - 6, y - 18, w + 12, 36);
    ctx.fillStyle = '#5a1240';
    ctx.fillRect(x - w / 2, y - 12, w, 24);
    ctx.fillStyle = '#ffd1ec';
    ctx.fillRect(x - w / 2, y - 12, w * Math.min(fill, lag), 24);
    ctx.fillStyle = C.pink;
    ctx.fillRect(x - w / 2, y - 12, w * Math.min(fill, hp), 24);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x - w / 2, y - 12, w * Math.min(fill, hp), 6);
    for (let k = 1; k < 10; k++) { ctx.fillStyle = 'rgba(18,4,15,0.6)'; ctx.fillRect(x - w / 2 + k * w / 10 - 2, y - 12, 4, 24); }
    ctx.restore();
  }

  function theBoss(t) {
    if (t < RISE) return;
    const rise = easeOutCubic(prog(t, RISE, RISE + 1.3));
    const hit = HITS.filter((h) => t >= h.t && t < h.t + 0.12).length > 0;
    const knock = HITS.reduce((a, h) => a + (t >= h.t ? Math.exp(-(t - h.t) * 10) * 26 * Math.sin((t - h.t) * 40) : 0), 0);
    const slowed = t >= HITS[1].t && t < DARE;
    const blind = t >= HITS[2].t && t < DARE;
    const enr = prog(t, ENRAGE, DARE);
    const lunge = easeInCubic(enr);
    const bob = Math.sin(t * (slowed ? 0.9 : 1.8)) * 12;
    ctx.save();
    ctx.translate(540 + knock, (1 - rise) * 700 + bob);
    ctx.translate(540 * 0 + 0, FEET - 300);
    ctx.scale(1 + lunge * 1.6, 1 + lunge * 1.6);
    ctx.translate(0, -(FEET - 300));
    // halo
    const g = ctx.createRadialGradient(0, FEET - 360, 0, 0, FEET - 360, 520);
    g.addColorStop(0, enr > 0 ? `rgba(255,60,90,${0.35 * enr})` : 'rgba(80,220,210,0.22)');
    g.addColorStop(1, 'rgba(80,220,210,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-540, FEET - 900, 1080, 1100);
    if (hit) ctx.filter = 'brightness(3) saturate(0.2)';
    else if (slowed) ctx.filter = 'hue-rotate(-20deg) saturate(1.3)';
    P.boss(0, FEET, BPX, t, { eyes: blind ? 0.15 : enr > 0 ? 1 : 0.8 + 0.2 * Math.sin(t * 6) });
    ctx.filter = 'none';
    if (enr > 0) {
      ctx.fillStyle = `rgba(255,60,90,${enr})`;
      [[5, 6], [6, 6], [13, 6], [14, 6]].forEach(([c, r]) => ctx.fillRect(-10 * BPX + c * BPX, FEET - 26 * BPX + r * BPX, BPX, BPX));
    }
    if (slowed) {
      for (let i = 0; i < 10; i++) {
        const a = t * 1.5 + i * TAU / 10;
        M.pixelSquare(Math.cos(a) * 300, FEET - 360 + Math.sin(a) * 120, 14, 'rgba(92,214,255,0.8)', 10);
      }
    }
    if (blind) {
      for (let i = 0; i < 14; i++) {
        const ph = (t * 0.8 + i / 14) % 1;
        const x = -200 + hash(i) * 400, y = FEET - 560 - ph * 200;
        ctx.fillStyle = `rgba(10,0,20,${0.55 * (1 - ph)})`;
        ctx.fillRect(x - 30 - ph * 30, y - 30 - ph * 30, 60 + ph * 60, 60 + ph * 60);
      }
    }
    ctx.restore();
  }

  function weapon(t) {
    if (t < FIGHT - 0.3 || t >= ENRAGE + 0.3) return;
    const enter = easeOutBack(prog(t, FIGHT - 0.3, FIGHT + 0.1), 1.4);
    const leave = easeInCubic(prog(t, ENRAGE, ENRAGE + 0.3));
    let ang = -0.2;
    HITS.forEach((h) => {
      if (t >= h.t - 0.14 && t < h.t) ang = lerp(-0.2, -1.5, easeInCubic(prog(t, h.t - 0.14, h.t)));
      if (t >= h.t && t < h.t + 0.25) ang = lerp(-1.5, -0.2, easeOutCubic(prog(t, h.t, h.t + 0.25)));
    });
    ctx.save();
    ctx.translate(840 + (1 - enter) * 400 + leave * 400, 1560 + (1 - enter) * 300 + leave * 300);
    ctx.rotate(ang);
    ctx.fillStyle = '#c9925f';
    ctx.fillRect(-30, 20, 120, 300);
    ctx.fillStyle = '#2f9fd9';
    ctx.fillRect(-36, 200, 132, 300);
    P.sword(10, -120, 20, -0.75, '#ff8fd0', '#ffd1ec', 30 + 20 * Math.sin(t * 8));
    ctx.restore();
  }

  function hitFx(t) {
    HITS.forEach((h, i) => {
      const lt = t - h.t;
      if (lt < 0 || lt > 1.4) return;
      if ((i === 0 || i === 3) && lt < 0.45) {
        const a = 1 - prog(lt, 0.2, 0.45);
        P.lightning(560, -40, 540 + (i ? -40 : 30), FEET - 560, i * 7 + Math.floor(lt * 25), a, 16);
        ctx.fillStyle = `rgba(230,240,255,${0.45 * a})`;
        ctx.fillRect(0, 0, W, H);
      }
      for (let k = 0; k < 18; k++) {
        const ang = hash(i * 9 + k) * TAU, d = 60 + lt * 500 * hash(k + i);
        M.pixelSquare(540 + Math.cos(ang) * d, FEET - 420 + Math.sin(ang) * d, 12, k % 2 ? h.col : '#ffffff', 12 * (1 - lt));
      }
      ctx.save();
      ctx.globalAlpha = 1 - prog(lt, 0.7, 1.2);
      M.headline([{ t: `-${Math.round((([1, ...HITS.map((x) => x.hp)][i]) - h.hp) * 120)}`, c: 'gold' }], (i % 2 ? 300 : 790), FEET - 420 - lt * 140, 96, 1, 500, HO);
      ctx.restore();
      const side = i % 2 ? 1 : -1;
      M.chip(h.fx, 540 + side * 280, FEET - 640 + i * 60, prog(lt, 0.05, 0.3) * (1 - prog(lt, 1.1, 1.4)), h.col, 24, { stroke: h.col });
    });
  }

  function render(t) {
    if (t >= END) {
      P.endCard(t, END, { top: [[{ t: 'THE DROWNED CAPTAIN' }], [{ t: 'AWAITS.', c: 'gold' }]] });
      M.drawScanlines();
      M.flash(t, END, 0.85, 6, '255,220,240');
      return;
    }
    if (t >= DARE) {
      ctx.fillStyle = '#050106';
      ctx.fillRect(0, 0, W, H);
      P.bats(t, 5, 7, 0.9);
      const hb = 1 + 0.06 * Math.exp(-((t - DARE) % 0.8) * 8);
      ctx.save();
      ctx.translate(540, 900);
      ctx.scale(hb, hb);
      ctx.translate(-540, -900);
      M.headline([{ t: 'THINK YOU CAN' }], 540, 830, 110, appear(t, DARE + 0.1, 0.2), 980, { ...HO, slam: true });
      M.headline([{ t: 'DEFEAT HIM?', c: 'pink' }], 540, 970, 140, appear(t, DARE + 0.45, 0.2), 980, { ...HO, slam: true });
      ctx.restore();
      P.eyesOnly(540, 1240, 26, 0.6 + 0.4 * Math.sin(t * 5));
      P.ipTag(t);
      M.drawScanlines();
      M.flash(t, DARE, 0.9, 9, '255,80,110');
      return;
    }
    const push = 1 + 0.08 * prog(t, 0, RISE) + 0.04 * easeOutCubic(prog(t, RISE, RISE + 1));
    const sh = M.shake(t, RISE, 18, 1.2);
    const sh2 = HITS.reduce((a, h) => { const s = M.shake(t, h.t, 16, 0.3); return { x: a.x + s.x, y: a.y + s.y }; }, { x: 0, y: 0 });
    const sh3 = M.shake(t, ENRAGE, 30, 0.6);
    ctx.save();
    ctx.translate(sh.x + sh2.x + sh3.x, sh.y + sh2.y + sh3.y);
    ctx.translate(540, 1100); ctx.scale(push * 1.03, push * 1.03); ctx.translate(-540, -1100);
    water(t);
    particles(t);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.drawImage(walls, -4, 0);
    ctx.restore();
    kelp(t);
    if (t >= EYES && t < RISE + 0.4) P.eyesOnly(540, FEET - 26 * BPX + 6.5 * BPX + (1 - 0) * 260, BPX, Math.min(prog(t, EYES, EYES + 0.15), 1 - prog(t, RISE, RISE + 0.4)) * (t > 3.4 && t < 3.52 ? 0.1 : 1));
    theBoss(t);
    bubbles(t, 30, prog(t, RISE, RISE + 1.2) > 0 && t < RISE + 1.2 ? prog(t, RISE, RISE + 1.2) : 0);
    ctx.restore();
    // underwater grade
    ctx.fillStyle = 'rgba(0,40,50,0.22)';
    ctx.fillRect(0, 0, W, H);
    M.vignette(0.75);
    hitFx(t);
    weapon(t);
    bossBar(t);
    if (t >= TITLE && t < FIGHT) {
      ctx.save();
      ctx.globalAlpha = 1 - prog(t, FIGHT - 0.2, FIGHT);
      M.headline([{ t: 'THE DROWNED' }], 540, 560, 120, appear(t, TITLE, 0.18), 980, { ...HO, slam: true });
      M.headline([{ t: 'CAPTAIN', c: 'gold' }], 540, 690, 150, appear(t, TITLE + 0.2, 0.18), 980, { ...HO, slam: true });
      ctx.restore();
    }
    CAPTIONS.forEach((c) => {
      if (t < c.t0 || t >= c.t1) return;
      M.caption(c.lines, 540, c.t0 >= FIGHT ? 600 : 520, 70, c.t0 === 0 ? 1 : appear(t, c.t0, 0.22));
    });
    P.ipTag(t);
    M.drawScanlines();
    M.flash(t, RISE, 0.35, 6, '160,255,250');
    M.flash(t, TITLE, 0.4, 8, '255,220,240');
  }

  function events() {
    const ev = [];
    ev.push({ type: 'sting', t: EYES });
    ev.push({ type: 'rise', t: RISE });
    ev.push({ type: 'growl', t: RISE + 0.3 });
    ev.push({ type: 'bar', t: RISE + 0.8 });
    ev.push({ type: 'braam', t: TITLE }, { type: 'hit', t: TITLE + 0.2 });
    HITS.forEach((h, i) => {
      ev.push({ type: 'swipe', t: h.t - 0.02, gain: 0.8 });
      ev.push({ type: 'hit', t: h.t, gain: 0.8 });
      if (i === 0 || i === 3) ev.push({ type: 'zap', t: h.t });
      ev.push({ type: 'pop', t: h.t + 0.08, note: 84 + i * 4 });
    });
    ev.push({ type: 'growl', t: ENRAGE, gain: 1.2 }, { type: 'riser', t: ENRAGE, end: DARE });
    ev.push({ type: 'braam', t: DARE }, { type: 'hit', t: DARE + 0.45 });
    ev.push({ type: 'riser', t: END - 0.8, end: END });
    ev.push(...P.endCardEvents(END));
    return ev.sort((a, b) => a.t - b.t);
  }

  P.start({ duration: DUR, cover: 6.6, setup, render, events });
})();
