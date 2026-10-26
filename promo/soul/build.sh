#!/usr/bin/env bash
# Renders the three Soul Launcher ads to out/soul-<name>.mp4 (1080x1920, 30fps, with sound)
# plus out/soul-<name>-cover.png. Usage: ./build.sh [ad-dir ...]  (default: all)
# Reuses the shorts toolkit in ../shorts/shared. Needs node + playwright, python3 + numpy, ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out
work=$(mktemp -d)
port=${PORT:-8780}
python3 -m http.server "$port" --bind 127.0.0.1 --directory .. >/dev/null 2>&1 &
server=$!
trap 'kill $server 2>/dev/null || true; rm -rf "$work"' EXIT
sleep 1

videos=("$@")
[ ${#videos[@]} -eq 0 ] && videos=(01-chores 02-spaces 03-numbers)

for v in "${videos[@]}"; do
  v=${v%/}
  echo "== $v"
  url="http://127.0.0.1:$port/soul/$v/index.html"
  node ../shorts/shared/render.js "$url" video "$work/$v.mp4" "$work/$v.json"
  python3 "$v/audio.py" "$work/$v.json" "$work/$v.wav"
  ffmpeg -y -loglevel error -i "$work/$v.mp4" -i "$work/$v.wav" \
    -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "out/soul-$v.mp4"
  node ../shorts/shared/render.js "$url" cover "out/soul-$v-cover.png"
done
ls -la out
