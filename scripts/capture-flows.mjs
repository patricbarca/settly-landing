import { chromium } from 'playwright';
import fs from 'fs';
const OUT = process.env.OUT || new URL('../.screenshots', import.meta.url).pathname;
const RECEIPT = process.env.RECEIPT || new URL('../.screenshots/receipt.png', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

/* La IA se intercepta EN RED, no parcheando la app: el camino de codigo
   (consentimiento, resize de la foto, parseo, editor por items) es el real. */
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const json = (r, body) => r.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) });
const SCAN = {
  description: "Dinner at Tasca do Mar", subtotal: 79.5, total: 79.5, category: "comida", currency: "EUR",
  items: [
    { name: "Sardinhas grelhadas", qty: 2, unitPrice: 12, price: 24 },
    { name: "Bacalhau à Brás", qty: 1, unitPrice: 16.5, price: 16.5 },
    { name: "Salada de polvo", qty: 1, unitPrice: 14, price: 14 },
    { name: "Vinho da casa 1L", qty: 1, unitPrice: 12, price: 12 },
    { name: "Pastéis de nata", qty: 4, unitPrice: 2, price: 8 },
    { name: "Água com gás", qty: 2, unitPrice: 2.5, price: 5 },
  ],
  fees: [], tax: { amount: 9.15, rate: 13, included: true, label: "IVA" },
};
await p.route('**/functions/v1/scan-receipt', async (r) => {
  if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  await new Promise((res) => setTimeout(res, 2500));
  return json(r, SCAN);
});
// La respuesta del parser se construye con los MIEMBROS que manda la propia
// peticion: los ids son aleatorios en cada arranque del modo invitado.
await p.route('**/functions/v1/parse-expense', (r) => {
  if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  const body = r.request().postDataJSON() || {};
  const byName = (n) => (body.members || []).find((m) => m.name === n)?.id;
  const ids = (body.members || []).map((m) => m.id);
  return json(r, {
    label: "Taxi to the airport", amount: 32, payerId: byName("Emma") || body.meId,
    participantIds: [byName("Alex"), byName("Emma"), byName("Liam")].filter(Boolean).length === 3
      ? [byName("Alex"), byName("Emma"), byName("Liam")] : ids,
    category: "transporte",
  });
});

await p.goto(process.env.APP || 'http://127.0.0.1:5199/', { waitUntil: 'domcontentloaded' });
await p.evaluate(() => {
  localStorage.setItem('settly.onboarded', '1');
  localStorage.setItem('settly.lang', 'en');
  localStorage.setItem('settly.theme', 'dark');
  localStorage.setItem('settly.aiConsent', '1');
});
await p.reload({ waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4000);
await p.evaluate(() => window.__auth.signInGuest());
await p.waitForTimeout(2000);
await p.addStyleTag({ content: '*,*::before,*::after{animation:none !important;transition:none !important}' });

const NAV = '.fixed.bottom-0', VH = 844, CAP = 2600;
const hideChrome = () => p.evaluate((nav) => {
  const re = /Reset demo|data is saved in this browser/i;
  const hits = [...document.querySelectorAll('div,p,footer,small')].filter(e => re.test(e.textContent || ''));
  for (const el of hits) if (!hits.some(o => o !== el && el.contains(o))) el.style.visibility = 'hidden';
  const n = document.querySelector(nav); if (n) n.style.display = 'none';
}, NAV);

/** Alto necesario = el del documento Y el de cualquier contenedor que scrollee
 *  por dentro (los modales lo hacen). Se itera porque al agrandar el viewport
 *  el layout cambia y puede aparecer/desaparecer overflow. */
const needed = () => p.evaluate(() => {
  const se = document.scrollingElement || document.documentElement;
  let extra = 0;
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (!/auto|scroll/.test(cs.overflowY)) continue;
    const d = el.scrollHeight - el.clientHeight;
    if (d > 4) extra = Math.max(extra, d);
  }
  return Math.ceil(Math.max(se.scrollHeight, document.body.scrollHeight) + extra);
});

