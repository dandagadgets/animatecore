// Video 4 — "The Build": a satisfying isometric build of a floating island with a radar
// tower, block by block, then "We're just getting started." 18s, 1080x1920.
(() => {
  'use strict';
  const M = MR;
  const { ctx, W, H, TAU, COL, NEON } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInCubic, easeInOutCubic } = M;

  const DUR = 18;
  const BUILD0 = -2.2, BUILT = 8.0, LIVE = 8.2, SOON = 10.4, END = 12.6;
  const S = 64, IX = S * 0.866, IY = S * 0.5;
  const OX = 540, OY = 960;

  const CAPTIONS = [
    { t0: 0.0, t1: 2.6, lines: [[{ t: 'We\'re building' }], [{ t: 'something new.', c: '#ffe14d' }]] },
    { t0: 2.6, t1: 4.4, lines: [[{ t: 'For players.', c: '#7fd0ff' }]] },
    { t0: 4.4, t1: 6.2, lines: [[{ t: 'For server owners.', c: '#ffd86b' }]] },
    { t0: 6.2, t1: BUILT, lines: [[{ t: 'For creators.', c: '#ff8cc6' }]] },
  ];

  let BLOCKS = [];
  let pondTop;

  function setup() {
    const g = (name, colors) => {
      const c = document.createElement('canvas');
      c.width = c.height = 16;
      const x = c.getContext('2d');
      for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) {
        x.fillStyle = colors[Math.floor(hash(xx * 17 + yy * 131 + name.length) * colors.length)];
        x.fillRect(xx, yy, 1, 1);
      }
      M.TEX[name] = c;
    };
    g('grass_top', ['#5fbf2a', '#4ea823', '#6fd23a', '#58b326', '#67c830']);
    g('log_top', ['#a8824e', '#9c7744', '#b38c57']);
    pondTop = M.TEX.water;

    const add = (x, y, z, tex) => BLOCKS.push({ x, y, z, tex });
    const inSq = (x, y, a, b) => x >= a && x <= b && y >= a && y <= b;
    for (let z = -3; z <= 1; z++) {
      const r = { '-3': [3, 4], '-2': [2, 5], '-1': [1, 6], 0: [0, 7], 1: [0, 7] }[z];
      for (let x = r[0]; x <= r[1]; x++) for (let y = r[0]; y <= r[1]; y++) {
        if (z === -1 && hash(x * 3 + y * 7) < 0.25 && !inSq(x, y, 2, 5)) continue;
        let tex = z <= -2 ? (hash(x + y * 5) < 0.2 ? 'ore_iron' : 'stone') : z === -1 ? (hash(x * 7 + y) < 0.4 ? 'stone' : 'dirt') : 'dirt';
        if (z === 1) {
          tex = 'grass';
          if (x >= 5 && x <= 6 && y >= 1 && y <= 2) tex = 'water';
          if (y === 4 && x >= 5) tex = 'gravel';
        }
        add(x, y, z, tex);
      }
    }
    for (let z = 2; z <= 6; z++) for (const [x, y] of [[3, 3], [4, 3], [3, 4], [4, 4]]) add(x, y, z, 'stonebrick');
    for (let x = 2; x <= 5; x++) for (let y = 2; y <= 5; y++) {
      if ((x === 2 || x === 5) && (y === 2 || y === 5)) continue;
      add(x, y, 7, 'cobble');
    }
    for (const [tx, ty] of [[1, 6], [6, 6]]) {
      for (let z = 2; z <= 4; z++) add(tx, ty, z, 'log');
      for (let z = 4; z <= 5; z++) for (let x = tx - 1; x <= tx + 1; x++) for (let y = ty - 1; y <= ty + 1; y++) {
        if (x === tx && y === ty && z === 4) continue;
        if (x < 0 || y < 0 || x > 7 || y > 7) continue;
        if (z === 5 && (x !== tx && y !== ty)) continue;
        add(x, y, z, 'leaves');
      }
    }
    add(6, 3, 2, 'lantern');
    // build order: layer by layer, back to front within a layer
    BLOCKS.sort((a, b) => a.z - b.z || (a.x + a.y) - (b.x + b.y) || a.x - b.x);
    // accelerating placement times
    let t = BUILD0, dt = 0.13;
    BLOCKS.forEach((b, i) => {
      b.t = t;
      b.i = i;
      t += dt;
      dt = Math.max(0.018, dt * 0.975);
    });
    const span = BLOCKS[BLOCKS.length - 1].t - BUILD0;
    BLOCKS.forEach((b) => { b.t = BUILD0 + (b.t - BUILD0) * ((BUILT - 0.3 - BUILD0) / span); });
  }

  // ---------- isometric cube ----------
  function faceTex(tex, face) {
    if (face === 'top') {
      if (tex === 'grass') return 'grass_top';
      if (tex === 'log') return 'log_top';
    }
    return tex;
  }

  function cube(b, cx, cy, alpha = 1) {
    const s = S;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const water = b.tex === 'water';
    const faces = [
      ['top', [IX / 16, IY / 16, -IX / 16, IY / 16, cx, cy - IY], 0],
      ['left', [IX / 16, IY / 16, 0, s / 16, cx - IX, cy], 0.22],
      ['right', [IX / 16, -IY / 16, 0, s / 16, cx, cy + IY], 0.42],
    ];
    faces.forEach(([face, m, shadeA]) => {
      if (water && face !== 'top') shadeA += 0.1;
      ctx.save();
      ctx.transform(...m);
      if (water) ctx.globalAlpha *= 0.85;
      ctx.drawImage(M.TEX[faceTex(b.tex, face)], 0, 0, 16, 16, -0.02, -0.02, 16.04, 16.04);
      if (shadeA) { ctx.fillStyle = `rgba(0,0,0,${shadeA})`; ctx.fillRect(0, 0, 16, 16); }
      ctx.restore();
    });
    ctx.restore();
  }

  const proj = (x, y, z) => [OX + (x - y) * IX, OY + (x + y) * IY - z * S];

  function island(t) {
    const drawList = BLOCKS.filter((b) => t >= b.t - 0.02);
    drawList.sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.z - b.z);
    drawList.forEach((b) => {
      const lt = t - b.t;
      const f = clamp(lt / 0.22);
      const drop = (1 - easeOutBack(f, 1.6)) * 7 * S;
      const [cx, cy] = proj(b.x, b.y, b.z);
      cube(b, cx, cy - drop, clamp(lt / 0.08 + 0.2));
      if (lt > 0.18 && lt < 0.5) {
        const pt = (lt - 0.18) / 0.32;
        for (let k = 0; k < 6; k++) {
          const a = k * TAU / 6 + b.i;
          M.pixelSquare(cx + Math.cos(a) * (40 + pt * 50), cy + IY * 1.2 + Math.sin(a) * (16 + pt * 22), 8, `rgba(255,255,255,${0.7 * (1 - pt)})`);
        }
      }
    });
  }

  function radarTop(t) {
    const e = easeOutBack(prog(t, LIVE, LIVE + 0.5), 1.6);
    if (e <= 0) return;
    const [cx, cy0] = proj(3.5, 3.5, 7);
    const cy = cy0 - IY - 6;
    const rx = 2.0 * IX * e, ry = 2.0 * IY * e;
    // light beam
    const bg = ctx.createLinearGradient(0, cy - 900, 0, cy);
    bg.addColorStop(0, NEON(0));
    bg.addColorStop(1, NEON(0.35 * e));
    ctx.fillStyle = bg;
    ctx.fillRect(cx - 50, cy - 900, 100, 900);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    const disc = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    disc.addColorStop(0, NEON(0.45));
    disc.addColorStop(1, NEON(0.08));
    ctx.fillStyle = disc;
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
    ctx.strokeStyle = COL.neon;
    ctx.lineWidth = 6;
    ctx.shadowColor = COL.neon;
    ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, rx * 0.55, 0, TAU); ctx.stroke();
    const a = (t - LIVE) * 3;
    const cg = ctx.createConicGradient(a - 1.1, 0, 0);
    cg.addColorStop(0, NEON(0));
    cg.addColorStop(1.1 / TAU, NEON(0.6));
    cg.addColorStop(1.1 / TAU + 0.0005, NEON(0));
    cg.addColorStop(1, NEON(0));
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, rx, a - 1.1, a); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = COL.lime;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * rx, Math.sin(a) * rx); ctx.stroke();
    ctx.restore();
    // ping rings spreading over the island and beyond
    for (let k = 0; k < 6; k++) {
      const age = t - LIVE - k * 0.8;
      if (age < 0 || age > 2.2) continue;
      const g = age / 2.2;
      ctx.save();
      ctx.translate(cx, cy + 4 * S * g);
      ctx.scale(1, 0.5);
      ctx.strokeStyle = NEON(0.6 * (1 - g));
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(0, 0, rx + g * 900, 0, TAU); ctx.stroke();
      ctx.restore();
    }
  }

  function players(t) {
    const spots = [[1.2, 2.2, '#7fd0ff', 0], [5.8, 5.3, '#ffd86b', 4], [2.4, 6.6, '#ff8cc6', 6], [6.5, 1.4, '#b9f27c', 2]];
    spots.forEach(([x, y, , p], i) => {
      const t0 = LIVE + 0.7 + i * 0.25;
      if (t < t0) return;
      const e = easeOutBack(prog(t, t0, t0 + 0.3), 2.2);
      const [cx, cy] = proj(x, y, 2);
      ctx.save();
      ctx.translate(cx, cy - IY);
      ctx.scale(e, e);
      M.drawPlayer(0, 0, 2.6, M.PLAYERS[p], i + 2);
      ctx.restore();
    });
  }

  function progressBar(t) {
    const e = appear(t, SOON, 0.3);
    if (e <= 0) return;
    const f = easeInOutCubic(prog(t, SOON + 0.3, SOON + 1.7));
    const x = 140, y = 1470, w = 800, h = 54;
    ctx.save();
    ctx.globalAlpha = e;
    M.label('WEBSITE', 540, y - 50, 26, M.MINT(0.8), 'center', 6, 700);
    M.pixelRectPath(x, y, w, h, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill();
    ctx.strokeStyle = NEON(0.8);
    ctx.lineWidth = 4;
    ctx.stroke();
    const segs = 20;
    for (let i = 0; i < Math.floor(segs * f); i++) {
      ctx.fillStyle = i % 2 ? COL.neon : COL.lime;
      ctx.fillRect(x + 10 + i * ((w - 20) / segs), y + 10, (w - 20) / segs - 4, h - 20);
    }
    if (f >= 1) {
      const s = easeOutBack(prog(t, SOON + 1.7, SOON + 2.0), 2.5);
      ctx.save();
      ctx.translate(540, y + h / 2);
      ctx.scale(s, s);
      ctx.fillStyle = 'rgba(4,10,6,0.9)';
      M.pixelRectPath(-200, -26, 400, 52, 6);
      ctx.fill();
      M.label('COMING SOON', 0, 2, 30, '#ffffff', 'center', 4, 700);
      ctx.restore();
    }
    ctx.restore();
  }

  function render(t) {
    if (t >= END) {
      M.discordCard(t, END, { top: [[{ t: 'BE THERE' }], [{ t: 'FROM DAY ONE.', c: 'accent' }]] });
      M.drawScanlines();
      M.flash(t, END, 0.92, 6);
      return;
    }
    M.skyGradient([[0, '#04070f'], [0.5, '#0a1a14'], [1, '#030604']]);
    M.drawBrandBg();
    ctx.save();
    ctx.globalAlpha = 0.6;
    M.skyGradient([[0, 'rgba(20,40,80,0.5)'], [1, 'rgba(0,0,0,0)']]);
    ctx.restore();
    M.floatingPixels(t, 30);
    const z = 1.0 + 0.06 * prog(t, 0, BUILT) + 0.03 * easeOutCubic(prog(t, LIVE, LIVE + 1));
    const bob = Math.sin(t * 1.2) * 10;
    const sh = M.shake(t, LIVE, 14, 0.35);
    ctx.save();
    ctx.translate(OX + sh.x, 1080 + bob + sh.y);
    ctx.scale(z, z);
    ctx.translate(-OX, -1080);
    const glow = ctx.createRadialGradient(OX, 1100, 0, OX, 1100, 640);
    glow.addColorStop(0, NEON(0.12 + 0.12 * prog(t, LIVE, LIVE + 0.6)));
    glow.addColorStop(1, NEON(0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 300, W, 1600);
    island(t);
    players(t);
    radarTop(t);
    ctx.restore();
    M.vignette(0.5);

    CAPTIONS.forEach((c) => {
      if (t < c.t0 || t >= c.t1) return;
      M.caption(c.lines, 540, 330, 76, c.t0 === 0 ? 1 : appear(t, c.t0, 0.22));
    });
    if (t >= LIVE) {
      M.headline([{ t: 'WE\'RE JUST' }], 540, 290, 110, appear(t, LIVE + 0.1, 0.18), 980, { slam: true });
      M.headline([{ t: 'GETTING STARTED.', c: 'accent' }], 540, 410, 112, appear(t, LIVE + 0.3, 0.18), 980, { slam: true });
    }
    progressBar(t);
    M.drawScanlines();
    M.flash(t, LIVE, 0.6, 8);
  }

  function events() {
    const ev = [];
    let last = -1;
    BLOCKS.forEach((b) => {
      const land = b.t + 0.2;
      if (land < 0 || land - last < 0.05) return;
      last = land;
      ev.push({ type: 'place', t: land, k: b.i, gain: b.z >= 2 ? 1.0 : 0.8 });
    });
    ev.push({ type: 'impact', t: LIVE, gain: 0.8 });
    ev.push({ type: 'hit', t: LIVE + 0.1 });
    ev.push({ type: 'hit', t: LIVE + 0.3 });
    for (let k = 0; k < 6; k++) ev.push({ type: 'ping', t: LIVE + k * 0.8, note: 93, gain: 0.8 });
    for (let i = 0; i < 4; i++) ev.push({ type: 'pop', t: LIVE + 0.7 + i * 0.25, note: 88 + i * 3 });
    for (let i = 0; i < 20; i++) ev.push({ type: 'tick', t: SOON + 0.3 + (i / 20) * 1.4, gain: 0.5 });
    ev.push({ type: 'levelup', t: SOON + 1.7, note: 76 });
    ev.push({ type: 'riser', t: END - 0.9, end: END });
    ev.push(...M.discordCardEvents(END));
    return ev.sort((a, b) => a.t - b.t);
  }

  M.start({ duration: DUR, cover: 5.0, setup, render, events });
})();
