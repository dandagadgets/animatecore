// Offline smoke test: runs every bot flow against fake Discord objects (no token, no network)
// and serialises every embed, button, menu and modal so discord.js validates them.
// Usage: npm run check
const os = require('os');
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const { Collection, PermissionFlagsBits } = require('discord.js');

process.env.STORE_FILE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'minetic-')), 'store.json');
const store = require('../src/store');
const commands = require('../src/commands');
const orders = require('../src/orders');
const vouches = require('../src/vouches');
const giveaways = require('../src/giveaways');
const welcome = require('../src/welcome');

const sent = [];
const serialise = (p) => {
  if (!p || typeof p !== 'object') return p;
  (p.embeds || []).forEach((e) => e.toJSON());
  (p.components || []).forEach((c) => c.toJSON());
  return p;
};
let nextId = 100;
function fakeChannel(name) {
  const messages = new Collection();
  const ch = {
    id: String(nextId++), name,
    send: async (p) => {
      serialise(p);
      const m = { id: String(nextId++), url: `https://discord.com/channels/x/${name}`, edit: async (q) => serialise(q), pin: async () => {},
        author: { tag: 'Minetic Bot#0001' }, content: typeof p === 'string' ? p : p.content || '', attachments: new Collection(), embeds: [], createdTimestamp: Date.now() };
      messages.set(m.id, m);
      sent.push({ channel: name, payload: p });
      return m;
    },
    messages: { fetch: async (q) => (typeof q === 'string' ? messages.get(q) : (q.before ? new Collection() : messages)) },
    delete: async () => {},
  };
  return ch;
}
const channels = new Map();
const client = {
  user: { id: '1', displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png' },
  channels: { fetch: async (id) => channels.get(id) || null },
};
const roles = { add: async () => {}, cache: new Map() };
const staffMember = { permissions: { has: (p) => p === PermissionFlagsBits.ManageGuild }, roles };
const clientMember = { permissions: { has: () => false }, roles: { add: async () => {}, cache: new Map() }, displayName: 'Steve' };
const guild = {
  id: 'G', name: 'Minetic Media', memberCount: 42, roles: { everyone: { id: 'G' } },
  channels: { create: async (o) => { const c = fakeChannel(o.name); channels.set(c.id, c); return c; } },
  members: { fetch: async () => clientMember },
};

function interaction(extra) {
  const log = [];
  const i = {
    client, guild, guildId: 'G', channelId: extra.channel?.id, channel: extra.channel,
    user: { id: 'U1', username: 'Steve_Builds', tag: 'Steve_Builds#0', displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/1.png', toString: () => '<@U1>' },
    member: clientMember, replied: false, deferred: false, log,
    reply: async (p) => { i.replied = true; log.push(['reply', serialise(p)]); },
    update: async (p) => { log.push(['update', serialise(p)]); },
    followUp: async (p) => { log.push(['followUp', serialise(p)]); },
    deferReply: async () => { i.deferred = true; },
    editReply: async (p) => { log.push(['editReply', serialise(p)]); },
    showModal: async (m) => { log.push(['modal', m.toJSON()]); },
    ...extra,
  };
  return i;
}

(async () => {
  // commands serialise and stay within Discord's limits
  const json = commands.map((c) => c.toJSON());
  assert.equal(json.length, 7);
  assert.ok(json.every((c) => c.description.length <= 100));

  // /setup equivalent
  for (const n of ['status', 'vouches', 'log', 'welcome', 'panel']) channels.set(n, fakeChannel(n));
  Object.assign(store.guild('G').config, {
    ticketCategoryId: 'cat', statusChannelId: 'status', vouchChannelId: 'vouches', logChannelId: 'log',
    staffRoleId: 'STAFF', clientRoleId: 'CLIENT', welcomeChannelId: 'welcome', memberRoleId: 'MEMBER', portfolioChannelId: 'pf',
  });
  await orders.updateBoard(client, 'G');
  assert.ok(store.guild('G').board?.messageId, 'board posted');

  // panel
  const panelI = interaction({ channel: channels.get('panel'), member: staffMember });
  await orders.postPanel(panelI);
  assert.equal(store.guild('G').panelChannelId, channels.get('panel').id);

  // order: button -> package -> modal -> ticket
  const startI = interaction({ customId: 'order:start' });
  await orders.start(startI);
  assert.equal(startI.log[0][0], 'reply');
  const pickI = interaction({ customId: 'order:package', values: ['test'] });
  await orders.pickPackage(pickI);
  assert.equal(pickI.log[0][0], 'modal');
  assert.equal(pickI.log[0][1].components.length, 5);
  const values = { server: 'PotSMP', ip: 'potsmp.fun • port 19132', features: 'Season IV, crates, boss fight', platform: 'YouTube Shorts', deadline: '' };
  const formI = interaction({ customId: 'order:form:test', fields: { getTextInputValue: (k) => values[k] } });
  await orders.submitForm(formI);
  const order = Object.values(store.get().orders)[0];
  assert.ok(order && order.status === 'received' && order.num === 1, 'order saved');
  assert.match(formI.log.at(-1)[1].content, /ticket is ready/);
  const ticket = channels.get(order.channelId);
  assert.match(ticket.name, /order-1-steve-builds/);

  // status tracker, delivered -> vouch button + client role
  const nonStaff = interaction({ channel: ticket, options: { getString: () => 'preview' } });
  await orders.setStatus(nonStaff);
  assert.match(nonStaff.log[0][1].content, /Only staff/);
  for (const stage of ['in_progress', 'preview', 'delivered']) {
    const si = interaction({ channel: ticket, member: staffMember, options: { getString: () => stage } });
    await orders.setStatus(si);
    assert.equal(store.get().orders[ticket.id].status, stage);
  }
  assert.ok(store.get().orders[ticket.id].deliveredAt);

  // slots
  const slotsI = interaction({ member: staffMember, options: { getInteger: () => 3, getBoolean: () => null, getString: () => '3–5 days' } });
  await orders.setSlots(slotsI);
  assert.equal(store.guild('G').settings.maxSlots, 3);
  assert.equal(store.guild('G').settings.turnaround, '3–5 days');

  // vouch: start -> stars -> modal -> card
  const vStart = interaction({ customId: 'vouch:start' });
  await vouches.start(vStart);
  assert.equal(vStart.log[0][0], 'reply');
  const vStars = interaction({ customId: 'vouch:stars', values: ['5'] });
  await vouches.pickStars(vStars);
  assert.equal(vStars.log[0][0], 'modal');
  const vForm = interaction({ customId: 'vouch:form:5', fields: { getTextInputValue: () => 'Amazing ad, got 40 new players!' } });
  await vouches.submit(vForm);
  assert.ok(store.get().orders[ticket.id].vouched);
  assert.ok(sent.some((s) => s.channel === 'vouches'), 'vouch posted');

  // a stranger can't vouch
  const stranger = interaction({ user: { id: 'U9', username: 'x', tag: 'x#0', displayAvatarURL: () => '' }, member: { roles: { cache: new Map() } } });
  await vouches.start(stranger);
  assert.match(stranger.log[0][1].content, /Vouches are for clients/);

  // close with transcript
  const closeI = interaction({ channel: ticket, member: staffMember });
  await orders.askClose(closeI);
  assert.equal(closeI.log[0][0], 'reply');
  await orders.confirmClose(interaction({ channel: ticket, member: staffMember }));
  assert.ok(store.get().orders[ticket.id].closedAt);
  assert.ok(sent.some((s) => s.channel === 'log' && s.payload.files?.length), 'transcript logged');

  // giveaway
  assert.equal(giveaways.parseDuration('30m'), 30 * 60e3);
  assert.equal(giveaways.parseDuration('2x'), null);
  const gwChannel = fakeChannel('giveaways');
  channels.set(gwChannel.id, gwChannel);
  await giveaways.create(interaction({ channel: gwChannel, member: staffMember,
    options: { getString: (k) => (k === 'prize' ? '1 free Starter ad' : '1m'), getInteger: () => 1 } }));
  const gw = Object.values(store.get().giveaways)[0];
  await giveaways.enter(interaction({ customId: `gw:enter:${gw.id}` }));
  assert.deepEqual(gw.entrants, ['U1']);
  gw.endsAt = Date.now() - 1;
  clearInterval(giveaways.startTicker(client));
  await new Promise((r) => setTimeout(r, 50));
  assert.ok(gw.ended && gw.winnerIds[0] === 'U1', 'giveaway ended with winner');

  // welcome
  await welcome.onJoin({ id: 'U5', guild, client, user: { displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/2.png' }, roles: { add: async () => {} }, toString: () => '<@U5>' });
  assert.ok(sent.some((s) => s.channel === 'welcome'), 'welcome posted');

  console.log(`✅ All checks passed (${sent.length} messages built and validated)`);
})().catch((e) => { console.error('❌ Check failed:', e); process.exit(1); });
