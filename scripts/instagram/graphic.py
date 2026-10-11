# Posts 4:5 GRÁFICOS (sin foto, coste cero): fondo de marca + titular + una pieza visual.
# Uso: python3 graphic.py <carpeta_salida>
# Para cuando no hay créditos de imagen, o para posts de texto/dato (p. ej. el de actualidad).
# ⚠️ Baloo 2 no tiene "✓" ni "→": el check se dibuja a mano (check()) y se usa "›".
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

D = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(D, "..", "video", "baloo2.ttf")
LOGO = os.path.join(D, "..", "..", "assets", "logo-s.png")
W, H = 1080, 1350
TEAL, INDIGO, CORAL, SOFT = (15, 163, 163), (91, 91, 240), (255, 90, 77), (210, 222, 235)
def font(s): return ImageFont.truetype(FONT, s)

def background():
    """Gradiente del hero (#241C53 → #0D1B2A) + dos halos desenfocados teal/índigo."""
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
    a, b = (36, 28, 83), (13, 27, 42)
    for y in range(H):
        t = y / H; d.line([(0, y), (W, y)], fill=tuple(round(a[i]*(1-t) + b[i]*t) for i in range(3)))
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
    g.ellipse((-260, -200, 560, 560), fill=INDIGO + (110,))
    g.ellipse((620, 820, 1400, 1560), fill=TEAL + (95,))
    im = im.convert("RGBA"); im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(160)))
    return im

def text(d, txt, x, y, f, fill, lh=1.05):
    for i, ln in enumerate(txt.split("\n")):
        d.text((x, y + i*round(f.size*lh)), ln, font=f, fill=fill)
    return y + len(txt.split("\n"))*round(f.size*lh)

def card(im, box, fill=(255, 255, 255, 18), outline=(255, 255, 255, 40), r=48):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle(box, r, fill=fill, outline=outline, width=2)
    im.alpha_composite(layer)

def check(d, x, y, s, color, w=6):
    d.line([(x, y + s*0.55), (x + s*0.38, y + s*0.9), (x + s, y + s*0.1)], fill=color, width=w, joint="curve")

def brand(im):
    logo = Image.open(LOGO).convert("RGBA")
    l = logo.resize((round(58*logo.size[0]/logo.size[1]), 58), Image.LANCZOS)
    im.alpha_composite(l, (64, H-112)); d = ImageDraw.Draw(im)
    d.text((64+l.size[0]+16, H-116), "Settlia", font=font(50), fill=(255, 255, 255))
    f = font(36); s = "settlia.app"; w = d.textbbox((0, 0), s, font=f)[2]
    d.text((W-64-w, H-100), s, font=f, fill=(110, 226, 226))

def bubble(im, x, y, w, lines, mine=False, name=None):
    """Burbuja de chat genérica (no imita ninguna app concreta)."""
    d = ImageDraw.Draw(im); f = font(42); lh = 50
    h = 44 + len(lines)*lh + (40 if name else 0)
    card(im, (x, y, x+w, y+h), fill=(TEAL + (235,)) if mine else (255, 255, 255, 30),
         outline=(0, 0, 0, 0), r=36)
    yy = y + 22
    if name:
        d.text((x+32, yy-4), name, font=font(30), fill=(150, 215, 255)); yy += 40
    for ln in lines:
        d.text((x+32, yy), ln, font=f, fill=(255, 255, 255)); yy += lh
    return y + h

def post_chat(out):
    im = background(); d = ImageDraw.Draw(im)
    y = text(d, "Every group\nchat, ever.", 64, 70, font(118), (255, 255, 255), 1.0)
    text(d, "Settlia shows everyone's payment details\nright where you settle up.", 66, y + 30, font(40), SOFT, 1.2)
    y = 470
    y = bubble(im, 64, y, 760, ["Can someone send me", "the bank details?"], name="Sam") + 22
    y = bubble(im, 64, y, 520, ["Which account?"], name="Lucy") + 22
    y = bubble(im, 300, y, 716, ["I sent them last week…"], mine=True) + 22
    y = bubble(im, 64, y, 560, ["Can you send again?"], name="Sam") + 18
    d.text((64, y), "Seen by 5", font=font(30), fill=(150, 165, 185))
    brand(im); im.convert("RGB").save(out, quality=93); print("ok", out)

def post_maths(out):
    im = background(); d = ImageDraw.Draw(im)
    y = text(d, "Nobody wants\nto do this maths.", 64, 70, font(112), (255, 255, 255), 1.0)
    text(d, "Snap the receipt. Settlia splits it\nline by line, to the cent.", 66, y + 30, font(40), SOFT, 1.2)
    card(im, (64, 560, W-64, 1150))
    rows = [("2 × Steak frites", "$64.00"), ("Caesar salad", "$18.50"), ("Bottle of red", "$46.00"),
            ("3 × Beer", "$27.00"), ("Sparkling water", "$6.30"), ("Surcharge 10%", "$16.18")]
    f = font(42); yy = 600
    for name, amt in rows:
        d.text((110, yy), name, font=f, fill=(230, 236, 245))
        w = d.textbbox((0, 0), amt, font=f)[2]; d.text((W-110-w, yy), amt, font=f, fill=(230, 236, 245)); yy += 62
    d.line([(110, yy+10), (W-110, yy+10)], fill=(120, 130, 160), width=2)
    f2 = font(64); q = "$177.98 ÷ 5 = ?"
    w = d.textbbox((0, 0), q, font=f2)[2]; d.text(((W-w)//2, yy+34), q, font=f2, fill=CORAL)
    brand(im); im.convert("RGB").save(out, quality=93); print("ok", out)

def post_paid(out):
    im = background(); d = ImageDraw.Draw(im)
    y = text(d, "“Wait… did I\nalready pay you?”", 64, 70, font(112), (255, 255, 255), 1.0)
    text(d, "Settlia keeps a log of every payment,\nso nobody has to remember.", 66, y + 30, font(40), SOFT, 1.2)
    card(im, (64, 600, W-64, 1150))
    d.text((110, 636), "PAYMENTS", font=font(32), fill=(150, 215, 255))
    rows = [("Lucy › Sam", "$42.50", True), ("Tom › Sam", "$42.50", True),
            ("Ana › Lucy", "$18.00", True), ("You › Sam", "$42.50", None)]
    yy = 700
    for who, amt, ok in rows:
        f = font(46); d.text((110, yy), who, font=f, fill=(240, 244, 250))
        w = d.textbbox((0, 0), amt, font=f)[2]
        d.text((W-190-w, yy), amt, font=f, fill=(240, 244, 250))
        if ok: check(d, W-160, yy+14, 40, (110, 226, 170))
        else:  d.text((W-158, yy-6), "?", font=font(56), fill=CORAL)
        yy += 104
        if yy < 1080: d.line([(110, yy-22), (W-110, yy-22)], fill=(70, 80, 110), width=1)
    brand(im); im.convert("RGB").save(out, quality=93); print("ok", out)

if __name__ == "__main__":
    o = sys.argv[1] if len(sys.argv) > 1 else D
    post_chat(os.path.join(o, "post-chat.jpg"))
    post_maths(os.path.join(o, "post-maths.jpg"))
    post_paid(os.path.join(o, "post-paid.jpg"))
