// Short 2 — "Every World": beat-cut hype trailer through eight pixel-art
// game-mode worlds, landing on "Every world. One radar." 18s, 1080x1920, 120 BPM.
(() => {
  'use strict';
  const M = MR;
  const { ctx, W, H, TAU, COL, NEON } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInCubic } = M;

  const DUR = 18;
  const MONTAGE = 2.0;   // first scene cut
  const FLICKER = 10.0;  // rapid recap
  const SLAM = 11.5;     // "every world." / "one radar."
  const END = 13.0;
  const T = 64;          // block size in px

  let SCENES;
  const stars = Array.from({ length: 70 }, (_, i) => [hash(i * 1.3) * W, hash(i * 7.1) * 900, hash(i * 3.3)]);

  function clouds(t, rows, speed, alpha = 0.9, color = '255,255,255') {
    ctx.fillStyle = `rgba(${color},${alpha})`;
    rows.forEach(([x, y, n], i) => {
      const dx = ((x + t * speed * (1 + i * 0.2)) % 1500) - 250;
      for (let k = 0; k < n; k++) ctx.fillRect(dx + k * 56, y - (k % 3 === 1 ? 32 : 0), 72, 44);
    });
  }

  function glowAt(x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color},${a})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function drawStars(t, a = 1) {
    stars.forEach(([x, y, k]) => {
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + k * 20));
      ctx.fillStyle = `rgba(255,255,255,${tw * a * (0.4 + k * 0.6)})`;
      const s = k > 0.8 ? 6 : 4;
      ctx.fillRect(x, y, s, s);
    });
  }

  // 16x16 sword along the diagonal, drawn from cells
  function sword(cx, cy, px, blade, edge, flip) {
    const cells = [];
    cells.push([14, 1, edge]);
    for (let i = 0; i < 9; i++) {
      const x = 13 - i, y = 2 + i;
      cells.push([x, y, blade], [x - 1, y, edge], [x, y + 1, edge]);
    }
    [[2, 9], [3, 10], [4, 11], [5, 12], [6, 13]].forEach(([x, y]) => cells.push([x, y, '#3a3a44']));
    cells.push([3, 12, '#6b4b25'], [2, 13, '#6b4b25'], [1, 14, '#3a3a44']);
    ctx.save();
    ctx.translate(cx, cy);
    if (flip) ctx.scale(-1, 1);
    cells.forEach(([x, y]) => { ctx.fillStyle = '#0a0a10'; ctx.fillRect((x - 8) * px - 4, (y - 8) * px - 4, px + 8, px + 8); });
    cells.forEach(([x, y, c]) => { ctx.fillStyle = c; ctx.fillRect((x - 8) * px, (y - 8) * px, px, px); });
    ctx.restore();
  }

  function explosion(x, y, lt, seed) {
    if (lt < 0 || lt > 0.9) return;
    const e = easeOutCubic(lt / 0.9);
    glowAt(x, y, 520 * e + 80, '255,200,120', 0.8 * (1 - e));
    for (let i = 0; i < 46; i++) {
      const a = hash(seed + i * 1.7) * TAU, v = 140 + hash(seed + i * 3.1) * 420;
      const d = v * e;
      const s = (20 + hash(seed + i) * 30) * (1 - e * 0.6);
      const col = lt < 0.15 ? '#ffffff' : lt < 0.4 ? ['#ffd36b', '#ff9a3c', '#fff1b0'][i % 3] : ['#7a7a7a', '#5a5a5a', '#9a9a9a'][i % 3];
      ctx.globalAlpha = 1 - e * 0.8;
      ctx.fillStyle = col;
      ctx.fillRect(x + Math.cos(a) * d - s / 2, y + Math.sin(a) * d - s / 2 - e * 60, s, s);
    }
    ctx.globalAlpha = 1;
  }

  function setup() {
    const surface = (c) => 19 + Math.round(1.6 * Math.sin(c * 0.5) + Math.sin(c * 0.23 + 1));
    const survival = M.blockWorld(20, 30, T, (c, r) => {
      const h = surface(c);
      const tree = [3, 10, 16].find((tc) => Math.abs(c - tc) <= 2);
      if (tree !== undefined) {
        const th = surface(tree);
        if (c === tree && r >= th - 4 && r < th) return 'log';
        const dy = th - 4 - r;
        if (dy >= 0 && dy <= 2 && Math.abs(c - tree) <= (dy === 2 ? 1 : 2)) return 'leaves';
      }
      if (r === h) return 'grass';
      if (r > h && r <= h + 3) return 'dirt';
      if (r > h + 3) return hash(c * 7 + r * 3) < 0.07 ? ['ore_iron', 'ore_gold', 'ore_diamond'][Math.floor(hash(c + r) * 3)] : 'stone';
      return null;
    });
    const isl = { 15: [5, 11], 16: [5, 11], 17: [6, 10], 18: [7, 9], 19: [8, 8] };
    const skyblock = M.blockWorld(17, 30, T, (c, r) => {
      if (c === 6 && r >= 11 && r <= 14) return 'log';
      if ((r >= 9 && r <= 11 && c >= 4 && c <= 8) || (r === 8 && c >= 5 && c <= 7)) return 'leaves';
      if (c === 10 && r === 14) return 'chest';
      const span = isl[r];
      if (span && c >= span[0] && c <= span[1]) return r === 15 ? 'grass' : r >= 18 ? 'stone' : 'dirt';
      return null;
    });
    const pvp = M.blockWorld(17, 30, T, (c, r) => (r >= 23 ? (r === 23 ? 'stonebrick' : hash(c + r * 5) < 0.2 ? 'netherrack' : 'stonebrick') : null));
    const smp = M.blockWorld(20, 30, T, (c, r) => {
      if (r === 22) return 'grass';
      if (r > 22) return r < 26 ? 'dirt' : 'stone';
      // house A
      if (c >= 1 && c <= 6) {
        if (r >= 18 && r <= 21) return (c === 1 || c === 6) ? 'log' : (r === 19 && (c === 3 || c === 4)) ? 'litwindow' : 'planks';
        if ((r === 17 && c >= 0) || (r === 16 && c >= 2 && c <= 5) || (r === 15 && c >= 3 && c <= 4)) return 'brick';
      }
      if (c === 0 && r === 17) return 'brick';
      if (c === 7 && r === 17) return 'brick';
      // house B
      if (c >= 11 && c <= 17) {
        if (r >= 17 && r <= 21) return (c === 11 || c === 17) ? 'log' : ((r === 18 || r === 19) && (c === 13 || c === 15)) ? 'litwindow' : 'planks';
        if ((r === 16 && c >= 11) || (r === 15 && c >= 12 && c <= 16) || (r === 14 && c >= 13 && c <= 15)) return 'cobble';
      }
      if ((c === 10 || c === 18) && r === 16) return 'cobble';
      if (c === 8 && r >= 19 && r <= 21) return 'log';
      if (c === 8 && r === 18) return 'lantern';
      return null;
    });
    const minigames = M.blockWorld(17, 30, T, (c, r) => (r >= 25 ? ((c + r) % 2 ? 'wool_white' : ['wool_magenta', 'wool_lightblue', 'wool_yellow', 'wool_lime'][(c >> 1) % 4]) : null));
    const factions = M.blockWorld(20, 30, T, (c, r) => {
      if (r === 24) return 'grass';
      if (r > 24) return r < 27 ? 'dirt' : 'stone';
      const tower = (c >= 2 && c <= 4) || (c >= 14 && c <= 16);
      if (tower && r >= 13 && r <= 23) return (r === 15 || r === 16) && (c === 3 || c === 15) ? 'wool_red' : 'stonebrick';
      if (tower && r === 12 && (c === 2 || c === 4 || c === 14 || c === 16)) return 'stonebrick';
      if (c >= 8 && c <= 10 && r >= 20 && r <= 23) return (r === 20 && c !== 9) ? 'cobble' : 'obsidian';
      if (r >= 18 && r <= 23) return 'cobble';
      if (r === 17 && c % 2 === 0) return 'cobble';
      return null;
    });
    const prisonBack = M.blockWorld(20, 30, T, (c, r) => (hash(c * 3 + r * 11) < 0.12 ? 'ore_iron' : 'cobble'));
    const prison = M.blockWorld(20, 30, T, (c, r) => {
      if (r >= 17 && r <= 22) return null;
      const h = hash(c * 13.7 + r * 5.3);
      return h < 0.05 ? 'ore_diamond' : h < 0.1 ? 'ore_gold' : h < 0.14 ? 'ore_emerald' : h < 0.2 ? 'ore_iron' : 'stone';
    });
    const ores = [];
    for (let r = 0; r < 30; r++) for (let c = 0; c < 20; c++) {
      if (r >= 17 && r <= 22) continue;
      const h = hash(c * 13.7 + r * 5.3);
      if (h < 0.14) ores.push([c * T + 32, r * T + 32, h]);
    }
    const creative = M.blockWorld(17, 30, T, (c, r) => (r === 25 ? 'grass' : r > 25 ? 'dirt' : null));
    const rainbow = [];
    ['red', 'orange', 'yellow', 'lime', 'lightblue', 'purple'].forEach((col, band) => {
      const R = 7.5 - band;
      for (let c = 0; c < 17; c++) for (let r = 10; r < 25; r++) {
        const d = Math.hypot(c - 8, r - 24.5);
        if (d >= R - 0.5 && d < R + 0.5 && r < 25) rainbow.push([c, r, col, Math.atan2(r - 24.5, c - 8)]);
      }
    });
    rainbow.sort((a, b) => b[3] - a[3]);

    SCENES = [
      {
        word: 'SURVIVAL', sub: 'start with nothing.', color: '#8dff4a', shadow: '#123a06',
        draw(lt, t) {
          M.skyGradient([[0, '#2f6fd8'], [0.45, '#7fb8ff'], [0.68, '#ffd27a'], [1, '#ff9f5a']]);
          glowAt(760, 1060, 420, '255,220,140', 0.7);
          ctx.fillStyle = '#fff4b8';
          ctx.fillRect(680, 980 - lt * 40, 160, 160);
          clouds(t, [[100, 820, 5], [700, 900, 4], [380, 1000, 3]], 40);
          ctx.drawImage(survival, -lt * 180, 0);
        },
      },
      {
        word: 'SKYBLOCK', sub: 'one island. no limits.', color: '#7fd8ff', shadow: '#0b2a4a',
        draw(lt, t) {
          M.skyGradient([[0, '#2d86ff'], [0.6, '#9dd6ff'], [1, '#e8f6ff']]);
          clouds(t, [[0, 1700, 6], [600, 1800, 5], [300, 1880, 7]], 60, 0.95);
          ctx.drawImage(skyblock, 0, Math.sin(t * 2) * 14 + 240);
          clouds(t, [[200, 760, 4], [800, 640, 3]], 25, 0.7);
        },
      },
      {
        word: 'PVP', sub: 'prove you\'re the best.', color: '#ff5a4a', shadow: '#3a0606',
        draw(lt, t) {
          M.skyGradient([[0, '#140202'], [0.5, '#4e0909'], [1, '#a11a14']]);
          ctx.drawImage(pvp, 0, 0);
          const clash = 0.25;
          const e = easeInCubic(clamp(lt / clash));
          const dx = lerp(700, 0, e);
          glowAt(540, 1160, 380, '255,120,80', lt > clash ? 0.6 * Math.exp(-(lt - clash) * 3) + 0.2 : 0.15);
          sword(540 - dx, 1160, 24, '#e8e8e8', '#9c9c9c', false);
          sword(540 + dx, 1160, 24, '#5decf5', '#24a9b5', true);
          if (lt > clash) {
            const st = lt - clash;
            for (let i = 0; i < 30; i++) {
              const a = hash(i * 2.3) * TAU, d = (200 + hash(i * 5.1) * 400) * easeOutCubic(Math.min(st / 0.6, 1));
              M.pixelSquare(540 + Math.cos(a) * d, 1160 + Math.sin(a) * d + st * st * 400, 12, i % 2 ? '#ffd36b' : '#fff', 12);
            }
          }
        },
      },
      {
        word: 'SMP', sub: 'your crew. your world.', color: '#ffad4a', shadow: '#3a1a06',
        draw(lt, t) {
          M.skyGradient([[0, '#170f38'], [0.45, '#5a2a68'], [0.75, '#d9606a'], [1, '#ff9a55']]);
          drawStars(t, 0.6);
          ctx.save();
          ctx.translate(-lt * 120, 0);
          ctx.drawImage(smp, 0, 0);
          [[3.5 * T, 19.5 * T], [13.5 * T, 18.5 * T], [15.5 * T, 18.5 * T], [8.5 * T, 18.5 * T]].forEach(([x, y], i) => glowAt(x, y, 150, '255,200,100', 0.45 + 0.1 * Math.sin(t * 9 + i)));
          M.drawPlayer(8.5 * T - 90, 22 * T, 4, M.PLAYERS[1], 2);
          M.drawPlayer(9.5 * T + 40, 22 * T, 4, M.PLAYERS[2], 3);
          M.drawPlayer(10.2 * T + 120, 22 * T, 4, M.PLAYERS[4], 4);
          ctx.restore();
          for (let i = 0; i < 14; i++) {
            const x = (hash(i) * W + Math.sin(t + i) * 30), y = 1100 + hash(i + 9) * 300 + Math.cos(t * 1.3 + i) * 20;
            M.pixelSquare(x, y, 6, `rgba(255,240,150,${0.5 + 0.5 * Math.sin(t * 4 + i)})`, 10);
          }
        },
      },
      {
        word: 'MINIGAMES', sub: 'quick games. big wins.', color: '#ffe14d', shadow: '#3a2a06',
        draw(lt, t) {
          M.skyGradient([[0, '#12b8ff'], [1, '#a6f3ff']]);
          ctx.drawImage(minigames, 0, 0);
          const pads = [[150, 1380, 'wool_magenta'], [420, 1220, 'wool_lime'], [690, 1300, 'wool_yellow'], [930, 1140, 'wool_lightblue'], [300, 1020, 'wool_orange'], [760, 960, 'wool_pink']];
          pads.forEach(([x, y, tex], i) => M.block(tex, x - 48, y + Math.sin(t * 3 + i) * 10, 96));
          const hop = Math.min(lt / 0.9, 1);
          const seg = Math.min(Math.floor(hop * 3), 2), f = hop * 3 - seg;
          const a = pads[seg], b = pads[seg + 1];
          const px = lerp(a[0], b[0], f), py = lerp(a[1], b[1], f) - Math.sin(f * Math.PI) * 220;
          M.drawPlayer(px, py + 4, 3, M.PLAYERS[6], 5);
          for (let i = 0; i < 40; i++) {
            const x = hash(i * 3.7) * W + Math.sin(t * 2 + i) * 20, y = ((hash(i * 9.1) * H + t * 300) % H);
            ctx.fillStyle = ['#ff4d8d', '#ffe14d', '#4dd2ff', '#7dff4d'][i % 4];
            ctx.fillRect(x, y, 12, 18);
          }
        },
      },
      {
        word: 'FACTIONS', sub: 'build it. defend it.', color: '#c08bff', shadow: '#1e0b3a',
        draw(lt, t) {
          M.skyGradient([[0, '#02030c'], [1, '#1a2048']]);
          drawStars(t);
          ctx.fillStyle = '#f2f2e0';
          ctx.fillRect(780, 760, 120, 120);
          ctx.drawImage(factions, -60 - lt * 60, 0);
          explosion(330, 1180, lt - 0.2, 1);
          explosion(820, 1080, lt - 0.55, 2);
        },
      },
      {
        word: 'PRISON', sub: 'mine your way out.', color: '#e6edf5', shadow: '#1a1f26',
        draw(lt, t) {
          ctx.drawImage(prisonBack, -lt * 60, 0);
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(0, 0, W, H);
          ctx.drawImage(prison, -lt * 100, 0);
          ores.forEach(([x, y, h], i) => {
            const s = Math.sin(t * 5 + i * 1.7);
            if (s > 0.85) M.pixelSquare(x - lt * 100 + (h - 0.07) * 200, y, 10, '#ffffff', 14);
          });
          glowAt(300, 1300, 260, '255,190,90', 0.5);
          glowAt(820, 1300, 260, '255,190,90', 0.5);
          M.block('lantern', 268, 1110, 64);
          M.block('lantern', 788, 1110, 64);
          M.drawPlayer(560, 23 * T, 4, M.PLAYERS[3], 7);
          ctx.fillStyle = '#2b2b30';
          for (let x = -40; x < W + 80; x += 130) ctx.fillRect(x - lt * 260, 0, 26, H);
          ctx.fillRect(0, 380, W, 22);
          ctx.fillRect(0, 1480, W, 22);
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          for (let x = -40; x < W + 80; x += 130) ctx.fillRect(x - lt * 260 + 4, 0, 6, H);
        },
      },
      {
        word: 'CREATIVE', sub: 'build anything.', color: '#ff8fd0', shadow: '#3a0b2a',
        draw(lt, t) {
          M.skyGradient([[0, '#ff86c8'], [0.5, '#ffc9a5'], [1, '#9ad8ff']]);
          ctx.drawImage(creative, 0, 0);
          const n = Math.floor(rainbow.length * clamp(lt / 0.7));
          for (let i = 0; i < n; i++) {
            const [c, r, col] = rainbow[i];
            const pop = clamp((lt / 0.7 * rainbow.length - i) / 6);
            const s = T * lerp(1.4, 1, easeOutCubic(pop));
            M.block(`wool_${col}`, c * T + 32 - s / 2, r * T + 32 - s / 2, s);
          }
          clouds(t, [[60, 1580, 3], [820, 1580, 3]], 0, 1);
        },
      },
    ];
    SCENES.forEach((s, i) => { s.index = i; });
  }

  // ---------- scene + word composition ----------
  function word(S, lt, t, opts = {}) {
    const e = easeOutCubic(clamp(lt / 0.14));
    const band = ctx.createLinearGradient(0, 300, 0, 900);
    band.addColorStop(0, 'rgba(0,0,0,0)');
    band.addColorStop(0.5, 'rgba(0,0,0,0.38)');
    band.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, 300, W, 600);
    if (lt < 0.12) {
      const a = 0.55 * (1 - lt / 0.12);
      ctx.save();
      ctx.font = '700 200px "Pixelify Sans"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,0,70,${a})`;
      ctx.fillText(S.word, 540 - 16, 590);
      ctx.fillStyle = `rgba(0,255,255,${a})`;
      ctx.fillText(S.word, 540 + 16, 590);
      ctx.restore();
    }
    M.headline([{ t: S.word, c: S.color }], 540, 590, 200, e, 960, { slam: true, shadow: S.shadow });
    if (!opts.wordOnly) {
      M.label(`${String(S.index + 1).padStart(2, '0')} / 08`, 540, 445, 30, 'rgba(255,255,255,0.85)', 'center', 6, 700);
      M.caption([[{ t: S.sub }]], 540, 730, 62, appear(t, opts.t0 + 0.12, 0.25));
    }
  }

  function scene(S, lt, t, opts = {}) {
    const z = 1 + 0.1 * Math.pow(1 - clamp(lt / 0.3), 2);
    ctx.save();
    ctx.translate(540, 960); ctx.scale(z, z); ctx.translate(-540, -960);
    S.draw(lt, t);
    ctx.restore();
    M.vignette(0.55);
    word(S, lt, t, opts);
  }

  const FLICK_ORDER = [5, 1, 6, 3, 0, 7, 2, 4];
  const FLICK_STEP = (SLAM - FLICKER) / FLICK_ORDER.length;

  function render(t) {
    let sh = { x: 0, y: 0 };
    if (t < MONTAGE) {
      // hook: question over a dim survival world, flickering previews building up
      ctx.save();
      const S = SCENES[0];
      if (t >= 1.0) {
        const k = Math.floor((t - 1.0) / 0.125);
        SCENES[(k * 3 + 1) % 8].draw(0.5, t);
      } else {
        S.draw(t * 0.3, t);
      }
      ctx.restore();
      ctx.fillStyle = `rgba(0,0,0,${lerp(0.72, 0.5, prog(t, 1.0, 2.0))})`;
      ctx.fillRect(0, 0, W, H);
      M.vignette(0.7);
      const beat = (x) => 1 + 0.07 * Math.exp(-((t - x) * 12)) * (t >= x ? 1 : 0);
      const pulse = Math.max(beat(0.5), beat(1.0), beat(1.5));
      ctx.save();
      ctx.translate(540, 900); ctx.scale(pulse, pulse); ctx.translate(-540, -900);
      M.headline([{ t: 'WHAT KIND OF' }], 540, 740, 104);
      M.headline([{ t: 'PLAYER', c: 'accent' }], 540, 900, 210);
      M.headline([{ t: 'ARE YOU?' }], 540, 1060, 140);
      ctx.restore();
    } else if (t < FLICKER) {
      const i = Math.floor(t - MONTAGE);
      const t0 = MONTAGE + i;
      const lt = t - t0;
      if (i === 2) sh = M.shake(t, t0 + 0.25, 22, 0.35);
      if (i === 5) { const a = M.shake(t, t0 + 0.2, 26, 0.4), b = M.shake(t, t0 + 0.55, 26, 0.4); sh = { x: a.x + b.x, y: a.y + b.y }; }
      ctx.save();
      ctx.translate(540 + sh.x, 960 + sh.y); ctx.scale(1.04, 1.04); ctx.translate(-540, -960);
      scene(SCENES[i], lt, t, { t0 });
      ctx.restore();
    } else if (t < SLAM) {
      const k = Math.min(Math.floor((t - FLICKER) / FLICK_STEP), FLICK_ORDER.length - 1);
      const lt = t - (FLICKER + k * FLICK_STEP);
      scene(SCENES[FLICK_ORDER[k]], 0.35 + lt, t, { wordOnly: true });
    } else if (t < END) {
      M.drawBrandBg();
      M.floatingPixels(t, 30);
      if (t >= SLAM + 0.7) M.radar(t, { cx: 540, cy: 960, R: 430, t0: SLAM + 0.7, alpha: 0.55, period: 1.6 });
      sh = M.shake(t, SLAM, 14, 0.3);
      const sh2 = M.shake(t, SLAM + 0.7, 18, 0.35);
      ctx.save();
      ctx.translate(sh.x + sh2.x, sh.y + sh2.y);
      M.headline([{ t: 'EVERY WORLD.' }], 540, 820, 150, appear(t, SLAM, 0.15), 980, { slam: true });
      M.headline([{ t: 'ONE RADAR.', c: 'accent' }], 540, 1010, 170, appear(t, SLAM + 0.7, 0.15), 980, { slam: true });
      ctx.restore();
    } else {
      M.endCard(t, END, { top: [[{ t: 'WHICH WORLD' }], [{ t: 'IS YOURS?', c: 'accent' }]] });
    }
    M.drawScanlines();
    // cut flashes
    for (let i = 0; i < 8; i++) M.flash(t, MONTAGE + i, i === 0 ? 0.9 : 0.45, 14, '255,255,255');
    if (t >= FLICKER && t < SLAM) M.flash(t, FLICKER + Math.floor((t - FLICKER) / FLICK_STEP) * FLICK_STEP, 0.35, 20, '255,255,255');
    M.flash(t, SLAM, 0.6, 10);
    M.flash(t, SLAM + 0.7, 0.6, 10);
    M.flash(t, END, 0.92, 6);
  }

  function events() {
    const ev = [];
    for (let i = 0; i < 8; i++) ev.push({ type: 'cut', t: MONTAGE + i, gain: i === 0 ? 1.2 : 0.8 });
    ev.push({ type: 'clash', t: MONTAGE + 2 + 0.25 });
    for (let i = 0; i < 3; i++) ev.push({ type: 'jump', t: MONTAGE + 4 + i * 0.3, note: 79 + i * 4 });
    ev.push({ type: 'boom', t: MONTAGE + 5 + 0.2 });
    ev.push({ type: 'boom', t: MONTAGE + 5 + 0.55 });
    for (let i = 0; i < 8; i++) ev.push({ type: 'pop', t: MONTAGE + 7 + i * 0.085, note: 84 + [0, 2, 4, 7, 9, 12, 14, 16][i] });
    FLICK_ORDER.forEach((_, k) => ev.push({ type: 'tick', t: FLICKER + k * FLICK_STEP }));
    ev.push({ type: 'hit', t: SLAM });
    ev.push({ type: 'hit', t: SLAM + 0.7 });
    ev.push({ type: 'ping', t: SLAM + 0.7, note: 96 });
    ev.push({ type: 'impact', t: END });
    ev.push({ type: 'pop', t: END + 1.32, note: 96 });
    return ev.sort((a, b) => a.t - b.t);
  }

  M.start({ duration: DUR, cover: 0.0, setup, render, events });
})();
