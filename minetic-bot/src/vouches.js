// Vouches: a client picks 1–5 stars, writes a short review, and the bot posts it as a branded
// card in the vouches channel. Only people with a delivered order (or the Client role) can vouch.
const {
  ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags,
} = require('discord.js');
const store = require('./store');
const { COLORS, embed, packageByKey } = require('./brand');
const { ordersIn } = require('./orders');

const EPHEMERAL = MessageFlags.Ephemeral;

function delivered(guildId, userId) {
  return ordersIn(guildId)
    .filter((o) => o.userId === userId && o.deliveredAt)
    .sort((a, b) => b.deliveredAt - a.deliveredAt);
}

function canVouch(interaction) {
  const cfg = store.guild(interaction.guildId).config;
  const hasRole = cfg.clientRoleId && interaction.member?.roles?.cache?.has(cfg.clientRoleId);
  return hasRole || delivered(interaction.guildId, interaction.user.id).length > 0;
}

async function start(interaction) {
  const cfg = store.guild(interaction.guildId).config;
  if (!cfg.vouchChannelId) return interaction.reply({ content: '⚙️ An admin needs to run `/setup` first.', flags: EPHEMERAL });
  if (!canVouch(interaction)) {
    return interaction.reply({ content: 'Vouches are for clients. Once your ad is delivered, you can leave one! ⭐', flags: EPHEMERAL });
  }
  const menu = new StringSelectMenuBuilder()
    .setCustomId('vouch:stars')
    .setPlaceholder('How many stars?')
    .addOptions([5, 4, 3, 2, 1].map((n) => ({ label: `${'⭐'.repeat(n)}  ${n}/5`, value: String(n) })));
  await interaction.reply({ content: '**How was your experience?**', components: [new ActionRowBuilder().addComponents(menu)], flags: EPHEMERAL });
}

async function pickStars(interaction) {
  const stars = interaction.values[0];
  const review = new TextInputBuilder()
    .setCustomId('review')
    .setLabel('Your review')
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(5)
    .setMaxLength(500)
    .setPlaceholder('How was the ad? Did it bring in players?')
    .setRequired(true);
  await interaction.showModal(new ModalBuilder()
    .setCustomId(`vouch:form:${stars}`)
    .setTitle(`${'⭐'.repeat(Number(stars))} Leave a vouch`)
    .addComponents(new ActionRowBuilder().addComponents(review)));
}

async function submit(interaction) {
  const g = store.guild(interaction.guildId);
  const stars = Math.min(5, Math.max(1, Number(interaction.customId.split(':')[2]) || 5));
  const text = interaction.fields.getTextInputValue('review').trim();
  const order = delivered(interaction.guildId, interaction.user.id).find((o) => !o.vouched)
    || delivered(interaction.guildId, interaction.user.id)[0];

  const card = embed(interaction.client, COLORS.gold)
    .setAuthor({ name: interaction.member?.displayName || interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
    .setTitle(`${'⭐'.repeat(stars)}  ${stars}/5`)
    .setDescription(`“${text}”`)
    .setFooter({ text: '✅ Verified client • Minetic Media', iconURL: interaction.client.user.displayAvatarURL() });
  if (order) card.addFields({ name: 'Order', value: `${packageByKey(order.package).emoji} ${packageByKey(order.package).label} for **${order.server}**` });

  const channel = await interaction.client.channels.fetch(g.config.vouchChannelId).catch(() => null);
  if (!channel) return interaction.reply({ content: 'Couldn\'t find the vouches channel. Please tell staff!', flags: EPHEMERAL });
  const msg = await channel.send({ embeds: [card] });
  if (order) { order.vouched = true; store.save(); }
  if (g.config.clientRoleId) await interaction.member?.roles.add(g.config.clientRoleId).catch(() => {});
  await interaction.reply({ content: `💛 Thank you! Your vouch is up: ${msg.url}`, flags: EPHEMERAL });
}

module.exports = { start, pickStars, submit };
