# Pista GUIA de voz (espeak-ng). Solo fija los tiempos del montaje; se sustituye
# por una voz real sin tocar el resto del render.
import subprocess, json, os
LINES = [                       # (t_inicio, texto)
    (0.40,  "Dinner with friends. One bill. Five people."),
    (5.30,  "Snap the receipt. Settlia reads every single line."),
    (9.60,  "Tap who had what."),
    (12.40, "Everyone pays exactly their share."),
    (15.60, "No maths. No awkward group chat."),
    (19.05, "Settlia. Split expenses without the drama."),
]
TOTAL = 23.0
os.makedirs("vo", exist_ok=True)
parts = []
for i, (t, txt) in enumerate(LINES):
    w = f"vo/{i}.wav"
    subprocess.run(["espeak-ng", "-v", "en-us", "-s", "148", "-p", "42", "-w", w, txt], check=True)
    d = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",w],
                             capture_output=True, text=True).stdout.strip())
    parts.append((t, w, d))
    print(f"{t:5.2f}s +{d:4.2f}s  {txt}")
    if i and t < parts[i-1][0] + parts[i-1][2] - 0.05:
        print(f"   !! se solapa con la linea anterior (acaba en {parts[i-1][0]+parts[i-1][2]:.2f}s)")

ins = " ".join(f"-i {w}" for _, w, _ in parts)
delays = "".join(f"[{i+1}:a]adelay={int(t*1000)}|{int(t*1000)}[d{i}];" for i, (t, _, _) in enumerate(parts))
mix = "".join(f"[d{i}]" for i in range(len(parts)))
cmd = (f'ffmpeg -y -loglevel error -f lavfi -t {TOTAL} -i anullsrc=r=44100:cl=stereo {ins} '
       f'-filter_complex "{delays}[0:a]{mix}amix=inputs={len(parts)+1}:duration=first:normalize=0[a]" '
       f'-map "[a]" -ar 44100 -ac 2 vo-guide.wav')
subprocess.run(cmd, shell=True, check=True)
print("total pista:", subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0","vo-guide.wav"],
      capture_output=True, text=True).stdout.strip())
json.dump([{"t": t, "text": x} for (t, x) in LINES], open("script.json","w"), indent=1)
