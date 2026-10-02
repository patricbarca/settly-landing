# Carrusel de Instagram 4:5 (1080x1350). UI = capturas REALES de produccion.
# El texto lo pone este script en Baloo 2 (la fuente de la app), nunca un modelo.
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
D = os.path.dirname(os.path.abspath(__file__))
A = "/home/user/settly-landing/assets/flow"
FONT = os.path.join(D, "..", "video", "baloo2.ttf")
LOGO = "/home/user/settly/public/icons/logo-s.png"
W, H = 1080, 1350
TEAL, INDIGO, SOFT = (15,163,163), (91,91,240), (176,214,224)
VIEW_H = round(640*844/390)

def font(s): return ImageFont.truetype(FONT, s)

def bg():
    im = Image.new("RGB",(W,H)); d = ImageDraw.Draw(im)
    for y in range(H):
        t = y/H; d.line([(0,y),(W,y)], fill=tuple(round((36,28,83)[i]+((13,27,42)[i]-(36,28,83)[i])*t) for i in range(3)))
    bl = Image.new("RGB",(W,H),(0,0,0)); b = ImageDraw.Draw(bl)
    b.ellipse([-300,-200,520,560], fill=INDIGO); b.ellipse([640,520,1400,1240], fill=TEAL)
    return Image.blend(im, Image.blend(im, bl.filter(ImageFilter.GaussianBlur(200)), 0.5), 0.85).convert("RGBA")
BG = bg()

def phone(src, scroll, ph, top):
    im = Image.open(os.path.join(A,src)).convert("RGB")
    mx = max(0, im.size[1]-VIEW_H); off = round(mx*scroll)
    box = im.crop((0,off,640,off+VIEW_H))
    pw = round(640*ph/VIEW_H); rad = round(46*ph/VIEW_H)
    box = box.resize((pw,ph), Image.LANCZOS)
    m = Image.new("L",(pw,ph),0); ImageDraw.Draw(m).rounded_rectangle([0,0,pw-1,ph-1],rad,fill=255)
    lay = Image.new("RGBA",(W,H),(0,0,0,0)); b=6; x=(W-pw)//2
    # sombra suave para separar el movil del fondo
    sh = Image.new("RGBA",(W,H),(0,0,0,0))
    ImageDraw.Draw(sh).rounded_rectangle([x-4,top+18,x+pw+4,top+ph+30],rad+8,fill=(0,0,0,140))
    lay.alpha_composite(sh.filter(ImageFilter.GaussianBlur(24)))
    fr = Image.new("RGBA",(pw+b*2,ph+b*2),(0,0,0,0))
    ImageDraw.Draw(fr).rounded_rectangle([0,0,pw+b*2-1,ph+b*2-1],rad+b,fill=(12,18,30,255),outline=(255,255,255,70),width=2)
    lay.alpha_composite(fr,(x-b,top-b)); lay.paste(box,(x,top),m)
    return lay

def zoom(src, y0, y1, top, width=940):
    im = Image.open(os.path.join(A,src)).convert("RGB").crop((0,y0,640,y1))
    h = round(width*(y1-y0)/640); im = im.resize((width,h), Image.LANCZOS)
    rad = 34; x = (W-width)//2
    m = Image.new("L",(width,h),0); ImageDraw.Draw(m).rounded_rectangle([0,0,width-1,h-1],rad,fill=255)
    lay = Image.new("RGBA",(W,H),(0,0,0,0))
    sh = Image.new("RGBA",(W,H),(0,0,0,0))
    ImageDraw.Draw(sh).rounded_rectangle([x,top+20,x+width,top+h+30],rad,fill=(0,0,0,150))
    lay.alpha_composite(sh.filter(ImageFilter.GaussianBlur(26)))
    lay.paste(im,(x,top),m)
    ImageDraw.Draw(lay).rounded_rectangle([x,top,x+width-1,top+h-1],rad,outline=(255,255,255,60),width=2)
    return lay

def centered(d, txt, y, f, fill):
    for i, ln in enumerate(txt.split("\n")):
        w = d.textbbox((0,0),ln,font=f)[2]; yy = y + i*round(f.size*1.12)
        d.text(((W-w)//2+2,yy+3), ln, font=f, fill=(0,0,0,120))
        d.text(((W-w)//2,yy), ln, font=f, fill=fill)

logo = Image.open(LOGO).convert("RGBA")
def small_logo(img):
    l = logo.resize((round(44*logo.size[0]/logo.size[1]),44), Image.LANCZOS)
    img.alpha_composite(l,(56,52)); d = ImageDraw.Draw(img)
    d.text((56+l.size[0]+12,50), "Settlia", font=font(38), fill=(255,255,255))

def counter(img, n):
    d = ImageDraw.Draw(img); f = font(30); s = f"{n}/5"
    w = d.textbbox((0,0),s,font=f)[2]; d.text((W-56-w,58), s, font=f, fill=SOFT)

out = []
# 1 — portada
s = BG.copy(); d = ImageDraw.Draw(s)
l = logo.resize((round(150*logo.size[0]/logo.size[1]),150), Image.LANCZOS)
s.alpha_composite(l,((W-l.size[0])//2,250))
centered(d, "Splitting the bill\nshouldn't need\na spreadsheet.", 470, font(96), (255,255,255))
centered(d, "Here's how Settlia does it in 30 seconds", 880, font(42), SOFT)
centered(d, "Swipe  ›", 1170, font(46), (110,226,226))
counter(s,1); out.append(s)

# 2-5 — el flujo real
steps = [
 ("a1-reading.webp",      0.00, "Snap the receipt",        "One photo. That's the whole setup."),
 ("a3-items.webp",        (968,1568), "AI reads every line",     "Every dish and price, pulled from the photo."),
 ("a4-assigned.webp",     (1300,1900), "Tap who had what",        "Only the people who ate it pay for it."),
 ("a6-saved-detail.webp", 0.10, "Everyone sees their share", "No maths. No awkward group chat."),
]
for n, (src, sc, title, sub) in enumerate(steps, start=2):
    s = BG.copy(); small_logo(s); counter(s,n)
    if isinstance(sc, tuple):
        s.alpha_composite(zoom(src, sc[0], sc[1], 360))
    else:
        s.alpha_composite(phone(src, sc, 900, 345))
    d = ImageDraw.Draw(s)
    centered(d, title, 150, font(74), (255,255,255))
    centered(d, sub, 245, font(40), SOFT)
    if n == 5:
        # CTA sobre una franja para que se lea encima del movil
        band = Image.new("RGBA",(W,H),(0,0,0,0))
        ImageDraw.Draw(band).rectangle([0,H-150,W,H], fill=(13,27,42,235))
        s.alpha_composite(band); d = ImageDraw.Draw(s)
        centered(d, "Try it free  ·  settlia.app", H-112, font(52), (110,226,226))
    out.append(s)

for i, im in enumerate(out, 1):
    im.convert("RGB").save(os.path.join(D, f"carousel-{i}.jpg"), quality=93)
# hoja de contacto para revisar las 5 de un vistazo
sheet = Image.new("RGB",(5*270+40,338+20),(20,20,20))
for i, im in enumerate(out): sheet.paste(im.convert("RGB").resize((270,338)),(8+i*278,10))
sheet.save(os.path.join(D,"carousel-sheet.png"))
print("ok", len(out))
