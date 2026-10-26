// Giveaways: /giveaway posts a card with an Enter button; a ticker ends them on time (and still
// ends them after a restart, since they're saved in the store).
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const store = require('./store');
const { COLORS, embed, isStaff } = require('./brand');

const EPHEMERAL = MessageFlags.Ephemeral;
const UNITS = { m: 60e3, h: 3600e3, d: 86400e3 };

function parseDuration(s) {
  const m = /^\s*(\d+)\s*([mhd])\s*$/i.exec(s || '');
  if (!m) return null;
  const ms = Number(m[1]) * UNITS[m[2].toLowerCase()];
  return ms >= 60e3 && ms <= 30 * 86400e3 ? ms : null;
}

function card(client, gw) {
  const ts = Math.floor(gw.endsAt / 1000);
  const e = embed(client, gw.ended ? COLORS.amber : COLORS.gold);
  if (!gw.ended) {
    return e.setTitle(`🎁 GIVEAWAY: ${gw.prize}`).setDescription([
      'Click **🎉 Enter** to join!',
      '',
      `⏰ Ends <t:${ts}:R> (<t:${ts}:f>)`,
      `🏆 Winners: **${gw.winners}**`,
      `👥 Entries: **${gw.entrants.length}**`,
    ].join('\n'));
  }
  const won = gw.winnerIds.length ? gw.winnerIds.map((id) => `<@${id}>`).join(', ') : 'No one entered 😢';
  return e.setTitle(`🎁 GIVEAWAY ENDED: ${gw.prize}`).setDescription([`🏆 Winner${gw.winnerIds.length === 1 ? '' : 's'}: ${won}`, `👥 Entries: **${gw.entrants.length}**`].join('\n'));
}

const button = (gw) => new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`gw:enter:${gw.id}`).setLabel(gw.ended ? 'Ended' : 'Enter').setEmoji('🎉')
    .setStyle(gw.ended ? ButtonStyle.Secondary : ButtonStyle.Success).setDisabled(Boolean(gw.ended)),
);

async function create(interaction) {
  if (!isStaff(interaction.member, store.guild(interaction.guildId).config)) {
    return interaction.reply({ content: 'Only staff can start giveaways.', flags: EPHEMERAL });
  }
  const ms = parseDuration(interaction.options.getString('duration', true));
  if (!ms) return interaction.reply({ content: 'Duration must look like `30m`, `12h` or `3d` (1 minute to 30 days).', flags: EPHEMERAL });
  const gw = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    guildId: interaction.guildId, channelId: interaction.channelId, messageId: null,
    prize: interaction.options.getString('prize', true), winners: interaction.options.getInteger('winners') || 1,
    endsAt: Date.now() + ms, entrants: [], ended: false, winnerIds: [],
  };
  const msg = await interaction.channel.send({ embeds: [card(interaction.client, gw)], components: [button(gw)] });
  gw.messageId = msg.id;
  store.get().giveaways[gw.id] = gw;
  store.save();
  await interaction.reply({ content: '🎁 Giveaway started!', flags: EPHEMERAL });
}

async function enter(interaction) {
  const gw = store.get().giveaways[interaction.customId.split(':')[2]];
  if (!gw || gw.ended) return interaction.reply({ content: 'This giveaway has ended.', flags: EPHEMERAL });
  const i = gw.entrants.indexOf(interaction.user.id);
  if (i >= 0) gw.entrants.splice(i, 1); else gw.entrants.push(interaction.user.id);
  store.save();
  await interaction.update({ embeds: [card(interaction.client, gw)], components: [button(gw)] });
  await interaction.followUp({ content: i >= 0 ? 'You left the giveaway.' : '🎉 You\'re in! Good luck!', flags: EPHEMERAL });
}

async function finish(client, gw) {
  const pool = [...gw.entrants];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  gw.winnerIds = pool.slice(0, gw.winners);
  gw.ended = true;
  store.save();
  const channel = await client.channels.fetch(gw.channelId).catch(() => null);
  if (!channel) return;
  const msg = await channel.messages.fetch(gw.messageId).catch(() => null);
  if (msg) await msg.edit({ embeds: [card(client, gw)], components: [button(gw)] });
  const text = gw.winnerIds.length
    ? `🎉 Congrats ${gw.winnerIds.map((id) => `<@${id}>`).join(', ')}! You won **${gw.prize}**! Open a ticket to claim it.`
    : `The giveaway for **${gw.prize}** ended with no entries.`;
  await channel.send({ content: text, allowedMentions: { users: gw.winnerIds } });
}

function startTicker(client) {
  const tick = async () => {
    const due = Object.values(store.get().giveaways).filter((gw) => !gw.ended && gw.endsAt <= Date.now());
    for (const gw of due) await finish(client, gw).catch((e) => console.error('Giveaway end failed:', e));
  };
  tick();
  return setInterval(tick, 15e3);
}

module.exports = { create, enter, startTicker, parseDuration };
