# Regenerar las capturas del móvil del hero

Las imágenes de `assets/app/*.webp` son **capturas reales de la app**, no un
mockup dibujado. Se generan desde la app corriendo en local, en **modo oscuro**
y en **inglés**, con un grupo de demo inventado.

Antes esto era HTML a mano y se desincronizaba con cada cambio de UI (llegó a
mostrar un formato de moneda que la app había abandonado, y tres tipografías
que la app no usa). Regenerar es más barato que mantener la copia.

## Requisitos

- El repo de la app (`patricbarca/settly`) al lado, con `npm install` hecho.
- `playwright` instalado en algún sitio (`npm i playwright`).

## Pasos

1. **Datos de demo en inglés.** La semilla del modo invitado
   (`src/lib/seed.ts` en la app) está en español y trae un solo grupo. Para las
   capturas se parchea **temporalmente** con un grupo tipo — un viaje con 5
   personas y gastos variados — y se hace que `store.ts` siembre 2-3 grupos
   para que la pantalla de inicio no salga vacía. **Revertir al terminar:**
   ese parche no debe llegar a `master`.

2. **Exponer el modo invitado.** La app no tiene botón de invitado, así que en
   `src/main.tsx` se añade temporalmente:
   ```ts
   import * as __auth from "./lib/auth";
   (window as any).__auth = __auth;
   ```
   El script llama a `window.__auth.signInGuest()`. **Revertir también.**

3. **Levantar la app** (necesita un `.env.local` con valores cualquiera; el
   modo invitado no toca la red):
   ```bash
   printf 'VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=x\n' > .env.local
   npx vite --port 5199
   ```

4. **Capturar y convertir:**
   ```bash
   node scripts/capture-screenshots.mjs     # PNG -> .screenshots/
   node scripts/png-to-webp.mjs             # WebP 640px -> assets/app/
   ```
   Variables: `APP` (default `http://127.0.0.1:5199/`), `OUT`, `CHROME`
   (ruta al binario si Playwright no lo encuentra solo).

5. Revisar las imágenes y **revertir los parches del paso 1 y 2**.

## Reglas que no se pueden saltar

- **Cero datos reales.** Nombres inventados, sin fotos de personas y sin
  tickets reales. Las capturas se publican en una web abierta.
- **El pie de modo invitado** (*"data is saved in this browser · Reset demo"*)
  se oculta en la captura: un usuario con cuenta no lo ve, así que enseñarlo
  sería mentir sobre la app.
- Idioma **inglés** y tema **oscuro**, para que casen entre ellas.
- Si se añade o quita una captura, actualizar **los `dot` del slideshow** en
  `index.html` (hay uno por slide).
