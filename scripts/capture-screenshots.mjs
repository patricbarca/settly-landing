import { chromium } from 'playwright';
import fs from 'fs';
const OUT = process.env.OUT || new URL('../.screenshots', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const APP = process.env.APP || 'http://127.0.0.1:5199/';
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
// Viewport ALTO en vez de fullPage: la app usa html,body,#root{height:100%}
// con scroll interno, y un fullPage sale con una banda vacia y la mitad de
// abajo en tema claro. Con el viewport alto todo entra en una sola pintura.
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

await p.goto(APP, { waitUntil: 'domcontentloaded' });
await p.evaluate(() => {
  localStorage.setItem('settly.onboarded', '1');
  localStorage.setItem('settly.lang', 'en');
  localStorage.setItem('settly.theme', 'dark');
});
await p.reload({ waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4000);
await p.evaluate(() => window.__auth.signInGuest());
await p.waitForTimeout(2000);
await p.addStyleTag({ content: '*,*::before,*::after{animation:none !important;transition:none !important}' });

const NAV = '.fixed.bottom-0';
const hideChrome = () => p.evaluate((nav) => {
  // pie de modo invitado: solo existe en guest, un usuario con cuenta no lo ve
  const re = /Reset demo|data is saved in this browser/i;
  const hits = [...document.querySelectorAll('div,p,footer,small')].filter(e => re.test(e.textContent || ''));
  for (const el of hits) if (!hits.some(o => o !== el && el.contains(o))) el.style.visibility = 'hidden';
  // la barra inferior va FIJA en la app: se captura aparte y se fija en el marco,
  // si no, en un scroll animado subiria con el contenido y mentiria.
  const n = document.querySelector(nav); if (n) n.style.display = 'none';
}, NAV);

const VH = 844;
/** Mide el alto REAL del contenido con el viewport normal (ahi el scroll de la
 *  app es el de verdad), redimensiona a esa altura exacta y captura de una sola
 *  pintura. Medir con el viewport ya alto no sirve: los envoltorios estiran a
 *  pantalla completa y siempre devuelven la altura del viewport. */
const shot = async (name) => {
  await p.setViewportSize({ width: 390, height: VH });
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(400);
  await hideChrome();
  await p.waitForTimeout(150);
  const h = await p.evaluate(() => {
    const se = document.scrollingElement || document.documentElement;
    return Math.ceil(Math.max(se.scrollHeight, document.body.scrollHeight));
  });
  const tall = Math.min(Math.max(h, VH), 2600);
  await p.setViewportSize({ width: 390, height: tall });
  await p.waitForTimeout(500);
  await hideChrome();
  await p.waitForTimeout(150);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  -> ${name}  390x${tall}`);
  await p.setViewportSize({ width: 390, height: VH });
  await p.waitForTimeout(300);
};

// la barra inferior, una sola vez y en su estado normal
await p.evaluate((nav) => { const n = document.querySelector(nav); if (n) n.style.display = ''; }, NAV);
await p.locator(NAV).first().screenshot({ path: `${OUT}/nav.png` });
console.log('  -> nav');

await shot('01-home');
await p.evaluate((nav) => { const n = document.querySelector(nav); if (n) n.style.display = ''; }, NAV);
await p.getByText('Lisbon trip').first().click();
await p.waitForTimeout(1300);
try { const l = p.getByRole('button', { name: /^Later$/ }); if (await l.count()) await l.first().click({ timeout: 2500 }); } catch {}
await p.waitForTimeout(400);
await shot('02-expenses');

const openTab = async (tab) => {
  await p.evaluate((nav) => { const n = document.querySelector(nav); if (n) n.style.display = ''; }, NAV);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: tab, exact: true }).first().click();
  await p.waitForTimeout(900);
};
await openTab('Balances');  await shot('03-balances');
await openTab('Stats');     await shot('04-stats');
console.log('listo');
await b.close();
