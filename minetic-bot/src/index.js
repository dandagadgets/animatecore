// Minetic Bot: order tickets, live order status, vouches, welcomes and giveaways for the
// Minetic Media Discord. Put DISCORD_TOKEN in .env, then `npm start`.
const path = require('path');
const { Client, GatewayIntentBits, Events, MessageFlags } = require('discord.js');
const store = require('./store');
const commands = require('./commands');
const orders = require('./orders');
const vouches = require('./vouches');
const welcome = require('./welcome');
const giveaways = require('./giveaways');
const { embed } = require('./brand');

try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // no .env file: fall back to real environment variables
}
if (!process.env.DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN. Copy .env.example to .env and paste your bot token into it.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});
const EPHEMERAL = MessageFlags.Ephemeral;
const json = commands.map((c) => c.toJSON());

async function register(guild) {
  await guild.commands.set(json);
  console.log(`Registered ${json.length} commands in ${guild.name}`);
}

async function setup(interaction) {
  const o = interaction.options;
  const g = store.guild(interaction.guildId);
  g.config = {
    ticketCategoryId: o.getChannel('tickets_category', true).id,
    statusChannelId: o.getChannel('order_status', true).id,
    vouchChannelId: o.getChannel('vouches', true).id,
    logChannelId: o.getChannel('order_log', true).id,
    staffRoleId: o.getRole('staff_role', true).id,
    clientRoleId: o.getRole('client_role', true).id,
    welcomeChannelId: o.getChannel('welcome')?.id || null,
    memberRoleId: o.getRole('member_role')?.id || null,
    portfolioChannelId: o.getChannel('portfolio')?.id || null,
  };
  store.save();
  await interaction.deferReply({ flags: EPHEMERAL });
  await orders.updateBoard(interaction.client, interaction.guildId);
  const c = g.config;
  const summary = embed(interaction.client).setTitle('✅ Minetic Bot is set up').setDescription([
    `🎫 Tickets go in <#${c.ticketCategoryId}>`,
    `📊 Order status board in <#${c.statusChannelId}>`,
    `⭐ Vouches post in <#${c.vouchChannelId}>`,
    `📋 Logs + transcripts in <#${c.logChannelId}>`,
    `🛠️ Staff role <@&${c.staffRoleId}> • 💎 Client role <@&${c.clientRoleId}>`,
    c.welcomeChannelId ? `👋 Welcomes in <#${c.welcomeChannelId}>` : '👋 Welcome messages: off',
    c.memberRoleId ? `👤 New members get <@&${c.memberRoleId}>` : '👤 Join role: off',
    '',
    '**Next:** run `/panel` in your order-here channel.',
    'Make sure the bot\'s role is **above** the Client and Member roles in Server Settings → Roles.',
  ].join('\n'));
  await interaction.editReply({ embeds: [summary] });
}

async function route(i) {
  if (i.isChatInputCommand()) {
    switch (i.commandName) {
      case 'setup': return setup(i);
      case 'panel': return orders.postPanel(i);
      case 'status': return orders.setStatus(i);
      case 'slots': return orders.setSlots(i);
      case 'close': return orders.askClose(i);
      case 'vouch': return vouches.start(i);
      case 'giveaway': return giveaways.create(i);
      default: return null;
    }
  }
  const id = i.customId || '';
  if (i.isButton()) {
    if (id === 'order:start') return orders.start(i);
    if (id === 'ticket:close') return orders.askClose(i);
    if (id === 'ticket:close:confirm') return orders.confirmClose(i);
    if (id === 'ticket:close:cancel') return orders.cancelClose(i);
    if (id === 'vouch:start') return vouches.start(i);
    if (id.startsWith('gw:enter:')) return giveaways.enter(i);
  }
  if (i.isStringSelectMenu()) {
    if (id === 'order:package') return orders.pickPackage(i);
    if (id === 'vouch:stars') return vouches.pickStars(i);
  }
  if (i.isModalSubmit()) {
    if (id.startsWith('order:form:')) return orders.submitForm(i);
    if (id.startsWith('vouch:form:')) return vouches.submit(i);
  }
  return null;
}

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  for (const guild of c.guilds.cache.values()) {
    await register(guild).catch((e) => console.error(`Could not register commands in ${guild.name}:`, e.message));
    await orders.updateBoard(c, guild.id).catch(() => {});
  }
  giveaways.startTicker(c);
});

client.on(Events.GuildCreate, (guild) => register(guild).catch((e) => console.error(e.message)));
client.on(Events.GuildMemberAdd, (member) => welcome.onJoin(member).catch((e) => console.error('Welcome failed:', e.message)));

client.on(Events.InteractionCreate, async (i) => {
  if (!i.inGuild()) return;
  try {
    await route(i);
  } catch (e) {
    console.error(`Interaction ${i.customId || i.commandName} failed:`, e);
    if (!i.isRepliable()) return;
    const msg = { content: '⚠️ Something went wrong. Please try again, or ping staff.', flags: EPHEMERAL };
    await (i.deferred || i.replied ? i.followUp(msg) : i.reply(msg)).catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN);
