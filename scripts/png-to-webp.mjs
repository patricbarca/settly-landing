import { chromium } from 'playwright';
import fs from 'fs';
const SRC = process.env.OUT || new URL('../.screenshots', import.meta.url).pathname;
const DST = new URL('../assets/app', import.meta.url).pathname;
const W = 640, Q = 0.86;
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const p = await b.newPage();
await p.goto('about:blank');
for (const f of fs.readdirSync(SRC).filter(f => f.endsWith('.png')).sort()) {
  const data = 'data:image/png;base64,' + fs.readFileSync(`${SRC}/${f}`).toString('base64');
  const out = await p.evaluate(async ({ data, W, Q }) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = data; });
    const c = document.createElement('canvas');
    c.width = W; c.height = Math.round(img.height * (W / img.width));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return { url: c.toDataURL('image/webp', Q), w: c.width, h: c.height };
  }, { data, W, Q });
  if (!out.url.startsWith('data:image/webp')) throw new Error('webp no soportado para ' + f);
  const name = f.replace('.png', '.webp');
  fs.writeFileSync(`${DST}/${name}`, Buffer.from(out.url.split(',')[1], 'base64'));
  console.log(name, `${out.w}x${out.h}`, (fs.statSync(`${DST}/${name}`).size / 1024).toFixed(0) + 'KB');
}
await b.close();
