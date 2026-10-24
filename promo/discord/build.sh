#!/usr/bin/env bash
# Renders the five "Join the Discord" promos to out/mine-radar-<name>.mp4 (1080x1920, 30fps,
# with sound) plus out/mine-radar-<name>-cover.png. Usage: ./build.sh [video-dir ...]  (default: all)
# Reuses the shorts toolkit in ../shorts/shared. Needs node + playwright, python3 + numpy, ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out
work=$(mktemp -d)
port=${PORT:-8778}
python3 -m http.server "$port" --bind 127.0.0.1 --directory .. >/dev/null 2>&1 &
server=$!
trap 'kill $server 2>/dev/null || true; rm -rf "$work"' EXIT
sleep 1

videos=("$@")
[ ${#videos[@]} -eq 0 ] && videos=(01-wooden-pickaxe 02-loot-reel 03-community 04-the-build 05-launch)

for v in "${videos[@]}"; do
  v=${v%/}
  echo "== $v"
  url="http://127.0.0.1:$port/discord/$v/index.html"
  node ../shorts/shared/render.js "$url" video "$work/$v.mp4" "$work/$v.json"
  python3 "$v/audio.py" "$work/$v.json" "$work/$v.wav"
  ffmpeg -y -loglevel error -i "$work/$v.mp4" -i "$work/$v.wav" \
    -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "out/mine-radar-$v.mp4"
  node ../shorts/shared/render.js "$url" cover "out/mine-radar-$v-cover.png"
done
ls -la out
