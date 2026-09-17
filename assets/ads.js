/* Settlia — medición de campañas (Google Ads + TikTok).
 *
 * INERTE POR DEFECTO: sin IDs no se carga ningún script de terceros y no se
 * envía nada. Rellena los IDs de abajo cuando tengas las cuentas creadas.
 *
 *   googleAds  → Google Ads ▸ Herramientas ▸ Conversiones. Formato "AW-123456789".
 *   gaLabels   → la etiqueta de cada acción de conversión ("AW-123456789/AbC-D_efGh").
 *   tiktok     → TikTok Ads ▸ Assets ▸ Events ▸ Web Events. Formato "C1A2B3...".
 *
 * Todos los CTA hacia la app disparan `lead` automáticamente (ver abajo): esa
 * es la conversión que optimizan las campañas, porque es lo último que ocurre
 * en ESTE dominio. El registro real se mide ya dentro de la app.
 */
(function () {
  "use strict";

  var ADS = {
    googleAds: "",   // p. ej. "AW-123456789"
    tiktok: "",      // p. ej. "C1A2B3D4E5F6G7H8"
    gaLabels: {
      lead: ""       // p. ej. "AW-123456789/AbC-D_efGh"
    }
  };

  var hasGoogle = /^AW-\d+$/.test(ADS.googleAds);
  var hasTikTok = !!ADS.tiktok;
  if (!hasGoogle && !hasTikTok) return; // nada configurado → no cargamos nada

  // ── Google Ads (gtag) ────────────────────────────────────────────────────
  if (hasGoogle) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + ADS.googleAds;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    // El conversion linker guarda el gclid para atribuir el registro aunque
    // ocurra en app.settlia.app (otro dominio) minutos después.
    window.gtag("config", ADS.googleAds, { allow_enhanced_conversions: true });
  }

  // ── TikTok pixel ─────────────────────────────────────────────────────────
  if (hasTikTok) {
    !function (w, d, t) {
      w.TiktokAnalyticsObject = t;
      var ttq = w[t] = w[t] || [];
      ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
      ttq.setAndDefer = function (obj, m) {
        obj[m] = function () { obj.push([m].concat(Array.prototype.slice.call(arguments, 0))); };
      };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (id) {
        var inst = ttq._i[id] || [];
        for (var j = 0; j < ttq.methods.length; j++) ttq.setAndDefer(inst, ttq.methods[j]);
        return inst;
      };
      ttq.load = function (id, opts) {
        var url = "https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i = ttq._i || {}; ttq._i[id] = []; ttq._i[id]._u = url;
        ttq._t = ttq._t || {}; ttq._t[id] = +new Date();
        ttq._o = ttq._o || {}; ttq._o[id] = opts || {};
        var el = d.createElement("script");
        el.type = "text/javascript"; el.async = true;
        el.src = url + "?sdkid=" + id + "&lib=" + t;
        var first = d.getElementsByTagName("script")[0];
        first.parentNode.insertBefore(el, first);
      };
      ttq.load(ADS.tiktok);
      ttq.page();
    }(window, document, "ttq");
  }

  // ── Conversión: clic en cualquier CTA hacia la app ───────────────────────
  // Se dispara una sola vez por sesión para no inflar el conteo si la persona
  // vuelve y pulsa otro botón.
  var fired = false;
  function trackLead(dest) {
    if (fired) return;
    fired = true;
    try { sessionStorage.setItem("settlia.lead", "1"); } catch (e) {}
    if (hasGoogle && ADS.gaLabels.lead) {
      window.gtag("event", "conversion", { send_to: ADS.gaLabels.lead });
    }
    if (hasTikTok && window.ttq) {
      window.ttq.track("ClickButton", { content_name: dest || "app" });
    }
  }
  try {
    if (sessionStorage.getItem("settlia.lead")) fired = true;
  } catch (e) {}

  document.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest("a[href]");
    if (!a) return;
    if (a.href.indexOf("app.settlia.app") !== -1) trackLead("webapp");
    else if (a.href.indexOf("apps.apple.com") !== -1) trackLead("appstore");
  }, true);
})();
