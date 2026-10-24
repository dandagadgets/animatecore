// Short 3 — "Nobody's Online": a lovingly built server sits empty in the rain,
// until it's put on the radar and players pour in. 22s, 1080x1920.
(() => {
  'use strict';
  const M = MR;
  const { ctx, W, H, TAU, COL, NEON } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInOutCubic, mixColor } = M;

  const DUR = 22;
  const EMPTY = 6.0;    // cut to the empty spawn
  const PING = 11.3;    // radar ping, rain stops, dawn
  const ARRIVE = 12.4;  // players start arriving
  const END = 17.2;
  const T = 64;
  const GROUND = 19 * T;            // feet line (top of the grass row)
  const SPAWN_CAM = 17.5 * T - 540; // camera x centred on the gate

  const RED = '#ff5a5a', YEL = '#ffe14d';
  const CAPTIONS = [
    { t0: 0.0, t1: 3.0, lines: [[{ t: 'You spent months' }], [{ t: 'building your server.' }]] },
    { t0: 3.0, t1: EMPTY, lines: [[{ t: 'Every block.' }], [{ t: 'Every detail.', c: YEL }]] },
    { t0: EMPTY, t1: 9.4, lines: [[{ t: '...and nobody\'s' }], [{ t: 'online.', c: RED }]] },
    { t0: 9.4, t1: 10.3, lines: [[{ t: 'It\'s not your server.' }]] },
    { t0: 10.3, t1: PING, lines: [[{ t: 'Nobody can' }], [{ t: 'find it.', c: RED }]] },
    { t0: 13.7, t1: END, lines: [[{ t: 'Get seen by players looking' }], [{ t: 'for their next adventure.', c: '#a8ff2e' }]] },
  ];
  const LABELS = [['SHOPS', 5 * T, 720, 0.5], ['SPAWN', 17.5 * T, 640, 2.3], ['EVENT ARENA', 30.5 * T, 700, 4.3]];
  const ZOOM = 1.25;
  const CHAT = [
    [6.4, '[Server] Welcome to the server!', '#ffe14d'], [7.0, '<You> hey everyone!'], [8.1, '<You> anyone?'],
    [13.0, '<Alex> this spawn is insane'], [13.8, '<Mia> when\'s the next event?'], [14.6, '<Kai> brought my whole crew'],
    [15.4, '<Zed> ok this server goes hard'], [16.2, '<Sam> how do i join the event?'],
  ];
  const NAMES = ['Alex', 'Mia', 'Kai', 'Zed', 'Sam', 'Ivy', 'Leo', 'Rin', 'Ash', 'Bo'];
  const ARRIVALS = NAMES.map((name, i) => ({
    name, t: ARRIVE + i * 0.36, x: [215, 920, 360, 760, 650, 140, 450, 870, 290, 815][i], skin: M.PLAYERS[(i + 1) % M.PLAYERS.length],
    tag: i < 5,
  }));

  let world;
  const stars = Array.from({ length: 80 }, (_, i) => [hash(i * 1.3) * W, hash(i * 7.1) * 1000, hash(i * 3.3)]);

  function setup() {
    world = M.blockWorld(36, 30, T, (c, r) => {
      if (r === 19) return 'grass';
      if (r > 19) return r < 23 ? 'dirt' : (hash(c * 5 + r * 3) < 0.06 ? 'ore_iron' : 'stone');
      // shops
      if (r === 14 && c >= 0 && c <= 4) return c % 2 ? 'wool_white' : 'wool_red';
      if (r === 14 && c >= 5 && c <= 10) return c % 2 ? 'wool_white' : 'wool_yellow';
      if ((c === 1 || c === 4 || c === 6 || c === 9) && r >= 15 && r <= 17) return 'log';
      if (r === 18 && ((c >= 1 && c <= 4) || (c >= 6 && c <= 9))) return 'planks';
      if (r === 17 && (c === 2 || c === 7)) return 'chest';
      // trees
      for (const tc of [11, 24]) {
        if (c === tc && r >= 15 && r <= 18) return 'log';
        if (r >= 12 && r <= 14 && Math.abs(c - tc) <= 1) return 'leaves';
      }
      // spawn castle
      const tower = (c >= 13 && c <= 14) || (c >= 21 && c <= 22);
      if (tower && r >= 8 && r <= 18) return (r === 10 || r === 11) && (c === 14 || c === 21) ? 'wool_lime' : 'stonebrick';
      if (tower && r === 7 && (c === 13 || c === 22)) return 'stonebrick';
      if (c >= 15 && c <= 20 && r >= 12 && r <= 18) {
        if (c >= 17 && c <= 18 && r >= 16) return 'obsidian';
        if (r === 14 && (c === 15 || c === 20)) return 'litwindow';
        return 'stonebrick';
      }
      if (r === 11 && (c === 15 || c === 17 || c === 18 || c === 20)) return 'stonebrick';
      // event arena
      if ((c === 26 || c === 35) && r >= 13 && r <= 18) return 'stonebrick';
      if (r === 12 && c >= 26 && c <= 35) return 'planks';
      if (r === 11 && (c === 26 || c === 35)) return 'wool_red';
      if (r === 18 && c >= 27 && c <= 34) return c % 2 ? 'wool_lime' : 'wool_white';
      return null;
    });
  }

  // ---------- helpers ----------
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

  function glowAt(x, y, r, color, a) {
    if (a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color},${a})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function nametag(text, x, y) {
    ctx.save();
    ctx.font = '400 28px "Pixelify Sans"';
    const w = ctx.measureText(text).width + 20;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x - w / 2, y - 20, w, 40);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 1);
    ctx.restore();
  }

  function camera(t) {
    if (t < EMPTY) return { x: lerp(-108, 1332, easeInOutCubic(prog(t, 0, EMPTY - 0.2))), z: ZOOM };
    return { x: SPAWN_CAM, z: ZOOM * (1 + 0.06 * prog(t, EMPTY, PING) - 0.06 * easeOutCubic(prog(t, PING, PING + 1.2))) };
  }

  const dawnAt = (t) => easeInOutCubic(prog(t, PING, PING + 1.8));
  const rainAt = (t) => prog(t, 6.3, 7.0) * (1 - prog(t, PING, PING + 0.7));

  function sky(t) {
    const d = dawnAt(t), r = rainAt(t);
    const night = ['#03061a', '#121b46', '#26305e'];
    const storm = ['#020309', '#0b0f24', '#161b33'];
    const dawn = ['#3a6fd8', '#f59a6b', '#ffd08a'];
    const stops = night.map((c, i) => mixColor(mixColor(c, storm[i], r), dawn[i], d));
    M.skyGradient([[0, stops[0]], [0.55, stops[1]], [1, stops[2]]]);
    const starA = (1 - d) * (1 - r * 0.8);
    stars.forEach(([x, y, k]) => {
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + k * 20));
      ctx.fillStyle = `rgba(255,255,255,${tw * starA * (0.35 + k * 0.6)})`;
      ctx.fillRect(x, y, k > 0.8 ? 6 : 4, k > 0.8 ? 6 : 4);
    });
    ctx.fillStyle = `rgba(240,240,225,${(1 - d) * (1 - r * 0.7)})`;
    ctx.fillRect(110, 270, 110, 110);
    if (d > 0) {
      glowAt(970, lerp(1080, 640, d), 380, '255,210,140', 0.6 * d);
      ctx.fillStyle = `rgba(255,236,170,${d})`;
      ctx.fillRect(900, lerp(1010, 570, d), 140, 140);
    }
  }

  function rain(t, a) {
    if (a <= 0) return;
    ctx.save();
    ctx.strokeStyle = `rgba(170,190,255,${0.45 * a})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 170; i++) {
      const x = ((hash(i) * W * 1.4 - t * 260) % (W * 1.4) + W * 1.4) % (W * 1.4) - 100;
      const y = ((hash(i + 40) * H + t * 1700) % H);
      ctx.moveTo(x, y); ctx.lineTo(x - 12, y + 46);
    }
    ctx.stroke();
    ctx.restore();
  }

  function onlineCount(t) {
    if (t < ARRIVE) return 1;
    return Math.round(lerp(1, 38, easeInOutCubic(prog(t, ARRIVE, 16.6))));
  }

  function onlinePanel(t) {
    const n = onlineCount(t);
    const empty = t >= EMPTY && t < PING;
    const busy = t >= ARRIVE;
    const pulse = empty ? 0.5 + 0.5 * Math.sin(t * 6) : 0;
    const color = busy ? COL.neon : empty ? RED : '#ffffff';
    let pop = 1;
    if (busy) {
      const step = (t - ARRIVE) % 0.18;
      pop = 1 + 0.12 * Math.max(0, 1 - step / 0.12) * (n < 38 ? 1 : 0);
    }
    ctx.save();
    ctx.translate(890, 280);
    ctx.scale(pop, pop);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-140, -56, 280, 112);
    ctx.strokeStyle = empty ? `rgba(255,90,90,${0.4 + 0.6 * pulse})` : busy ? NEON(0.8) : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(-140, -56, 280, 112);
    M.label('ONLINE', 0, -26, 20, 'rgba(255,255,255,0.7)', 'center', 3);
    ctx.font = '700 52px "Pixelify Sans"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    if (busy) { ctx.shadowColor = COL.neon; ctx.shadowBlur = 16; }
    ctx.fillText(`${n}/100`, 0, 18);
    ctx.restore();
  }

  function chat(t) {
    const shown = CHAT.filter(([ct]) => t >= ct).slice(-5);
    shown.forEach(([ct, text, col], i) => {
      const y = 1460 - (shown.length - 1 - i) * 56;
      const a = prog(t, ct, ct + 0.15) * (t > END - 0.3 ? 0 : 1);
      ctx.save();
      ctx.globalAlpha = a;
      const w = M.textWidth(text, '400 34px "Pixelify Sans"') + 30;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(30, y - 26, w, 54);
      mcText(text, 44, y, 34, col || '#ffffff');
      ctx.restore();
    });
  }

  // ---------- scene ----------
  function scene(t) {
    const cam = camera(t);
    const d = dawnAt(t), r = rainAt(t);
    sky(t);
    ctx.save();
    ctx.translate(540, GROUND); ctx.scale(cam.z, cam.z); ctx.translate(-540, -GROUND);
    ctx.translate(-cam.x, 0);
    ctx.drawImage(world, 0, 0);
    // night tint over the world, lifted at dawn
    ctx.fillStyle = `rgba(6,10,40,${lerp(0.42 + 0.15 * r, 0, d)})`;
    ctx.fillRect(0, 0, world.width, H);
    const lamp = (1 - d) * (0.55 + 0.08 * Math.sin(t * 11));
    [[15.5, 14.5], [20.5, 14.5], [2.5, 16], [7.5, 16]].forEach(([c, rr]) => glowAt(c * T, rr * T, 170, '255,200,110', lamp));
    // you, at the gate
    const youX = 17.5 * T;
    M.drawPlayer(youX, GROUND, 4, M.PLAYERS[0], 1);
    nametag('You', youX, GROUND - 156);
    // tumbleweed
    const p = prog(t, 7.2, 9.2);
    if (p > 0 && p < 1) {
      const bx = SPAWN_CAM + lerp(-80, 1160, p), by = GROUND - 30 - Math.abs(Math.sin(p * 16)) * 34;
      for (let i = 0; i < 14; i++) {
        const a = i * 0.9 + p * 22;
        ctx.fillStyle = i % 2 ? '#8a6a3a' : '#6e5026';
        ctx.fillRect(bx + Math.cos(a) * 24 - 5, by + Math.sin(a) * 24 - 5, 10, 10);
      }
    }
    // arrivals
    ARRIVALS.forEach((a, i) => {
      const lt = t - a.t;
      if (lt < -0.25) return;
      const wx = SPAWN_CAM + a.x + Math.sin((t - a.t) * 0.8 + i) * 18 * prog(lt, 0.6, 1.5);
      if (lt < 0.35) {
        const bw = lerp(10, 90, easeOutCubic(prog(lt, -0.25, 0)));
        ctx.save();
        ctx.globalAlpha = 1 - prog(lt, 0.1, 0.35);
        const g = ctx.createLinearGradient(0, 0, 0, GROUND);
        g.addColorStop(0, NEON(0));
        g.addColorStop(1, NEON(0.65));
        ctx.fillStyle = g;
        ctx.fillRect(wx - bw / 2, 0, bw, GROUND);
        ctx.restore();
      }
      if (lt >= 0) {
        const drop = (1 - easeOutBack(prog(lt, 0, 0.3), 1.8)) * 140;
        M.drawPlayer(wx, GROUND - drop, 4, a.skin, i + 3);
        if (a.tag) nametag(a.name, wx, GROUND - drop - 156);
        if (lt < 0.8) {
          for (let k = 0; k < 10; k++) {
            const ang = hash(i * 11 + k) * TAU, dd = 30 + lt * 160 * hash(k + i);
            M.pixelSquare(wx + Math.cos(ang) * dd, GROUND - 60 + Math.sin(ang) * dd - lt * 80, 8, M.LIME(1 - lt / 0.8), 10);
          }
        }
      }
    });
    ctx.restore();

    // build labels during the flyover
    LABELS.forEach(([text, wx, y, t0]) => {
      const e = prog(t, t0, t0 + 0.35) * (1 - prog(t, t0 + 1.7, t0 + 2.0));
      if (e <= 0 || t >= EMPTY) return;
      const x = 540 + (wx - cam.x - 540) * cam.z;
      const w = M.textWidth(text, '700 28px "Silkscreen"', 3) + 50;
      const sc = easeOutBack(clamp(e), 2);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      M.panel(-w / 2, -32, w, 64, 6, { glow: 14 });
      ctx.fillStyle = COL.neon;
      ctx.beginPath(); ctx.moveTo(-14, 34); ctx.lineTo(14, 34); ctx.lineTo(0, 54); ctx.closePath(); ctx.fill();
      M.label(text, 0, 1, 28, COL.white, 'center', 3, 700);
      ctx.restore();
    });

    rain(t, r);
    if (t >= 8.6 && t < 9.0) {
      const a = (t < 8.68 ? 0.7 : t < 8.74 ? 0.15 : t < 8.8 ? 0.55 : 0.55 * (1 - prog(t, 8.8, 9.0)));
      ctx.fillStyle = `rgba(220,230,255,${a})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function radarPing(t) {
    const lt = t - PING;
    if (lt < 0 || lt > 2.4) return;
    const cx = 540, cy = GROUND - 80;
    for (let k = 0; k < 3; k++) {
      const age = lt - k * 0.35;
      if (age < 0 || age > 1.6) continue;
      ctx.save();
      ctx.strokeStyle = M.LIME(0.9 * (1 - age / 1.6));
      ctx.lineWidth = lerp(16, 3, age / 1.6);
      ctx.shadowColor = COL.neon;
      ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(cx, cy, easeOutCubic(age / 1.6) * 1500, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    const sa = clamp(lt / 1.1);
    if (sa < 1) {
      const a = -Math.PI / 2 + TAU * easeInOutCubic(sa);
      ctx.save();
      ctx.globalAlpha = 1 - prog(sa, 0.8, 1);
      const cg = ctx.createConicGradient(a - 1.0, cx, cy);
      cg.addColorStop(0, NEON(0));
      cg.addColorStop(1.0 / TAU, NEON(0.35));
      cg.addColorStop(1.0 / TAU + 0.0005, NEON(0));
      cg.addColorStop(1, NEON(0));
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 1800, a - 1.0, a); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = COL.lime;
      ctx.lineWidth = 6;
      ctx.shadowColor = COL.neon;
      ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 1800, cy + Math.sin(a) * 1800); ctx.stroke();
      ctx.restore();
    }
  }

  function render(t) {
    if (t >= END) {
      M.endCard(t, END, { top: [[{ t: 'BUILT FOR' }], [{ t: 'SERVER OWNERS', c: 'accent' }]] });
    } else {
      scene(t);
      radarPing(t);
      onlinePanel(t);
      chat(t);
      const hl = prog(t, PING + 0.2, PING + 0.5) * (1 - prog(t, 13.4, 13.7));
      if (hl > 0) {
        ctx.save();
        ctx.globalAlpha = hl;
        M.headline([{ t: 'PUT IT ON' }], 540, 470, 110, appear(t, PING + 0.2, 0.3), 980, { slam: true });
        M.headline([{ t: 'THE RADAR.', c: 'accent' }], 540, 600, 130, appear(t, PING + 0.45, 0.3), 980, { slam: true });
        ctx.restore();
      }
      CAPTIONS.forEach((c) => {
        if (t < c.t0 || t >= c.t1) return;
        const e = c.t0 === 0 ? 1 : appear(t, c.t0, 0.25);
        ctx.save();
        ctx.globalAlpha = 1 - prog(t, c.t1 - 0.15, c.t1);
        M.caption(c.lines, 540, 500, 72, e);
        ctx.restore();
      });
    }
    M.drawScanlines();
    M.flash(t, PING, 0.5, 5);
    M.flash(t, END, 0.92, 6);
  }

  function events() {
    const ev = [];
    LABELS.forEach(([, , , t0]) => ev.push({ type: 'pop', t: t0, note: 88 }));
    CHAT.forEach(([ct]) => ev.push({ type: 'chat', t: ct }));
    ev.push({ type: 'thunder', t: 8.6 });
    ev.push({ type: 'ping', t: PING, note: 93 });
    ev.push({ type: 'ping', t: PING + 0.35, note: 100 });
    ev.push({ type: 'ping', t: PING + 0.7, note: 105 });
    ev.push({ type: 'hit', t: PING + 0.2 });
    ev.push({ type: 'hit', t: PING + 0.45 });
    ARRIVALS.forEach((a, i) => ev.push({ type: 'arrive', t: a.t, note: [84, 86, 88, 91, 93, 96, 98, 100, 103, 105][i] }));
    ev.push({ type: 'impact', t: END });
    ev.push({ type: 'pop', t: END + 1.32, note: 96 });
    return ev.sort((a, b) => a.t - b.t);
  }

  M.start({ duration: DUR, cover: 7.6, setup, render, events });
})();
