// Video 3 — "Community": a Mine Radar chat channel comes alive with players, server owners
// and creators, then the channel list lights up. 18s, 1080x1920.
(() => {
  'use strict';
  const M = MR;
  const { ctx, W, H, TAU, COL, NEON } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInCubic, easeInOutCubic } = M;

  const DUR = 18;
  const FLOOD = 7.3, CHANNELS = 9.0, HANG = 11.0, END = 12.6;
  const PANEL = { x: 50, y: 540, w: 980, h: 960 };
  const LIST_BOTTOM = PANEL.y + PANEL.h - 110;
  const TEXT_W = 760;

  const ROLES = {
    PLAYER: '#5cc8ff', OWNER: '#ffd23a', CREATOR: '#ff5d9e', TEAM: '#39ff14',
  };
  const PEOPLE = {
    blocky_sam: { role: 'PLAYER', p: 0, col: '#7fd0ff' },
    PixelPilot: { role: 'PLAYER', p: 2, col: '#b9f27c' },
    mossyvale: { role: 'OWNER', p: 4, col: '#ffd86b' },
    CreeperQueen: { role: 'CREATOR', p: 6, col: '#ff8cc6' },
    'lunar.builds': { role: 'PLAYER', p: 3, col: '#c7a8ff' },
    'Mine Radar': { role: 'TEAM', logo: true, col: '#a8ff2e' },
  };
  const MSGS = [
    { t: -3, who: 'CreeperQueen', text: 'gm everyone' },
    { t: -2, who: 'mossyvale', text: 'new spawn build is finally done' },
    { t: -1, who: 'blocky_sam', text: 'anyone know a chill survival server?' },
    { t: 0.9, who: 'PixelPilot', text: 'check #server-showcase, found my SMP there' },
    { t: 2.0, who: 'mossyvale', text: 'just posted mine! feedback welcome', typing: 1.35,
      reacts: [['heart', 2.5, 5], ['star', 2.75, 3]] },
    { t: 3.4, who: 'CreeperQueen', text: 'streaming the community event tonight!', typing: 2.95 },
    { t: 4.6, who: 'Mine Radar', text: 'heads up, everyone:', embed: ['GIVEAWAY + COMMUNITY EVENT', 'Everyone can join. Details in #events.'],
      reacts: [['gg', 5.0, 9], ['heart', 5.2, 12]] },
    { t: 5.9, who: 'lunar.builds', text: 'wait, website sneak peeks??', typing: 5.45 },
    { t: 6.6, who: 'Mine Radar', text: 'soon. stay tuned in #sneak-peeks' },
  ];
  const FLOOD_TEXT = ['gg', 'lets gooo', 'count me in', 'see you there', 'this is so helpful', 'w community', 'hype', 'first!', 'joining rn'];
  const FLOOD_WHO = ['PixelPilot', 'blocky_sam', 'lunar.builds', 'mossyvale', 'CreeperQueen'];
  FLOOD_TEXT.forEach((text, i) => MSGS.push({ t: FLOOD + 0.2 + i * 0.17, who: FLOOD_WHO[i % FLOOD_WHO.length], text, quick: true }));

  const CHANNEL_LIST = ['general', 'server-showcase', 'looking-for-server', 'events', 'giveaways', 'sneak-peeks', 'feedback'];
  const CAPTIONS = [
    { t0: 0, t1: FLOOD, lines: [[{ t: 'More than just' }], [{ t: 'a server list.', c: '#ffe14d' }]] },
    { t0: FLOOD, t1: CHANNELS, lines: [[{ t: 'Players. Server owners.' }], [{ t: 'Creators.', c: '#ff8cc6' }]] },
    { t0: CHANNELS, t1: HANG, lines: [[{ t: 'Share ideas.' }], [{ t: 'Help build Mine Radar.', c: '#a8ff2e' }]] },
    { t0: HANG, t1: END, lines: [[{ t: 'Come hang out' }], [{ t: 'with us.', c: '#ffe14d' }]] },
  ];

  function wrap(text, font, maxW) {
    ctx.save();
    ctx.font = font;
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    words.forEach((w) => {
      const tryLine = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(tryLine).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryLine;
    });
    if (cur) lines.push(cur);
    ctx.restore();
    return lines;
  }

  function setup() {
    MSGS.forEach((m) => {
      m.lines = wrap(m.text, '400 36px "Pixelify Sans"', TEXT_W);
      m.h = 54 + m.lines.length * 44 + (m.embed ? 150 : 0) + 24;
      m.rh = m.reacts ? 58 : 0;
    });
  }

  // ---------- pieces ----------
  function head(x, y, size, p, seed) {
    const P = M.PLAYERS[p];
    const px = size / 8;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      let col = P.skin;
      if (r < 2 || (r === 2 && (c === 0 || c === 7))) col = P.hair;
      if (r === 4 && (c === 1 || c === 6)) col = '#ffffff';
      if (r === 4 && (c === 2 || c === 5)) col = '#3a3ad0';
      if (r === 6 && (c === 3 || c === 4)) col = M.shade(P.skin, -0.25);
      ctx.fillStyle = M.shade(col, (hash(seed * 13 + r * 8 + c) - 0.5) * 0.1);
      ctx.fillRect(Math.round(x + c * px), Math.round(y + r * px), Math.ceil(px), Math.ceil(px));
    }
  }

  function reactIcon(kind, x, y) {
    if (kind === 'heart') {
      const rows = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
      ctx.fillStyle = '#ff4d6d';
      rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') ctx.fillRect(x + c * 4, y + r * 4, 4, 4); }));
    } else if (kind === 'star') {
      const rows = ['...#...', '..###..', '#######', '.#####.', '.##.##.', '#.....#'];
      ctx.fillStyle = '#ffd23a';
      rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') ctx.fillRect(x + c * 4, y + r * 4, 4, 4); }));
    } else {
      M.label('GG', x + 14, y + 12, 20, '#a8ff2e', 'center', 1, 700);
    }
  }

  function countAt(t, start, max) {
    if (t < start) return 0;
    return Math.min(max, 1 + Math.floor((t - start) / 0.07));
  }

  function message(m, x, y, t) {
    const P = PEOPLE[m.who];
    const e = appear(t, m.t, 0.22);
    ctx.save();
    ctx.globalAlpha = clamp(e * 1.5);
    ctx.translate(0, (1 - e) * 24);
    if (t >= m.t && t < m.t + 0.5) {
      ctx.fillStyle = `rgba(168,255,46,${0.08 * (1 - prog(t, m.t, m.t + 0.5))})`;
      ctx.fillRect(PANEL.x + 8, y - 8, PANEL.w - 16, m.h - 8);
    }
    if (P.logo) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x + 38, y + 38, 38, 0, TAU); ctx.clip();
      ctx.drawImage(M.getLogo(), x - 6, y - 6, 88, 88);
      ctx.restore();
    } else {
      ctx.save();
      M.pixelRectPath(x, y, 76, 76, 8);
      ctx.clip();
      head(x, y, 76, P.p, m.who.length);
      ctx.restore();
    }
    const tx = x + 100;
    ctx.font = '800 32px "Inter"';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = P.col;
    ctx.fillText(m.who, tx, y + 18);
    const nw = ctx.measureText(m.who).width;
    const rw = M.textWidth(P.role, '700 16px "Silkscreen"', 2) + 20;
    ctx.fillStyle = ROLES[P.role];
    M.pixelRectPath(tx + nw + 14, y + 4, rw, 28, 4);
    ctx.fill();
    M.label(P.role, tx + nw + 24, y + 19, 16, '#05140a', 'left', 2, 700);
    m.lines.forEach((ln, i) => {
      ctx.font = '400 36px "Pixelify Sans"';
      ctx.fillStyle = '#e8efe6';
      ctx.textBaseline = 'middle';
      let cx = tx;
      ln.split(/(#[a-z-]+)/).forEach((part) => {
        if (!part) return;
        const ch = part.startsWith('#');
        const w = ctx.measureText(part).width;
        if (ch) { ctx.fillStyle = 'rgba(57,255,20,0.18)'; ctx.fillRect(cx - 4, y + 44 + i * 44 + 4, w + 8, 40); }
        ctx.fillStyle = ch ? '#a8ff2e' : '#e8efe6';
        ctx.fillText(part, cx, y + 66 + i * 44);
        cx += w;
      });
    });
    let by = y + 54 + m.lines.length * 44 + 10;
    if (m.embed) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(tx, by, 800, 132);
      ctx.fillStyle = COL.neon;
      ctx.fillRect(tx, by, 8, 132);
      M.label(m.embed[0], tx + 30, by + 38, 26, '#ffffff', 'left', 2, 700);
      ctx.font = '400 32px "Pixelify Sans"';
      ctx.fillStyle = '#c9d6c6';
      ctx.fillText(m.embed[1], tx + 30, by + 92);
      by += 150;
    }
    if (m.reacts) {
      const re = appear(t, m.reacts[0][1], 0.2);
      let rx = tx;
      m.reacts.forEach(([kind, start, max]) => {
        const n = countAt(t, start, max);
        if (n === 0) return;
        const popS = 1 + 0.25 * Math.exp(-((t - start) % 0.07) * 40) * (n < max ? 1 : 0);
        ctx.save();
        ctx.globalAlpha *= re;
        ctx.translate(rx + 62, by + 24);
        ctx.scale(popS, popS);
        ctx.fillStyle = 'rgba(88,101,242,0.25)';
        M.pixelRectPath(-62, -22, 124, 44, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(150,160,255,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        reactIcon(kind, -48, -12);
        M.label(String(n), 30, 1, 22, '#ffffff', 'center', 1, 700);
        ctx.restore();
        rx += 140;
      });
    }
    ctx.restore();
  }

  function chat(t) {
    const p = PANEL;
    ctx.save();
    M.pixelRectPath(p.x, p.y, p.w, p.h, 14);
    ctx.fillStyle = '#0c120e';
    ctx.fill();
    ctx.shadowColor = NEON(0.5);
    ctx.shadowBlur = 30;
    ctx.strokeStyle = NEON(0.7);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // header
    ctx.fillStyle = '#121a14';
    ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, 96);
    ctx.save();
    ctx.beginPath(); ctx.arc(p.x + 60, p.y + 52, 30, 0, TAU); ctx.clip();
    ctx.drawImage(M.getLogo(), p.x + 24, p.y + 16, 72, 72);
    ctx.restore();
    ctx.font = '800 34px "Inter"';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText('Mine Radar', p.x + 108, p.y + 40);
    M.label('# GENERAL', p.x + 110, p.y + 74, 20, '#a8ff2e', 'left', 3, 700);
    M.pixelSquare(p.x + p.w - 60, p.y + 52, 16, COL.neon, 16);
    M.label('LIVE', p.x + p.w - 80, p.y + 53, 18, COL.neon, 'right', 3, 700);
    // messages, stacked up from the bottom
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x + 4, p.y + 104, p.w - 8, p.h - 200);
    ctx.clip();
    let y = LIST_BOTTOM;
    const shown = MSGS.filter((m) => t >= m.t - 0.01);
    for (let i = shown.length - 1; i >= 0; i--) {
      const m = shown[i];
      const hh = (m.h + (m.rh ? m.rh * appear(t, m.reacts[0][1], 0.2) : 0)) * easeOutCubic(prog(t, m.t, m.t + 0.22));
      y -= hh;
      if (y + hh < p.y + 100) break;
      message(m, p.x + 30, y + 10, t);
    }
    ctx.restore();
    // typing indicator + input bar
    const typer = MSGS.find((m) => m.typing && t >= m.typing && t < m.t);
    if (typer) {
      for (let k = 0; k < 3; k++) {
        const b = Math.abs(Math.sin(t * 9 - k * 0.8)) * 10;
        M.pixelSquare(p.x + 46 + k * 22, LIST_BOTTOM + 18 - b, 12, '#cfd8cc');
      }
      ctx.font = '800 24px "Inter"';
      ctx.fillStyle = '#9fb09a';
      ctx.fillText(`${typer.who} is typing...`, p.x + 120, LIST_BOTTOM + 14);
    }
    ctx.fillStyle = '#18221a';
    M.pixelRectPath(p.x + 24, p.y + p.h - 80, p.w - 48, 60, 8);
    ctx.fill();
    ctx.font = '400 30px "Pixelify Sans"';
    ctx.fillStyle = '#6f7f6b';
    ctx.fillText('Message #general', p.x + 50, p.y + p.h - 49);
    ctx.restore();
  }

  function channels(t) {
    const e = easeOutCubic(prog(t, CHANNELS, CHANNELS + 0.5));
    if (e <= 0) return;
    const x = lerp(W + 40, 300, e), y = 600;
    ctx.save();
    M.pixelRectPath(x, y, 700, 820, 14);
    ctx.fillStyle = 'rgba(10,16,12,0.96)';
    ctx.fill();
    ctx.shadowColor = NEON(0.6);
    ctx.shadowBlur = 30;
    ctx.strokeStyle = NEON(0.8);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;
    M.label('CHANNELS', x + 40, y + 56, 24, 'rgba(255,255,255,0.6)', 'left', 4, 700);
    CHANNEL_LIST.forEach((ch, i) => {
      const ce = appear(t, CHANNELS + 0.35 + i * 0.12, 0.25);
      const cy = y + 130 + i * 98;
      ctx.save();
      ctx.globalAlpha = ce;
      ctx.translate((1 - ce) * 60, 0);
      if (i === 0) { ctx.fillStyle = 'rgba(57,255,20,0.12)'; ctx.fillRect(x + 20, cy - 38, 660, 76); }
      M.label('#', x + 50, cy, 40, '#a8ff2e', 'center', 0, 700);
      ctx.font = '800 36px "Inter"';
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch, x + 88, cy + 2);
      const bt = CHANNELS + 0.6 + i * 0.12;
      if (i > 0 && t >= bt) {
        const n = 1 + (i * 3) % 7;
        const s = easeOutBack(prog(t, bt, bt + 0.25), 2.5);
        ctx.save();
        ctx.translate(x + 630, cy);
        ctx.scale(s, s);
        ctx.fillStyle = '#ff4d4d';
        M.pixelRectPath(-26, -22, 52, 44, 6);
        ctx.fill();
        M.label(String(n), 0, 1, 22, '#ffffff', 'center', 0, 700);
        ctx.restore();
      }
      ctx.restore();
    });
    ctx.restore();
  }

  function render(t) {
    if (t >= END) {
      M.discordCard(t, END, { top: [[{ t: 'EVERYONE\'S' }], [{ t: 'WELCOME.', c: 'accent' }]] });
      M.drawScanlines();
      M.flash(t, END, 0.92, 6);
      return;
    }
    M.drawBrandBg();
    M.floatingPixels(t, 30);
    const back = easeInOutCubic(prog(t, CHANNELS, CHANNELS + 0.5));
    const zoom = 1 + 0.03 * prog(t, FLOOD, CHANNELS) - 0.08 * back;
    ctx.save();
    ctx.translate(540 - 160 * back, 1020);
    ctx.scale(zoom, zoom);
    ctx.translate(-540, -1020);
    ctx.globalAlpha = 1 - 0.55 * back;
    chat(t);
    ctx.restore();
    channels(t);
    // notification bubbles flying off during the flood
    for (let i = 0; i < 9; i++) {
      const lt = t - (FLOOD + 0.2 + i * 0.17);
      if (lt < 0 || lt > 1) continue;
      const x = 900 + Math.sin(i * 2) * 60, y = 520 - lt * 260;
      ctx.save();
      ctx.globalAlpha = 1 - lt;
      ctx.fillStyle = '#ff4d4d';
      ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fill();
      M.label(`+${i + 1}`, x, y + 1, 20, '#ffffff', 'center', 0, 700);
      ctx.restore();
    }
    CAPTIONS.forEach((c) => {
      if (t < c.t0 || t >= c.t1) return;
      M.caption(c.lines, 540, 350, 74, c.t0 === 0 ? 1 : appear(t, c.t0, 0.22));
    });
    M.drawScanlines();
  }

  function events() {
    const ev = [];
    MSGS.forEach((m, i) => {
      if (m.t < 0) return;
      ev.push({ type: 'ding', t: m.t, note: m.quick ? 88 + [0, 2, 4, 7, 9, 12, 14, 16, 19][(i - 7) % 9] : [84, 88, 91, 86, 93, 89, 96][i % 7], gain: m.quick ? 0.6 : 1 });
      if (m.typing) for (let k = m.typing; k < m.t - 0.05; k += 0.09) ev.push({ type: 'typing', t: k });
      (m.reacts || []).forEach(([, start, max]) => {
        for (let n = 1; n <= max; n++) ev.push({ type: 'pop', t: start + (n - 1) * 0.07, note: 84 + n, gain: 0.55 });
      });
    });
    ev.push({ type: 'whoosh', t: CHANNELS + 0.1 });
    CHANNEL_LIST.forEach((_, i) => { if (i) ev.push({ type: 'pop', t: CHANNELS + 0.6 + i * 0.12, note: 88 + i * 2 }); });
    ev.push({ type: 'riser', t: END - 0.9, end: END });
    ev.push(...M.discordCardEvents(END));
    return ev.sort((a, b) => a.t - b.t);
  }

  M.start({ duration: DUR, cover: 2.9, setup, render, events });
})();
