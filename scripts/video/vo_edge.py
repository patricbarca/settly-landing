#!/usr/bin/env python3
"""Voz en off del anuncio con edge-tts, respetando los tiempos de script.json.

CORRER EN LOCAL, no en el contenedor de Claude: edge-tts habla por WebSocket y
el proxy de egress no soporta upgrades a WebSocket (devuelve 403 en el
handshake). En un Mac normal funciona sin mas.

    pip install edge-tts
    python3 vo_edge.py                 # -> vo-edge.wav
    python3 vo_edge.py --voice en-GB-RyanNeural
    edge-tts --list-voices | grep en-  # ver el catalogo

Luego se monta igual que siempre:
    ./assemble.sh scene-01.mp4 vo-edge.wav settlia-ad-en-9x16.mp4
"""
import argparse, json, os, subprocess, sys

D = os.path.dirname(os.path.abspath(__file__))
TOTAL = 23.0

ap = argparse.ArgumentParser()
ap.add_argument("--voice", default="en-US-AriaNeural")
ap.add_argument("--rate", default="+0%", help='p. ej. "+8%" si una linea se pasa de largo')
ap.add_argument("--out", default=os.path.join(D, "vo-edge.wav"))
a = ap.parse_args()

lines = json.load(open(os.path.join(D, "script.json")))
tmp = os.path.join(D, "vo-edge"); os.makedirs(tmp, exist_ok=True)

parts = []
for i, ln in enumerate(lines):
    mp3 = os.path.join(tmp, f"{i}.mp3")
    subprocess.run(["edge-tts", "--voice", a.voice, "--rate", a.rate,
                    "--text", ln["text"], "--write-media", mp3], check=True)
    dur = float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3],
        capture_output=True, text=True).stdout.strip())
    parts.append((ln["t"], mp3, dur))
    print(f'{ln["t"]:5.2f}s +{dur:4.2f}s  {ln["text"]}')

# El aviso que importa: una linea que invade la siguiente se oye como atropello.
bad = False
for i in range(1, len(parts)):
    end = parts[i-1][0] + parts[i-1][2]
    if parts[i][0] < end - 0.05:
        print(f"  !! la linea {i} entra en {parts[i][0]:.2f}s pero la anterior acaba en {end:.2f}s", file=sys.stderr)
        bad = True
if parts and parts[-1][0] + parts[-1][2] > TOTAL:
    print(f"  !! la ultima linea se sale de los {TOTAL}s", file=sys.stderr); bad = True
if bad:
    print("  -> prueba --rate \"+10%\", o mueve los tiempos en script.json", file=sys.stderr)

ins = " ".join(f'-i "{p}"' for _, p, _ in parts)
delays = "".join(f"[{i+1}:a]adelay={int(t*1000)}|{int(t*1000)}[d{i}];" for i, (t, _, _) in enumerate(parts))
mix = "".join(f"[d{i}]" for i in range(len(parts)))
cmd = (f'ffmpeg -y -loglevel error -f lavfi -t {TOTAL} -i anullsrc=r=44100:cl=stereo {ins} '
       f'-filter_complex "{delays}[0:a]{mix}amix=inputs={len(parts)+1}:duration=first:normalize=0[a]" '
       f'-map "[a]" -ar 44100 -ac 2 "{a.out}"')
subprocess.run(cmd, shell=True, check=True)
print("->", a.out)
