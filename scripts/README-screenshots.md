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


## Cómo funciona la animación

Cada captura es la **pantalla entera** de la app (no un recorte), y se desplaza
verticalmente dentro del marco como si alguien hiciera scroll.

- La **barra inferior se captura aparte** (`nav.webp`) y se fija en el marco.
  En la app es `position: fixed`; si subiera con el contenido, la animación
  estaría mintiendo sobre cómo se comporta.
- El recorrido lo calcula el CSS solo: `translateY(calc(560px - 100%))`, donde
  `100%` es el alto de la propia imagen y `560px` el alto del marco. Así vale
  para cualquier captura sin tocar nada.
- La **duración va por slide** (`--scroll-dur`) y se calcula a **velocidad
  constante** (~120 px/s) al escribir el HTML, para que una pantalla larga no
  pase volando ni una corta se arrastre. El tiempo que se queda cada slide
  (`data-ms`) = duración + 1.1 s de pausa arriba y abajo.
- Con `prefers-reduced-motion: reduce` la animación **se desactiva**.

Si cambias una captura, recalcula `--scroll-dur` y `data-ms` a partir del alto
nuevo, o el ritmo se descuadra.

## Por qué NO se usa `fullPage: true`

La app tiene `html, body, #root { height: 100% }` con scroll interno. Un
`fullPage` sale con **una banda vacía en medio y la mitad de abajo en tema
claro**. El script mide el alto real con el viewport normal, **redimensiona el
viewport a esa altura exacta** y captura de una sola pintura.


## Los dos flujos de la storyboard (`assets/flow/`)

`capture-flows.mjs` graba los dos recorridos completos que enseña la sección
"De la cuenta al reparto": **escanear un ticket** (foto → la IA lo desglosa →
marcar quién consumió qué → guardado con la parte de cada uno) y **escribirlo
en lenguaje normal** (frase → la IA la interpreta → guardado).

**La IA se intercepta EN RED, no parcheando la app.** El script hace
`page.route()` sobre `**/functions/v1/scan-receipt` y `**/functions/v1/parse-expense`
y devuelve respuestas de demo. Así el camino de código es el de producción
—consentimiento de IA, compresión de la foto, editor por ítems, cálculo del
reparto— y sólo se sustituye lo que no podemos llamar de verdad. La respuesta
del parser se **construye a partir de los miembros que manda la propia
petición**, porque los ids del modo invitado son distintos en cada arranque.

Detalles que importan:

- El ticket de la foto lo genera `demo-receipt.html` (un restaurante inventado
  de Lisboa). **Nunca usar un ticket real.**
- La respuesta del scan lleva un **retardo de 2,5 s** a propósito: sin él no da
  tiempo a capturar el estado *"Reading the receipt…"*, que es el mejor primer
  fotograma porque enseña la foto.
- El contenedor de cada ítem se localiza por el **valor** de su input y se le
  marca con un `data-attr` temporal: React pone el valor como propiedad, no
  como atributo, así que un selector CSS no lo encuentra.
- `localStorage['settly.aiConsent'] = '1'` evita el modal de consentimiento,
  que sólo sale la primera vez.
- En las slides con un **modal abierto** NO se superpone la barra inferior: la
  app oscurece toda la pantalla, barra incluida.

## Reglas que no se pueden saltar

- **Cero datos reales.** Nombres inventados, sin fotos de personas y sin
  tickets reales. Las capturas se publican en una web abierta.
- **El pie de modo invitado** (*"data is saved in this browser · Reset demo"*)
  se oculta en la captura: un usuario con cuenta no lo ve, así que enseñarlo
  sería mentir sobre la app.
- Idioma **inglés** y tema **oscuro**, para que casen entre ellas.
- Si se añade o quita una captura, actualizar **los `dot` del slideshow** en
  `index.html` (hay uno por slide) y recalcular `--scroll-dur`/`data-ms`.
