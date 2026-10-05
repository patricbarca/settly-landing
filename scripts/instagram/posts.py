# Posts de "dolor" 4:5: foto generada (sin texto) + titular en Baloo 2 encima.
from PIL import Image, ImageDraw, ImageFont
import os
D = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(D, "..", "video", "baloo2.ttf")
LOGO = "/home/user/settly/public/icons/logo-s.png"
W, H = 1080, 1350
SOFT = (226, 236, 240)
def font(s): return ImageFont.truetype(FONT, s)

def fit(src):
    im = Image.open(os.path.join(D, src)).convert("RGB")
    s = max(W/im.size[0], H/im.size[1])
    im = im.resize((round(im.size[0]*s), round(im.size[1]*s)), Image.LANCZOS)
    x, y = (im.size[0]-W)//2, (im.size[1]-H)//2
    return im.crop((x, y, x+W, y+H)).convert("RGBA")

def scrim(im, top_h, top_a, bot_h, bot_a):
    """Degradado oscuro arriba (titular) y abajo (marca) para que el texto se lea sobre la foto."""
    g = Image.new("RGBA", (W, H), (0,0,0,0)); d = ImageDraw.Draw(g)
    for y in range(top_h):
        d.line([(0,y),(W,y)], fill=(8,12,22, round(top_a*(1-y/top_h)**1.4)))
    for y in range(bot_h):
        yy = H-1-y; d.line([(0,yy),(W,yy)], fill=(8,12,22, round(bot_a*(1-y/bot_h)**1.3)))
    im.alpha_composite(g)

def left(d, txt, x, y, f, fill, lh=1.08):
    for i, ln in enumerate(txt.split("\n")):
        yy = y + i*round(f.size*lh)
        d.text((x+2, yy+4), ln, font=f, fill=(0,0,0,150))
        d.text((x, yy), ln, font=f, fill=fill)

logo = Image.open(LOGO).convert("RGBA")
def brand(im):
    l = logo.resize((round(58*logo.size[0]/logo.size[1]), 58), Image.LANCZOS)
    im.alpha_composite(l, (64, H-112)); d = ImageDraw.Draw(im)
    d.text((64+l.size[0]+16, H-116), "Settlia", font=font(50), fill=(255,255,255))
    f = font(36); s = "settlia.app"; w = d.textbbox((0,0), s, font=f)[2]
    d.text((W-64-w, H-100), s, font=f, fill=(110,226,226))

POSTS = [
    ("wine.jpg", "post-wine.jpg", "Who ordered\nthe wine?", (900, 252),
     "Settlia splits the bill by what\neach person actually had."),
    ("receipts.png", "post-payback.jpg", "“I'll pay you\nback later.”", (720, 235),
     "Famous last words. Settlia keeps\ntrack, so nobody has to."),
]
for src, out, title, (th, ta), sub in POSTS:
    im = fit(src); scrim(im, th, ta, 300, 225)
    d = ImageDraw.Draw(im)
    left(d, title, 64, 70, font(118), (255,255,255), 1.0)
    left(d, sub, 66, 70 + 2*round(118*1.0) + 46, font(44), SOFT, 1.2)
    brand(im)
    im.convert("RGB").save(os.path.join(D, out), quality=93)
    print("ok", out)
