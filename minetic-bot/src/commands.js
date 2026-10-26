// Slash command definitions. They are registered per server when the bot starts, so they show
// up straight away (no hour-long wait for global commands).
const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { STAGES } = require('./brand');

const text = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

const setup = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Tell the bot which channels and roles to use')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption((o) => o.setName('tickets_category').setDescription('Category where order tickets are created').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
  .addChannelOption((o) => o.setName('order_status').setDescription('Channel for the live order-status board').addChannelTypes(...text).setRequired(true))
  .addChannelOption((o) => o.setName('vouches').setDescription('Channel where vouches are posted').addChannelTypes(...text).setRequired(true))
  .addChannelOption((o) => o.setName('order_log').setDescription('Private channel for order logs and transcripts').addChannelTypes(...text).setRequired(true))
  .addRoleOption((o) => o.setName('staff_role').setDescription('Role that handles orders (e.g. Founder)').setRequired(true))
  .addRoleOption((o) => o.setName('client_role').setDescription('Role given to clients after delivery').setRequired(true))
  .addChannelOption((o) => o.setName('welcome').setDescription('Channel for welcome messages (e.g. general)').addChannelTypes(...text))
  .addRoleOption((o) => o.setName('member_role').setDescription('Role given to everyone who joins'))
  .addChannelOption((o) => o.setName('portfolio').setDescription('Your portfolio channel, linked in welcome messages').addChannelTypes(...text));

const panel = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('Post the "Order an Ad" panel in this channel')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

const status = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Update the status of the order in this ticket')
  .addStringOption((o) => o.setName('stage').setDescription('Where the order is at').setRequired(true)
    .addChoices(...['received', 'in_progress', 'preview', 'revisions', 'delivered']
      .map((k) => ({ name: `${STAGES[k].emoji} ${STAGES[k].label}`, value: k }))));

const slots = new SlashCommandBuilder()
  .setName('slots')
  .setDescription('Change order slots, open/close orders, or set the turnaround')
  .addIntegerOption((o) => o.setName('max').setDescription('How many orders you take at once').setMinValue(1).setMaxValue(50))
  .addBooleanOption((o) => o.setName('open').setDescription('Are you taking new orders?'))
  .addStringOption((o) => o.setName('turnaround').setDescription('e.g. "2–4 days"').setMaxLength(40));

const close = new SlashCommandBuilder()
  .setName('close')
  .setDescription('Close this order ticket (saves a transcript to the order log)');

const vouch = new SlashCommandBuilder()
  .setName('vouch')
  .setDescription('Leave a review for your Minetic Media ad');

const giveaway = new SlashCommandBuilder()
  .setName('giveaway')
  .setDescription('Start a giveaway in this channel')
  .addStringOption((o) => o.setName('prize').setDescription('e.g. "1 free Starter ad"').setRequired(true).setMaxLength(100))
  .addStringOption((o) => o.setName('duration').setDescription('e.g. 30m, 12h, 3d').setRequired(true))
  .addIntegerOption((o) => o.setName('winners').setDescription('How many winners (default 1)').setMinValue(1).setMaxValue(10));

module.exports = [setup, panel, status, slots, close, vouch, giveaway];
