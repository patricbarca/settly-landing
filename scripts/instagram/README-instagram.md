# Imágenes para Instagram (feed 4:5, 1080×1350)

Mismo principio que el vídeo: **la IA pone el mundo real, la app son capturas
reales, y el texto lo dibuja el script en Baloo 2.** Nunca texto generado dentro
de la imagen (sale con garabatos) ni UI generada (deforma importes y nombres).

## Piezas
| Archivo | Qué es | Fuente |
|---|---|---|
| `carousel-1..5.jpg` | Carrusel "cómo funciona" | `assets/flow/*.webp` (capturas reales) |
| `post-wine.jpg` | "Who ordered the wine?" | foto generada + titular |
| `post-payback.jpg` | "I'll pay you back later." | foto generada + titular |

```bash
python3 carousel.py      # 5 slides + carousel-sheet.png para revisar
python3 posts.py         # necesita wine.jpg y receipts.png al lado (ver abajo)
```

## Fotos generadas
Modelo **`gemini-3.1-flash-image`** (Nano Banana 2) vía Kling: es el que genera
**4:5 nativo**. Los modelos propios de Kling llegan como mucho a 3:4.
2k · 15 créditos/imagen. Prompts: escena sin personas reconocibles, "no text, no
letters, no numbers, no logos", y **el tercio superior despejado** para el titular.

## Trampas
- **El subset de Baloo 2 no tiene `→`** (sale un cuadrado vacío). Usar `›`.
  Sí tiene `“ ” ’ · – —`.
- **El móvil entero no se lee en Instagram:** a ese tamaño el texto de la UI es
  ilegible y dos pantallas parecidas parecen la misma. Para enseñar UN detalle
  (el desglose, quién tomó qué) se usa `zoom()`: un recorte ampliado de la
  captura. El móvil entero solo cuando importa el contexto (escaneo, resultado).
- **Fotos con mucho detalle arriba** necesitan más velo: `posts.py` lleva altura
  y opacidad del degradado por post (el del vino va a 900 px / 252).
- Las fotos y los JPG de salida **no se versionan** (se regeneran).
