// Revisa los servicios de Settlia y escribe status.json.
// Lo ejecuta .github/workflows/status.yml cada 15 minutos (Node 20, sin dependencias).
// Uso: node scripts/status-check.mjs <status.json previo o ""> <salida>
import { readFileSync, writeFileSync } from "node:fs";

const [, , prevPath, outPath = "status.json"] = process.argv;
const SB = "https://ziawqnavocwrkybdhkla.supabase.co";
// Clave PUBLICABLE (la misma que lleva la app web en .env.production; no es secreta).
const SB_KEY = "sb_publishable_eaN4tfUnzT_h5XnlbteyVg_t9dkMCip";
const GROQ_KEY = (process.env.GROQ_API_KEY || "").trim();
// Modelos que usan las Edge Functions. Groq los retira sin avisar.
const GROQ_MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b", "whisper-large-v3-turbo"];
const HISTORY = 96; // 24 h a 15 min

async function timed(url, opts = {}, ms = 15000) {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal, redirect: "follow" });
    const body = await res.text();
    return { res, body, ms: Date.now() - t0 };
  } finally {
    clearTimeout(timer);
  }
}

// Comprobación directa de un endpoint nuestro.
function own(id, name, group, url, { opts, ok = (r) => r.status < 400, slow = 3000 } = {}) {
  return async () => {
    try {
      const { res, ms } = await timed(url, opts);
      if (!ok(res)) return { id, name, group, status: "down", detail: `HTTP ${res.status}`, ms };
      return { id, name, group, status: ms > slow ? "degraded" : "up", detail: ms > slow ? "Lento" : `HTTP ${res.status}`, ms };
    } catch (e) {
      return { id, name, group, status: "down", detail: e.name === "AbortError" ? "Sin respuesta (15 s)" : String(e.message || e).slice(0, 120) };
    }
  };
}

// Página de estado pública con formato Atlassian Statuspage (/api/v2/summary.json).
function statuspage(id, name, base, page) {
  return async () => {
    const r = { id, name, group: "Proveedores", page };
    try {
      const { res, body } = await timed(`${base}/api/v2/summary.json`);
      if (!res.ok) return { ...r, status: "unknown", detail: `Sin datos (HTTP ${res.status})` };
      const j = JSON.parse(body);
      const ind = j.status?.indicator ?? "none";
      const status = ind === "none" ? "up" : ind === "minor" ? "degraded" : ind === "maintenance" ? "degraded" : "down";
      const incidents = (j.incidents || []).slice(0, 3).map((i) => ({ name: i.name, status: i.status, url: i.shortlink }));
      return { ...r, status, detail: j.status?.description || ind, incidents };
    } catch (e) {
      return { ...r, status: "unknown", detail: "No se pudo leer su página de estado" };
    }
  };
}

// Apple publica el estado de los servicios para desarrolladores en un JSONP.
function apple() {
  return async () => {
    const r = { id: "apple", name: "Apple Developer (App Store Connect, TestFlight, APNs)", group: "Proveedores", page: "https://developer.apple.com/system-status/" };
    try {
      const { body } = await timed("https://www.apple.com/support/systemstatus/data/developer/system_status_en_US.js");
      const j = JSON.parse(body.slice(body.indexOf("{"), body.lastIndexOf("}") + 1));
      const want = /App Store Connect|TestFlight|APNS|Push Notification|In-App Purchase|App Store/i;
      const bad = [];
      for (const s of j.services || []) {
        if (!want.test(s.serviceName)) continue;
        const open = (s.events || []).filter((e) => e.eventStatus !== "resolved" && e.eventStatus !== "completed");
        if (open.length) bad.push(`${s.serviceName}: ${open[0].statusType || "incidencia"}`);
      }
      return bad.length ? { ...r, status: "degraded", detail: bad.slice(0, 3).join(" · ") } : { ...r, status: "up", detail: "Sin incidencias" };
    } catch {
      return { ...r, status: "unknown", detail: "No se pudo leer su página de estado" };
    }
  };
}

