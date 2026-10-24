// Frame-exact renderer for the Mine Radar ad.
//   node render.js stills <outDir> 1.5,4.8,...   -> PNG stills at those times
//   node render.js video  <out.mp4> <cues.json>  -> silent H.264 + cue sheet for the audio
// Expects the ad folder to be served at $AD_URL (see build.sh).
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const AD_URL = process.env.AD_URL || 'http://127.0.0.1:8765/index.html';

async function main() {
  const [mode, out, arg] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { console.error('page error:', e); process.exitCode = 1; });
  await page.goto(`${AD_URL}?render`);
  await page.waitForFunction(() => window.AD_READY === true, null, { timeout: 30000 });
  const { FPS, DURATION } = await page.evaluate(() => ({ FPS: window.AD.FPS, DURATION: window.AD.DURATION }));

  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    for (const t of arg.split(',').map(Number)) {
      const b64 = await page.evaluate((tt) => window.AD.frame(tt), t);
      const file = path.join(out, `t${t.toFixed(2).padStart(5, '0')}.png`);
      fs.writeFileSync(file, Buffer.from(b64, 'base64'));
      console.log(file);
    }
  } else if (mode === 'video') {
    fs.writeFileSync(arg, JSON.stringify(await page.evaluate(() => window.AD.events()), null, 1));
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS),
      '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
    const frames = Math.round(FPS * DURATION);
    for (let f = 0; f < frames; f++) {
      const b64 = await page.evaluate((tt) => window.AD.frame(tt), f / FPS);
      if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
      if (f % 60 === 0) console.log(`frame ${f}/${frames}`);
    }
    ff.stdin.end();
    await done;
    console.log(out);
  } else {
    throw new Error('usage: render.js stills <dir> <t,t,...> | video <out.mp4> <cues.json>');
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
