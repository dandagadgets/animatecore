#!/usr/bin/env bash
# Cuts the portfolio clips listed in reel.json out of the finished ads (../../*/out/*.mp4) into
# JPEG frames under reel/<clip>/, which the Minetic ads play inside their phone mockups.
# The frames are generated, not committed. Usage: ./prep-reel.sh  (skips clips already cut)
set -euo pipefail
cd "$(dirname "$0")"
python3 - <<'PY'
import json, os, subprocess
cfg = json.load(open('reel.json'))
w, h = cfg['size']
for name, c in cfg['clips'].items():
    out = os.path.join('reel', name)
    if os.path.isdir(out) and len(os.listdir(out)) >= int(c['dur'] * cfg['fps']) - 1:
        continue
    os.makedirs(out, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(c['t0']), '-t', str(c['dur']),
                    '-i', os.path.join('..', '..', c['src']),
                    '-vf', f"fps={cfg['fps']},scale={w}:{h}:flags=lanczos", '-q:v', '3',
                    os.path.join(out, 'f%03d.jpg')], check=True)
    print(name, len(os.listdir(out)), 'frames')
PY
