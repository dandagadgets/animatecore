#!/usr/bin/env bash
# Mac/Linux: double-click or run ./start.sh
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js is not installed. Get the LTS version from https://nodejs.org"; exit 1; }
if [ ! -f .env ]; then
  read -rp "Paste your bot token (Developer Portal > Bot > Reset Token): " TOKEN
  echo "DISCORD_TOKEN=$TOKEN" > .env
fi
[ -d node_modules ] || npm install --no-audit --no-fund
echo "Starting Minetic Bot... keep this window open."
node src/index.js