const shot = async (name) => {
  await p.setViewportSize({ width: 390, height: VH });
  await p.waitForTimeout(350); await hideChrome(); await p.waitForTimeout(120);
  let tall = VH;
  for (let i = 0; i < 3; i++) {
    const h = Math.min(Math.max(await needed(), VH), CAP);
    if (h <= tall + 4) break;
    tall = h;
    await p.setViewportSize({ width: 390, height: tall });
    await p.waitForTimeout(400); await hideChrome();
  }
  await p.waitForTimeout(200); await hideChrome(); await p.waitForTimeout(120);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  -> ${name}  390x${tall}`);
  await p.setViewportSize({ width: 390, height: VH }); await p.waitForTimeout(250);
};

await p.getByText('Lisbon trip').first().click();
await p.waitForTimeout(1300);
try { const l = p.getByRole('button', { name: /^Later$/ }); if (await l.count()) await l.first().click({ timeout: 2500 }); } catch {}
await p.waitForTimeout(400);

// ================= FLUJO A: escanear un ticket =================
await p.getByRole('button', { name: /^Scan/ }).first().click();
await p.waitForTimeout(900);
const fileInputs = p.locator('input[type=file]');
await fileInputs.nth(await fileInputs.count() - 1).setInputFiles(RECEIPT);
await p.waitForTimeout(900);
await shot('a1-reading');   // "Reading the receipt..." con la foto
await p.waitForTimeout(3000);
await shot('a2-currency');
await p.getByRole('button', { name: 'EUR', exact: true }).first().click();
await p.waitForTimeout(1600);
await shot('a3-items');

// Asignar quien consumio que: es LO que diferencia a la app.
// El contenedor del item se localiza por el VALOR del input (React lo pone
// como propiedad, no como atributo, asi que un selector CSS no vale) y se le
// marca con un data-attr temporal para poder actuar dentro de el.
const assign = async (itemName, people) => {
  const ok = await p.evaluate((name) => {
    document.querySelectorAll('[data-shot-item]').forEach(e => e.removeAttribute('data-shot-item'));
    for (const inp of document.querySelectorAll('input')) {
      if (inp.value !== name) continue;
      let el = inp;
      while (el && !(el.textContent || '').includes('Deselect all')) el = el.parentElement;
      if (el) { el.setAttribute('data-shot-item', '1'); return true; }
    }
    return false;
  }, itemName);
  if (!ok) throw new Error('no encontre el item ' + itemName);
  const box = p.locator('[data-shot-item]');
  await box.getByText('Deselect all', { exact: true }).first().click();
  await p.waitForTimeout(150);
  for (const who of people) {
    await box.getByRole('button', { name: new RegExp(who) }).first().click();
    await p.waitForTimeout(130);
  }
};
await assign('Sardinhas grelhadas', ['Emma', 'Liam']);
await assign('Bacalhau à Brás', ['Alex']);
await assign('Salada de polvo', ['Olivia']);
await assign('Água com gás', ['Noah', 'Alex']);
await p.evaluate(() => document.querySelectorAll('[data-shot-item]').forEach(e => e.removeAttribute('data-shot-item')));
await p.waitForTimeout(500);
await shot('a4-assigned');

await p.getByRole('button', { name: /^Add expense$/ }).first().click();
await p.waitForTimeout(2200);
await shot('a5-saved-list');
// abrir el gasto guardado para ver el reparto por persona
try {
  await p.getByText('Dinner at Tasca do Mar').first().click();
  await p.waitForTimeout(900);
  await shot('a6-saved-detail');
} catch (e) { console.log('  (no se pudo abrir el detalle)'); }
console.log('FLUJO A ok');

// ================= FLUJO B: gasto escrito en lenguaje normal =================
// plegar el detalle abierto y volver arriba
try { await p.getByText('Dinner at Tasca do Mar').first().click(); await p.waitForTimeout(600); } catch {}
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);

const box = p.getByPlaceholder(/coffee 12 with Ana/i).first();
await box.click();
await box.type('Taxi to the airport 32, Emma paid, split with Liam and me', { delay: 18 });
await p.waitForTimeout(400);
await shot('b1-prompt');

await p.getByRole('button', { name: /^Add\b/ }).first().click();
await p.waitForTimeout(2000);
await shot('b2-parsed');

await p.getByRole('button', { name: /^Add expense$/ }).first().click();
await p.waitForTimeout(2200);
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);
await shot('b3-saved');
console.log('FLUJO B ok');
await b.close();
