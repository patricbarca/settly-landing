# Capa de OVERLAY del anuncio (PNG con alfa, 23 s a 30 fps).
# Se compone encima de: [escena real de Kling 0-5 s] + [fondo de marca 5-23 s].
# La UI es pixel a pixel la de produccion; ningun modelo la toca.
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, shutil

D = os.path.dirname(os.path.abspath(__file__))
A = "/home/user/settly-landing/assets"
FONTP = os.path.join(D, "baloo2.ttf")
LOGO = "/home/user/settly/public/icons/logo-s.png"
W, H, FPS, DUR = 1080, 1920, 30, 23.0
VIEW_H = round(640 * 844 / 390)
SCENE_END = 5.0

def font(s): return ImageFont.truetype(FONTP, s)
def ease(t): return t*t*(3-2*t)
def clamp(x): return max(0.0, min(1.0, x))
def fade(t, a, b, d=0.35):
    if t < a: return 0.0
    if t < a+d: return ease((t-a)/d)
    if t < b: return 1.0
    if t < b+d: return 1.0-ease((t-b)/d)
    return 0.0

def brand_bg():
    bg = Image.new("RGB", (W, H), (13, 27, 42)); d = ImageDraw.Draw(bg)
    for y in range(H):
        t = y/H
        d.line([(0,y),(W,y)], fill=tuple(round((36,28,83)[i]+((13,27,42)[i]-(36,28,83)[i])*t) for i in range(3)))
    bl = Image.new("RGB", (W,H), (0,0,0)); b = ImageDraw.Draw(bl)
    b.ellipse([-260,-180,560,620], fill=(91,91,240)); b.ellipse([620,240,1420,1020], fill=(15,163,163))
    return Image.blend(bg, Image.blend(bg, bl.filter(ImageFilter.GaussianBlur(190)), 0.55), 0.85)
BG = brand_bg().convert("RGBA")

def shot(p):
    im = Image.open(os.path.join(A,p)).convert("RGB")
    return im if im.size[0]==640 else im.resize((640, round(im.size[1]*640/im.size[0])))
S = {k: shot(v) for k,v in {"reading":"flow/a1-reading.webp","items":"flow/a3-items.webp",
                            "saved":"flow/a6-saved-detail.webp"}.items()}

PHONE_H = 1330; SCALE = PHONE_H/VIEW_H; PW = round(640*SCALE); RAD = round(46*SCALE)
PX, PY = (W-PW)//2, 440

def phone(key, scroll=0.0):
    im = S[key]; mx = max(0, im.size[1]-VIEW_H); off = round(mx*clamp(scroll))
    box = im.crop((0, off, 640, off+VIEW_H))
    if box.size[1] < VIEW_H:
        pad = Image.new("RGB",(640,VIEW_H), box.getpixel((5,box.size[1]-5))); pad.paste(box,(0,0)); box = pad
    box = box.resize((PW,PHONE_H), Image.LANCZOS)
    m = Image.new("L",(PW,PHONE_H),0); ImageDraw.Draw(m).rounded_rectangle([0,0,PW-1,PHONE_H-1],RAD,fill=255)
    lay = Image.new("RGBA",(W,H),(0,0,0,0)); b=7
    fr = Image.new("RGBA",(PW+b*2,PHONE_H+b*2),(0,0,0,0))
    ImageDraw.Draw(fr).rounded_rectangle([0,0,PW+b*2-1,PHONE_H+b*2-1],RAD+b,
                                         fill=(12,18,30,255), outline=(255,255,255,70), width=2)
    lay.alpha_composite(fr,(PX-b,PY-b)); lay.paste(box,(PX,PY),m)
    return lay

def blend(dst, layer, a):
    if a > 0.01:
        dst.alpha_composite(Image.blend(Image.new("RGBA",(W,H),(0,0,0,0)), layer, a))

def text(dst, s, y, sz, alpha, color=(255,255,255), shadow=True):
    if alpha <= 0.01: return
    f = font(sz); lay = Image.new("RGBA",(W,H),(0,0,0,0)); d = ImageDraw.Draw(lay)
    for i, ln in enumerate(s.split("\n")):
        w = d.textbbox((0,0),ln,font=f)[2]; yy = y + i*round(sz*1.18)
        if shadow: d.text(((W-w)//2+3, yy+4), ln, font=f, fill=(0,0,0,150))
        d.text(((W-w)//2, yy), ln, font=f, fill=color+(255,))
    blend(dst, lay, alpha)

FR = os.path.join(D,"ov"); shutil.rmtree(FR, ignore_errors=True); os.makedirs(FR)
logo = Image.open(LOGO).convert("RGBA"); logo = logo.resize((round(250*logo.size[0]/logo.size[1]),250), Image.LANCZOS)

for i in range(int(DUR*FPS)):
    t = i/FPS
    f = Image.new("RGBA",(W,H),(0,0,0,0))

    # 0-5 s: sobre la escena real. Solo un velo suave + el gancho.
    if t < SCENE_END + 0.5:
        blend(f, Image.new("RGBA",(W,H),(6,10,20,120)), fade(t, 0.0, SCENE_END-0.2, 0.3)*0.9)
        text(f, "Dinner with friends.\nOne bill. Five people.", 640, 104, fade(t,0.35,4.30))

    # 5-18.6 s: el fondo de marca tapa la escena y entra el movil con la UI real.
    blend(f, BG, fade(t, SCENE_END-0.25, 18.65, 0.35))

    a_ph = fade(t, SCENE_END+0.05, 18.45, 0.30)
    if a_ph > 0.01:
        if t < 9.45:
            lay, cap = phone("reading"), "Snap the receipt"
        elif t < 12.25:
            lay, cap = phone("items", ease(clamp((t-9.7)/2.2))*0.8), "Tap who had what"
        else:
            lay, cap = phone("saved", 0.12), "Each share, worked out"
        rise = 1.0 - ease(clamp((t-SCENE_END-0.05)/0.5))
        if rise > 0:
            sh = Image.new("RGBA",(W,H),(0,0,0,0)); sh.paste(lay,(0,round(rise*560)),lay); lay = sh
        blend(f, lay, a_ph)
        text(f, cap, 215, 68, a_ph)
        text(f, "No maths. No awkward group chat.", 1830, 46, fade(t,15.5,18.4)*0.95, (176,214,224))

    # 18.6-23 s: cierre de marca.
    a_end = fade(t, 18.60, 22.60, 0.35)
    if a_end > 0.01:
        blend(f, BG, a_end)
        c = Image.new("RGBA",(W,H),(0,0,0,0)); c.alpha_composite(logo, ((W-logo.size[0])//2, 700))
        blend(f, c, a_end)
        text(f, "Settlia", 1010, 132, a_end)
        text(f, "Split expenses without the drama", 1180, 50, a_end*0.92, (176,214,224))
        text(f, "settlia.app", 1290, 54, a_end*0.95, (110, 226, 226))

    f.save(os.path.join(FR, f"{i:04d}.png"))
print("overlay frames:", len(os.listdir(FR)))
