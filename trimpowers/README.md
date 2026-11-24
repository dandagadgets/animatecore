# TrimPowers (Trims SMP)

Armor trims give powers, but **only as a full set**: wear all 4 armor pieces with the same trim and you unlock
everything that trim has. Fewer pieces give nothing.

A full set gives:

1. **Passive:** the trim's built-in bonus.
2. **Permanent potion effects:** e.g. Speed or Haste. You choose them.
3. **Signature passives:** special perks like Double Jump or Vein Miner. You choose them.
4. **Ability:** press **Sneak + F** (swap hands) or type `/trims ability`.

Abilities apply **custom effects** (Bleed, Stun, Frostbite, Shocked, ...) with their own particles, sounds and
action-bar HUD.

- Paper **1.21.1+**, Java 21. No dependencies.
- Build: `mvn package` in this folder, then copy `target/TrimPowers-1.0.0.jar` into the server's `plugins/` folder.
- **Choosing potions and passives:** run `/trims editor` in-game (admins). Click a trim, then pick its potion
  effects and signature passives. Every click saves to `config.yml` and applies instantly.

## The 18 trims (default setup, full set only)

| Trim | Passive | Potions | Signature passives | Ability |
|---|---|---|---|---|
| Sentry | +24% projectile damage | Hero of the Village | – | **Volley**: 5 bleeding arrows |
| Dune | +32% knockback resistance | Fire Resistance | – | **Sandstorm**: damages and blinds |
| Coast | +40% swim speed, more oxygen | Conduit Power, Dolphin's Grace | Undertow | **Riptide Surge** |
| Wild | 16% chance on hit to Root | Health Boost | – | **Entangle**: root enemies |
| Ward | -12% damage taken | – | Swords deal 1.5x | **Bulwark**: shield + sonic pulse |
| Eye | +2 block reach | Night Vision | – | **All-Seeing Eye**: mark enemies |
| Vex | +16% speed | Speed | – | **Phase Blink**: teleport + hex |
| Tide | +20% damage when wet | – | Ocean's Blessing | **Tidal Wave**: frostbite wave |
| Snout | +12% melee damage, knockback | Haste | – | **Berserk**: damage + lifesteal |
| Rib | Immune to fire and lava | Resistance | Half fall damage | **Hellfire Ring**: soulburn |
| Spire | -60% fall damage | Regeneration | Jump 2 blocks higher | **Skyward**: launch + levitate |
| Wayfinder | 40% chance to not lose hunger | – | Pathfinder, Navigator | **Recall**: anchor teleport |
| Shaper | +20% mining speed | – | Vein Miner, Auto-Smelt, Prospector | **Earthshatter**: rock line + stun |
| Silence | +60% sneak speed, sculk-proof | – | Warden's Calm, Deep Dark Sight, Shadow Crawl | **Shadowstep**: vanish + invisibility |
| Raiser | +40% XP | – | Wisdom, Bounce, XP Hunter, Level Power | **Upheaval**: knock-up + stun |
| Host | +2 hearts max health | Regeneration | – | **Soul Siphon**: drain + heal |
| Flow | Safer falls, higher jumps | Speed | Double Jump | **Gale Dash**: wind dash |
| Bolt | +16% attack speed | – | Static Charge, Chain Reaction | **Overcharge**: chain lightning |

Every number is in `config.yml`. Change it, then run `/trims reload`. You can also use `/trims editor` for potions and passives.

## Signature passives

Any passive can go on any trim, either in `/trims editor` or under `powers.<trim>.perks` in `config.yml`.

