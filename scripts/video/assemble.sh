#!/bin/bash
# Montaje final. Base = escena real de Kling (0-5 s) congelada hasta el final,
# y encima la capa PNG con alfa (que a partir del segundo 5 la tapa entera con
# el fondo de marca). Asi la UI jamas pasa por el modelo.
set -euo pipefail
cd "$(dirname "$0")"
SCENE="${1:-scene-01.mp4}"
VO="${2:-vo-guide.wav}"
OUT="${3:-settlia-ad-en-9x16.mp4}"
DUR=23

ffmpeg -y -loglevel error \
  -i "$SCENE" -framerate 30 -i ov/%04d.png -i "$VO" \
  -filter_complex "
    [0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,
         fps=30,eq=contrast=1.05:saturation=1.06,
         tpad=stop_mode=clone:stop_duration=${DUR}[base];
    [base][1:v]overlay=0:0:format=auto:shortest=1[v];
    [0:a]atrim=0:4.8,afade=t=out:st=4.2:d=0.6,volume=0.45,
         apad=whole_dur=${DUR}[amb];
    [amb][2:a]amix=inputs=2:duration=first:normalize=0,
         alimiter=limit=0.95[a]
  " \
  -map "[v]" -map "[a]" -t ${DUR} \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 19 -r 30 \
  -c:a aac -b:a 160k -ar 44100 -movflags +faststart "$OUT"
echo "OK -> $OUT"
