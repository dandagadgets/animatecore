// Frame-exact renderer for the Mine Radar shorts.
//   node render.js <page-url> stills <outDir> <t,t,...>
//   node render.js <page-url> video <out.mp4> <cues.json>
//   node render.js <page-url> cover <out.png>
//   node render.js <page-url> cues <cues.json>
//   node render.js <page-url> frames <outDir>      (PNG per frame, keeps transparency)
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

async function main() {
  const [url, mode, out, arg] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { console.error('page error:', e); process.exitCode = 1; });
  await page.goto(`${url}?render`);
  await page.waitForFunction(() => window.AD_READY === true, null, { timeout: 30000 });
  const { FPS, DURATION, COVER } = await page.evaluate(() => window.SHORT);
  const frame = async (t) => Buffer.from(await page.evaluate((tt) => window.SHORT.frame(tt), t), 'base64');

  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    for (const t of arg.split(',').map(Number)) {
      const file = path.join(out, `t${t.toFixed(2).padStart(5, '0')}.png`);
      fs.writeFileSync(file, await frame(t));
      console.log(file);
    }
  } else if (mode === 'frames') {
    fs.mkdirSync(out, { recursive: true });
    for (let f = 0; f < Math.round(FPS * DURATION); f++) {
      fs.writeFileSync(path.join(out, `f${String(f).padStart(4, '0')}.png`), await frame(f / FPS));
    }
  } else if (mode === 'cues') {
    fs.writeFileSync(out, JSON.stringify(await page.evaluate(() => window.SHORT.events()), null, 1));
  } else if (mode === 'cover') {
    fs.writeFileSync(out, await frame(COVER));
    console.log(out);
  } else if (mode === 'video') {
    fs.writeFileSync(arg, JSON.stringify(await page.evaluate(() => window.SHORT.events()), null, 1));
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS),
      '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
    const frames = Math.round(FPS * DURATION);
    for (let f = 0; f < frames; f++) {
      if (!ff.stdin.write(await frame(f / FPS))) await new Promise((r) => ff.stdin.once('drain', r));
      if (f % 90 === 0) console.log(`  frame ${f}/${frames}`);
    }
    ff.stdin.end();
    await done;
    console.log(out);
  } else {
    throw new Error('usage: render.js <url> stills <dir> <t,...> | video <out.mp4> <cues.json> | cover <out.png>');
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
