# Genera la foto de fondo de un post con Nano Banana 2 vía la API de Gemini (Google AI Studio).
# Uso: python3 gen_image.py "<prompt>" salida.png [1K|2K]
# Necesita GEMINI_API_KEY en el entorno. Modelo configurable con GEMINI_IMAGE_MODEL.
import base64, json, os, sys, urllib.request, urllib.error

MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image-preview")
KEY = os.environ.get("GEMINI_API_KEY", "").strip()  # .trim(): un newline pegado rompe la clave

# Toda foto lleva estas reglas: el texto lo dibuja render.py, nunca el modelo.
RULES = (" No text, no letters, no numbers, no logos, no brand names, no signs, "
         "no labels anywhere in the image. No recognisable faces. "
         "The top third of the frame is calm and uncluttered to leave room for a headline.")

def generate(prompt, out, size="2K"):
    if not KEY:
        sys.exit("Falta GEMINI_API_KEY")
    body = {
        "contents": [{"parts": [{"text": prompt + RULES}]}],
        "generationConfig": {"responseModalities": ["IMAGE"],
                             "imageConfig": {"aspectRatio": "4:5", "imageSize": size}},
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
        data=json.dumps(body).encode(), method="POST",
        headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            res = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code}: {e.read().decode()[:800]}")
    for part in res.get("candidates", [{}])[0].get("content", {}).get("parts", []):
        data = part.get("inlineData") or part.get("inline_data")
        if data:
            open(out, "wb").write(base64.b64decode(data["data"]))
            print("ok", out, res.get("usageMetadata", {}))
            return
    sys.exit("Sin imagen en la respuesta: " + json.dumps(res)[:800])

if __name__ == "__main__":
    generate(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "2K")
