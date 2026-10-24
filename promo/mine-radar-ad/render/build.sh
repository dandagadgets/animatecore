#!/usr/bin/env bash
# Renders out/mine-radar-ad.mp4 (1080x1080, 30fps, 15s, with sound) and out/mine-radar-poster.png.
# Needs: node + playwright (chromium), python3 + numpy, ffmpeg.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
work=$(mktemp -d)
trap 'kill $server 2>/dev/null || true; rm -rf "$work"' EXIT

port=8765
python3 -m http.server "$port" --bind 127.0.0.1 >/dev/null 2>&1 &
server=$!
sleep 1
export AD_URL="http://127.0.0.1:$port/index.html"

node render/render.js video "$work/silent.mp4" "$work/cues.json"
python3 render/make-audio.py "$work/cues.json" "$work/audio.wav"
ffmpeg -y -loglevel error -i "$work/silent.mp4" -i "$work/audio.wav" \
  -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/mine-radar-ad.mp4

node render/render.js stills "$work/stills" 14.6
cp "$work/stills/t14.60.png" out/mine-radar-poster.png
echo "done: out/mine-radar-ad.mp4 out/mine-radar-poster.png"
