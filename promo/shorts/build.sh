#!/usr/bin/env bash
# Renders the Mine Radar shorts to out/<name>.mp4 (1080x1920, 30fps, with sound)
# plus out/<name>-cover.png. Usage: ./build.sh [short-dir ...]   (default: all)
# Needs: node + playwright (chromium), python3 + numpy, ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out
work=$(mktemp -d)
port=${PORT:-8777}
python3 -m http.server "$port" --bind 127.0.0.1 >/dev/null 2>&1 &
server=$!
trap 'kill $server 2>/dev/null || true; rm -rf "$work"' EXIT
sleep 1

shorts=("$@")
[ ${#shorts[@]} -eq 0 ] && shorts=(01-dead-servers 02-every-world 03-nobody-online)

for s in "${shorts[@]}"; do
  s=${s%/}
  echo "== $s"
  url="http://127.0.0.1:$port/$s/index.html"
  node shared/render.js "$url" video "$work/$s.mp4" "$work/$s.json"
  python3 "$s/audio.py" "$work/$s.json" "$work/$s.wav"
  ffmpeg -y -loglevel error -i "$work/$s.mp4" -i "$work/$s.wav" \
    -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "out/mine-radar-$s.mp4"
  node shared/render.js "$url" cover "out/mine-radar-$s-cover.png"
done
ls -la out
