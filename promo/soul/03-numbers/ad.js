// Soul Launcher Ad 3: "By the numbers." Kinetic type cut to a 128 BPM beat: ~125 MB idle RAM
// (the rest stays with the game), 0 telemetry/ads/accounts for offline play, 4 steps then Play,
// 1 click for the OneClient FPS build, 2 mod sites in 1 honest search, 100% open source (GPL-3.0),
// then the end card: installs in 2 minutes.
(() => {
  const M = MR, S = SOUL, { ctx, W, H, TAU } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInOutCubic, easeInCubic } = M;
  const { C } = S;

  const B = 60 / 128;
  const SEG = [0, 5 * B, 9 * B, 13 * B, 17 * B, 21 * B];
  const END = 25 * B, DUR = END + 5.0;

  // number slam: scales in from big with two motion echoes
  function slam(parts, x, y, size, lt, opts = {}) {
    if (lt < 0) return;
    const e = clamp(lt / 0.13);
    for (let k = 2; k >= 1; k--) {
      const ek = clamp((lt - 0.02 * k) / 0.13);
      if (ek >= 1) continue;
      ctx.save();
      ctx.globalAlpha *= 0.18 * (1 - ek);
      S.title(parts, x, y, size, ek, { ...opts, slam: true });
      ctx.restore();
    }
    const bump = 1 + 0.06 * Math.exp(-Math.max(0, lt - 0.13) * 9) * (e >= 1 ? 1 : 0);
    ctx.save();
    ctx.translate(x, y); ctx.scale(bump, bump); ctx.translate(-x, -y);
    S.title(parts, x, y, size, e, { ...opts, slam: true });
    ctx.restore();
  }

  // ---------- 0. ~125 MB ----------
  function seg0(t, lt) {
    S.drawBg(t, { mint: 1.3 });
    S.embers(t, 16, 5, 0.6);
    S.kicker('SOUL LAUNCHER, BY THE NUMBERS', 540, 250, appear(t, -0.2, 0.3));
    const n = Math.round(125 * easeOutCubic(prog(lt, 0.05, 0.85)));
    const lock = lt - 0.85;
    const pulse = lock > 0 ? 1 + 0.1 * Math.exp(-lock * 8) : 1;
    ctx.save();
    ctx.translate(540, 750); ctx.scale(pulse, pulse); ctx.translate(-540, -750);
    S.title([{ t: `~${n}`, c: 'mint' }, { t: ' MB' }], 540, 750, 250, 1);
    ctx.restore();
    if (lock > 0) { S.shockwave(540, 750, lock, 'rgba(94,234,212,A)', 900); S.burst(540, 750, lock, 1.0, 0.7); }
    S.title([{ t: 'RAM while idling.' }], 540, 940, 76, appear(t, SEG[0] + 0.9, 0.3));
    // the memory bar: a mint sliver for the launcher, the rest fills with the game
    const be = appear(t, 1.05, 0.35);
    if (be > 0) {
      ctx.save();
      ctx.globalAlpha *= be;
      ctx.translate(0, (1 - be) * 40);
      S.kicker('YOUR RAM', 540, 1090, 1, C.dim, 24);
      S.card(90, 1130, 900, 130, { r: 28 });
      const x0 = 112, w = 856, y0 = 1152, h = 86;
      ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 18); ctx.fillStyle = '#0b0e13'; ctx.fill();
      ctx.save();
      ctx.shadowColor = S.MINT(0.9); ctx.shadowBlur = 20;
      ctx.fillStyle = C.mint;
      ctx.beginPath(); ctx.roundRect(x0, y0, 24, h, [18, 4, 4, 18]); ctx.fill();
      ctx.restore();
      const fe = easeInOutCubic(prog(t, 1.25, 1.85));
      if (fe > 0) {
        const g = ctx.createLinearGradient(x0 + 30, 0, x0 + w, 0);
        g.addColorStop(0, '#1f6fb8'); g.addColorStop(1, '#56bde8');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(x0 + 30, y0, (w - 30) * fe, h, [4, 18, 18, 4]); ctx.fill();
        ctx.save();
        ctx.globalAlpha *= prog(t, 1.6, 1.85);
        S.text('Minecraft gets the rest', x0 + 30 + (w - 30) / 2, y0 + h / 2 + 1, 34, '#ffffff', 'center', 800);
        ctx.restore();
      }
      ctx.fillStyle = C.mint;
      ctx.beginPath(); ctx.moveTo(x0 + 12, 1272); ctx.lineTo(x0 + 24, 1292); ctx.lineTo(x0, 1292); ctx.closePath(); ctx.fill();
      S.text('Soul Launcher', x0 - 2, 1322, 30, C.mint, 'left', 700);
      ctx.restore();
    }
  }

  // ---------- 1. zero ----------
  const ZERO_LINES = [[{ t: 'telemetry.' }], [{ t: 'ads.' }], [{ t: 'accounts for offline play.' }]];
  function seg1(t, lt) {
    ctx.fillStyle = C.mint;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = C.ink;
    for (let x = -H; x < W; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x + ((t * 60) % 90), H); ctx.lineTo(x + 40 + ((t * 60) % 90), H); ctx.lineTo(x + H + 40 + ((t * 60) % 90), 0); ctx.lineTo(x + H + ((t * 60) % 90), 0);
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(16, 18);
    slam([{ t: '0', c: '#1aa893' }], 540, 640, 620, lt, { dark: true });
    ctx.restore();
    slam([{ t: '0', c: C.ink }], 540, 640, 620, lt, { dark: true });
    ZERO_LINES.forEach((parts, i) => slam(parts, 540, 1060 + i * 132, i === 2 ? 82 : 112, lt - (i + 1) * B * 0.75, { dark: true, maxW: 940 }));
  }

  // ---------- 2. four steps ----------
  const STEPS = ['Version', 'Software', 'Content', 'Name'];
  const S2_PLAY = 2.5 * B, S2_CLICK = 3.2 * B;
  function seg2(t, lt) {
    const g = ctx.createRadialGradient(540, 900, 100, 540, 900, 1300);
    g.addColorStop(0, '#0f3a80'); g.addColorStop(1, '#040c1f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    S.embers(t, 14, 6, 0.5);
    slam([{ t: '4', c: 'gold' }, { t: ' steps.' }], 540, 520, 200, lt);
    STEPS.forEach((name, i) => {
      const x = i % 2 ? 790 : 290, y = 790 + Math.floor(i / 2) * 230;
      const e = prog(lt, B * 0.5 * (i + 1) - 0.1, B * 0.5 * (i + 1) + 0.12);
      if (e <= 0) return;
      const s = clamp(easeOutBack(e, 2.4), 0, 1.3);
      ctx.save();
      ctx.translate(x, y); ctx.scale(s, s); ctx.rotate((1 - clamp(e)) * (i % 2 ? 0.3 : -0.3));
      S.card(-220, -95, 440, 190, { r: 28, fill: 'rgba(8,22,52,0.92)', stroke: 'rgba(242,180,3,0.55)', glow: 14, glowColor: 'rgba(242,180,3,0.4)' });
      ctx.fillStyle = C.gold;
      ctx.beginPath(); ctx.arc(-140, 0, 44, 0, TAU); ctx.fill();
      S.text(String(i + 1), -140, 6, 56, '#2a1a00', 'center', 800, 'Baloo 2');
      S.title([{ t: name }], -70, 0, 64, 1, { align: 'left' });
      ctx.restore();
    });
    const press = lt > S2_CLICK ? Math.exp(-(lt - S2_CLICK) * 10) : 0;
    S.button('Then play', 540, 1300, 700, 150, prog(lt, S2_PLAY, S2_PLAY + 0.2), { icon: 'play', size: 64, press, glow: 50 });
    S.ripple(540, 1300, lt - S2_CLICK, S.MINT, 380);
    if (lt > S2_CLICK) S.burst(540, 1300, lt - S2_CLICK, 0.9, 0.5);
    const cp = S.path(lt, [[S2_PLAY, 1000, 1700], [S2_CLICK - 0.05, 700, 1330], [S2_CLICK + 0.5, 1100, 1650]]);
    if (lt > S2_PLAY && lt < S2_CLICK + 0.5) S.cursor(cp.x, cp.y, 1, press);
  }

  // ---------- 3. one click ----------
  const S3_CLICK = B, S3_DONE = 2 * B;
  function seg3(t, lt) {
    S.drawBg(t, { mint: 0.8, blue: 1.4 });
    // speed streaks
    ctx.save();
    for (let i = 0; i < 40; i++) {
      const a = hash(i * 3.7) * TAU, sp = (lt * (1.5 + hash(i)) + hash(i * 9)) % 1;
      const r0 = 200 + sp * 1100, len = 60 + sp * 220;
      ctx.strokeStyle = i % 3 ? S.CYAN(0.35 * (1 - sp)) : `rgba(255,255,255,${0.3 * (1 - sp)})`;
      ctx.lineWidth = 3 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(540 + Math.cos(a) * r0, 960 + Math.sin(a) * r0);
      ctx.lineTo(540 + Math.cos(a) * (r0 + len), 960 + Math.sin(a) * (r0 + len));
      ctx.stroke();
    }
    ctx.restore();
    slam([{ t: '1', c: 'mint' }, { t: ' click.' }], 540, 400, 200, lt);
    const ce = easeOutCubic(prog(lt, 0.05, 0.3));
    ctx.save();
    ctx.globalAlpha *= ce;
    ctx.translate(0, (1 - ce) * 80);
    S.card(110, 560, 860, 440, { r: 34, stroke: S.MINT(0.45), glow: 18, glowColor: S.MINT(0.35) });
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    [[184, 610], [156, 652], [176, 652], [166, 688], [198, 640], [178, 640], [192, 610]].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.shadowColor = 'rgba(242,180,3,0.7)'; ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
    S.title([{ t: 'OneClient' }], 220, 640, 76, 1, { align: 'left' });
    S.text('Tuned Fabric FPS build', 160, 712, 32, C.dim, 'left', 600);
    [['Sodium', '#5eead4'], ['Lithium', '#56bde8'], ['Iris', '#b48cff'], ['+ more', C.dim]].reduce((x, [s, col], i) => {
      const w = S.width(s, 26, 700) + (col === C.dim ? 48 : 72);
      S.pill(s, x + w / 2, 800, prog(lt, 0.15 + i * 0.07, 0.35 + i * 0.07), { size: 26, dot: col === C.dim ? null : col, pad: 24 });
      return x + w + 14;
    }, 160);
    // install button fills, then flips to Installed
    const press = lt > S3_CLICK ? Math.exp(-(lt - S3_CLICK) * 10) : 0;
    const fill = easeInOutCubic(prog(lt, S3_CLICK + 0.05, S3_DONE));
    const done = lt > S3_DONE;
    const bx = 540, by = 910, bw = 760, bh = 104;
    ctx.save();
    ctx.translate(bx, by); ctx.scale(1 - 0.06 * press, 1 - 0.06 * press);
    ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.fillStyle = done ? C.mint : '#1d2630';
    ctx.shadowColor = S.MINT(0.6); ctx.shadowBlur = done ? 40 : 0;
    ctx.fill();
    ctx.shadowBlur = 0;
    if (!done && fill > 0) {
      ctx.save(); ctx.clip();
      ctx.fillStyle = S.MINT(0.85);
      ctx.fillRect(-bw / 2, -bh / 2, bw * fill, bh);
      ctx.restore();
    }
    ctx.strokeStyle = C.mint; ctx.lineWidth = 3;
    ctx.stroke();
    if (done) { S.icon('check', -110, 0, 40, C.ink); S.text('Installed', 20, 4, 46, C.ink, 'center', 800, 'Baloo 2'); }
    else S.text(fill > 0 ? 'Installing…' : 'Install OneClient', 0, 4, 46, fill > 0.5 ? C.ink : C.mint, 'center', 800, 'Baloo 2');
    ctx.restore();
    ctx.restore();
    const cp = S.path(lt, [[0.1, 1000, 1700], [S3_CLICK - 0.05, 760, 935], [S3_CLICK + 0.5, 1100, 1600]]);
    if (lt > 0.1 && lt < S3_CLICK + 0.5) S.cursor(cp.x, cp.y, 1, press);
    // FPS gauge revs up
    const ge = appear(t, SEG[3] + 0.5, 0.3);
    if (ge > 0) {
      const gx = 540, gy = 1380, r = 230;
      ctx.save();
      ctx.globalAlpha *= ge;
      ctx.lineCap = 'round';
      ctx.lineWidth = 34;
      ctx.strokeStyle = '#1d2630';
      ctx.beginPath(); ctx.arc(gx, gy, r, Math.PI, TAU); ctx.stroke();
      const v = clamp(easeOutBack(prog(lt, S3_DONE, S3_DONE + 0.6), 1.6), 0, 1.04);
      const a = Math.PI + v * Math.PI * 0.92;
      const grad = ctx.createLinearGradient(gx - r, 0, gx + r, 0);
      grad.addColorStop(0, '#2a86c9'); grad.addColorStop(0.6, C.cyan); grad.addColorStop(1, C.mint);
      ctx.strokeStyle = grad;
      ctx.shadowColor = S.MINT(0.8); ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.arc(gx, gy, r, Math.PI, Math.max(Math.PI + 0.01, a)); ctx.stroke();
      ctx.shadowBlur = 0;
      for (let k = 0; k <= 10; k++) {
        const ka = Math.PI + k / 10 * Math.PI;
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(gx + Math.cos(ka) * (r - 40), gy + Math.sin(ka) * (r - 40)); ctx.lineTo(gx + Math.cos(ka) * (r - 58), gy + Math.sin(ka) * (r - 58)); ctx.stroke();
      }
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(a) * (r - 70), gy + Math.sin(a) * (r - 70)); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(gx, gy, 20, 0, TAU); ctx.fill();
      S.title([{ t: 'FPS', c: v > 0.5 ? 'mint' : undefined }], gx, gy - 92, 64, 1);
      ctx.restore();
    }
  }

  // ---------- 4. two mod sites, one search ----------
  const QUERY = 'sodium', Q0 = 0.55, Q_DT = 0.045;
  const RESULTS = [
    { name: 'Sodium', src: 'Modrinth', ok: true, t: 1.0 },
    { name: 'Sodium Extra', src: 'CurseForge', ok: true, t: 1.12 },
    { name: 'An old zoom mod', src: 'CurseForge', ok: false, t: 1.24 },
  ];
  function seg4(t, lt) {
    S.drawBg(t, { mint: 1.1 });
    slam([{ t: '2', c: 'gold' }, { t: ' mod sites.' }], 540, 330, 124, lt);
    slam([{ t: '1', c: 'mint' }, { t: ' search.' }], 540, 460, 124, lt - B);
    const merge = easeInOutCubic(prog(lt, 0.25, 0.55));
    [['Modrinth', '#1bd96a', 300], ['CurseForge', '#f16436', 780]].forEach(([s, col, x]) => {
      if (merge >= 1) return;
      ctx.save();
      ctx.globalAlpha *= 1 - merge;
      S.pill(s, lerp(x, 540, merge), lerp(610, 680, merge), prog(lt, 0.02, 0.2), { size: 34, dot: col, pad: 34 });
      ctx.restore();
    });
    const se = prog(lt, 0.45, 0.62);
    if (se > 0) {
      ctx.save();
      ctx.globalAlpha *= se;
      S.card(110, 630, 860, 104, { r: 52, stroke: S.MINT(0.6), glow: 16, glowColor: S.MINT(0.3) });
      ctx.strokeStyle = C.dim; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(176, 676, 18, 0, TAU); ctx.moveTo(190, 690); ctx.lineTo(204, 704); ctx.stroke();
      const n = clamp(Math.floor((lt - Q0) / Q_DT) + 1, 0, QUERY.length);
      const typed = lt > Q0 ? QUERY.slice(0, n) : '';
      S.text(typed || 'Search Modrinth + CurseForge', 232, 683, 38, typed ? C.text : C.faint, 'left', 600);
      if (typed && Math.floor(t * 4) % 2) { ctx.fillStyle = C.mint; ctx.fillRect(238 + S.width(typed, 38, 600), 660, 4, 46); }
      S.pill('1.21.1', 790, 682, 1, { size: 22, pad: 16, color: C.mint, stroke: S.MINT(0.5), family: 'JetBrains Mono', weight: 500 });
      S.pill('Fabric', 900, 682, 1, { size: 22, pad: 16, color: '#e3cf9f', stroke: 'rgba(227,207,159,0.5)' });
      ctx.restore();
    }
    RESULTS.forEach((r, i) => {
      const e = appear(t, SEG[4] + r.t, 0.25);
      if (e <= 0) return;
      const y = 830 + i * 124;
      ctx.save();
      ctx.globalAlpha *= e;
      ctx.translate((1 - e) * 100, 0);
      S.card(110, y - 52, 860, 104, { r: 24, stroke: r.ok ? C.line : 'rgba(255,181,71,0.55)' });
      ctx.fillStyle = r.ok ? ['#5eead4', '#56bde8'][i] : '#6b7684';
      ctx.beginPath(); ctx.roundRect(140, y - 30, 60, 60, 14); ctx.fill();
      S.text(r.name, 226, y - 14, 34, C.text, 'left', 700);
      S.text(r.src, 226, y + 22, 24, C.dim, 'left', 500);
      if (r.ok) {
        S.pill('Add', 880, y, 1, { size: 26, pad: 30, color: C.ink, fill: C.mint, stroke: C.mint });
      } else {
        S.pill('No 1.21.1 build', 840, y, 1, { size: 24, pad: 22, color: C.amber, stroke: 'rgba(255,181,71,0.7)', fill: 'rgba(255,181,71,0.1)' });
      }
      ctx.restore();
    });
    S.title([{ t: 'No silent latest.', c: 'mint' }], 540, 1250, 76, appear(t, SEG[4] + 1.36, 0.3));
    const ne = appear(t, SEG[4] + 1.5, 0.3);
    if (ne > 0) {
      ctx.save();
      ctx.globalAlpha *= ne;
      S.text('It tells you when nothing fits your setup.', 540, 1340, 34, C.dim, 'center', 600);
      ctx.restore();
    }
  }

  // ---------- 5. open source ----------
  const CODE = ['const space = createSpace(version, loader);', 'await java.ensure(space.javaVersion);', 'linkShared(category, "servers.dat");',
    'linkShared(category, "options.txt");', 'if (!compatible) return say("no build");', 'export function launch(space) {', '  // no telemetry here', 'resolveContent(space, query);',
    'installLoader(space.loader);', 'spaces.forEach(watchServers);'];
  function seg5(t, lt) {
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    for (let c = 0; c < 3; c++) {
      for (let r = 0; r < 26; r++) {
        const y = ((r * 80 - t * (90 + c * 40)) % 2080 + 2080) % 2080 - 80;
        ctx.globalAlpha = 0.07 + 0.04 * hash(r + c * 31);
        S.text(CODE[(r * 3 + c * 7) % CODE.length], 40 + c * 360, y, 24, C.mint, 'left', 500, 'JetBrains Mono');
      }
    }
    ctx.restore();
    S.blob(540, 820, 760, 'rgba(5,7,10,0.9)');
    S.blob(540, 760, 700, S.MINT(0.14));
    slam([{ t: '100%', c: 'mint' }], 540, 560, 280, lt);
    slam([{ t: 'open source.' }], 540, 770, 118, lt - B * 0.75);
    // GPL stamp
    const st = lt - B * 1.5;
    if (st > 0) {
      const e = clamp(st / 0.12);
      const s = lerp(2.4, 1, easeInCubic(e)) * (1 + 0.05 * Math.exp(-Math.max(0, st - 0.12) * 10));
      ctx.save();
      ctx.globalAlpha *= clamp(e * 2);
      ctx.translate(540, 1030);
      ctx.rotate(-0.09);
      ctx.scale(s, s);
      ctx.beginPath(); ctx.roundRect(-250, -86, 500, 172, 26);
      ctx.strokeStyle = C.mint; ctx.lineWidth = 10;
      ctx.shadowColor = S.MINT(0.7); ctx.shadowBlur = 26;
      ctx.stroke();
      ctx.shadowBlur = 0;
      S.title([{ t: 'GPL-3.0', c: 'mint' }], 0, 0, 120, 1);
      ctx.restore();
    }
    const ce = appear(t, SEG[5] + 1.15, 0.3);
    if (ce > 0) {
      ctx.save();
      ctx.globalAlpha *= ce;
      S.pill('npm ci && npm run dist', 540, 1250 + (1 - ce) * 20, 1, { size: 32, family: 'JetBrains Mono', weight: 500, pad: 34, color: C.text });
      S.text('Don’t trust a binary? Build it yourself.', 540, 1350 + (1 - ce) * 20, 36, C.dim, 'center', 600);
      ctx.restore();
    }
  }

  // diagonal slice wipe that covers each cut
  function slices(t, tb) {
    const cols = [C.mint, C.sky, '#ffffff'];
    for (let k = 0; k < 3; k++) {
      const p = (t - (tb - 0.13) - k * 0.035) / 0.26;
      if (p <= 0 || p >= 1) continue;
      const x = lerp(-1500, 1700, easeInOutCubic(p));
      ctx.fillStyle = cols[k];
      ctx.beginPath();
      ctx.moveTo(x, -50); ctx.lineTo(x + 520, -50); ctx.lineTo(x + 520 - 900, H + 50); ctx.lineTo(x - 900, H + 50);
      ctx.closePath();
      ctx.fill();
    }
  }

  const SEGS = [seg0, seg1, seg2, seg3, seg4, seg5];
  function render(t) {
    if (t >= END) {
      S.endCard(t, END, { top: [[{ t: 'Installs in ' }, { t: '2 minutes.', c: 'mint' }]] });
    } else {
      let i = SEGS.length - 1;
      while (t < SEG[i]) i--;
      const lt = t - SEG[i];
      // punch-in on every cut, plus a little shake
      const z = i > 0 ? 1 + 0.07 * Math.exp(-lt * 9) : 1;
      const sh = i > 0 ? M.shake(t, SEG[i], 14, 0.3) : { x: 0, y: 0 };
      ctx.save();
      ctx.translate(540 + sh.x, 960 + sh.y); ctx.scale(z, z); ctx.translate(-540, -960);
      SEGS[i](t, lt);
      ctx.restore();
    }
    SEG.slice(1).concat([END]).forEach((tb) => slices(t, tb));
  }

  function events() {
    const ev = [];
    for (let tt = 0.05; tt < 0.85; tt += 0.045) ev.push({ type: 'tick', t: tt, gain: 0.7 });
    ev.push({ type: 'impact', t: 0.85, gain: 0.8 }, { type: 'sparkle', t: 0.88, note: 86 });
    ev.push({ type: 'pop', t: 0.9, note: 72 }, { type: 'swipe', t: 1.05, gain: 0.5 }, { type: 'riser', t: 1.25, end: 1.85, gain: 0.5 });
    ev.push({ type: 'ding', t: 1.85, note: 84 });
    SEG.slice(1).concat([END]).forEach((tb) => ev.push({ type: 'whoosh', t: tb, gain: 0.7 }, { type: 'hit', t: tb }));
    ZERO_LINES.forEach((_, i) => ev.push({ type: 'pop', t: SEG[1] + (i + 1) * B * 0.75, note: 76 + i * 3, gain: 1.2 }, { type: 'hit', t: SEG[1] + (i + 1) * B * 0.75, gain: 0.5 }));
    STEPS.forEach((_, i) => ev.push({ type: 'pop', t: SEG[2] + B * 0.5 * (i + 1), note: 72 + [0, 4, 7, 12][i] }));
    ev.push({ type: 'swipe', t: SEG[2] + S2_PLAY, gain: 0.6 }, { type: 'cta_click', t: SEG[2] + S2_CLICK });
    ev.push({ type: 'uiclick', t: SEG[3] + S3_CLICK }, { type: 'riser', t: SEG[3] + S3_CLICK, end: SEG[3] + S3_DONE, gain: 0.6 });
    ev.push({ type: 'levelup', t: SEG[3] + S3_DONE, note: 76 }, { type: 'zap', t: SEG[3] + S3_DONE + 0.05, gain: 0.5 });
    for (let i = 0; i < QUERY.length; i++) ev.push({ type: 'typing', t: SEG[4] + Q0 + i * Q_DT });
    ev.push({ type: 'pop', t: SEG[4] + B, note: 79 });
    RESULTS.forEach((r, i) => ev.push({ type: r.ok ? 'pop' : 'beep', t: SEG[4] + r.t, note: r.ok ? 79 + i * 3 : 60, d: 0.12 }));
    ev.push({ type: 'ding', t: SEG[4] + 1.36, note: 88 });
    ev.push({ type: 'pop', t: SEG[5] + B * 0.75, note: 74 }, { type: 'stamp', t: SEG[5] + B * 1.5 + 0.12 });
    ev.push({ type: 'pop', t: SEG[5] + 1.15, note: 79, gain: 0.6 });
    return ev.concat(S.endCardEvents(END));
  }

  S.start({ duration: DUR, cover: 0.95, render, events, B, SEG });
})();
