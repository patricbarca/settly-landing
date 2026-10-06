# Monta posts 4:5 (1080×1350): foto + titular y subtítulo en Baloo 2 + marca abajo.
# Uso: python3 render.py posts.json
# posts.json = [{"src": "foto.png", "out": "post-x.jpg", "title": "Línea 1\nLínea 2",
#                "sub": "Subtítulo\nen dos líneas", "top": [800, 245],
#                "blur": [[x0, y0, x1, y1], ...]}]
# "top" = alto y opacidad del degradado de arriba (más alto/opaco si la foto tiene detalle arriba).
# "blur" = cajas (en coordenadas del post) a difuminar: logos o matrículas que dibujó el modelo.
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

D = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(D, "..", "video", "baloo2.ttf")
LOGO = os.path.join(D, "..", "..", "assets", "logo-s.png")
W, H = 1080, 1350
SOFT = (226, 236, 240)
def font(s): return ImageFont.truetype(FONT, s)

def fit(path):
    im = Image.open(path).convert("RGB")
    s = max(W/im.size[0], H/im.size[1])
    im = im.resize((round(im.size[0]*s), round(im.size[1]*s)), Image.LANCZOS)
    x, y = (im.size[0]-W)//2, (im.size[1]-H)//2
    return im.crop((x, y, x+W, y+H)).convert("RGBA")

def scrim(im, top_h, top_a, bot_h=300, bot_a=225):
    g = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(g)
    for y in range(top_h):
        d.line([(0, y), (W, y)], fill=(8, 12, 22, round(top_a*(1-y/top_h)**1.4)))
    for y in range(bot_h):
        yy = H-1-y; d.line([(0, yy), (W, yy)], fill=(8, 12, 22, round(bot_a*(1-y/bot_h)**1.3)))
    im.alpha_composite(g)

def left(d, txt, x, y, f, fill, lh=1.08):
    for i, ln in enumerate(txt.split("\n")):
        yy = y + i*round(f.size*lh)
        d.text((x+2, yy+4), ln, font=f, fill=(0, 0, 0, 150))
        d.text((x, yy), ln, font=f, fill=fill)

def brand(im, logo):
    l = logo.resize((round(58*logo.size[0]/logo.size[1]), 58), Image.LANCZOS)
    im.alpha_composite(l, (64, H-112)); d = ImageDraw.Draw(im)
    d.text((64+l.size[0]+16, H-116), "Settlia", font=font(50), fill=(255, 255, 255))
    f = font(36); s = "settlia.app"; w = d.textbbox((0, 0), s, font=f)[2]
    d.text((W-64-w, H-100), s, font=f, fill=(110, 226, 226))

def render(spec, base):
    logo = Image.open(LOGO).convert("RGBA")
    for p in spec:
        im = fit(os.path.join(base, p["src"]))
        for box in p.get("patch", []):
            # Rellena con el color medio de una franja justo encima de la caja: tapa un logo
            # sobre una superficie lisa (p. ej. la marca de una nevera) sin dejar mancha.
            x0, y0, x1, y1 = box
            ref = im.crop((x0, y0 - 12, x1, y0 - 2)).convert("RGB").resize((1, 1), Image.BOX)
            im.paste(ref.getpixel((0, 0)) + (255,), (x0, y0, x1, y1))
            im.paste(im.crop((x0-6, y0-6, x1+6, y1+6)).filter(ImageFilter.GaussianBlur(4)), (x0-6, y0-6))
        for box in p.get("blur", []):
            box = tuple(box)
            im.paste(im.crop(box).filter(ImageFilter.GaussianBlur(9)), box[:2])
        th, ta = p.get("top", [800, 245])
        scrim(im, th, ta)
        d = ImageDraw.Draw(im)
        lines = p["title"].count("\n") + 1
        left(d, p["title"], 64, 70, font(118), (255, 255, 255), 1.0)
        left(d, p["sub"], 66, 70 + lines*118 + 46, font(44), SOFT, 1.2)
        brand(im, logo)
        out = os.path.join(base, p["out"])
        im.convert("RGB").save(out, quality=93)
        print("ok", out)

if __name__ == "__main__":
    path = sys.argv[1]
    render(json.load(open(path)), os.path.dirname(os.path.abspath(path)))
