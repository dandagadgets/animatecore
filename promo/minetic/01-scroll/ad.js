// Minetic Media Ad 1: "Stop the Scroll." A feed of boring server ads gets swiped straight past
// ("Nobody stops scrolling."), then a Minetic Media ad makes the thumb stop dead. A montage of
// real portfolio work plays in the phone while feature stickers slap on around it, then
// "Your server could be next." and the Join the Discord end card.
(() => {
  const M = MR, { ctx, W, H, TAU } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInOutCubic, easeInCubic } = M;
  const { C } = MM;

  const STOP = 3.0, LOCK = 3.32, MONT = 4.3, NEXT = 10.6, END = 12.6, DUR = 18.0;
  const PX = 540, PY = 1000, PW = 520;

  // ---------- boring ads ----------
  function boringA(x, y, w, h) {
    ctx.fillStyle = '#c4c4c4';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#111';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '400 54px serif';
    ctx.fillText('JOIN MY', x + w / 2, y + h * 0.2);
    ctx.fillText('SERVER!!!', x + w / 2 + 6, y + h * 0.27);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(M.TEX.grass, x + w * 0.3, y + h * 0.36, w * 0.4, w * 0.3);
    ctx.fillStyle = '#1a3fd6';
    ctx.font = '400 30px serif';
    ctx.fillText('play.myserver.net', x + w / 2, y + h * 0.62);
    ctx.fillRect(x + w / 2 - 118, y + h * 0.62 + 16, 236, 2);
    ctx.fillStyle = '#333';
    ctx.font = '400 26px serif';
    ctx.fillText('we have survival and stuff', x + w / 2, y + h * 0.69);
  }
  function boringB(x, y, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffee00';
    ctx.font = '900 64px sans-serif';
    ctx.fillText('BEST', x + w / 2, y + h * 0.3);
    ctx.fillText('SERVER', x + w / 2, y + h * 0.38);
    ctx.fillText('EVER', x + w / 2, y + h * 0.46);
    ctx.fillStyle = '#fff';
    ctx.font = '400 26px sans-serif';
    ctx.fillText('(not clickbait)', x + w / 2, y + h * 0.54);
  }
  function boringC(x, y, w, h) {
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(x, y, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#888';
    ctx.font = '400 40px sans-serif';
    ctx.fillText('pls join', x + w / 2, y + h * 0.42);
    ctx.fillText(':(', x + w / 2, y + h * 0.5);
    ctx.font = '400 22px sans-serif';
    ctx.fillText('ip in bio', x + w / 2, y + h * 0.58);
  }
  const SCREENS = [boringA, boringB, boringC, boringA, boringB, boringC];

  // feed position: 0..5 are boring ads, 6 is the Minetic ad. Each key is [t, pos].
  const FEED = [[0, 0], [1.0, 0], [1.25, 1], [1.7, 1], [1.95, 2], [2.32, 2], [2.44, 3], [2.56, 4], [2.68, 5], [STOP, 5], [STOP + 0.2, 5.86], [LOCK, 6]];
  function feedPos(t) {
    for (let i = 1; i < FEED.length; i++) {
      const [t0, p0] = FEED[i - 1], [t1, p1] = FEED[i];
      if (t <= t1) return lerp(p0, p1, i === FEED.length - 1 ? easeOutBack(prog(t, t0, t1), 3) : easeInOutCubic(prog(t, t0, t1)));
    }
    return 6;
  }
  const SWIPES = [1.0, 1.7, 2.32, 2.44, 2.56, STOP];

  function screenAt(i, t) {
    if (i < 6) return { draw: SCREENS[i] };
    return { img: MM.clip('boss', t - STOP + 0.2) };
  }

  function feed(x, y, w, h, t) {
    const pos = feedPos(t);
    const i0 = Math.floor(pos), f = pos - i0;
    [i0, i0 + 1].forEach((i, k) => {
      if (i > 6 || i < 0) return;
      const oy = y + (k - f) * h;
      if (oy > y + h || oy + h < y) return;
      const s = screenAt(i, t);
      ctx.save();
      ctx.beginPath(); ctx.rect(x, oy, w, h); ctx.clip();
      if (s.draw) s.draw(x, oy, w, h);
      else if (s.img) {
        const kk = Math.max(w / s.img.width, h / s.img.height);
        ctx.drawImage(s.img, x + (w - s.img.width * kk) / 2, oy + (h - s.img.height * kk) / 2, s.img.width * kk, s.img.height * kk);
      }
      MM.shortsUi(x, oy, w, h, { name: i < 6 ? '@myserver' : '@yourserver', liked: i === 6 && t > LOCK + 0.3, progress: i === 6 ? 0.3 : 0.1 });
      ctx.restore();
    });
    // the thumb: a touch dot that drags up on each swipe
    SWIPES.forEach((s, k) => {
      const d = k === SWIPES.length - 1 ? 0.3 : (k >= 2 && k <= 4 ? 0.12 : 0.25);
      const e = prog(t, s - 0.08, s + d);
      if (e <= 0 || e >= 1) return;
      const yy = lerp(y + h * 0.8, y + h * (k === SWIPES.length - 1 ? 0.5 : 0.3), easeOutCubic(e));
      ctx.fillStyle = `rgba(255,255,255,${0.55 * Math.sin(e * Math.PI)})`;
      ctx.beginPath(); ctx.arc(x + w * 0.55, yy, 34, 0, TAU); ctx.fill();
    });
  }

  // ---------- montage ----------
  const MONTAGE = ['chaos', 'worlds', 'loot', 'numbers', 'crates', 'spaces', 'launch', 'season'];
  const STEP = 0.79;
  function montageClip(t) {
    const k = clamp(Math.floor((t - MONT) / STEP), 0, MONTAGE.length - 1);
    return { id: MONTAGE[k], lt: t - MONT - k * STEP + 0.4, cut: MONT + k * STEP };
  }

  const STICKERS = [
    { t: 5.0, text: 'CUSTOM ANIMATION', x: 280, y: 760, rot: -0.07, col: C.cyan },
    { t: 6.2, text: 'NO-COPYRIGHT MUSIC', x: 760, y: 990, rot: 0.05, col: C.gold },
    { t: 7.4, text: 'BUILT FOR SHORTS', x: 290, y: 1210, rot: 0.04, col: C.cyan },
    { t: 8.6, text: '3 STYLES TO TEST', x: 760, y: 1420, rot: -0.05, col: C.gold },
  ];
  function sticker(s, t) {
    const e = prog(t, s.t, s.t + 0.18);
    const out = prog(t, NEXT - 0.5, NEXT - 0.2);
    if (e <= 0 || out >= 1) return;
    const sc = lerp(1.8, 1, easeOutCubic(e)) * (1 - out);
    ctx.save();
    ctx.translate(s.x + out * (s.x < 540 ? -500 : 500), s.y);
    ctx.rotate(s.rot);
    ctx.scale(sc, sc);
    ctx.globalAlpha *= clamp(e * 3);
    MM.chip(s.text, 0, 0, 1, s.col, 28);
    ctx.restore();
  }

  // ---------- "your server could be next" placeholder screen ----------
  function placeholder(x, y, w, h, t) {
    ctx.fillStyle = '#04122a';
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.setLineDash([18, 12]);
    ctx.lineDashOffset = -t * 30;
    ctx.strokeStyle = MM.CYAN(0.7 + 0.3 * Math.sin(t * 6));
    ctx.lineWidth = 5;
    ctx.strokeRect(x + 24, y + 24, w - 48, h - 48);
    ctx.restore();
    M.label('YOUR', x + w / 2, y + h * 0.42, 40, C.white, 'center', 3, 700);
    M.label('SERVER', x + w / 2, y + h * 0.5, 40, C.cyan, 'center', 3, 700);
    M.label('HERE', x + w / 2, y + h * 0.58, 40, C.white, 'center', 3, 700);
  }

  // ---------- frame ----------
  function render(t) {
    if (t >= END) { MM.endCard(t, END); return; }
    const sh = M.shake(t, LOCK, 18, 0.4);
    ctx.save();
    ctx.translate(sh.x, sh.y);
    if (sh.x || sh.y) { ctx.translate(540, 960); ctx.scale(1.03, 1.03); ctx.translate(-540, -960); }
    MM.drawBg(t, t < STOP ? 0.4 : 1);
    MM.sparkles(t, t < STOP ? 6 : 26, 1, t < STOP ? 0.4 : 1);

    // phone: feed until the montage, then cycling clips, then shrinking into the placeholder
    const shrink = easeInOutCubic(prog(t, NEXT - 0.35, NEXT + 0.15));
    const zoom = t > MONT ? 1 + 0.03 * Math.sin((t - MONT) * 1.3) : 1;
    const pw = lerp(PW, 330, shrink) * zoom;
    const py = lerp(PY, 1190, shrink);
    const rot = t > MONT ? lerp(0.025 * Math.sin((t - MONT) * 1.7), 0, shrink) : 0;
    const glowing = t > LOCK - 0.05;
    let opts = { rot, glow: glowing ? 36 + 12 * Math.sin(t * 5) : 0 };
    if (t < MONT) {
      opts.screen = (x, y, w, h) => feed(x, y, w, h, t);
    } else if (t < NEXT) {
      const m = montageClip(t);
      opts.img = MM.clip(m.id, m.lt);
      opts.screen = (x, y, w, h) => {
        const f = 1 - prog(t, m.cut, m.cut + 0.12);
        if (f > 0 && t > MONT + 0.05) { ctx.fillStyle = `rgba(255,255,255,${0.7 * f})`; ctx.fillRect(x, y, w, h); }
        MM.shortsUi(x, y, w, h, { liked: true, progress: (t - m.cut) / STEP });
      };
    } else {
      opts.screen = (x, y, w, h) => placeholder(x, y, w, h, t);
    }
    if (t >= MONT && t < NEXT) {
      const m = montageClip(t);
      const bump = 1 + 0.04 * Math.exp(-(t - m.cut) * 12);
      opts.scale = bump;
      // what kind of ad this is
      const le = prog(t, m.cut, m.cut + 0.15);
      M.label(MM.clipLabel(m.id), 540, py - pw * 1.01 - 40, 30, MM.CYAN(le * (1 - shrink)), 'center', 4, 700);
    }
    MM.phone(PX, py, pw, opts);

    // "SCROLL STOPPED" stamp when the thumb stops
    const st = prog(t, LOCK, LOCK + 0.12);
    const stOut = prog(t, MONT - 0.25, MONT);
    if (st > 0 && stOut < 1) {
      ctx.save();
      ctx.translate(560, 640);
      ctx.rotate(-0.12);
      ctx.scale(lerp(2.2, 1, easeInCubic(st)), lerp(2.2, 1, easeInCubic(st)));
      ctx.globalAlpha *= (1 - stOut);
      M.pixelRectPath(-330, -62, 660, 124, 10);
      ctx.fillStyle = 'rgba(3,16,31,0.85)';
      ctx.fill();
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 8;
      ctx.shadowColor = C.gold;
      ctx.shadowBlur = 24;
      ctx.stroke();
      ctx.shadowBlur = 0;
      M.label('SCROLL STOPPED', 0, 4, 50, C.gold, 'center', 4, 700);
      ctx.restore();
    }
    if (t > LOCK + 0.3 && t < LOCK + 1.2) MM.burst(PX + PW * 0.4, PY + PW * 0.15, t - LOCK - 0.3, 0.9, 0.35);

    STICKERS.forEach((s) => sticker(s, t));

    // captions
    if (t < 2.1) {
      M.caption([[{ t: 'Your server ad' }], [{ t: 'right now:' }]], 540, 300, 78, appear(t, -0.15, 0.3));
    } else if (t < STOP - 0.25) {
      M.caption([[{ t: 'Nobody stops' }], [{ t: 'scrolling.', c: '#ff6b6b' }]], 540, 300, 78, appear(t, 2.1, 0.25));
    } else if (t < MONT) {
      M.caption([[{ t: 'With a ' }, { t: 'Minetic Media', c: C.cyan }], [{ t: 'ad:' }]], 540, 300, 74, appear(t, STOP - 0.25, 0.25));
    } else if (t < NEXT - 0.3) {
      MM.hl([{ t: 'ADS THAT ' }, { t: 'STOP', c: 'cyan' }], 540, 240, 92, appear(t, MONT, 0.3));
      MM.hl([{ t: 'THE SCROLL.', c: 'gold' }], 540, 345, 92, appear(t, MONT + 0.1, 0.3));
    } else {
      MM.hl([{ t: 'YOUR SERVER' }], 540, 560, 110, appear(t, NEXT - 0.1, 0.35));
      MM.hl([{ t: 'COULD BE ', c: 'cyan' }, { t: 'NEXT.', c: 'gold' }], 540, 680, 110, appear(t, NEXT + 0.1, 0.35));
    }
    ctx.restore();
    M.flash(t, LOCK, 0.5, 7, '200,250,255');
  }

  function events() {
    const ev = [];
    SWIPES.slice(0, 5).forEach((s, i) => ev.push({ type: 'swipe', t: s + 0.05, gain: i >= 2 ? 0.5 : 0.8 }));
    ev.push({ type: 'womp', t: 2.1 });
    ev.push({ type: 'swipe', t: STOP + 0.05 }, { type: 'riser', t: STOP - 0.6, end: LOCK, gain: 0.6 });
    ev.push({ type: 'impact', t: LOCK }, { type: 'stamp', t: LOCK });
    ev.push({ type: 'pop', t: LOCK + 0.3, note: 84 }, { type: 'sparkle', t: LOCK + 0.32, note: 88 });
    ev.push({ type: 'swipe', t: MONT - 0.05, gain: 0.6 });
    MONTAGE.forEach((_, k) => ev.push({ type: 'hit', t: MONT + k * STEP, gain: 0.45 }));
    STICKERS.forEach((s, i) => ev.push({ type: 'slap', t: s.t + 0.12 }, { type: 'pop', t: s.t + 0.14, note: 76 + [0, 3, 7, 10][i] }));
    ev.push({ type: 'swipe', t: NEXT - 0.3 }, { type: 'pop', t: NEXT - 0.05, note: 72 }, { type: 'pop', t: NEXT + 0.15, note: 79 });
    return ev.concat(MM.endCardEvents(END));
  }

  MM.start({ duration: DUR, cover: 3.9, render, events });
})();