function groqModels() {
  return async () => {
    const r = { id: "groq-models", name: "Modelos de IA en Groq", group: "Settlia" };
    if (!GROQ_KEY) return { ...r, status: "unknown", detail: "Falta el secreto GROQ_API_KEY en GitHub" };
    try {
      const { res, body, ms } = await timed("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${GROQ_KEY}` } });
      if (!res.ok) return { ...r, status: "down", detail: `HTTP ${res.status}`, ms };
      const have = new Set((JSON.parse(body).data || []).map((m) => m.id));
      const missing = GROQ_MODELS.filter((m) => !have.has(m));
      return missing.length
        ? { ...r, status: "down", detail: `Retirados: ${missing.join(", ")}`, ms }
        : { ...r, status: "up", detail: `${GROQ_MODELS.length} modelos disponibles`, ms };
    } catch (e) {
      return { ...r, status: "down", detail: String(e.message || e).slice(0, 120) };
    }
  };
}

const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
// Un OPTIONS (preflight CORS) basta para saber si la función está desplegada y arranca, sin gastar IA.
const fnOpts = { method: "OPTIONS", headers: { Origin: "https://app.settlia.app", "Access-Control-Request-Method": "POST" } };
const fn = (name) => own(`fn-${name}`, `Función ${name}`, "Settlia", `${SB}/functions/v1/${name}`, { opts: fnOpts, ok: (r) => r.status < 400, slow: 5000 });

const checks = [
  own("app", "App web (app.settlia.app)", "Settlia", "https://app.settlia.app/"),
  own("landing", "Landing (settlia.app)", "Settlia", "https://settlia.app/"),
  own("sb-auth", "Supabase · login", "Settlia", `${SB}/auth/v1/health`, { opts: { headers: sbHeaders } }),
  own("sb-db", "Supabase · base de datos", "Settlia", `${SB}/rest/v1/groups?select=id&limit=1`, { opts: { headers: sbHeaders }, ok: (r) => r.status < 500 }),
  own("sb-storage", "Supabase · archivos", "Settlia", `${SB}/storage/v1/status`, { opts: { headers: sbHeaders }, ok: (r) => r.status < 500 }),
  fn("parse-expense"),
  fn("scan-receipt"),
  fn("transcribe"),
  fn("send-push"),
  fn("forecast-spending"),
  fn("convert-currency"),
  groqModels(),
  statuspage("supabase", "Supabase", "https://status.supabase.com", "https://status.supabase.com"),
  statuspage("groq", "Groq (IA de texto, voz y tickets)", "https://groqstatus.com", "https://groqstatus.com"),
  statuspage("openrouter", "OpenRouter (respaldo del escáner)", "https://status.openrouter.ai", "https://status.openrouter.ai"),
  statuspage("revenuecat", "RevenueCat (compras en iOS)", "https://status.revenuecat.com", "https://status.revenuecat.com"),
  statuspage("stripe", "Stripe (pagos web)", "https://www.stripestatus.com", "https://status.stripe.com"),
  statuspage("resend", "Resend (emails de login)", "https://resend-status.com", "https://resend-status.com"),
  statuspage("github", "GitHub (hosting y CI)", "https://www.githubstatus.com", "https://www.githubstatus.com"),
  statuspage("codemagic", "Codemagic (builds iOS)", "https://status.codemagic.io", "https://status.codemagic.io"),
  statuspage("cloudflare", "Cloudflare (analítica)", "https://www.cloudflarestatus.com", "https://www.cloudflarestatus.com"),
  apple(),
];

const results = await Promise.all(checks.map((c) => c()));
const now = new Date().toISOString();

let prev = {};
try { if (prevPath) prev = JSON.parse(readFileSync(prevPath, "utf8")); } catch {}
const history = prev.history || {};
for (const r of results) {
  const h = (history[r.id] || []).concat([[now, r.status, r.ms ?? null]]);
  history[r.id] = h.slice(-HISTORY);
}
for (const id of Object.keys(history)) if (!results.some((r) => r.id === id)) delete history[id];

writeFileSync(outPath, JSON.stringify({ checkedAt: now, results, history }, null, 1));
for (const r of results) console.log(`${r.status.padEnd(8)} ${r.name} — ${r.detail}`);
