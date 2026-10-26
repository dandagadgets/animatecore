# Minetic Bot

The Discord bot for **Minetic Media**. It handles the whole order flow in your server:

- 🎫 **Order an Ad** button → package picker → order form → a **private ticket** with the answers laid out, pinging staff
- 📊 **Order tracker**: `/status` moves an order through 📥 Received → 🎬 In progress → 👀 Preview → ✏️ Revisions → ✅ Delivered
- 🟢 **Live order-status board** that updates itself ("2/5 slots available", open/full/closed, turnaround)
- ⭐ **Vouches**: after delivery the client picks 1–5 stars and writes a review, and the bot posts a branded card and gives them the Client role
- 🔒 **Close ticket** with a transcript saved to your order log
- 👋 **Welcome card** + automatic Member role for new members
- 🎁 **Giveaways** with an Enter button that end on time, even after a restart

Everything uses your cyan-and-gold Minetic Media colours and the bot's avatar as the logo.

## 1. Developer Portal (one time)

1. **Bot** tab → turn on **Server Members Intent** and **Message Content Intent** → Save.
2. **Bot** tab → **Reset Token** → copy it. Keep it secret: anyone with it controls your bot.
3. Invite the bot. Replace `YOUR_APP_ID` with the **Application ID** from the **General Information** tab:

   ```
   https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot%20applications.commands&permissions=268561424
   ```

   This gives it only what it needs: view/send messages, manage channels (tickets), manage roles
   (Client/Member roles), embed links, attach files, read history and manage messages (pins).

## 2. Run it

You need **Node.js 20.12 or newer** on whatever runs the bot.

```sh
cd minetic-bot
npm install
cp .env.example .env      # then open .env and paste your token after DISCORD_TOKEN=
npm start
```

You should see `Logged in as Minetic Bot#…` and `Registered 7 commands in Minetic Media`.

The bot only works while this is running. To keep it online 24/7, run it on a small VPS or a
Discord-bot host (many Minecraft hosts sell these). With [pm2](https://pm2.keymetrics.io/):
`npm i -g pm2 && pm2 start src/index.js --name minetic-bot && pm2 save`.

## 3. Set it up in Discord

1. **Server Settings → Roles**: create **💎 Client** (and **👤 Member** if you want a join role).
   Then drag the bot's role **above** Client and Member, or it can't give those roles.
2. Run **`/setup`** and pick:
   - `tickets_category` → 🎫 TICKETS
   - `order_status` → 📊 order-status
   - `vouches` → ⭐ vouches
   - `order_log` → 📋 order-log (in 🔒 STAFF)
   - `staff_role` → 👑 Founder
   - `client_role` → 💎 Client
   - optional: `welcome` → 💬 general, `member_role` → 👤 Member, `portfolio` → 🎥 portfolio
3. Go to **🎫 order-here** and run **`/panel`**. That posts the Order an Ad button.
4. Delete any status message you typed into **order-status** yourself. The bot posts its own and keeps it updated.
5. Optional: make **⭐ vouches** fully read-only for everyone. The bot posts the vouches itself.

## Commands

| Command | Who | What it does |
|---|---|---|
| `/setup` | Admin | Picks the channels and roles the bot uses |
| `/panel` | Admin | Posts the Order an Ad panel in the current channel |
| `/status stage:` | Staff | Updates the order in this ticket; **Delivered** gives the Client role and asks for a vouch |
| `/slots max: open: turnaround:` | Staff | e.g. `/slots max:3`, `/slots open:false`, `/slots turnaround:3–5 days` |
| `/close` | Staff | Closes this ticket (or use the 🔒 button); a transcript goes to the order log |
| `/vouch` | Clients | Leave a review |
| `/giveaway prize: duration: winners:` | Staff | e.g. `/giveaway prize:1 free Starter ad duration:3d` |

"Staff" means anyone with the staff role from `/setup` or the Manage Server permission.

## Changing things

- **Packages** (names, emojis, descriptions): `PACKAGES` in `src/brand.js`
- **Colours and footer text**: `COLORS` and `TAGLINE` in `src/brand.js`
- **Max open orders per person** (default 2): `MAX_OPEN_PER_USER` in `src/orders.js`

The bot saves everything in `data/store.json`. Back that file up if you move hosts.

## Testing without Discord

`npm run check` runs every flow (order, status, slots, vouch, close, giveaway, welcome) against fake
Discord objects, so you can confirm changes work before restarting the real bot.
