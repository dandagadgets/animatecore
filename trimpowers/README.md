# TrimPowers (Trims SMP)

Armor trims give powers. Every trimmed piece you wear gives that trim's **passive**. Wear **4 pieces with the same
trim** and you unlock its **ability**: press **Sneak + F** (swap hands), or type `/trims ability`.

Abilities apply **custom effects** (Bleed, Stun, Frostbite, Shocked, ...) with their own particles, sounds and
action-bar HUD.

- Paper **1.21.1+**, Java 21. No dependencies.
- Build: `mvn package` in this folder, then copy `target/TrimPowers-1.0.0.jar` into the server's `plugins/` folder.

## The 18 trims

| Trim | Passive (per piece) | Full-set ability |
|---|---|---|
| Sentry | +6% projectile damage | **Volley**: fan of 5 arrows that cause Bleed |
| Dune | +8% knockback resistance | **Sandstorm**: 5s storm that damages and blinds nearby enemies |
| Coast | Faster swimming, more oxygen | **Riptide Surge**: riptide launch without rain, slams enemies in your path |
| Wild | 4% chance on hit to Root | **Entangle**: Roots every enemy within 7 blocks |
| Ward | -3% damage taken | **Bulwark**: 10 HP shield; when it breaks, a sonic pulse knocks enemies back |
| Eye | Night vision (2+ pieces) | **All-Seeing Eye**: Marks enemies within 24 blocks (they glow, take +20% damage) |
| Vex | +4% speed | **Phase Blink**: blink 10 blocks forward and Hex enemies at both ends |
| Tide | +5% damage in water or rain | **Tidal Wave**: wave that sweeps enemies away and gives them Frostbite |
| Snout | +3% melee damage, extra knockback | **Berserk**: +30% melee damage, speed, lifesteal |
| Rib | -25% fire damage, shorter burning | **Hellfire Ring**: expanding soul fire ring that causes Soulburn |
| Spire | -15% fall damage | **Skyward**: launch up and float down; enemies below levitate |
| Wayfinder | 10% chance to not lose hunger | **Recall**: drop an anchor, use again to teleport back (heals, cleanses) |
| Shaper | +5% mining speed | **Earthshatter**: line of erupting rock that Stuns |
| Silence | Faster sneaking; sculk can't hear you (2+) | **Shadowstep**: vanish for 6s; first hit out deals +60% damage and causes Bleed |
| Raiser | +10% XP | **Upheaval**: throws nearby enemies into the air and Stuns them |
| Host | +1 max health | **Soul Siphon**: drains up to 5 enemies and heals you |
| Flow | Safer falls, higher jumps | **Gale Dash**: wind dash that blasts enemies away |
| Bolt | +4% attack speed | **Overcharge**: melee hits chain lightning and Shock enemies |

Every number above is in `config.yml`. Change it, then run `/trims reload`.

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
| `/trims` or `/trims info` | everyone | Your worn trims, passives and ability status |
| `/trims list` | everyone | All 18 powers (hover for details) |
| `/trims ability` | everyone | Use your ability |
| `/trims hud` | everyone | Toggle the action-bar HUD |
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
- **No griefing:** Earthshatter's rocks are display entities. No blocks are ever placed or broken.
- **Crash-safe:** stat bonuses and slows are never saved to player data, so a crash can't leave someone stuck slowed or stunned.
