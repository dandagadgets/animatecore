// Orders: the "Order an Ad" panel -> package picker -> order form -> private ticket, the
// /status tracker, the live order-status board, /slots, and closing a ticket with a transcript.
const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder,
  TextInputStyle, ChannelType, PermissionFlagsBits, MessageFlags, AttachmentBuilder,
} = require('discord.js');
const store = require('./store');
const { COLORS, embed, PACKAGES, packageByKey, STAGES, ACTIVE, stageLine, isStaff } = require('./brand');

const EPHEMERAL = MessageFlags.Ephemeral;
const MAX_OPEN_PER_USER = 2;
const P = PermissionFlagsBits;

const ordersIn = (guildId) => Object.values(store.get().orders).filter((o) => o.guildId === guildId);
const activeCount = (guildId) => ordersIn(guildId).filter((o) => ACTIVE.includes(o.status)).length;
const orderFor = (channelId) => store.get().orders[channelId];

function needSetup(interaction) {
  const cfg = store.guild(interaction.guildId).config;
  if (cfg.ticketCategoryId) return null;
  return interaction.reply({ content: '⚙️ The bot isn\'t set up yet. An admin needs to run `/setup` first.', flags: EPHEMERAL });
}

// ---------- panel ----------
async function postPanel(interaction) {
  if (await needSetup(interaction)) return;
  const e = embed(interaction.client)
    .setTitle('🎫 Order an Ad')
    .setDescription([
      'Ready to bring more players to your server? ⛏️',
      '',
      '**1.** Click **Order an Ad** below',
      '**2.** Pick your package',
      '**3.** Fill in a quick form',
      '',
      'We\'ll open a private ticket and get started!',
    ].join('\n'))
    .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }));
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('order:start').setLabel('Order an Ad').setEmoji('🎫').setStyle(ButtonStyle.Primary),
  );
  await interaction.channel.send({ embeds: [e], components: [row] });
  store.guild(interaction.guildId).panelChannelId = interaction.channelId;
  store.save();
  await interaction.reply({ content: '✅ Order panel posted.', flags: EPHEMERAL });
}

