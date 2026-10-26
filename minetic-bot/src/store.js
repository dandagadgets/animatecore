// Tiny JSON store in data/store.json. Everything the bot needs to remember (channel setup,
// orders, the status board message, giveaways) lives here, so back this file up.
const fs = require('fs');
const path = require('path');

const FILE = process.env.STORE_FILE || path.join(__dirname, '..', 'data', 'store.json');

const freshGuild = () => ({
  config: {},
  settings: { maxSlots: 5, open: true, turnaround: '2–4 days' },
  board: null,
  panelChannelId: null,
  nextOrder: 1,
});

let state = null;

function load() {
  try {
    state = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    state = {};
  }
  state.guilds ??= {};
  state.orders ??= {};
  state.giveaways ??= {};
  return state;
}

function get() {
  return state || load();
}

function guild(guildId) {
  const s = get();
  s.guilds[guildId] ??= freshGuild();
  return s.guilds[guildId];
}

function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(get(), null, 2));
  fs.renameSync(tmp, FILE);
}

module.exports = { get, guild, save };
