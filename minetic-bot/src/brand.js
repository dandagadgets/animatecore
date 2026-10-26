// Minetic Media look and wording: colours, the standard embed, packages and order stages.
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const COLORS = {
  cyan: 0x3fe0e8,
  gold: 0xffc93c,
  green: 0x4ade80,
  amber: 0xffb547,
  red: 0xff5c6c,
};

const TAGLINE = 'Minetic Media • Ads that move players';

function embed(client, color = COLORS.cyan) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: TAGLINE, iconURL: client.user.displayAvatarURL() })
    .setTimestamp();
}

const PACKAGES = [
  { key: 'starter', label: 'Starter', emoji: '⛏️', description: '1 custom ad (15–20s)' },
  { key: 'test', label: 'Test Pack', emoji: '💎', description: '3 unique ads in different styles' },
  { key: 'launch', label: 'Launch Pack', emoji: '🚀', description: '3 ads + thumbnails + a Discord banner' },
  { key: 'custom', label: 'Something custom', emoji: '✨', description: 'Tell us what you need' },
];
const packageByKey = (key) => PACKAGES.find((p) => p.key === key) || PACKAGES[PACKAGES.length - 1];

const STAGES = {
  received: { label: 'Order received', emoji: '📥', step: 1 },
  in_progress: { label: 'In progress', emoji: '🎬', step: 2 },
  preview: { label: 'Preview ready', emoji: '👀', step: 3 },
  revisions: { label: 'Revisions', emoji: '✏️', step: 4 },
  delivered: { label: 'Delivered', emoji: '✅', step: 5 },
  closed: { label: 'Closed', emoji: '🔒', step: 5 },
};
// stages that still take up an order slot
const ACTIVE = ['received', 'in_progress', 'preview', 'revisions'];

const progressBar = (step) => '🟩'.repeat(step) + '⬛'.repeat(5 - step);
const stageLine = (key) => {
  const s = STAGES[key];
  return `${s.emoji} **${s.label}**\n${progressBar(s.step)}`;
};

function isStaff(member, cfg) {
  if (!member) return false;
  if (member.permissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  return Boolean(cfg.staffRoleId && member.roles?.cache?.has(cfg.staffRoleId));
}

module.exports = { COLORS, TAGLINE, embed, PACKAGES, packageByKey, STAGES, ACTIVE, progressBar, stageLine, isStaff };
