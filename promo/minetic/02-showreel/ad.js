// Minetic Media Ad 2: "Showreel." Cut to a 128 BPM beat: WE MAKE / MINECRAFT / SERVER ADS slam in
// over strobing clips, then a carousel of floating phones plays real portfolio work, one ad type
// per two beats (boss trailers, comedy ads, server lists...). It pulls back into a wall of
// phones with an empty "your server here" slot in the middle -> Join the Discord end card.
(() => {
  const M = MR, { ctx, W, H } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInOutCubic } = M;
  const { C } = MM;

  const B = 60 / 128;
  const CAR0 = 4 * B, SEG = 2 * B, WALL = 20 * B, END = 24 * B, DUR = END + 5.25;
  const ORDER = ['boss', 'chaos', 'worlds', 'season', 'loot', 'numbers', 'crates', 'launch'];
  const WALL_CLIPS = ['spaces', 'boss', 'loot', 'worlds', null, 'chaos', 'build', 'crowd', 'numbers'];
  const beatPulse = (t) => Math.exp(-(((t % B) + B) % B) * 9);

  // ---------- intro: words slam on the beat over strobing clips ----------
  const WORDS = [
    [0, [{ t: 'WE MAKE' }], 760, 150],
    [1, [{ t: 'MINECRAFT', c: 'cyan' }], 920, 160],
    [2, [{ t: 'SERVER ADS', c: 'gold' }], 1080, 150],
  ];
  function slam(parts, y, size, lt) {
    if (lt < 0) return;
    const e = clamp(lt / 0.12);
    MM.hl(parts, 540, y, size, easeOutCubic(e), { slam: true });
  }
  function intro(t) {
    MM.drawBg(t);
    const b = Math.floor(t / B);
    // a dimmed full-screen clip flashes behind on every beat
    const img = MM.clip(ORDER[(b * 3) % ORDER.length], (t % B) + 0.6);
    if (img) {
      ctx.save();
      ctx.globalAlpha = 0.22 * beatPulse(t) + 0.08;
      const k = Math.max(W / img.width, H / img.height);
      ctx.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k);
      ctx.restore();
    }
    MM.sparkles(t, 30, 2);
    const sh = b === 3 ? M.shake(t, 3 * B, 16, 0.4) : { x: 0, y: 0 };
    ctx.save();
    ctx.translate(sh.x, sh.y);
    WORDS.forEach(([beat, parts, y, size]) => slam(parts, y, size, t - beat * B + (beat === 0 ? 0.1 : 0)));
    ctx.restore();
    M.label('A MINETIC MEDIA SHOWREEL', 540, 1260, 30, MM.CYAN(appear(t, 3 * B, 0.25)), 'center', 4, 700);
  }

  // ---------- carousel of phones ----------
  function carousel(t) {
    MM.drawBg(t, 1.2);
    MM.sparkles(t, 26, 3);
    const s = (t - CAR0) / SEG;
    const seg = Math.floor(s);
    // each segment starts with the next phone sliding into the middle
    const u = seg - 1 + easeInOutCubic(clamp((s - seg) / 0.28));
    const pulse = 1 + 0.025 * beatPulse(t);
    const items = [];
    for (let j = seg - 2; j <= seg + 3; j++) {
      if (j < 0 || j >= ORDER.length) continue;
      const p = j - u;
      if (Math.abs(p) > 2.2) continue;
      items.push({ j, p });
    }
    items.sort((a, b) => Math.abs(b.p) - Math.abs(a.p));
    items.forEach(({ j, p }) => {
      const ap = Math.abs(p);
      const w = lerp(500, 290, clamp(ap)) * (ap < 0.5 ? pulse : 1);
      const x = 540 + p * 410;
      const y = 1040 + clamp(ap) * 50;
      const centre = ap < 0.5;
      MM.phone(x, y, w, {
        rot: p * 0.13,
        img: MM.clip(ORDER[j], t - CAR0 - j * SEG + 0.5),
        glow: centre ? 34 + 14 * beatPulse(t) : 0,
        alpha: 1 - clamp(ap - 1.4) * 1.2,
        screen: (sx, sy, sw, sh) => {
          if (!centre) { ctx.fillStyle = 'rgba(2,11,29,0.45)'; ctx.fillRect(sx, sy, sw, sh); }
        },
      });
    });
    // what kind of ad is in the middle
    const cur = clamp(seg, 0, ORDER.length - 1);
    const le = prog(t, CAR0 + cur * SEG + 0.08, CAR0 + cur * SEG + 0.24);
    M.label('WE MAKE', 540, 210, 34, C.cyan, 'center', 6, 700);
    MM.hl([{ t: MM.clipLabel(ORDER[cur]), c: cur % 2 ? 'gold' : 'cyan' }], 540, 330, 104, le, { slam: true });
    // progress pips
    ORDER.forEach((_, k) => M.pixelSquare(540 + (k - 3.5) * 34, 1640, k === cur ? 18 : 12, k === cur ? C.gold : 'rgba(255,255,255,0.35)', k === cur ? 12 : 0));
  }

  // ---------- the wall ----------
  function placeholder(x, y, w, h, t) {
    ctx.fillStyle = '#04122a';
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.setLineDash([14, 10]);
    ctx.lineDashOffset = -t * 30;
    ctx.strokeStyle = MM.CYAN(0.6 + 0.4 * Math.sin(t * 6));
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 16, y + 16, w - 32, h - 32);
    ctx.restore();
    ['YOUR', 'SERVER', 'HERE'].forEach((s, i) => M.label(s, x + w / 2, y + h * (0.42 + i * 0.08), 28, i === 1 ? C.gold : C.white, 'center', 3, 700));
  }
  function wall(t) {
    MM.drawBg(t, 1.3);
    const lt = t - WALL;
    const z = lerp(2.2, 1, easeOutCubic(prog(lt, 0, 0.5)));
    ctx.save();
    ctx.translate(540, 1130); ctx.scale(z, z); ctx.translate(-540, -1130);
    WALL_CLIPS.forEach((id, i) => {
      const cx = 240 + (i % 3) * 300, cy = 640 + Math.floor(i / 3) * 490;
      const pop = easeOutBack(prog(lt, 0.05 + hash(i) * 0.25, 0.35 + hash(i) * 0.25), 2);
      if (!id) {
        MM.phone(cx, cy, 240 * (0.9 + 0.1 * pop), { glow: 30 + 16 * beatPulse(t), glowColor: C.gold, screen: (x, y, w, h) => placeholder(x, y, w, h, t) });
      } else {
        MM.phone(cx, cy, 240 * clamp(pop, 0, 1.1), { img: MM.clip(id, lt + i * 0.37), alpha: 0.85 });
      }
    });
    ctx.restore();
    const band = appear(t, WALL + 0.35, 0.3);
    if (band > 0) {
      ctx.fillStyle = `rgba(2,11,29,${0.7 * band})`;
      ctx.fillRect(0, 160, W, 250);
    }
    MM.hl([{ t: 'YOUR SERVER' }], 540, 235, 104, appear(t, WALL + 0.4, 0.3));
    MM.hl([{ t: 'IS ', c: 'cyan' }, { t: 'NEXT.', c: 'gold' }], 540, 345, 104, appear(t, WALL + 0.55, 0.3), { slam: true });
  }

  function render(t) {
    if (t >= END) { MM.endCard(t, END); return; }
    if (t < CAR0) intro(t);
    else if (t < WALL) carousel(t);
    else wall(t);
    // beat flash on the section changes
    [CAR0, WALL].forEach((tb) => M.flash(t, tb, 0.6, 8, '210,250,255'));
  }

  function events() {
    const ev = [];
    WORDS.forEach(([beat]) => ev.push({ type: 'hit', t: beat * B, gain: 0.9 }, { type: 'pop', t: beat * B, note: 72 + beat * 5 }));
    ev.push({ type: 'riser', t: 2 * B, end: CAR0, gain: 0.6 }, { type: 'impact', t: CAR0, gain: 0.8 });
    for (let k = 1; k < ORDER.length; k++) ev.push({ type: 'swipe', t: CAR0 + k * SEG + 0.1, gain: 0.8 }, { type: 'hit', t: CAR0 + k * SEG, gain: 0.5 });
    ev.push({ type: 'riser', t: WALL - 4 * B, end: WALL, gain: 0.6 }, { type: 'impact', t: WALL }, { type: 'sparkle', t: WALL + 0.3, note: 86 });
    ev.push({ type: 'pop', t: WALL + 0.42, note: 79 }, { type: 'hit', t: WALL + 0.57, gain: 0.7 });
    return ev.concat(MM.endCardEvents(END));
  }

  MM.start({ duration: DUR, cover: CAR0 + 0.6, render, events });
})();