// ---------- ordering ----------
async function start(interaction) {
  if (await needSetup(interaction)) return;
  const g = store.guild(interaction.guildId);
  if (!g.settings.open) {
    return interaction.reply({ content: '🔴 We\'re not taking new orders right now. Keep an eye on the order-status channel!', flags: EPHEMERAL });
  }
  if (activeCount(interaction.guildId) >= g.settings.maxSlots) {
    return interaction.reply({ content: '🟡 All order slots are full right now. Check the order-status channel and try again soon!', flags: EPHEMERAL });
  }
  const mine = ordersIn(interaction.guildId).filter((o) => o.userId === interaction.user.id && ACTIVE.includes(o.status));
  if (mine.length >= MAX_OPEN_PER_USER) {
    return interaction.reply({ content: `You already have ${mine.length} open orders: ${mine.map((o) => `<#${o.channelId}>`).join(', ')}`, flags: EPHEMERAL });
  }
  const menu = new StringSelectMenuBuilder()
    .setCustomId('order:package')
    .setPlaceholder('Choose your package')
    .addOptions(PACKAGES.map((p) => ({ label: p.label, value: p.key, description: p.description, emoji: p.emoji })));
  await interaction.reply({
    content: '**Which package do you want?** Prices are in the prices channel.',
    components: [new ActionRowBuilder().addComponents(menu)],
    flags: EPHEMERAL,
  });
}

async function pickPackage(interaction) {
  const pkg = packageByKey(interaction.values[0]);
  const input = (id, label, style, opts = {}) => {
    const t = new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(style).setRequired(opts.required ?? true);
    if (opts.placeholder) t.setPlaceholder(opts.placeholder);
    if (opts.max) t.setMaxLength(opts.max);
    return new ActionRowBuilder().addComponents(t);
  };
  const modal = new ModalBuilder()
    .setCustomId(`order:form:${pkg.key}`)
    .setTitle(`${pkg.label} order`)
    .addComponents(
      input('server', 'Server name', TextInputStyle.Short, { max: 80, placeholder: 'e.g. PotSMP' }),
      input('ip', 'Server IP (and Bedrock port, if any)', TextInputStyle.Short, { max: 100, placeholder: 'e.g. play.myserver.net • port 19132' }),
      input('features', 'What should the ad show off?', TextInputStyle.Paragraph, { max: 1000, placeholder: '3–5 features, events, a new season…' }),
      input('platform', 'Where will you post it?', TextInputStyle.Short, { max: 80, required: false, placeholder: 'YouTube Shorts, TikTok, Reels…' }),
      input('deadline', 'Deadline', TextInputStyle.Short, { max: 80, required: false, placeholder: 'e.g. before 1 Nov, or "no rush"' }),
    );
  await interaction.showModal(modal);
}

function orderEmbed(client, o) {
  const pkg = packageByKey(o.package);
  return embed(client, o.status === 'delivered' ? COLORS.green : COLORS.cyan)
    .setTitle(`🎫 Order #${o.num} • ${pkg.emoji} ${pkg.label}`)
    .addFields(
      { name: '🏰 Server', value: o.server, inline: true },
      { name: '🌐 IP', value: `\`${o.ip}\``, inline: true },
      { name: '✨ Show off', value: o.features },
      { name: '📱 Posting on', value: o.platform || '—', inline: true },
      { name: '📅 Deadline', value: o.deadline || '—', inline: true },
      { name: '📊 Status', value: stageLine(o.status) },
    );
}

async function submitForm(interaction) {
  const guild = interaction.guild;
  const g = store.guild(guild.id);
  const cfg = g.config;
  const pkgKey = interaction.customId.split(':')[2];
  const field = (id) => interaction.fields.getTextInputValue(id).trim();
  await interaction.deferReply({ flags: EPHEMERAL });

  const num = g.nextOrder++;
  const slug = interaction.user.username.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'client';
  const staffPerms = [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles, P.EmbedLinks, P.ManageMessages];
  const channel = await guild.channels.create({
    name: `🎫・order-${num}-${slug}`,
    type: ChannelType.GuildText,
    parent: cfg.ticketCategoryId,
    topic: `Order #${num} for ${interaction.user.tag} • ${packageByKey(pkgKey).label}`,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [P.ViewChannel] },
      { id: interaction.user.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles, P.EmbedLinks] },
      ...(cfg.staffRoleId ? [{ id: cfg.staffRoleId, allow: staffPerms }] : []),
      { id: interaction.client.user.id, allow: [...staffPerms, P.ManageChannels] },
    ],
  });

  const o = {
    num, guildId: guild.id, channelId: channel.id, userId: interaction.user.id, package: pkgKey,
    server: field('server'), ip: field('ip'), features: field('features'),
    platform: field('platform'), deadline: field('deadline'),
    status: 'received', messageId: null, vouched: false, createdAt: Date.now(),
  };
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:close').setLabel('Close ticket').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
  );
  const msg = await channel.send({
    content: `${interaction.user}${cfg.staffRoleId ? ` <@&${cfg.staffRoleId}>` : ''} New order! 🎉`,
    embeds: [orderEmbed(interaction.client, o)],
    components: [row],
    allowedMentions: { users: [interaction.user.id], roles: cfg.staffRoleId ? [cfg.staffRoleId] : [] },
  });
  await msg.pin().catch(() => {});
  o.messageId = msg.id;
  store.get().orders[channel.id] = o;
  store.save();

  await channel.send({
    embeds: [embed(interaction.client, COLORS.gold).setTitle('📎 Next step').setDescription([
      'Send these here so we can start:',
      '• Your **logo** (PNG if you have it)',
      '• Your **brand colours** (or say "use the logo colours")',
      '• Any screenshots, art or announcement text you want used',
      '',
      'We\'ll reply here with a preview. You can ask for changes before the final video.',
    ].join('\n'))],
  });
  await log(interaction.client, guild.id, embed(interaction.client).setTitle(`📥 Order #${num} opened`)
    .setDescription(`${interaction.user} • ${packageByKey(pkgKey).label} • ${o.server}\n${channel}`));
  await updateBoard(interaction.client, guild.id);
  await interaction.editReply({ content: `✅ Your order ticket is ready: ${channel}` });
}

