import { chromium } from 'playwright';
const OUT = process.env.OUT || new URL('../.screenshots', import.meta.url).pathname;
import fs from 'fs';
fs.mkdirSync(OUT, { recursive: true });
const APP = process.env.APP || 'http://127.0.0.1:5199/';
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
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

/** El pie "data is saved in this browser / Reset demo" SOLO existe en modo
 *  invitado; un usuario con cuenta nunca lo ve, asi que no debe salir. React
 *  lo re-renderiza, por eso se oculta justo antes de cada captura. */
const hideGuestChrome = () => p.evaluate(() => {
  const re = /Reset demo|data is saved in this browser/i;
  const hits = [...document.querySelectorAll('div,p,footer,small')]
    .filter((el) => re.test(el.textContent || ''));
  // Solo el elemento MAS INTERNO que casa: un ancestro tambien casa por
  // textContent y ocultarlo se llevaria por delante media pantalla.
  for (const el of hits) {
    if (!hits.some((o) => o !== el && el.contains(o))) el.style.visibility = 'hidden';
  }
});

const shot = async (name, y = 0) => {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(450);
  await hideGuestChrome();
  await p.waitForTimeout(150);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log('  ->', name);
};

await shot('01-home');

await p.getByText('Lisbon trip').first().click();
await p.waitForTimeout(1300);
try {
  const later = p.getByRole('button', { name: /^Later$/ });
  if (await later.count()) await later.first().click({ timeout: 2500 });
} catch { console.log('  (no habia banner de metodo de pago)'); }
await p.waitForTimeout(400);

await shot('02-expenses', 0);
await shot('03-expense-list', 980);

const openTab = async (tab) => {
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: tab, exact: true }).first().click();
  await p.waitForTimeout(900);
};

await openTab('Balances');
await shot('04-balances', 620);
await shot('05-settle-up', 690);
await openTab('Stats');
await shot('06-stats', 560);
await openTab('Achievements');
await shot('07-achievements', 560);
console.log('listo');
await b.close();
