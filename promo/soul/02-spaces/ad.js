// Soul Launcher Ad 2: "Spaces that sync themselves." A glass Space cube gets packed with a
// version, loader, mods, worlds and settings; Spaces multiply for every setup; three of them join a
// category, a server added in one pops up in all of them, a settings slider drags all three, and
// the file tree shows how it works (one shared servers.dat / options.txt, linked). Then the end card.
(() => {
  const M = MR, S = SOUL, { ctx, W, H, TAU } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInOutCubic, easeInCubic } = M;
  const { C } = S;

  const GRID = 2.4, CAT = 5.0, PANEL = 6.35, ADD_CLICK = 6.75, TYPE0 = 6.88, DONE_CLICK = 7.55, SEND = 7.9;
  const SLIDE = 8.95, TREE = 10.45, END = 13.2, DUR = 18.1;
  const SERVER = 'Friday Night SMP', TYPE_DT = 0.028;

  const hexA = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  };

  // ---------- isometric blocks ----------
  const K = 0.866;
  function faces(cx, cy, s) {
    const tx = cx, ty = cy - s;
    return {
      top: [[tx, ty], [tx + K * s, ty + s / 2], [tx, ty + s], [tx - K * s, ty + s / 2]],
      left: [[tx - K * s, ty + s / 2], [tx, ty + s], [tx, ty + 2 * s], [tx - K * s, ty + 1.5 * s]],
      right: [[tx, ty + s], [tx + K * s, ty + s / 2], [tx + K * s, ty + 1.5 * s], [tx, ty + 2 * s]],
    };
  }
  function poly(pts) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }
  function texFace(tex, a, b, c, d, e, f) {
    ctx.save();
    ctx.transform(a / 16, b / 16, c / 16, d / 16, e, f);
    ctx.drawImage(tex, 0, 0);
    ctx.restore();
  }
  function texBlock(cx, cy, s, top, side) {
    const tx = cx, ty = cy - s;
    ctx.imageSmoothingEnabled = false;
    texFace(top, K * s, s / 2, -K * s, s / 2, tx, ty);
    texFace(side, K * s, s / 2, 0, s, tx - K * s, ty + s / 2);
    texFace(side, K * s, -s / 2, 0, s, tx, ty + s);
    const f = faces(cx, cy, s);
    poly(f.left); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();
    poly(f.right); ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fill();
  }

  const TX = {};
  function noise(name, cols, seed) {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      g.fillStyle = cols[Math.floor(hash(seed + x * 17 + y * 131) * cols.length)];
      g.fillRect(x, y, 1, 1);
    }
    TX[name] = c;
  }
  const tint = (hex) => [M.shade(hex, -0.12), M.shade(hex, -0.04), M.shade(hex, 0.05), M.shade(hex, -0.2)];

  const SPACES = [
    { name: 'Fabric', ver: '1.21.1', col: '#e3cf9f', tex: 'planks' },
    { name: 'Vanilla', ver: '1.21.1', col: '#6fcf3a', tex: 'grass' },
    { name: 'Quilt', ver: '1.20.4', col: '#b48cff', tex: 'quilt' },
    { name: 'Forge', ver: '1.20.1', col: '#7d9bff', tex: 'cobble' },
    { name: 'NeoForge', ver: '1.21.1', col: '#ff8a3d', tex: 'neo' },
    { name: 'OptiFine', ver: '1.20.1', col: '#ff6b7d', tex: 'opti' },
  ];
  function setup() {
    noise('gtop', ['#5fbf2a', '#4ea823', '#6fd23a', '#58b326'], 11);
    noise('quilt', tint('#9b6bff'), 12);
    noise('neo', tint('#ff8a3d'), 13);
    noise('opti', tint('#ff6b7d'), 14);
    SPACES.forEach((sp) => {
      sp.side = TX[sp.tex] || M.TEX[sp.tex];
      sp.top = sp.tex === 'grass' ? TX.gtop : sp.side;
    });
  }

  // a glass Space with a little block floating inside. o.flash 0..1, o.inner 0..1
  function space(sp, cx, cy, s, t, o = {}) {
    if (s <= 1) return;
    const f = faces(cx, cy, s);
    const fl = o.flash || 0;
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    S.blob(cx, cy, s * 2.1, hexA(sp.col, 0.16 + 0.4 * fl));
    poly(f.left); ctx.fillStyle = hexA(sp.col, 0.08 + 0.1 * fl); ctx.fill();
    poly(f.right); ctx.fillStyle = hexA(sp.col, 0.13 + 0.1 * fl); ctx.fill();
    poly(f.top); ctx.fillStyle = hexA(sp.col, 0.2 + 0.15 * fl); ctx.fill();
    const inner = o.inner ?? 1;
    if (inner > 0) {
      const bob = Math.sin(t * 2.2 + cx * 0.01) * s * 0.06;
      texBlock(cx, cy + s * 0.1 + bob, s * 0.44 * easeOutBack(clamp(inner), 2), sp.top, sp.side);
    }
    ctx.lineJoin = 'round';
    ctx.shadowColor = sp.col;
    ctx.shadowBlur = 18 + 30 * fl;
    ctx.strokeStyle = M.mixColor(sp.col, '#ffffff', 0.25 + 0.5 * fl);
    ctx.lineWidth = Math.max(2, s * 0.025);
    poly([f.top[0], f.top[1], f.right[2], f.right[3], f.left[3], f.left[0]]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(...f.top[3]); ctx.lineTo(...f.top[2]); ctx.lineTo(...f.top[1]);
    ctx.moveTo(...f.top[2]); ctx.lineTo(...f.right[3]);
    ctx.stroke();
    ctx.restore();
  }
  function plate(sp, cx, y, e) {
    S.pill(`${sp.name} ${sp.ver}`, cx, y, e, { size: 26, dot: sp.col, pad: 26 });
  }

  // ---------- 1. hook: pack a Space ----------
  const ITEMS = [
    { label: '1.21.1', kind: 'ver', from: [180, 1520], t: 0.6 },
    { label: 'Fabric', kind: 'loader', from: [900, 1540], t: 0.88 },
    { label: 'Mods', kind: 'mods', from: [170, 640], t: 1.16 },
    { label: 'Worlds', kind: 'world', from: [910, 660], t: 1.44 },
    { label: 'Settings', kind: 'gear', from: [540, 1660], t: 1.72 },
  ];
  const WORDS = ['version', 'loader', 'mods', 'worlds', 'settings'];
  const HOOK = { x: 540, y: 1010, s: 230 };

  function itemChip(it, x, y, sc) {
    const lw = S.width(it.label, 36, 700, it.kind === 'ver' ? 'JetBrains Mono' : 'Inter');
    const w = lw + 120, h = 92;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 24);
    ctx.fillStyle = C.card2;
    ctx.shadowColor = S.MINT(0.5);
    ctx.shadowBlur = 24;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = S.MINT(0.6);
    ctx.lineWidth = 3;
    ctx.stroke();
    const ix = -w / 2 + 50;
    if (it.kind === 'ver') S.icon('play', ix, 0, 34, C.mint);
    else if (it.kind === 'loader') { ctx.fillStyle = SPACES[0].col; ctx.beginPath(); ctx.roundRect(ix - 17, -17, 34, 34, 8); ctx.fill(); }
    else if (it.kind === 'mods') ['#5eead4', '#56bde8', '#b48cff'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(ix - 22 + i * 8, -20 + i * 8, 22, 22); });
    else if (it.kind === 'world') texBlock(ix, 2, 20, TX.gtop, M.TEX.grass);
    else S.icon('gear', ix, 0, 40, C.mint);
    S.text(it.label, ix + 36, 2, 36, C.text, 'left', 700, it.kind === 'ver' ? 'JetBrains Mono' : 'Inter');
    ctx.restore();
  }

  function hook(t) {
    const landed = ITEMS.filter((it) => t >= it.t).length;
    const lastLand = landed ? ITEMS[landed - 1].t : -9;
    const flash = Math.exp(-(t - lastLand) * 5) * (landed ? 1 : 0);
    // the cube drops in, squashes, then settles; after GRID it flies to its slot
    const drop = easeInCubic(clamp(t / 0.28));
    let y = lerp(720, HOOK.y, drop);
    let s = HOOK.s;
    if (t > 0.28) {
      const k = t - 0.28;
      s *= 1 + 0.08 * Math.exp(-k * 9) * Math.cos(k * 30);
    }
    space(SPACES[0], HOOK.x, y, s, t, { flash, inner: landed / ITEMS.length });
    ITEMS.forEach((it) => {
      const lt = t - (it.t - 0.62);
      if (lt < 0 || t > it.t) return;
      const pop = easeOutBack(clamp(lt / 0.2), 2.4);
      const fly = easeInCubic(prog(t, it.t - 0.32, it.t));
      const x = lerp(it.from[0], HOOK.x, fly);
      const yy = lerp(it.from[1], HOOK.y, fly) - Math.sin(fly * Math.PI) * 160;
      itemChip(it, x, yy, pop * lerp(1, 0.2, fly));
    });
    ITEMS.forEach((it, i) => S.ripple(HOOK.x, HOOK.y, t - it.t, S.MINT, 300 + i * 40));
    // the caption words light up as their item lands
    const parts = [];
    WORDS.forEach((w, i) => {
      if (i) parts.push([' + ', C.faint]);
      parts.push([w, t >= ITEMS[i].t ? C.mint : C.faint]);
    });
    const total = parts.reduce((a, [s2]) => a + S.width(s2, 38, 700), 0);
    let x = 540 - total / 2;
    parts.forEach(([s2, col]) => {
      S.text(s2, x, 420, 38, col, 'left', 700);
      x += S.width(s2, 38, 700);
    });
    plate(SPACES[0], 540, HOOK.y + HOOK.s + 80, prog(t, 2.0, 2.25));
  }

  // ---------- 2. a Space for every setup ----------
  const SLOTS = [[220, 820], [540, 820], [860, 820], [220, 1210], [540, 1210], [860, 1210]];
  const POP = [GRID + 0.45, GRID + 0.6, GRID + 0.8, GRID + 1.0, GRID + 1.2, GRID + 1.4];
  const SS = 112;
  // three of them form the "family-nights" category: Fabric, Vanilla, NeoForge
  const CATS = [0, 1, 4];
  const CAT_X = [220, 540, 860], CAT_Y = 880;

  function spacePos(i, t) {
    let [x, y] = SLOTS[i];
    let s = SS;
    if (i === 0 && t < POP[0] + 0.4) {
      const e = easeInOutCubic(prog(t, GRID, GRID + 0.45));
      x = lerp(HOOK.x, x, e); y = lerp(HOOK.y, y, e); s = lerp(HOOK.s, SS, e);
    } else if (i > 0) {
      const e = prog(t, POP[i], POP[i] + 0.3);
      s = SS * clamp(easeOutBack(e, 2.2), 0, 1.3);
      y -= (1 - easeOutCubic(e)) * 80;
    }
    const ci = CATS.indexOf(i);
    const m = easeInOutCubic(prog(t, CAT, CAT + 0.55));
    if (ci >= 0) {
      x = lerp(x, CAT_X[ci], m); y = lerp(y, CAT_Y, m);
    } else {
      y += easeInCubic(m) * 900;
    }
    return { x, y, s, out: ci < 0 ? m : 0 };
  }

  function grid(t) {
    SPACES.forEach((sp, i) => {
      if (i > 0 && t < POP[i]) return;
      const p = spacePos(i, t);
      if (p.out >= 1) return;
      const fl = i > 0 ? Math.exp(-(t - POP[i]) * 6) : 0;
      space(sp, p.x, p.y, p.s, t, { flash: fl + syncFlash(i, t), alpha: 1 - p.out });
      const pe = i === 0 ? 1 : prog(t, POP[i] + 0.1, POP[i] + 0.35);
      if (t < TREE) plate(sp, p.x, p.y + p.s + 52, pe * (1 - p.out) * (1 - prog(t, TREE - 0.3, TREE)));
    });
  }

  // ---------- 3. categories that sync themselves ----------
  const ARRIVE = [SEND, SEND + 0.62, SEND + 0.78]; // Fabric sends; node is hit at SEND + 0.35
  const NODE = { x: 540, y: 1320 };
  function syncFlash(i, t) {
    const ci = CATS.indexOf(i);
    if (ci < 0 || t < SEND) return 0;
    let f = ci === 0 ? 0 : Math.exp(-(t - ARRIVE[ci]) * 5) * (t > ARRIVE[ci] ? 1 : 0);
    if (t > SLIDE + 0.15 && t < SLIDE + 1.05) f = Math.max(f, 0.35 + 0.25 * Math.sin(t * 20));
    return f;
  }

  function categoryFrame(t) {
    const e = easeOutCubic(prog(t, CAT + 0.45, CAT + 0.85)) * (1 - prog(t, TREE - 0.3, TREE));
    if (e <= 0) return;
    ctx.save();
    ctx.globalAlpha *= e;
    ctx.setLineDash([22, 14]);
    ctx.lineDashOffset = -t * 40;
    ctx.strokeStyle = S.MINT(0.7);
    ctx.lineWidth = 4;
    ctx.shadowColor = S.MINT(0.6);
    ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.roundRect(50, 650, 980, 470, 34); ctx.stroke();
    ctx.restore();
    S.pill('FAMILY NIGHTS', 250, 650, e, { size: 26, fill: C.mint, color: C.ink, stroke: C.mint, spacing: 3, pad: 30, glow: 24 });
  }

  function links(t, toY, e) {
    if (e <= 0) return;
    ctx.save();
    ctx.globalAlpha *= e;
    ctx.setLineDash([14, 12]);
    ctx.lineDashOffset = -t * 60;
    ctx.strokeStyle = S.MINT(0.55);
    ctx.lineWidth = 4;
    CAT_X.forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, CAT_Y + SS + 82);
      ctx.bezierCurveTo(x, CAT_Y + SS + 170, toX(x), toY - 120, toX(x), toY - 62);
      ctx.stroke();
    });
    ctx.restore();
  }
  // where a link lands: the node for the server sync, straight down for the sliders
  let linkMode = 'node';
  const toX = (x) => (linkMode === 'node' ? lerp(x, NODE.x, 0.7) : x);

  function sharedNode(t) {
    const e = appear(t, CAT + 0.9, 0.4) * (1 - prog(t, SLIDE - 0.3, SLIDE));
    if (e <= 0) return;
    linkMode = 'node';
    links(t, NODE.y, e);
    const hit = t > SEND + 0.35 ? Math.exp(-(t - SEND - 0.35) * 5) : 0;
    ctx.save();
    ctx.globalAlpha *= e;
    ctx.translate(0, (1 - e) * 40);
    S.card(NODE.x - 330, NODE.y - 64, 660, 128, { r: 26, stroke: S.MINT(0.4 + 0.6 * hit), glow: 20 * hit });
    S.text('shared/', NODE.x - 296, NODE.y + 2, 34, C.text, 'left', 700, 'JetBrains Mono');
    S.pill('servers.dat', NODE.x - 24, NODE.y, 1, { size: 24, family: 'JetBrains Mono', weight: 500, pad: 18, color: C.mint, stroke: S.MINT(0.4 + 0.6 * hit) });
    S.pill('options.txt', NODE.x + 190, NODE.y, 1, { size: 24, family: 'JetBrains Mono', weight: 500, pad: 18, color: C.mint });
    ctx.restore();
  }

  function mcButton(label, cx, cy, w, h, hot) {
    ctx.fillStyle = '#111';
    ctx.fillRect(cx - w / 2 - 4, cy - h / 2 - 4, w + 8, h + 8);
    ctx.fillStyle = hot ? '#7f8fe0' : '#6d6d6d';
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(cx - w / 2, cy - h / 2, w, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(cx - w / 2, cy + h / 2 - 6, w, 6);
    S.text(label, cx + 3, cy + 4, 32, '#3a3a3a', 'center', 700, 'Pixelify Sans');
    S.text(label, cx, cy + 1, 32, '#ffffff', 'center', 700, 'Pixelify Sans');
  }

  // the in-game Multiplayer screen inside the Fabric Space
  function serverPanel(t) {
    const pin = easeOutBack(prog(t, PANEL, PANEL + 0.3), 1.6);
    const pout = easeInCubic(prog(t, SEND - 0.25, SEND));
    if (pin <= 0 || pout >= 1) return;
    const cx = lerp(540, CAT_X[0], pout), cy = lerp(1080, CAT_Y, pout);
    const sc = clamp(pin, 0, 1.1) * lerp(1, 0.08, pout);
    ctx.save();
    ctx.fillStyle = `rgba(4,6,10,${0.6 * clamp(pin) * (1 - pout)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    ctx.translate(-540, -1080);
    const x0 = 120, y0 = 790, w = 840, h = 580;
    ctx.fillStyle = 'rgba(14,17,22,0.97)';
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeRect(x0, y0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(x0, y0, w, 92);
    S.text('Multiplayer', 543, y0 + 50, 46, '#3a3a3a', 'center', 700, 'Pixelify Sans');
    S.text('Multiplayer', 540, y0 + 47, 46, '#ffffff', 'center', 700, 'Pixelify Sans');
    S.pill('in Fabric 1.21.1', 540, y0 + 128, 1, { size: 22, dot: SPACES[0].col, pad: 20 });
    // list area
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x0 + 30, y0 + 170, w - 60, 210);
    const typing = t > TYPE0 - 0.1 && t < DONE_CLICK;
    const added = t > DONE_CLICK + 0.05;
    if (typing) {
      S.text('Server Name', x0 + 60, y0 + 215, 26, '#a0a0a0', 'left', 700, 'Pixelify Sans');
      ctx.fillStyle = '#000';
      ctx.fillRect(x0 + 56, y0 + 240, w - 112, 82);
      ctx.strokeStyle = '#a0a0a0';
      ctx.lineWidth = 3;
      ctx.strokeRect(x0 + 56, y0 + 240, w - 112, 82);
      const n = clamp(Math.floor((t - TYPE0) / TYPE_DT) + 1, 0, SERVER.length);
      const typed = t > TYPE0 ? SERVER.slice(0, n) : '';
      S.text(typed + (Math.floor(t * 4) % 2 ? '_' : ''), x0 + 80, y0 + 283, 38, '#ffffff', 'left', 700, 'Pixelify Sans');
    } else if (added) {
      const e = easeOutBack(prog(t, DONE_CLICK + 0.05, DONE_CLICK + 0.3), 2);
      ctx.save();
      ctx.globalAlpha *= clamp(e);
      ctx.translate((1 - clamp(e)) * -60, 0);
      ctx.fillStyle = 'rgba(94,234,212,0.12)';
      ctx.fillRect(x0 + 40, y0 + 190, w - 80, 170);
      texBlock(x0 + 118, y0 + 290, 46, TX.gtop, M.TEX.grass);
      S.text(SERVER, x0 + 200, y0 + 245, 40, '#ffffff', 'left', 700, 'Pixelify Sans');
      S.text('Survival  ·  1.21.1', x0 + 200, y0 + 300, 30, '#9a9a9a', 'left', 400, 'Pixelify Sans');
      [10, 16, 22, 28, 34].forEach((bh, i) => { ctx.fillStyle = '#4ade80'; ctx.fillRect(x0 + w - 120 + i * 14, y0 + 262 - bh, 9, bh); });
      ctx.restore();
    } else {
      S.text('No servers yet', 540, y0 + 276, 32, '#7a7a7a', 'center', 400, 'Pixelify Sans');
    }
    const hotAdd = t > ADD_CLICK - 0.3 && t < ADD_CLICK + 0.1;
    const hotDone = t > DONE_CLICK - 0.3 && t < DONE_CLICK + 0.1;
    mcButton(typing ? 'Cancel' : 'Add Server', 340, y0 + 470, 330, 84, hotAdd);
    mcButton('Done', 740, y0 + 470, 330, 84, hotDone);
    ctx.restore();
  }

  // the server card travelling Fabric -> shared node -> the other two Spaces
  function packet(t) {
    if (t < SEND || t > ARRIVE[2] + 0.05) return;
    const card = (x, y, sc) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      ctx.beginPath(); ctx.roundRect(-120, -36, 240, 72, 18);
      ctx.fillStyle = C.card2;
      ctx.shadowColor = S.MINT(0.9);
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = C.mint;
      ctx.lineWidth = 3;
      ctx.stroke();
      texBlock(-86, 4, 18, TX.gtop, M.TEX.grass);
      S.text('Friday Night SMP', -56, 2, 24, C.text, 'left', 700);
      ctx.restore();
    };
    const hit = SEND + 0.35;
    const bez = (x0, y0, x1, y1, e) => {
      const ux = lerp(x0, x1, e);
      return [ux, lerp(y0, y1, e) - Math.sin(e * Math.PI) * 60];
    };
    if (t < hit) {
      const e = easeInOutCubic(prog(t, SEND, hit));
      card(...bez(CAT_X[0], CAT_Y, NODE.x, NODE.y, e), lerp(0.6, 0.9, e));
    } else {
      [1, 2].forEach((ci) => {
        const e = easeInOutCubic(prog(t, hit, ARRIVE[ci]));
        if (e < 1) card(...bez(NODE.x, NODE.y, CAT_X[ci], CAT_Y, e), lerp(0.9, 0.6, e));
      });
    }
  }

  function serverBadges(t) {
    CATS.forEach((_, ci) => {
      const at = ci === 0 ? DONE_CLICK + 0.3 : ARRIVE[ci];
      const e = prog(t, at, at + 0.25) * (1 - prog(t, SLIDE - 0.3, SLIDE));
      S.pill('+ Friday Night SMP', CAT_X[ci], CAT_Y - SS - 36, e, { size: 20, pad: 16, color: C.mint, stroke: S.MINT(0.6) });
    });
  }

  // render-distance sliders that move together
  const SL_Y = 1330;
  const sliderVal = (t, lag) => {
    const e = easeInOutCubic(prog(t, SLIDE + 0.25 + lag, SLIDE + 0.95 + lag));
    return Math.round(lerp(12, 24, e));
  };
  function sliders(t) {
    const e = appear(t, SLIDE, 0.35) * (1 - prog(t, TREE - 0.3, TREE));
    if (e <= 0) return;
    linkMode = 'down';
    links(t, SL_Y - 20, e);
    CAT_X.forEach((x, ci) => {
      const v = sliderVal(t, ci * 0.025);
      ctx.save();
      ctx.globalAlpha *= e;
      ctx.translate(0, (1 - e) * 50);
      S.card(x - 150, SL_Y - 70, 300, 170, { r: 22, stroke: t > SLIDE + 0.3 && t < SLIDE + 1.1 ? S.MINT(0.7) : C.line });
      S.text('Render distance', x, SL_Y - 36, 22, C.dim, 'center', 600);
      S.title([{ t: `${v} chunks`, c: ci === 0 ? 'mint' : undefined }], x, SL_Y + 8, 42, 1);
      const tx = x - 110, tw = 220, ty = SL_Y + 60;
      ctx.fillStyle = '#2a313b';
      ctx.beginPath(); ctx.roundRect(tx, ty - 5, tw, 10, 5); ctx.fill();
      const k = (v - 2) / 30;
      ctx.fillStyle = C.mint;
      ctx.beginPath(); ctx.roundRect(tx, ty - 5, tw * k, 10, 5); ctx.fill();
      ctx.beginPath(); ctx.arc(tx + tw * k, ty, 15, 0, TAU);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = S.MINT(0.8);
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.restore();
    });
  }

  // ---------- 4. the file tree ----------
  const TREE_LINES = [
    { t: TREE + 0.2, a: 'categories/family-nights/shared/', col: C.text },
    { t: TREE + 0.5, a: '  servers.dat', col: C.mint, note: 'one list for the group' },
    { t: TREE + 0.78, a: '  options.txt', col: C.mint, note: 'one settings file' },
    { t: TREE + 1.1, a: 'spaces/fabric-1.21.1/', col: C.text, link: TREE + 1.35 },
    { t: TREE + 1.42, a: 'spaces/vanilla-1.21.1/', col: C.text, link: TREE + 1.67 },
    { t: TREE + 1.74, a: 'spaces/neoforge-1.21.1/', col: C.text, link: TREE + 1.99 },
  ];
  const CPS = 110;
  function tree(t) {
    if (t < TREE - 0.1) return;
    const e = appear(t, TREE - 0.1, 0.35);
    ctx.save();
    ctx.globalAlpha *= e;
    ctx.translate(0, (1 - e) * 60);
    S.card(70, 610, 940, 640, { r: 30 });
    S.text('HOW A CATEGORY LOOKS ON DISK', 120, 672, 22, C.dim, 'left', 700, 'Inter', 4);
    TREE_LINES.forEach((ln, i) => {
      if (t < ln.t) return;
      const y = 770 + i * 84;
      const n = Math.min(ln.a.length, Math.floor((t - ln.t) * CPS) + 1);
      S.text(ln.a.slice(0, n), 120, y, 36, ln.col, 'left', ln.col === C.text ? 700 : 500, 'JetBrains Mono');
      if (n >= ln.a.length && ln.note) {
        ctx.save();
        ctx.globalAlpha *= prog(t, ln.t + 0.15, ln.t + 0.3);
        S.text(ln.note, 470, y + 1, 28, C.dim, 'left', 500);
        ctx.restore();
      }
      if (ln.link && t > ln.link) {
        const le = prog(t, ln.link, ln.link + 0.22);
        const end = 120 + S.width(ln.a, 36, 700, 'JetBrains Mono');
        S.icon('link', end + 36, y, 34 * clamp(le * 2), C.mint);
        S.pill('linked', end + 126, y, le, { size: 26, color: C.ink, fill: C.mint, stroke: C.mint, pad: 22, glow: 20 });
      }
    });
    ctx.restore();
    const ne = appear(t, TREE + 2.25, 0.35);
    if (ne > 0) {
      ctx.save();
      ctx.globalAlpha *= ne;
      S.text('No export. No copy-paste. No settings screen.', 540, 1330 + (1 - ne) * 20, 34, C.dim, 'center', 600);
      ctx.restore();
    }
  }

  // ---------- titles ----------
  const TITLES = [
    [0, [[{ t: 'This is a ' }, { t: 'Space.', c: 'mint' }]], -0.2],
    [GRID, [[{ t: 'Make one for' }], [{ t: 'every setup.', c: 'mint' }]]],
    [CAT, [[{ t: 'Categories that' }], [{ t: 'sync themselves.', c: 'mint' }]]],
    [TREE, [[{ t: 'Sync without' }], [{ t: 'a sync button.', c: 'mint' }]]],
  ];
  const SUBS = [
    [GRID + 1.6, CAT - 0.2, 'Fully isolated. Mix them freely.'],
    [PANEL + 0.1, SEND + 0.3, 'Add a server in one Space…'],
    [SEND + 0.3, SLIDE - 0.1, '…and it’s on every Space.'],
    [SLIDE, TREE - 0.2, 'Your settings too.'],
  ];
  function titles(t) {
    for (let i = TITLES.length - 1; i >= 0; i--) {
      const [t0, lines, lead = 0.05] = TITLES[i];
      if (t < t0) continue;
      const out = i < TITLES.length - 1 ? 1 - prog(t, TITLES[i + 1][0] - 0.18, TITLES[i + 1][0]) : 1;
      ctx.save();
      ctx.globalAlpha *= out;
      lines.forEach((parts, li) => S.title(parts, 540, lines.length > 1 ? 255 + li * 100 : 300, lines.length > 1 ? 96 : 112, appear(t, t0 + lead + li * 0.1, 0.35)));
      ctx.restore();
      break;
    }
    SUBS.forEach(([t0, t1, s]) => {
      const e = M.window(t, t0, t1, 0.25, 0.18);
      if (e <= 0) return;
      ctx.save();
      ctx.globalAlpha *= e;
      S.text(s, 540, 468 + (1 - e) * 14, 42, s.startsWith('…and') ? C.mint : C.text, 'center', 700);
      ctx.restore();
    });
  }

  // ---------- frame ----------
  function render(t) {
    if (t >= END) { S.endCard(t, END, { top: [[{ t: 'Spaces that ' }, { t: 'sync themselves.', c: 'mint' }]] }); return; }
    S.drawBg(t);
    S.embers(t, 16, 2, 0.6);
    if (t < GRID) {
      hook(t);
    } else if (t < TREE + 0.2) {
      ctx.save();
      ctx.globalAlpha *= 1 - prog(t, TREE - 0.3, TREE);
      categoryFrame(t);
      sharedNode(t);
      sliders(t);
      grid(t);
      serverBadges(t);
      packet(t);
      ctx.restore();
      serverPanel(t);
    }
    tree(t);
    titles(t);
    if (t >= GRID && t < TREE + 0.2) cursor(t);
  }

  const CLICKS = [ADD_CLICK, DONE_CLICK];
  function cursor(t) {
    if (t > PANEL + 0.1 && t < SEND - 0.2) {
      const p = S.path(t, [[PANEL + 0.1, 980, 1700], [ADD_CLICK - 0.05, 360, 1275], [TYPE0 + 0.2, 380, 1300], [DONE_CLICK - 0.06, 760, 1275], [SEND, 900, 1500]]);
      const press = Math.max(...CLICKS.map((c) => (t > c ? Math.exp(-(t - c) * 14) : 0)));
      S.cursor(p.x, p.y, 1, press);
    } else if (t > SLIDE + 0.05 && t < SLIDE + 1.4) {
      // grab the Fabric slider knob and drag it to 24
      const k = (v) => 110 + 220 * (v - 2) / 30;
      const v = sliderVal(t, 0);
      const x = t < SLIDE + 0.25 ? lerp(380, CAT_X[0] - 110 + k(12) - 110, easeOutCubic(prog(t, SLIDE + 0.05, SLIDE + 0.25))) : CAT_X[0] - 220 + k(v);
      const y = t < SLIDE + 0.25 ? lerp(1560, SL_Y + 64, easeOutCubic(prog(t, SLIDE + 0.05, SLIDE + 0.25))) : SL_Y + 64;
      S.cursor(x, y, 1, t > SLIDE + 0.25 && t < SLIDE + 0.95 ? 1 : 0);
    }
  }

  function events() {
    const ev = [{ type: 'thump', t: 0.28 }, { type: 'pop', t: 0.3, note: 60 }];
    ITEMS.forEach((it, i) => ev.push({ type: 'swipe', t: it.t - 0.2, gain: 0.45 }, { type: 'plink', t: it.t, note: [72, 74, 76, 79, 81][i] }));
    ev.push({ type: 'pop', t: 2.02, note: 84 });
    ev.push({ type: 'swipe', t: GRID + 0.05 });
    POP.slice(1).forEach((p, i) => ev.push({ type: 'pop', t: p, note: [69, 72, 74, 76, 79][i] }, { type: 'plink', t: p + 0.02, note: [81, 84, 86, 88, 91][i], gain: 0.5 }));
    ev.push({ type: 'swipe', t: CAT + 0.05 }, { type: 'latch', t: CAT + 0.6 }, { type: 'latch', t: CAT + 0.95 });
    ev.push({ type: 'swipe', t: PANEL + 0.05, gain: 0.6 }, { type: 'pop', t: PANEL + 0.1, note: 76 });
    CLICKS.forEach((c) => ev.push({ type: 'uiclick', t: c }));
    for (let i = 0; i < SERVER.length; i++) ev.push({ type: 'typing', t: TYPE0 + i * TYPE_DT });
    ev.push({ type: 'ding', t: DONE_CLICK + 0.08, note: 84 });
    ev.push({ type: 'swipe', t: SEND - 0.1, gain: 0.6 });
    ev.push({ type: 'plink', t: SEND + 0.35, note: 79 });
    ARRIVE.slice(1).forEach((a, i) => ev.push({ type: 'ding', t: a, note: [86, 91][i] }, { type: 'sparkle', t: a + 0.02, note: [86, 91][i] }));
    ev.push({ type: 'swipe', t: SLIDE + 0.05, gain: 0.5 });
    let last = 12;
    for (let tt = SLIDE + 0.25; tt < SLIDE + 1.05; tt += 1 / 60) {
      const v = sliderVal(tt, 0);
      if (v !== last) { ev.push({ type: 'tick', t: tt, gain: 0.5 }); last = v; }
    }
    ev.push({ type: 'ding', t: SLIDE + 1.0, note: 88 });
    ev.push({ type: 'swipe', t: TREE - 0.1 }, { type: 'hit', t: TREE, gain: 0.6 });
    TREE_LINES.forEach((ln) => {
      for (let i = 0; i < ln.a.trim().length; i += 3) ev.push({ type: 'typing', t: ln.t + i / CPS });
      if (ln.link) ev.push({ type: 'latch', t: ln.link }, { type: 'pop', t: ln.link + 0.02, note: 84, gain: 0.6 });
    });
    ev.push({ type: 'pop', t: TREE + 2.27, note: 79, gain: 0.5 });
    return ev.concat(S.endCardEvents(END));
  }

  S.start({ duration: DUR, cover: 8.6, setup, render, events });
})();
