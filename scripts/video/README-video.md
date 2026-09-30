# Vídeos para redes (9:16)

Pipeline reproducible del anuncio. **Regla de oro: la interfaz NUNCA la genera un
modelo.** Kling pone la escena de la vida real; la UI son las capturas de
producción superpuestas pixel a pixel. Si se deja que el modelo "anime" una
captura, deforma nombres, importes y botones — además de feo, es mentir sobre el
producto justo en el plano donde el espectador intenta leer si le sirve.

## Las tres capas
| Capa | Quién la hace | Fichero |
|---|---|---|
| Escena real (0–5 s) | Kling `text_to_video`, `kling-video-v3_0` | `scene-01.mp4` (no versionado) |
| UI + textos (0–23 s) | `render_ad.py` → PNG con alfa en `ov/` | capturas de `assets/flow/` |
| Voz en off | `vo.py` (pista **guía**, espeak-ng) | `vo-guide.wav` |

## Cómo se monta
```bash
python3 vo.py          # voz guía + script.json con los tiempos
python3 render_ad.py   # 690 PNG con alfa (23 s a 30 fps)
./assemble.sh scene-01.mp4 vo-guide.wav settlia-ad-en-9x16.mp4
```

## Prompt de la escena en Kling
5 s · 9:16 · 1080p · `prefer_multi_shots=false` · 60 créditos.
> Cinematic vertical shot, warm evening restaurant table seen from slightly
> above. Four friends' hands around the table with tapas plates, wine glasses
> and a small printed paper receipt lying in the centre. One hand gently picks
> up the receipt. Soft warm tungsten light, shallow depth of field, gentle slow
> push-in camera move, realistic film look, cozy and friendly mood. No text, no
> letters, no numbers, no logos, no captions anywhere in frame. No faces, hands
> and table only.

**Prohibir texto en el prompt es obligatorio:** la tipografía generada sale como
garabatos y arruina la toma.

## Trampas anotadas
- **El MP4 de Kling caduca a las 24 h.** Descargarlo en cuanto termina.
- **La red del contenedor debe permitir `*.klingai.com`** (el subdominio rota
  entre `v15-`, `s15-`…, por eso hace falta comodín). Sin eso el vídeo se genera
  pero no se puede descargar ni montar.
- **La voz es una pista GUÍA** (espeak-ng): solo fija los tiempos. Para publicar,
  grabar o usar un TTS decente y pasarlo como 2º argumento de `assemble.sh` — el
  montaje no cambia.
- **`edge-tts` NO corre en una sesión CLOUD de Claude; en una sesión LOCAL sí.**
  El motivo NO es el proxy (primer diagnóstico, equivocado): el túnel a
  `speech.platform.bing.com` se establece y el TLS se completa — basta con añadir
  el CA del proxy a `certifi`. Es **Microsoft** quien devuelve **403** en el
  handshake, porque ese endpoint es el del "Read aloud" de Edge y **rechaza las
  IPs de centros de datos**. Comprobado con edge-tts 7.2.8 y 6.1.12 (esta ni
  manda `Sec-MS-GEC`): mismo 403, y el reloj del contenedor era correcto.
  → Desde tu Mac (o una sesión local de Claude Code) funciona sin tocar nada.
  → Desde la nube hace falta un TTS por **REST** (ElevenLabs, OpenAI, Azure),
    que sí pasa porque es HTTPS normal contra el 443.
- **Licencia:** `edge-tts` usa un endpoint no documentado de Microsoft pensado
  para el "Read aloud" del navegador Edge. Para un anuncio comercial conviene
  verificar los términos, o tirar de un TTS con licencia explícita.
- `vo.py` **avisa si dos líneas se solapan**; hacer caso al aviso.
- Las capturas de `assets/flow/` son de **página completa** (scroll interno), no
  del viewport. `render_ad.py` recorta 640×1385 (390×844 escalado) y el parámetro
  `scroll` recorre la página — así se anima el desplazamiento de verdad.
- El texto en pantalla va en **inglés porque las capturas están en inglés**. Para
  una versión en español hay que **recapturar la app en español** primero
  (`capture-screenshots.mjs`), si no queda voz en un idioma y UI en otro.
- `scene-01.mp4` **no se versiona** (6,4 MB, y esto lo sirve GitHub Pages). Se
  regenera con el prompt de arriba.

## Guion (inglés) — `script.json`
| s | línea |
|---|---|
| 0.40 | Dinner with friends. One bill. Five people. |
| 5.30 | Snap the receipt. Settlia reads every single line. |
| 9.60 | Tap who had what. |
| 12.40 | Everyone pays exactly their share. |
| 15.60 | No maths. No awkward group chat. |
| 19.05 | Settlia. Split expenses without the drama. |
