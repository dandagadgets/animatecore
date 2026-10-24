// Overlay for the cinematic cut of Short 3: captions, player counter, chat and the
// lightning flash, drawn on a transparent canvas and composited over the AI rain shot
// by compose.sh. Times line up with the original short's audio from 6.3s onwards.
(() => {
  'use strict';
  const M = MR;
  const { ctx, W, H, COL, NEON } = M;
  const { prog, lerp, appear } = M;

  const DUR = 5;
  const RED = '#ff5a5a';
  const THUNDER = 2.3;
  const CAPTIONS = [
    { t0: 0.0, t1: 1.7, lines: [[{ t: 'You spent months' }], [{ t: 'building your server.' }]] },
    { t0: 1.7, t1: 3.4, lines: [[{ t: '...and nobody\'s' }], [{ t: 'online.', c: RED }]] },
    { t0: 3.4, t1: 5.0, lines: [[{ t: 'Nobody can' }], [{ t: 'find it.', c: RED }]] },
  ];
  const CHAT = [[0.1, '[Server] Welcome to the server!', '#ffe14d'], [0.7, '<You> hey everyone!'], [1.8, '<You> anyone?']];

  function mcText(text, x, y, size, color = '#ffffff') {
    ctx.save();
    ctx.font = `400 ${size}px "Pixelify Sans"`;
    ctx.textBaseline = 'middle';
    const d = Math.max(3, Math.round(size / 12));
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillText(text, x + d, y + d);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function onlinePanel(t) {
    const empty = t >= 1.7;
    const pulse = empty ? 0.5 + 0.5 * Math.sin(t * 6) : 0;
    ctx.save();
    ctx.translate(890, 280);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-140, -56, 280, 112);
    ctx.strokeStyle = empty ? `rgba(255,90,90,${0.4 + 0.6 * pulse})` : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(-140, -56, 280, 112);
    M.label('ONLINE', 0, -26, 20, 'rgba(255,255,255,0.7)', 'center', 3);
    ctx.font = '700 52px "Pixelify Sans"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = empty ? RED : '#ffffff';
    ctx.fillText('1/100', 0, 18);
    ctx.restore();
  }

  function chat(t) {
    const shown = CHAT.filter(([ct]) => t >= ct);
    shown.forEach(([ct, text, col], i) => {
      const y = 1460 - (shown.length - 1 - i) * 56;
      ctx.save();
      ctx.globalAlpha = prog(t, ct, ct + 0.15);
      const w = M.textWidth(text, '400 34px "Pixelify Sans"') + 30;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(30, y - 26, w, 54);
      mcText(text, 44, y, 34, col || '#ffffff');
      ctx.restore();
    });
  }

  function render(t) {
    // darken the top and bottom a touch so captions and chat read over the footage
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0.5)');
    g.addColorStop(0.36, 'rgba(0,0,0,0)');
    g.addColorStop(0.62, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    M.vignette(0.45);

    onlinePanel(t);
    chat(t);
    CAPTIONS.forEach((c) => {
      if (t < c.t0 || t >= c.t1) return;
      ctx.save();
      ctx.globalAlpha = c.t1 < DUR ? 1 - prog(t, c.t1 - 0.12, c.t1) : 1;
      M.caption(c.lines, 540, 500, 72, c.t0 === 0 ? 1 : appear(t, c.t0, 0.25));
      ctx.restore();
    });

    if (t >= THUNDER && t < THUNDER + 0.4) {
      const lt = t - THUNDER;
      const a = lt < 0.08 ? 0.7 : lt < 0.14 ? 0.15 : lt < 0.2 ? 0.55 : 0.55 * (1 - prog(lt, 0.2, 0.4));
      ctx.fillStyle = `rgba(220,230,255,${a})`;
      ctx.fillRect(0, 0, W, H);
    }
    // ramp into the radar-ping flash that opens the pixel half
    const f = prog(t, 4.85, 5.0);
    if (f > 0) {
      ctx.fillStyle = `rgba(220,255,200,${0.5 * f})`;
      ctx.fillRect(0, 0, W, H);
    }
    M.drawScanlines();
  }

  M.start({ duration: DUR, cover: 0, transparent: true, render });
})();
