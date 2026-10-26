// New members get the Member role (if set) and a branded welcome card in the welcome channel.
const store = require('./store');
const { embed } = require('./brand');

async function onJoin(member) {
  const g = store.guild(member.guild.id);
  const cfg = g.config;
  if (cfg.memberRoleId) await member.roles.add(cfg.memberRoleId).catch((e) => console.warn('Could not give member role:', e.message));
  if (!cfg.welcomeChannelId) return;
  const channel = await member.client.channels.fetch(cfg.welcomeChannelId).catch(() => null);
  if (!channel) return;
  const lines = [
    `Hey ${member}, welcome! ⛏️`,
    '',
    'We make eye-catching video ads that bring players to Minecraft servers.',
    '',
    `🎥 See our work${cfg.portfolioChannelId ? ` in <#${cfg.portfolioChannelId}>` : ''}`,
    `🎫 Order an ad${g.panelChannelId ? ` in <#${g.panelChannelId}>` : ''}`,
  ];
  const card = embed(member.client)
    .setTitle('👋 Welcome to Minetic Media!')
    .setDescription(lines.join('\n'))
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: `Member #${member.guild.memberCount} • Minetic Media`, iconURL: member.client.user.displayAvatarURL() });
  await channel.send({ content: `${member}`, embeds: [card], allowedMentions: { users: [member.id] } });
}

module.exports = { onJoin };
