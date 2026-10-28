// Minetic Media Ad 3: "Craft Your Ad." A crafting grid: Your Logo, Your Server IP, Best Features,
// Epic Music, Eye-Catching Effects and the Minetic pickaxe get thrown into the slots (each with an
// item tooltip), the arrow fills, and out pops an "Ad That Moves Players" with its lore. Clicking
// it pulls the phone out to play real work, then three achievement-style toasts show how to order.
(() => {
  const M = MR, { ctx, TAU } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInOutCubic, easeInCubic } = M;
  const { C } = MM;

  const CRAFT = 3.6, OUTPUT = 4.05, CLICK = 5.2, PULLED = 5.75, ORDER = 8.3, END = 11.9, DUR = 17.2;
  const TOASTS = [8.7, 9.45, 10.2];

  // ---------- pixel items ----------
  const SPR = {};
  function setup() {
    SPR.logo = M.sprite([
      'BBBBBBBBBBBBBBBB', 'BbbbbbbbbbbbbbbB', 'BbCCCCCCCCCCCCbB', 'BbCCCCCCwCCCCCbB', 'BbCCCCCwwwCCCCbB',
      'BbCCCCwwwwwCCCbB', 'BbCCwwwwwwwwwCbB', 'BbCCCwwwwwwwCCbB', 'BbCCCCwwwwwCCCbB', 'BbCCCwwwCwwwCCbB',
      'BbCCwwCCCCCwwCbB', 'BbCCCCCCCCCCCCbB', 'BbCCCCCCCCCCCCbB', 'BbbbbbbbbbbbbbbB', 'BBBBBBBBBBBBBBBB', '................',
    ], { B: '#4a2f14', b: '#9c6a35', C: '#2aa9c4', w: '#ffe48a' });
    SPR.sign = M.sprite([
      '................', '.BBBBBBBBBBBBBB.', '.BppppppppppppB.', '.BpddddddddddpB.', '.BppppppppppppB.',
      '.BpddddddddpppB.', '.BppppppppppppB.', '.BpddddddpppppB.', '.BppppppppppppB.', '.BBBBBBBBBBBBBB.',
      '.......SS.......', '.......SS.......', '.......SS.......', '.......SS.......', '.......SS.......', '................',
    ], { B: '#4a2f14', p: '#c8a165', d: '#6b4a26', S: '#6b4a26' });
    SPR.sword = M.sprite([
      '..............KK', '.............KcK', '............KclK', '...........KclK.', '..........KclK..',
      '.........KclK...', '..KK....KclK....', '..KdK..KclK.....', '...KdKKclK......', '....KdclK.......',
      '.....KddK.......', '....KhKKdK......', '...KhK..KdK.....', '.KKhK....KK.....', '.KhK............', '.KK.............',
    ], { K: '#0b1a24', c: '#3fe0e8', l: '#c8fbff', d: '#1b6f7a', h: '#7a5230' });
    SPR.disc = M.sprite([
      '.....KKKKKK.....', '...KKddddddKK...', '..KddddddddddK..', '.KddddddddddddK.', '.KdddrrrrrrdddK.',
      'KdddrrrrrrrrdddK', 'KdddrrrKKrrrdddK', 'KdddrrKggKrrdddK', 'KdddrrKggKrrdddK', 'KdddrrrKKrrrdddK',
      'KdddrrrrrrrrdddK', '.KdddrrrrrrdddK.', '.KddddddddddddK.', '..KddddddddddK..', '...KKddddddKK...', '.....KKKKKK.....',
    ], { K: '#0b0b0b', d: '#2b2b33', r: '#ffc93c', g: '#3fe0e8' });
    SPR.rocket = M.sprite([
      '.......ww.......', '......wwww......', '.....wwwwww.....', '.....RRRRRR.....', '.....RrRRrR.....',
      '.....RRRRRR.....', '.....RrRRrR.....', '.....RRRRRR.....', '.....RrRRrR.....', '.....RRRRRR.....',
      '.......ss.......', '.......ss.......', '.......ss.......', '......y..y......', '.....y.yy.y.....', '................',
    ], { w: '#f2f2f2', R: '#d93838', r: '#ff7b7b', s: '#7a5230', y: '#ffc93c' });
    SPR.ticket = M.sprite([
      '................', '................', '.GGGGGGGGGGGGGG.', '.GggggggggggggG.', '.Gg.gggggggg.gG.', '..gggKKKKKKggg..',
      '..gggggggggggg..', '..gggKKKKggggg..', '..gggggggggggg..', '.Gg.gggggggg.gG.', '.GggggggggggggG.',
      '.GGGGGGGGGGGGGG.', '................', '................', '................', '................',
    ], { G: '#b8860b', g: '#ffc93c', K: '#7a5a10' });
  }

  // ---------- crafting UI ----------
  const PANEL = { x: 90, y: 690, w: 900, h: 520 };
  const SLOT = 124, STEP_S = 130, GX = 130, GY = 775;
  const slotXY = (c, r) => ({ x: GX + c * STEP_S + SLOT / 2, y: GY + r * STEP_S + SLOT / 2 });
  const OUT = { x: 850, y: GY + STEP_S + SLOT / 2, s: 170 };

  function slot(cx, cy, s) {
    const x = cx - s / 2, y = cy - s / 2;
    ctx.fillStyle = '#8b8b8b';
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#373737';
    ctx.fillRect(x, y, s, 5); ctx.fillRect(x, y, 5, s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y + s - 5, s, 5); ctx.fillRect(x + s - 5, y, 5, s);
  }
  function panel(t, alpha, scale) {
    if (alpha <= 0) return;
    const { x, y, w, h } = PANEL;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(540, y + h / 2); ctx.scale(scale, scale); ctx.translate(-540, -(y + h / 2));
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 20;
    M.pixelRectPath(x, y, w, h, 12);
    ctx.fillStyle = '#c6c6c6';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 10, y + 10, w - 20, 6); ctx.fillRect(x + 10, y + 10, 6, h - 20);
    ctx.fillStyle = '#555555';
    ctx.fillRect(x + 10, y + h - 16, w - 20, 6); ctx.fillRect(x + w - 16, y + 10, 6, h - 20);
    M.label('Crafting', x + 40, y + 46, 34, '#404040', 'left', 1, 700, 'Pixelify Sans');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const p = slotXY(c, r); slot(p.x, p.y, SLOT); }
    // the arrow fills with cyan while it crafts
    const ax = 600, ay = OUT.y;
    const fill = easeInOutCubic(prog(t, CRAFT, OUTPUT));
    const arrow = () => {
      ctx.beginPath();
      ctx.moveTo(ax - 50, ay - 18); ctx.lineTo(ax + 20, ay - 18); ctx.lineTo(ax + 20, ay - 44); ctx.lineTo(ax + 70, ay);
      ctx.lineTo(ax + 20, ay + 44); ctx.lineTo(ax + 20, ay + 18); ctx.lineTo(ax - 50, ay + 18); ctx.closePath();
    };
    arrow(); ctx.fillStyle = '#8b8b8b'; ctx.fill();
    if (fill > 0) {
      ctx.save();
      arrow(); ctx.clip();
      ctx.fillStyle = C.cyan;
      ctx.shadowColor = C.cyan; ctx.shadowBlur = 20;
      ctx.fillRect(ax - 50, ay - 50, 120 * fill, 100);
      ctx.restore();
    }
    slot(OUT.x, OUT.y, OUT.s);
    if (t > OUTPUT) {
      const g = 0.5 + 0.5 * Math.sin((t - OUTPUT) * 6);
      ctx.save();
      ctx.strokeStyle = MM.CYAN(0.5 + 0.5 * g);
      ctx.lineWidth = 6;
      ctx.shadowColor = C.cyan; ctx.shadowBlur = 30;
      ctx.strokeRect(OUT.x - OUT.s / 2 - 4, OUT.y - OUT.s / 2 - 4, OUT.s + 8, OUT.s + 8);
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- ingredients ----------
  const ITEMS = [
    { key: 'logo', c: 1, r: 0, t: 0.55, name: 'Your Logo', col: '#ffffff', from: [180, 1900] },
    { key: 'sign', c: 0, r: 1, t: 1.05, name: 'Your Server IP', col: '#ffffff', from: [-120, 1300] },
    { key: 'sword', c: 2, r: 1, t: 1.55, name: 'Your Best Features', col: '#55ffff', from: [1200, 1350] },
    { key: 'disc', c: 0, r: 2, t: 2.05, name: 'Epic Music', col: '#ffaa00', lore: 'No copyright claims', from: [100, 1950] },
    { key: 'rocket', c: 2, r: 2, t: 2.55, name: 'Eye-Catching Effects', col: '#ff55ff', from: [980, 1950] },
    { key: 'icon', c: 1, r: 1, t: 3.15, name: 'Minetic Magic', col: '#55ffff', lore: 'Made by Minetic Media', from: [540, 2000] },
  ];
  function drawItem(key, cx, cy, s, t) {
    ctx.save();
    ctx.imageSmoothingEnabled = key === 'icon';
    if (key === 'icon') MM.logo(cx, cy, s * 1.05, { icon: true });
    else ctx.drawImage(SPR[key], cx - s / 2, cy - s / 2, s, s);
    ctx.restore();
  }
  function items(t, gone) {
    ITEMS.forEach((it, i) => {
      const fly = prog(t, it.t - 0.38, it.t);
      if (fly <= 0) return;
      const p = slotXY(it.c, it.r);
      const e = easeInCubic(fly);
      let x = lerp(it.from[0], p.x, e), y = lerp(it.from[1], p.y, e) - Math.sin(fly * Math.PI) * 260;
      let s = 104 * (fly < 1 ? lerp(1.3, 1, e) : 1 + 0.18 * Math.exp(-(t - it.t) * 12) * Math.cos((t - it.t) * 30));
      if (gone > 0) {
        // fly into the output slot when the ad is pulled out
        const g = easeInCubic(clamp(gone * 1.6 - i * 0.08));
        x = lerp(x, OUT.x, g); y = lerp(y, OUT.y, g); s *= 1 - g;
        if (s <= 1) return;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(fly < 1 ? (1 - fly) * (i % 2 ? 4 : -4) : 0);
      drawItem(it.key, 0, 0, s, t);
      ctx.restore();
      if (fly >= 1 && t < it.t + 0.15) MM.burst(p.x, p.y, t - it.t, 0.5, 0.18);
    });
  }

  // item tooltip, styled like an in-game one
  function tooltip(x, y, lines, e = 1) {
    if (e <= 0) return;
    const sizes = lines.map((_, i) => (i === 0 ? 50 : 38));
    const widths = lines.map((l, i) => M.textWidth(l.t, `${i === 0 ? 700 : 400} ${sizes[i]}px "Pixelify Sans"`, 1));
    const w = Math.max(...widths) + 52, h = sizes.reduce((a, b) => a + b * 1.35, 0) + 34;
    ctx.save();
    ctx.globalAlpha *= clamp(e * 2);
    const sc = lerp(0.85, 1, easeOutBack(clamp(e), 2));
    ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(16,0,16,0.95)';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#5000ff'); g.addColorStop(1, '#28007f');
    ctx.strokeStyle = g;
    ctx.lineWidth = 4;
    ctx.strokeRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12);
    let yy = -h / 2 + 22;
    lines.forEach((l, i) => {
      yy += sizes[i] * 0.62;
      M.label(l.t, -w / 2 + 26 + 3, yy + 3, sizes[i], 'rgba(0,0,0,0.6)', 'left', 1, i === 0 ? 700 : 400, 'Pixelify Sans');
      M.label(l.t, -w / 2 + 26, yy, sizes[i], l.c, 'left', 1, i === 0 ? 700 : 400, 'Pixelify Sans');
      yy += sizes[i] * 0.73;
    });
    ctx.restore();
  }
  function ingredientTip(t) {
    for (let i = ITEMS.length - 1; i >= 0; i--) {
      const it = ITEMS[i];
      if (t >= it.t && t < (ITEMS[i + 1]?.t ?? CRAFT)) {
        const lines = [{ t: it.name, c: it.col }];
        if (it.lore) lines.push({ t: it.lore, c: '#a8a8a8' });
        tooltip(540, 1320, lines, prog(t, it.t, it.t + 0.15));
        return;
      }
    }
  }

  // ---------- frame ----------
  function render(t) {
    if (t >= END) { MM.endCard(t, END); return; }
    MM.drawBg(t);
    MM.sparkles(t, 22, 5);
    const pull = prog(t, CLICK, PULLED);
    const pe = easeInOutCubic(pull);

    if (t < ORDER) {
      panel(t, 1 - prog(t, CLICK + 0.15, PULLED), lerp(1, 0.85, pe));
      items(t, pull);
      if (t < CRAFT) ingredientTip(t);
      // the crafted ad: a phone in the output slot, then pulled out to play real work
      if (t > OUTPUT) {
        const pop = easeOutBack(prog(t, OUTPUT, OUTPUT + 0.3), 2.4);
        const out = easeInOutCubic(prog(t, ORDER - 0.3, ORDER));
        const w = lerp(76 * pop, 500, pe);
        const x = lerp(OUT.x, 540, pe) + out * 900;
        const y = lerp(OUT.y, 1010, pe);
        const k = Math.floor(Math.max(0, t - PULLED) / 0.8);
        const id = t < PULLED ? 'numbers' : ['crates', 'boss', 'spaces'][Math.min(2, k)];
        const lt = t < PULLED ? t - OUTPUT : t - PULLED - k * 0.8 + 0.3;
        MM.phone(x, y, w, { img: MM.clip(id, lt), glow: 24 + 20 * Math.sin(t * 6) * (1 - pe) + 10, rot: lerp(-0.08, Math.sin(t * 1.5) * 0.02, pe) - out * 0.3 });
        if (t < OUTPUT + 0.6) MM.burst(OUT.x, OUT.y, t - OUTPUT, 0.9, 0.4);
        if (t < CLICK + 0.1) {
          tooltip(540, 1390, [
            { t: 'Ad That Moves Players', c: '#55ffff' },
            { t: '+ Stops the scroll', c: '#55ff55' },
            { t: '+ No copyright claims', c: '#55ff55' },
            { t: '+ Ready for Shorts & TikTok', c: '#55ff55' },
          ], prog(t, OUTPUT + 0.2, OUTPUT + 0.4) * (1 - prog(t, CLICK - 0.05, CLICK + 0.1)));
        }
      }
      // the cursor grabs the result
      if (t > OUTPUT + 0.5 && t < CLICK + 0.35) {
        const e = easeOutCubic(prog(t, OUTPUT + 0.5, CLICK - 0.05));
        MM.cursor(lerp(1020, OUT.x + 10, e), lerp(1650, OUT.y + 20, e), 6);
      }
      if (t < CLICK + 0.1) {
        M.caption([[{ t: 'How to craft the' }], [{ t: 'perfect server ad:', c: C.cyan }]], 540, 300, 76, appear(t, -0.15, 0.3) * (1 - prog(t, CLICK - 0.05, CLICK + 0.1)));
      } else {
        MM.hl([{ t: 'CRAFTED BY' }], 540, 250, 96, appear(t, CLICK + 0.2, 0.3) * (1 - prog(t, ORDER - 0.3, ORDER)));
        MM.hl([{ t: 'MINETIC ', c: 'cyan' }, { t: 'MEDIA.', c: 'gold' }], 540, 360, 96, appear(t, CLICK + 0.35, 0.3) * (1 - prog(t, ORDER - 0.3, ORDER)));
      }
    } else {
      // how to order, as achievement toasts
      MM.hl([{ t: 'HOW TO ' }, { t: 'ORDER:', c: 'gold' }], 540, 470, 110, appear(t, ORDER + 0.05, 0.3));
      const steps = [
        ['Join the Discord', (x, y) => MM.bubble(x, y, 30, '#ffffff'), C.blurple],
        ['Open a ticket', (x, y) => ctx.drawImage(SPR.ticket, x - 44, y - 44, 88, 88), '#3a2a00'],
        ['Get your ad', (x, y) => MM.logo(x, y, 82, { icon: true }), '#062033'],
      ];
      steps.forEach(([text, icon, iconBg], i) => {
        const e = prog(t, TOASTS[i], TOASTS[i] + 0.4);
        if (e <= 0) return;
        const y = 720 + i * 200;
        const x = lerp(1400, 540, easeOutBack(e, 1.3));
        ctx.save();
        ctx.translate(x, y);
        M.pixelRectPath(-440, -80, 880, 160, 10);
        ctx.fillStyle = '#202020';
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
        ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#5a5a5a';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = iconBg;
        ctx.fillRect(-410, -56, 112, 112);
        icon(-354, 0);
        M.label(`STEP ${i + 1}`, -270, -28, 28, '#ffff55', 'left', 3, 700);
        M.label(text, -270, 22, 50, '#ffffff', 'left', 1, 700, 'Pixelify Sans');
        ctx.restore();
        if (e < 1 && e > 0.5) MM.burst(980, y, (e - 0.5) * 0.8, 0.4, 0.15);
      });
      const fe = appear(t, TOASTS[2] + 0.7, 0.3);
      if (fe > 0) M.label('IT\'S THAT EASY.', 540, 1360 + (1 - fe) * 20, 40, MM.CYAN(fe), 'center', 4, 700);
    }
    M.flash(t, OUTPUT, 0.35, 8, '200,250,255');
  }

  function events() {
    const ev = [];
    ITEMS.forEach((it, i) => ev.push({ type: 'swipe', t: it.t - 0.18, gain: 0.45 }, { type: 'place', t: it.t, k: i }, { type: 'pop', t: it.t + 0.02, note: 72 + [0, 2, 4, 7, 9, 12][i] }));
    ev.push({ type: 'craft', t: CRAFT, end: OUTPUT });
    ev.push({ type: 'levelup', t: OUTPUT, note: 76 }, { type: 'sparkle', t: OUTPUT + 0.05, note: 91 });
    ev.push({ type: 'uiclick', t: CLICK }, { type: 'whoosh', t: CLICK + 0.45 }, { type: 'impact', t: PULLED, gain: 0.7 });
    [1, 2].forEach((k) => ev.push({ type: 'hit', t: PULLED + k * 0.8, gain: 0.45 }));
    ev.push({ type: 'swipe', t: ORDER - 0.1 }, { type: 'pop', t: ORDER + 0.07, note: 79 });
    TOASTS.forEach((s, i) => ev.push({ type: 'swipe', t: s + 0.05, gain: 0.5 }, { type: 'toast', t: s + 0.25, k: i }));
    ev.push({ type: 'pop', t: TOASTS[2] + 0.72, note: 88 });
    return ev.concat(MM.endCardEvents(END));
  }

  MM.start({ duration: DUR, cover: 4.6, setup, render, events });
})();
