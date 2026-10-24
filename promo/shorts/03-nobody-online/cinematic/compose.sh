#!/usr/bin/env bash
# Builds the cinematic cut of Short 3: the AI-generated rain shot (5s) with overlay.webm on
# top, then the pixel short from its radar ping (11.3s) to the end, over the original
# soundtrack from 6.3s so every sound effect stays in sync. 15.7s, 1080x1920.
#   ./compose.sh <ai-clip.mp4> <out.mp4>
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
ai=$1
out=$2
short="$here/../../out/mine-radar-03-nobody-online.mp4"

ffmpeg -y -loglevel error \
  -i "$ai" \
  -c:v libvpx-vp9 -i "$here/overlay.webm" \
  -ss 11.3 -i "$short" \
  -ss 6.3 -i "$short" \
  -filter_complex "\
[0:v]scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,setsar=1,fps=30,trim=duration=5,setpts=PTS-STARTPTS[bg];\
[1:v]format=rgba,setpts=PTS-STARTPTS[ov];\
[bg][ov]overlay=0:0:format=auto,format=yuv420p[a];\
[2:v]setpts=PTS-STARTPTS,format=yuv420p[b];\
[a][b]concat=n=2:v=1:a=0[v];\
[3:a]asetpts=PTS-STARTPTS,afade=t=in:d=0.05[aud]" \
  -map "[v]" -map "[aud]" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart "$out"

ffmpeg -y -loglevel error -i "$out" -frames:v 1 "${out%.mp4}-cover.png"
echo "$out"
