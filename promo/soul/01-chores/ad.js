// Soul Launcher Ad 1: "Minecraft, minus the chores." Setting up modded Minecraft by hand buries
// the desktop in error popups and duplicate folders while a setup timer runs away; it freezes,
// a wall of soul fire burns it off, and Soul Launcher does the same job in 4 steps
// (version, software, content, name -> Play) while Java and the loader install themselves.
(() => {
  const M = MR, S = SOUL, { ctx, W, H, TAU } = M;
  const { prog, lerp, clamp, appear, hash, easeOutBack, easeOutCubic, easeInOutCubic } = M;
  const { C } = S;

  const FREEZE = 6.3, BURN0 = 6.85, BURN1 = 7.55;
  const WIZ = BURN1;
  const STEP = [8.25, 9.35, 10.45, 11.55];
  const TYPE0 = STEP[3] + 0.3, NAME = 'Survival with friends', TYPE_DT = 0.032;
  const PLAY = 12.75, INSTALL = [13.05, 13.25, 13.45, 13.65];
  const CHORES = 14.1, END = 16.0, DUR = 20.9;

  // ---------- the messy desktop ----------
  let desk;
  function buildDesk() {
    desk = document.createElement('canvas');
    desk.width = W; desk.height = H;
    const b = desk.getContext('2d');
    const g = b.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#24365a');
    g.addColorStop(1, '#0d1526');
    b.fillStyle = g;
    b.fillRect(0, 0, W, H);
    [['#1a2945', 1300, 140], ['#121d33', 1500, 90]].forEach(([col, base, amp], k) => {
      b.fillStyle = col;
      for (let x = 0; x < W; x += 30) {
        const h = Math.round((base + amp * Math.sin(x * 0.004 + k * 2) + amp * 0.5 * Math.sin(x * 0.013 + k)) / 30) * 30;
        b.fillRect(x, h, 30, H - h);
      }
    });
    b.fillStyle = '#0b1019';
    b.fillRect(0, 1830, W, 90);
    b.fillStyle = 'rgba(255,255,255,0.08)';
    b.fillRect(0, 1830, W, 2);
    for (let i = 0; i < 6; i++) {
      b.fillStyle = ['#3b82f6', '#f4c04e', '#9aa5b4', '#5eead4', '#ff8a3d', '#a879ff'][i];
      b.beginPath();
      b.roundRect(540 - 3 * 76 + i * 76 + 12, 1852, 52, 52, 12);
      b.fill();
    }
  }

  const FILES = [
    ['mods', 'dir'], ['jdk-17.exe', 'EXE'], ['mods (2)', 'dir'], ['forge-installer.jar', 'JAR'], ['mods_OLD', 'dir'],
    ['.minecraft copy', 'dir'], ['jdk-21.exe', 'EXE'], ['servers.dat', 'DAT'], ['mods_backup_FINAL', 'dir'],
    ['fabric-installer.jar', 'JAR'], ['options.txt', 'TXT'], ['New folder', 'dir'], ['crash-report.txt', 'TXT'],
    ['java8_setup.exe', 'EXE'], ['New folder (2)', 'dir'], ['servers (1).dat', 'DAT'], ['mods_FINAL_v2', 'dir'],
    ['latest.log', 'TXT'], ['options (old).txt', 'TXT'], ['mods_FINAL_v3', 'dir'],
  ];
  const SLOTS = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) SLOTS.push([95 + c * 178, 590 + r * 185, hash(r * 6 + c + 0.5)]);
  SLOTS.sort((a, b) => a[2] - b[2]);
  const ICONS = FILES.map(([name, kind], i) => ({
    name, kind, x: SLOTS[i][0], y: SLOTS[i][1], t: i < 3 ? -1 : 5.9 * Math.pow(i / FILES.length, 0.8),
  }));
  const BAND = { EXE: '#3b82f6', JAR: '#ff8a3d', DAT: '#a879ff', TXT: '#9aa5b4' };

  function fileIcon(f, t) {
    const e = prog(t, f.t, f.t + 0.18);
    if (e <= 0) return;
    const s = 1.2 * clamp(easeOutBack(e, 2.6), 0, 1.3);
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    if (f.kind === 'dir') {
      ctx.fillStyle = '#d9a537';
      ctx.beginPath(); ctx.roundRect(-46, -38, 40, 18, 5); ctx.fill();
      ctx.beginPath(); ctx.roundRect(-46, -30, 92, 66, 7); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#f4c04e';
      ctx.beginPath(); ctx.roundRect(-46, -18, 92, 54, 7); ctx.fill();
    } else {
      ctx.fillStyle = '#eef2f6';
      ctx.beginPath();
      ctx.moveTo(-32, -42); ctx.lineTo(16, -42); ctx.lineTo(34, -24); ctx.lineTo(34, 40); ctx.lineTo(-32, 40);
      ctx.closePath(); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#c6ced8';
      ctx.beginPath(); ctx.moveTo(16, -42); ctx.lineTo(16, -24); ctx.lineTo(34, -24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = BAND[f.kind];
      ctx.fillRect(-32, 4, 66, 26);
      S.text(f.kind, 1, 18, 18, '#fff', 'center', 700);
    }
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 6;
    let name = f.name;
    while (S.width(name, 21, 600) > 168 && name.length > 4) name = name.slice(0, -2);
    if (name !== f.name) name += '…';
    S.text(name, 0, 68, 21, '#ffffff', 'center', 600);
    ctx.restore();
  }

  // error popups, in the order they land
  const POPS = [
    { t: 0.05, x: 540, y: 820, icon: 'warn', title: 'Java not found', lines: ['Please install Java 21', 'to continue.'], btns: ['OK'] },
    { t: 1.05, x: 470, y: 1090, icon: 'down', title: 'Downloading…', lines: ['jdk-17_windows-x64.exe'], bar: true, btns: ['Cancel'] },
    { t: 1.95, x: 610, y: 700, icon: 'error', title: 'Wrong Java version', lines: ['This version needs Java 21.', 'You installed Java 17.'], btns: ['OK'] },
    { t: 2.55, x: 440, y: 1290, icon: 'info', title: 'forge-installer.jar', lines: ['Select the install folder…'], btns: ['Browse…', 'OK'] },
    { t: 3.1, x: 630, y: 960, icon: 'error', title: 'Incompatible mods', lines: ['coolmod-2.1.jar needs Fabric.', 'You installed Forge.'], btns: ['OK'] },
    { t: 3.6, x: 490, y: 640, icon: 'warn', title: 'Replace file?', lines: ['servers.dat already exists', 'in mods_backup_FINAL.'], btns: ['Replace', 'Skip'] },
    { t: 4.05, x: 600, y: 1380, icon: 'warn', title: 'options.txt', lines: ['Your settings were reset', 'to default.'], btns: ['OK'] },
  ];
  const CRASH0 = 4.5;
  for (let k = 0; k < 17; k++) {
    POPS.push({ t: CRASH0 + k * 0.1 - k * k * 0.0012, x: 330 + k * 24, y: 690 + k * 34, icon: 'error', title: 'Game crashed', lines: ['Exit code: 1'], btns: ['OK'], crash: true });
  }
  POPS.forEach((p, i) => { p.rot = (hash(i * 9.1) - 0.5) * (p.crash ? 0 : 0.08); });

  function dialogIcon(kind, x, y) {
    ctx.save();
    ctx.translate(x, y);
    if (kind === 'warn') {
      ctx.fillStyle = C.amber;
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(32, 26); ctx.lineTo(-32, 26); ctx.closePath(); ctx.fill();
      S.text('!', 0, 6, 34, '#2a1a00', 'center', 800);
    } else {
      ctx.fillStyle = kind === 'error' ? '#ef4444' : '#3b82f6';
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill();
      if (kind === 'error') S.icon('cross', 0, 0, 40, '#fff');
      else if (kind === 'down') S.icon('download', 0, 0, 34, '#fff');
      else S.text('i', 0, 2, 36, '#fff', 'center', 800);
    }
    ctx.restore();
  }

  function popup(p, t) {
    const e = prog(t, p.t, p.t + 0.16);
    if (e <= 0) return;
    const w = 640, lineH = 42;
    const h = 64 + 34 + p.lines.length * lineH + (p.bar ? 40 : 0) + 96;
    const s = clamp(easeOutBack(e, 2.4), 0, 1.25);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(s, s);
    ctx.translate(-w / 2, -h / 2);
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    ctx.beginPath(); ctx.roundRect(0, 0, w, h, 14);
    ctx.fillStyle = '#1f242d';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#2b313c';
    ctx.fillRect(0, 0, w, 64);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    ctx.stroke();
    S.text(p.title, 28, 33, 28, '#f1f4f8', 'left', 600);
    S.icon('cross', w - 36, 32, 26, '#9aa5b4');
    dialogIcon(p.icon, 66, 64 + 34 + 26);
    p.lines.forEach((ln, i) => S.text(ln, 124, 64 + 40 + i * lineH, 30, '#d6dde6', 'left', 500));
    if (p.bar) {
      const by = 64 + 40 + p.lines.length * lineH + 6;
      ctx.fillStyle = '#323946';
      ctx.beginPath(); ctx.roundRect(124, by, 470, 16, 8); ctx.fill();
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath(); ctx.roundRect(124, by, 470 * Math.min(0.63, (t - p.t) * 0.9), 16, 8); ctx.fill();
    }
    let bx = w - 28;
    [...p.btns].reverse().forEach((label, i) => {
      const bw = Math.max(130, S.width(label, 26, 600) + 56);
      bx -= bw;
      ctx.beginPath(); ctx.roundRect(bx, h - 82, bw, 56, 10);
      ctx.fillStyle = i === 0 ? '#3b82f6' : '#353c48';
      ctx.fill();
      S.text(label, bx + bw / 2, h - 54, 26, '#fff', 'center', 600);
      bx -= 16;
    });
    ctx.restore();
  }

  function setupClock(t) {
    const secs = Math.floor(9300 * Math.pow(clamp(t / FREEZE), 2.3));
    const hh = String(Math.floor(secs / 3600)).padStart(2, '0');
    const mm = String(Math.floor(secs / 60) % 60).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    const heat = prog(t, 1.5, FREEZE);
    const col = M.mixColor('#eef3f8', '#ff5c6c', heat);
    const w = 470, h = 92;
    ctx.save();
    ctx.translate(540, 470);
    const s = 1 + 0.05 * heat * Math.abs(Math.sin(t * 9));
    ctx.scale(s, s);
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
    ctx.fillStyle = 'rgba(10,13,18,0.9)';
    ctx.fill();
    ctx.strokeStyle = M.mixColor('#3a4350', '#ff5c6c', heat);
    ctx.lineWidth = 3;
    ctx.stroke();
    S.text('SETUP TIME', -w / 2 + 34, 2, 22, C.dim, 'left', 700, 'Inter', 3);
    S.text(`${hh}:${mm}:${ss}`, w / 2 - 34, 3, 44, col, 'right', 700, 'JetBrains Mono');
    ctx.restore();
  }

  function chaos(t) {
    const tc = Math.min(t, FREEZE);
    ctx.save();
    const amp = 12 * prog(tc, 4.3, 6.1) * (t < FREEZE ? 1 : 0);
    ctx.translate(amp * Math.sin(t * 91), amp * Math.cos(t * 127));
    ctx.drawImage(desk, -20, -20, W + 40, H + 40);
    ICONS.forEach((f) => fileIcon(f, tc));
    POPS.forEach((p) => popup(p, tc));
    ctx.restore();
    if (t < FREEZE) {
      M.caption([[{ t: 'POV: you just want to' }], [{ t: 'play modded Minecraft', c: C.mint }]], 540, 290, 70, appear(t, -0.12, 0.3));
      setupClock(tc);
    } else {
      setupClock(tc);
      ctx.fillStyle = `rgba(4,6,10,${0.55 * prog(t, FREEZE, FREEZE + 0.15)})`;
      ctx.fillRect(0, 0, W, H);
      M.caption([[{ t: 'Or skip ' }, { t: 'all of it.', c: C.mint }]], 540, 300, 92, appear(t, FREEZE + 0.05, 0.25));
    }
  }

  // ---------- the launcher wizard ----------
  const VERSIONS = [['1.21.1', 'Latest release'], ['1.20.6', ''], ['1.20.1', ''], ['1.8.9', '']];
  const SOFT = [['Vanilla', '#6fcf3a'], ['Fabric', '#dbc8a0'], ['Quilt', '#a879ff'], ['Forge', '#6c8cff'], ['NeoForge', '#ff8a3d'], ['OptiFine', '#ff5c6c']];
  const MODS = [['Sodium', 'Rendering', '#5eead4'], ['Lithium', 'Performance', '#56bde8'], ['Iris', 'Shaders', '#a879ff']];
  const ADD = [STEP[2] + 0.4, STEP[2] + 0.65, STEP[2] + 0.9];
  const STEPS = ['Version', 'Software', 'Content', 'Name'];
  const WX = 90, WY = 560, WW = 900, WH = 800;
  const tile = (i) => ({ x: 130 + 127 + (i % 3) * 283, y: 880 + Math.floor(i / 3) * 170 });

  function stepPills(t) {
    const pw = 196, gap = 12;
    const x0 = 540 - (pw * 4 + gap * 3) / 2;
    STEPS.forEach((name, i) => {
      const active = t >= STEP[i] && (i === 3 || t < STEP[i + 1]) && t < PLAY;
      const done = (i < 3 && t >= STEP[i + 1]) || t >= PLAY;
      const x = x0 + i * (pw + gap);
      ctx.beginPath(); ctx.roundRect(x, 650, pw, 60, 30);
      ctx.fillStyle = active ? C.mint : done ? 'rgba(94,234,212,0.12)' : 'rgba(255,255,255,0.04)';
      ctx.fill();
      ctx.strokeStyle = active || done ? C.mint : C.line;
      ctx.lineWidth = 2;
      ctx.stroke();
      const col = active ? C.ink : done ? C.mint : C.faint;
      if (done) S.icon('check', x + 34, 680, 26, C.mint);
      else S.text(String(i + 1), x + 34, 681, 26, col, 'center', 800, 'Baloo 2');
      S.text(name, x + 58, 681, 25, col, 'left', 700);
    });
  }

  function stepContent(i, t, fn) {
    const t0 = STEP[i], t1 = i < 3 ? STEP[i + 1] : PLAY + 0.2;
    if (t < t0 - 0.01 || t > t1 + 0.3) return;
    const ein = easeOutCubic(prog(t, t0, t0 + 0.3));
    const eout = easeInOutCubic(prog(t, t1, t1 + 0.3));
    ctx.save();
    ctx.beginPath(); ctx.rect(WX + 2, 730, WW - 4, 460); ctx.clip();
    ctx.translate((1 - ein) * 500 - eout * 900, 0);
    ctx.globalAlpha *= ein * (1 - eout);
    fn(t - t0);
    ctx.restore();
  }

  function row(x, y, w, h, sel) {
    ctx.beginPath(); ctx.roundRect(x, y - h / 2, w, h, 18);
    ctx.fillStyle = sel ? 'rgba(94,234,212,0.12)' : C.card2;
    ctx.fill();
    ctx.strokeStyle = sel ? C.mint : C.line;
    ctx.lineWidth = sel ? 3 : 2;
    ctx.stroke();
  }

  function wizard(t) {
    const we = appear(t, WIZ + 0.45, 0.45) * (1 - prog(t, CHORES - 0.35, CHORES));
    if (we <= 0) return;
    ctx.save();
    ctx.globalAlpha *= we;
    ctx.translate(0, (1 - we) * 90);
    S.card(WX, WY, WW, WH, { r: 30 });
    ctx.save();
    ctx.beginPath(); ctx.roundRect(WX, WY, WW, WH, 30); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(WX, WY, WW, 66);
    ctx.restore();
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(WX + 36 + i * 30, WY + 33, 9, 0, TAU); ctx.fill();
    });
    S.text('New Space', 540, WY + 34, 28, C.text, 'center', 700);
    stepPills(t);

    // 1. version
    stepContent(0, t, (lt) => {
      S.text('Minecraft version', 130, 760, 26, C.dim, 'left', 600);
      VERSIONS.forEach(([v, note], i) => {
        const y = 832 + i * 94;
        const sel = i === 0 && lt > 0.55;
        row(130, y, 820, 74, sel);
        S.text(v, 164, y + 1, 32, C.text, 'left', 700, 'JetBrains Mono');
        if (note) S.text(note, 320, y + 1, 24, C.dim, 'left', 500);
        if (sel) S.badge('check', 906, y, 44, prog(lt, 0.55, 0.75));
      });
    });
    // 2. software
    stepContent(1, t, (lt) => {
      S.text('Software', 130, 760, 26, C.dim, 'left', 600);
      SOFT.forEach(([name, col], i) => {
        const { x, y } = tile(i);
        const sel = i === 1 && lt > 0.55;
        ctx.save();
        if (sel) { ctx.shadowColor = S.MINT(0.6); ctx.shadowBlur = 24; }
        row(x - 127, y, 254, 146, sel);
        ctx.restore();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.roundRect(x - 22, y - 50, 44, 44, 10); ctx.fill();
        S.text(name, x, y + 34, 30, C.text, 'center', 700);
        if (sel) S.badge('check', x + 100, y - 46, 40, prog(lt, 0.55, 0.75));
      });
    });
    // 3. content
    stepContent(2, t, () => {
      S.pill('Matched to 1.21.1  ·  Fabric', 540, 768, 1, { size: 24, color: C.mint, stroke: S.MINT(0.45), dot: C.mint, pad: 24 });
      MODS.forEach(([name, desc, col], i) => {
        const y = 880 + i * 116;
        const added = t > ADD[i];
        row(130, y, 820, 100, false);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.roundRect(160, y - 28, 56, 56, 12); ctx.fill();
        S.text(name, 240, y - 14, 32, C.text, 'left', 700);
        S.text(desc, 240, y + 22, 24, C.dim, 'left', 500);
        const sq = t > ADD[i] ? 1 - 0.1 * Math.exp(-(t - ADD[i]) * 12) : 1;
        ctx.save();
        ctx.translate(840, y);
        ctx.scale(sq, sq);
        ctx.beginPath(); ctx.roundRect(-92, -30, 184, 60, 30);
        ctx.fillStyle = added ? C.mint : 'rgba(94,234,212,0.08)';
        ctx.fill();
        ctx.strokeStyle = C.mint;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (added) {
          S.icon('check', -50, 0, 26, C.ink);
          S.text('Added', 16, 1, 26, C.ink, 'center', 700);
        } else {
          S.text('+ Add', 0, 1, 26, C.mint, 'center', 700);
        }
        ctx.restore();
      });
    });
    // 4. name
    stepContent(3, t, () => {
      S.text('Name your Space', 130, 760, 26, C.dim, 'left', 600);
      const focus = t > TYPE0 - 0.1;
      ctx.beginPath(); ctx.roundRect(130, 800, 820, 104, 20);
      ctx.fillStyle = C.card2;
      ctx.fill();
      ctx.strokeStyle = focus ? C.mint : C.line;
      ctx.lineWidth = focus ? 3 : 2;
      ctx.stroke();
      const n = clamp(Math.floor((t - TYPE0) / TYPE_DT) + 1, 0, NAME.length);
      const typed = NAME.slice(0, t > TYPE0 ? n : 0);
      S.text(typed, 166, 853, 40, C.text, 'left', 600);
      if (focus && Math.floor(t * 3) % 2 === 0) {
        ctx.fillStyle = C.mint;
        ctx.fillRect(170 + S.width(typed, 40, 600), 830, 4, 48);
      }
      const se = prog(t, TYPE0 + 0.8, TYPE0 + 1.0);
      if (se > 0) {
        ctx.save();
        ctx.globalAlpha *= se;
        [['1.21.1', C.text], ['Fabric', '#dbc8a0'], ['3 mods', C.mint]].forEach(([s, col], i) => {
          S.pill(s, 230 + i * 220, 990, 1, { size: 26, dot: col, pad: 24 });
        });
        ctx.restore();
      }
    });
    // install overlay after Play
    if (t > PLAY + 0.12) {
      const oe = easeOutCubic(prog(t, PLAY + 0.12, PLAY + 0.35));
      ctx.save();
      ctx.globalAlpha *= oe;
      ctx.beginPath(); ctx.roundRect(110, 730, 860, 460, 22);
      ctx.fillStyle = '#10141a';
      ctx.fill();
      S.text('Getting everything ready…', 540, 775, 28, C.dim, 'center', 600);
      ['Java 21', 'Libraries + assets', 'Fabric Loader', 'Your 3 mods'].forEach((name, i) => {
        const y = 850 + i * 92;
        row(150, y, 780, 76, t > INSTALL[i]);
        S.text(name, 190, y + 1, 30, C.text, 'left', 700);
        if (t > INSTALL[i]) {
          S.badge('check', 884, y, 42, prog(t, INSTALL[i], INSTALL[i] + 0.2));
          S.text('installed itself', 840, y + 1, 24, C.mint, 'right', 600);
        } else {
          S.spinner(884, y, 15, t);
        }
      });
      ctx.restore();
    }
    // play button
    const enabled = t > TYPE0 + NAME.length * TYPE_DT + 0.15;
    const press = t > PLAY ? Math.exp(-(t - PLAY) * 10) : 0;
    const launched = t > INSTALL[3] + 0.2;
    S.button(launched ? 'Playing' : 'Play', 540, 1268, 820, 112, 1, {
      icon: 'play', disabled: !enabled, press, size: 48, glow: enabled ? 30 + 14 * Math.sin(t * 6) : 0,
    });
    S.ripple(540, 1268, t - PLAY, S.MINT, 360);
    ctx.restore();
  }

  const CLICKS = [STEP[0] + 0.55, STEP[1] + 0.55, ...ADD, TYPE0 - 0.12, PLAY];
  function wizardCursor(t) {
    if (t < WIZ + 0.7 || t > PLAY + 0.9) return;
    const p = S.path(t, [
      [WIZ + 0.7, 980, 1720], [CLICKS[0] - 0.05, 640, 840], [STEP[1] + 0.1, 640, 840], [CLICKS[1] - 0.05, 560, 900],
      [STEP[2] + 0.1, 560, 900], [CLICKS[2] - 0.05, 850, 888], [CLICKS[3] - 0.05, 850, 1004], [CLICKS[4] - 0.05, 850, 1120],
      [STEP[3] + 0.05, 850, 1120], [CLICKS[5] - 0.05, 620, 860], [TYPE0 + 0.9, 640, 1000], [PLAY - 0.06, 600, 1285],
      [PLAY + 0.9, 1100, 1700],
    ]);
    const press = Math.max(...CLICKS.map((c) => (t > c ? Math.exp(-(t - c) * 14) : 0)));
    S.cursor(p.x, p.y, 1, press);
  }

  const CAPS = [
    [STEP[0], [{ t: 'Pick a version' }]],
    [STEP[1], [{ t: 'Pick your software' }]],
    [STEP[2], [{ t: 'Add mods ' }, { t: '(if you want)', c: C.dim }]],
    [STEP[3], [{ t: 'Name it' }]],
    [PLAY, [{ t: 'Java + loaders ' }, { t: 'install themselves.', c: 'mint' }]],
  ];
  function stepCaption(t) {
    for (let i = CAPS.length - 1; i >= 0; i--) {
      if (t >= CAPS[i][0]) {
        const out = i === CAPS.length - 1 ? 1 - prog(t, CHORES - 0.35, CHORES) : 1;
        ctx.save();
        ctx.globalAlpha *= out;
        S.title(CAPS[i][1], 540, 1445, 64, appear(t, CAPS[i][0], 0.3));
        ctx.restore();
        return;
      }
    }
  }

  // ---------- chores, crossed out ----------
  const CHORE_LIST = ['Hunting down the right Java', 'Running loader installers', 'Copy-pasting servers.dat', 'Managing mod folders'];
  const STRIKE = CHORE_LIST.map((_, i) => CHORES + 0.75 + i * 0.22);
  function chores(t) {
    if (t < CHORES) return;
    S.title([{ t: 'Minecraft,' }], 540, 480, 112, appear(t, CHORES + 0.02, 0.35));
    S.title([{ t: 'minus the chores.', c: 'mint' }], 540, 600, 112, appear(t, CHORES + 0.16, 0.35));
    CHORE_LIST.forEach((s, i) => {
      const y = 790 + i * 136;
      const e = appear(t, CHORES + 0.3 + i * 0.07, 0.3);
      if (e <= 0) return;
      ctx.save();
      ctx.globalAlpha *= e;
      ctx.translate((1 - e) * 120, 0);
      const done = t > STRIKE[i];
      S.card(120, y - 56, 840, 112, { r: 24, fill: done ? 'rgba(19,23,29,0.75)' : C.card, stroke: done ? S.MINT(0.35) : C.line });
      if (done) S.badge('check', 186, y, 56, prog(t, STRIKE[i], STRIKE[i] + 0.2));
      else S.badge('cross', 186, y, 56, 1);
      S.text(s, 240, y + 1, 38, done ? C.faint : C.text, 'left', 700);
      const sw = prog(t, STRIKE[i], STRIKE[i] + 0.18);
      if (sw > 0) {
        ctx.fillStyle = C.mint;
        ctx.shadowColor = S.MINT(0.8);
        ctx.shadowBlur = 12;
        ctx.fillRect(232, y - 3, (S.width(s, 38, 700) + 16) * easeOutCubic(sw), 7);
      }
      ctx.restore();
    });
  }

  // ---------- frame ----------
  function render(t) {
    if (t >= END) { S.endCard(t, END); return; }
    if (t < BURN0) { chaos(t); return; }
    // clean launcher world underneath
    S.drawBg(t);
    S.embers(t, 18, 1, 0.7);
    S.lockup(540, 300, 104, appear(t, BURN1 - 0.12, 0.4));
    S.title([{ t: '4 steps. ' }, { t: 'Then play.', c: 'mint' }], 540, 452, 86, appear(t, WIZ + 0.3, 0.35) * (1 - prog(t, CHORES - 0.35, CHORES)));
    wizard(t);
    stepCaption(t);
    wizardCursor(t);
    chores(t);
    // the soul-fire wall burns the chaos away from the bottom up
    if (t < BURN1 + 0.2) {
      const y = lerp(H + 160, -220, easeInOutCubic(prog(t, BURN0, BURN1)));
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, Math.max(0, y)); ctx.clip();
      chaos(t);
      ctx.restore();
      const g = ctx.createLinearGradient(0, y - 260, 0, y + 120);
      g.addColorStop(0, S.CYAN(0));
      g.addColorStop(0.7, S.CYAN(0.45));
      g.addColorStop(1, S.CYAN(0));
      ctx.fillStyle = g;
      ctx.fillRect(0, y - 260, W, 380);
      for (let i = 0; i < 14; i++) S.soulFire(i * 80 + 20, y + 70, 9, 13 + Math.floor(hash(i * 4.7) * 10), 11, t, i);
      for (let i = 0; i < 40; i++) {
        const a = hash(i * 5.3), lt = (t * (1.2 + a) + a) % 1;
        const s = 8 + (i % 3) * 5;
        ctx.fillStyle = i % 3 ? S.CYAN(1 - lt) : `rgba(239,255,255,${1 - lt})`;
        ctx.fillRect(hash(i * 2.1) * W, y - 40 - lt * 420, s, s);
      }
    }
    M.flash(t, BURN1, 0.55, 7, '180,255,245');
  }

  function events() {
    const ev = [];
    // clock ticks speed up as the setup drags on
    for (let tt = 0.15, k = 0; tt < FREEZE; k++) {
      ev.push({ type: 'tick', t: tt, gain: 0.5 + 0.5 * prog(tt, 0, FREEZE) });
      tt += lerp(0.5, 0.12, prog(tt, 0, FREEZE));
    }
    ICONS.forEach((f, i) => ev.push({ type: 'pop', t: f.t, note: 64 + (i * 5) % 19, gain: 0.45 }));
    POPS.forEach((p, i) => ev.push({ type: 'err', t: p.t, crash: !!p.crash, k: i }));
    ev.push({ type: 'scratch', t: FREEZE });
    ev.push({ type: 'pop', t: FREEZE + 0.08, note: 72 });
    ev.push({ type: 'burn', t: BURN0, end: BURN1 });
    ev.push({ type: 'impact', t: BURN1 });
    ev.push({ type: 'sparkle', t: BURN1 + 0.05, note: 86 });
    ev.push({ type: 'pop', t: WIZ + 0.32, note: 74 });
    ev.push({ type: 'swipe', t: WIZ + 0.5 });
    STEP.forEach((s, i) => ev.push({ type: 'swipe', t: s, gain: 0.5 }, { type: 'pop', t: s + 0.02, note: 69 + [0, 5, 7, 12][i], gain: 0.6 }));
    CLICKS.forEach((c) => ev.push({ type: 'uiclick', t: c }));
    ev.push({ type: 'ding', t: CLICKS[0] + 0.02, note: 81 }, { type: 'ding', t: CLICKS[1] + 0.02, note: 83 });
    ADD.forEach((a, i) => ev.push({ type: 'pop', t: a + 0.02, note: 76 + [0, 4, 7][i] }));
    for (let i = 0; i < NAME.length; i++) ev.push({ type: 'typing', t: TYPE0 + i * TYPE_DT });
    ev.push({ type: 'ding', t: TYPE0 + NAME.length * TYPE_DT + 0.15, note: 86, gain: 0.7 });
    ev.push({ type: 'levelup', t: PLAY + 0.02, note: 74 });
    INSTALL.forEach((s, i) => ev.push({ type: 'ding', t: s, note: 81 + [0, 2, 4, 7][i] }));
    ev.push({ type: 'swipe', t: CHORES - 0.1 });
    ev.push({ type: 'hit', t: CHORES + 0.02, gain: 0.7 });
    CHORE_LIST.forEach((_, i) => ev.push({ type: 'pop', t: CHORES + 0.3 + i * 0.07, note: 67 + i * 2, gain: 0.5 }));
    STRIKE.forEach((s, i) => ev.push({ type: 'swipe', t: s + 0.05, gain: 0.7 }, { type: 'ding', t: s + 0.04, note: 84 + [0, 2, 4, 7][i] }));
    return ev.concat(S.endCardEvents(END));
  }

  S.start({ duration: DUR, cover: 12.95, setup: buildDesk, render, events });
})();