| Passive | Config id | What it does |
|---|---|---|
| Weapon Mastery | `weapon-damage` | Damage multipliers per weapon: `sword`, `axe`, `mace`, `trident`, `pickaxe`, `bow`, `crossbow` |
| Soft Landing | `fall-damage` | Fall damage multiplier (0.5 = half) |
| Spring Legs | `extra-jump` | Jump N blocks higher, with no fall damage from those jumps |
| Ocean's Blessing | `ocean-blessing` | In water or rain: regenerate health and deal +25% damage |
| Undertow | `undertow` | Enemies in water take +30% damage and get pulled toward you |
| Pathfinder | `pathfinder` | +30% speed on paths, gravel, sand and roads |
| Navigator | `navigator` | Coordinates, facing and biome in your HUD |
| Vein Miner | `vein-miner` | Sneak-mine an ore to break the whole vein (up to 16 blocks) |
| Auto-Smelt | `auto-smelt` | Raw iron/gold/copper drop ingots; ancient debris drops netherite scrap |
| Prospector | `prospector` | 15% chance for ores to drop double (never with silk touch) |
| Warden's Calm | `wardens-calm` | Wardens never attack you |
| Deep Dark Sight | `deep-dark-sight` | Immune to Darkness and Blindness |
| Shadow Crawl | `shadow-crawl` | Sneak at full walking speed |
| Wisdom | `wisdom` | Keep half your XP levels on death |
| Bounce | `bounce` | Falls of 5+ blocks bounce you up instead of hurting (sneak to land softly) |
| XP Hunter | `xp-hunter` | Mobs you kill drop 1.5x XP |
| Level Power | `level-power` | +1% damage per XP level (max +30%) |
| Double Jump | `double-jump` | Jump again in mid-air (3s cooldown) |
| Static Charge | `static-charge` | 15% chance lightning strikes whoever hits you |
| Chain Reaction | `chain-reaction` | Every 4th hit in a row arcs lightning to a nearby enemy |

## Custom effects

| Effect | What it does |
|---|---|
| Bleed | Damage every second |
| Stun | Can't move, jump, attack, shoot, pearl or use abilities |
| Rooted | Can't move, jump, pearl or use movement abilities (can still fight) |
| Frostbite | Slowed, frozen screen overlay |
| Shocked | Periodic zaps that interrupt eating, blocking and bows |
| Marked | Glowing, takes extra damage from everything |
| Soulburn | Damage over time that ignores fire resistance, halves healing |
| Hexed | Deals less damage |
| Warded | Damage shield (Ward ability) |
| Berserk | More melee damage, speed, lifesteal |
| Overcharged | Melee hits chain lightning |
| Shadowstep | Invisible to players (hidden from the tab list too) and ignored by mobs |
| Cushioned | No fall damage |
| Anchored | Your Recall point |

Milk clears custom debuffs (configurable). Bosses (Wither, Ender Dragon, Warden, Elder Guardian) are immune to Stun and Root.

## Commands

| Command | Who | What |
|---|---|---|
| `/trims` or `/trims info` | everyone | Your full set's passive, potions, signature passives and ability |
| `/trims list` | everyone | All 18 trims (hover for details) |
| `/trims ability` | everyone | Use your ability |
| `/trims hud` | everyone | Toggle the action-bar HUD |
| `/trims editor` | admin | Menu to choose each trim's potions and signature passives |
| `/trims potion <trim> add <effect> [level]` | admin | Give a trim a permanent potion (also `remove`, `clear`, `list`) |
| `/trims perk <trim> add <passive>` | admin | Give a trim a signature passive (also `remove`, `list`) |
| `/trims give <pattern> [material] [player]` | admin | Full trimmed netherite set for testing |
| `/trims effect <player> <effect> <seconds> [potency]` | admin | Apply a custom effect |
| `/trims cleanse [player]` | admin | Remove all custom effects |
| `/trims resetcd [player]` | admin | Reset ability cooldowns |
| `/trims reload` | admin | Reload `config.yml` |

Permissions: `trimpowers.use` (everyone by default) and `trimpowers.admin` (ops by default).

## Server notes

- **PvP and protection:** abilities only hit players when world PvP is on, and never hit teammates with friendly
  fire off. With `respect-protection: true`, protection plugins (WorldGuard, GriefPrevention, ...) are asked before
  any ability touches someone. Pets, animals and villagers are safe by default (`targets.other-mobs: false`).
- **Potions are safe to remove:** trim potions only last while you wear the full set. The plugin remembers which effects
  it gave, so it never removes a potion you drank or a beacon effect, and leftovers are cleaned up even after a crash.
- **Double Jump** works by briefly allowing flight, so it can trip some anti-cheat plugins. It never touches
  players who already have `/fly` or creative.
- **No griefing:** Earthshatter's rocks are display entities, and Vein Miner breaks blocks exactly as if the player
  mined them (protection plugins and tool durability apply).
- **Crash-safe:** stat bonuses and slows are never saved to player data, so a crash can't leave someone stuck slowed or stunned.