// ---------- status tracker ----------
async function setStatus(interaction) {
  const cfg = store.guild(interaction.guildId).config;
  if (!isStaff(interaction.member, cfg)) return interaction.reply({ content: 'Only staff can update order status.', flags: EPHEMERAL });
  const o = orderFor(interaction.channelId);
  if (!o) return interaction.reply({ content: 'Use this inside an order ticket.', flags: EPHEMERAL });
  const stage = interaction.options.getString('stage', true);
  o.status = stage;
  if (stage === 'delivered') o.deliveredAt = Date.now();
  store.save();

  const msg = await interaction.channel.messages.fetch(o.messageId).catch(() => null);
  if (msg) await msg.edit({ embeds: [orderEmbed(interaction.client, o)] });
  const s = STAGES[stage];
  const update = embed(interaction.client, stage === 'delivered' ? COLORS.green : COLORS.cyan)
    .setTitle(`${s.emoji} ${s.label}`)
    .setDescription(stageLine(stage));
  const components = [];
  if (stage === 'delivered') {
    update.setDescription(`${stageLine(stage)}\n\nYour ad is done! 🎉 If you're happy with it, leaving a vouch helps a lot.`);
    components.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('vouch:start').setLabel('Leave a vouch').setEmoji('⭐').setStyle(ButtonStyle.Success),
    ));
    if (cfg.clientRoleId) {
      const member = await interaction.guild.members.fetch(o.userId).catch(() => null);
      await member?.roles.add(cfg.clientRoleId).catch((e) => console.warn('Could not give client role:', e.message));
    }
  }
  await interaction.reply({ content: `<@${o.userId}>`, embeds: [update], components, allowedMentions: { users: [o.userId] } });
  await updateBoard(interaction.client, interaction.guildId);
  await log(interaction.client, interaction.guildId, embed(interaction.client).setDescription(`Order #${o.num} → ${s.emoji} **${s.label}** (${interaction.channel})`));
}

// ---------- live order-status board ----------
function boardEmbed(client, guildId) {
  const { settings } = store.guild(guildId);
  const active = activeCount(guildId);
  const free = Math.max(0, settings.maxSlots - active);
  let color = COLORS.green;
  let line = `🟢 **OPEN** — **${free}/${settings.maxSlots}** slots available`;
  if (!settings.open) { color = COLORS.red; line = '🔴 **CLOSED** — not taking new orders right now'; }
  else if (free === 0) { color = COLORS.amber; line = `🟡 **FULL** — all ${settings.maxSlots} slots are taken`; }
  return embed(client, color)
    .setTitle('📊 Order Status')
    .setDescription([line, '', `⏱️ Turnaround: **${settings.turnaround}**`, `📥 Orders in progress: **${active}**`].join('\n'))
    .setFooter({ text: 'Updates automatically • Minetic Media', iconURL: client.user.displayAvatarURL() });
}

async function updateBoard(client, guildId) {
  const g = store.guild(guildId);
  const channelId = g.config.statusChannelId;
  if (!channelId) return;
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return;
  const payload = { embeds: [boardEmbed(client, guildId)] };
  if (g.board?.channelId === channelId) {
    const msg = await channel.messages.fetch(g.board.messageId).catch(() => null);
    if (msg) { await msg.edit(payload); return; }
  }
  const msg = await channel.send(payload);
  g.board = { channelId, messageId: msg.id };
  store.save();
}

async function setSlots(interaction) {
  const g = store.guild(interaction.guildId);
  if (!isStaff(interaction.member, g.config)) return interaction.reply({ content: 'Only staff can change slots.', flags: EPHEMERAL });
  const max = interaction.options.getInteger('max');
  const open = interaction.options.getBoolean('open');
  const turnaround = interaction.options.getString('turnaround');
  if (max !== null) g.settings.maxSlots = max;
  if (open !== null) g.settings.open = open;
  if (turnaround) g.settings.turnaround = turnaround;
  store.save();
  await updateBoard(interaction.client, interaction.guildId);
  const s = g.settings;
  await interaction.reply({ content: `✅ ${s.open ? '🟢 Open' : '🔴 Closed'} • ${s.maxSlots} slots • turnaround ${s.turnaround}`, flags: EPHEMERAL });
}

// ---------- closing ----------
async function askClose(interaction) {
  const cfg = store.guild(interaction.guildId).config;
  if (!isStaff(interaction.member, cfg)) return interaction.reply({ content: 'Only staff can close tickets.', flags: EPHEMERAL });
  if (!orderFor(interaction.channelId)) return interaction.reply({ content: 'This isn\'t an order ticket.', flags: EPHEMERAL });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:close:confirm').setLabel('Yes, close it').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket:close:cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
  );
  await interaction.reply({ content: 'Close this ticket? A transcript will be saved to the order log.', components: [row], flags: EPHEMERAL });
}

async function transcript(channel) {
  const lines = [];
  let before;
  for (let page = 0; page < 10; page++) {
    const batch = await channel.messages.fetch({ limit: 100, before });
    if (!batch.size) break;
    batch.forEach((m) => {
      const files = [...m.attachments.values()].map((a) => ` [file: ${a.url}]`).join('');
      const embeds = m.embeds.map((e) => ` [embed: ${e.title || e.description?.slice(0, 60) || ''}]`).join('');
      lines.push(`[${new Date(m.createdTimestamp).toISOString().replace('T', ' ').slice(0, 16)}] ${m.author.tag}: ${m.content}${files}${embeds}`);
    });
    before = batch.last().id;
  }
  return lines.reverse().join('\n');
}

async function confirmClose(interaction) {
  const cfg = store.guild(interaction.guildId).config;
  if (!isStaff(interaction.member, cfg)) return interaction.reply({ content: 'Only staff can close tickets.', flags: EPHEMERAL });
  const o = orderFor(interaction.channelId);
  if (!o) return interaction.update({ content: 'This isn\'t an order ticket.', components: [] });
  await interaction.update({ content: '🔒 Closing…', components: [] });
  const text = await transcript(interaction.channel);
  const file = new AttachmentBuilder(Buffer.from(text || '(empty)', 'utf8'), { name: `order-${o.num}-transcript.txt` });
  await log(interaction.client, interaction.guildId, embed(interaction.client, COLORS.amber)
    .setTitle(`🔒 Order #${o.num} closed`)
    .setDescription(`<@${o.userId}> • ${packageByKey(o.package).label} • ${o.server}\nLast status: ${STAGES[o.status].emoji} ${STAGES[o.status].label}\nClosed by ${interaction.user}`), [file]);
  if (o.status !== 'delivered') o.status = 'closed';
  o.closedAt = Date.now();
  store.save();
  await updateBoard(interaction.client, interaction.guildId);
  await interaction.channel.send('🔒 This ticket will be deleted in 5 seconds.');
  setTimeout(() => interaction.channel.delete(`Order #${o.num} closed`).catch(() => {}), 5000);
}

async function cancelClose(interaction) {
  await interaction.update({ content: 'Okay, the ticket stays open.', components: [] });
}

async function log(client, guildId, e, files = []) {
  const id = store.guild(guildId).config.logChannelId;
  if (!id) return;
  const channel = await client.channels.fetch(id).catch(() => null);
  await channel?.send({ embeds: [e], files }).catch((err) => console.warn('Could not write to order log:', err.message));
}

module.exports = {
  postPanel, start, pickPackage, submitForm, setStatus, updateBoard, setSlots, askClose, confirmClose, cancelClose,
  ordersIn, orderFor, log,
};
