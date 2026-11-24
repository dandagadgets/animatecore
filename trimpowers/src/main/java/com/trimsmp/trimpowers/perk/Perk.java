package com.trimsmp.trimpowers.perk;

import org.bukkit.Material;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Full-set signature passives. Any perk can be put on any trim under {@code powers.<trim>.perks} in config.yml
 * (or toggled in /trims editor); the numbers below are the defaults used when a value isn't set.
 */
public enum Perk {

    WEAPON_DAMAGE("Weapon Mastery", Material.IRON_SWORD, params("sword", 1.5)),
    FALL_DAMAGE("Soft Landing", Material.FEATHER, params("multiplier", 0.5)),
    EXTRA_JUMP("Spring Legs", Material.RABBIT_FOOT, params("blocks", 2.0)),
    OCEAN_BLESSING("Ocean's Blessing", Material.HEART_OF_THE_SEA, params("damage-bonus", 0.25, "heal-per-second", 0.4)),
    UNDERTOW("Undertow", Material.KELP, params("damage-bonus", 0.3, "pull", 0.5)),
    PATHFINDER("Pathfinder", Material.DIRT_PATH, params("speed-bonus", 0.3)),
    NAVIGATOR("Navigator", Material.COMPASS, params()),
    VEIN_MINER("Vein Miner", Material.IRON_PICKAXE, params("max-blocks", 16, "require-sneak", true)),
    AUTO_SMELT("Auto-Smelt", Material.FURNACE, params()),
    PROSPECTOR("Prospector", Material.RAW_GOLD, params("chance", 0.15)),
    WARDENS_CALM("Warden's Calm", Material.SCULK_SHRIEKER, params()),
    DEEP_DARK_SIGHT("Deep Dark Sight", Material.ENDER_EYE, params()),
    SHADOW_CRAWL("Shadow Crawl", Material.LEATHER_BOOTS, params("sneak-speed", 1.0)),
    WISDOM("Wisdom", Material.EXPERIENCE_BOTTLE, params("keep-levels", 0.5)),
    BOUNCE("Bounce", Material.SLIME_BLOCK, params("min-fall", 5.0)),
    XP_HUNTER("XP Hunter", Material.SCULK_CATALYST, params("multiplier", 1.5)),
    LEVEL_POWER("Level Power", Material.ENCHANTING_TABLE, params("per-level", 0.01, "max", 0.3)),
    DOUBLE_JUMP("Double Jump", Material.WIND_CHARGE, params("cooldown", 3.0, "power", 0.9, "forward", 0.4)),
    STATIC_CHARGE("Static Charge", Material.LIGHTNING_ROD, params("chance", 0.15, "damage", 3.0, "shocked-seconds", 2.0)),
    CHAIN_REACTION("Chain Reaction", Material.COPPER_BULB, params("hits", 4, "window-seconds", 4.0, "damage", 3.0, "radius", 5.0));

    private final String displayName;
    private final Material icon;
    private final Map<String, Object> defaults;

    Perk(String displayName, Material icon, Map<String, Object> defaults) {
        this.displayName = displayName;
        this.icon = icon;
        this.defaults = defaults;
    }

    /** Config id: WEAPON_DAMAGE -> "weapon-damage". */
    public String id() {
        return name().toLowerCase(Locale.ROOT).replace('_', '-');
    }

    public String displayName() {
        return displayName;
    }

    public Material icon() {
        return icon;
    }

    public Map<String, Object> defaults() {
        return defaults;
    }

    public static Perk byId(String id) {
        for (Perk perk : values()) {
            if (perk.id().equalsIgnoreCase(id) || perk.name().equalsIgnoreCase(id)) {
                return perk;
            }
        }
        return null;
    }

    /** Plain-English description using the given values (MiniMessage). */
    public String describe(PerkParams p) {
        return switch (this) {
            case WEAPON_DAMAGE -> {
                StringBuilder sb = new StringBuilder();
                for (String weapon : PerkParams.WEAPONS) {
                    double mult = p.d(weapon, 1.0);
                    if (Math.abs(mult - 1.0) > 1.0E-9) {
                        sb.append(sb.isEmpty() ? "" : ", ").append(cap(weapon)).append("s deal <white>")
                                .append(x(mult)).append("</white> damage");
                    }
                }
                yield sb.isEmpty() ? "Weapon damage multipliers (none set)." : sb + ".";
            }
            case FALL_DAMAGE -> "Take <white>" + x(p.d("multiplier", 0.5)) + "</white> fall damage.";
            case EXTRA_JUMP -> "Jump <white>" + n(p.d("blocks", 2)) + "</white> blocks higher (no fall damage from your own jumps).";
            case OCEAN_BLESSING -> "In water or rain: regenerate health and deal <white>+" + pct(p.d("damage-bonus", 0.25)) + "</white> damage.";
            case UNDERTOW -> "Enemies in water take <white>+" + pct(p.d("damage-bonus", 0.3)) + "</white> damage from you and get pulled toward you.";
            case PATHFINDER -> "<white>+" + pct(p.d("speed-bonus", 0.3)) + "</white> speed on paths, gravel, sand and roads.";
            case NAVIGATOR -> "Your coordinates, facing and biome always show in your HUD.";
            case VEIN_MINER -> (p.b("require-sneak", true) ? "Sneak while mining" : "Mining") + " an ore breaks the whole vein (up to <white>"
                    + p.i("max-blocks", 16) + "</white> blocks).";
            case AUTO_SMELT -> "Iron, gold and copper ores drop ingots; ancient debris drops netherite scrap.";
            case PROSPECTOR -> "<white>" + pct(p.d("chance", 0.15)) + "</white> chance for mined ores to drop double.";
            case WARDENS_CALM -> "Wardens never attack you.";
            case DEEP_DARK_SIGHT -> "Immune to Darkness and Blindness.";
            case SHADOW_CRAWL -> "Sneak at <white>" + pct(p.d("sneak-speed", 1.0)) + "</white> walking speed.";
            case WISDOM -> "Keep <white>" + pct(p.d("keep-levels", 0.5)) + "</white> of your XP levels when you die.";
            case BOUNCE -> "Falls of <white>" + n(p.d("min-fall", 5)) + "+</white> blocks bounce you up instead of hurting (sneak to land softly).";
            case XP_HUNTER -> "Mobs you kill drop <white>" + x(p.d("multiplier", 1.5)) + "</white> XP.";
            case LEVEL_POWER -> "<white>+" + pct(p.d("per-level", 0.01)) + "</white> damage per XP level (max <white>+" + pct(p.d("max", 0.3)) + "</white>).";
            case DOUBLE_JUMP -> "Press jump in mid-air to leap again (<white>" + n(p.d("cooldown", 3)) + "s</white> cooldown).";
            case STATIC_CHARGE -> "<white>" + pct(p.d("chance", 0.15)) + "</white> chance that lightning strikes whoever hits you in melee.";
            case CHAIN_REACTION -> "Every <white>" + p.i("hits", 4) + "th</white> hit in a row arcs lightning to a nearby enemy.";
        };
    }

    private static Map<String, Object> params(Object... kv) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i + 1 < kv.length; i += 2) {
            map.put((String) kv[i], kv[i + 1]);
        }
        return map;
    }

    private static String n(double v) {
        return com.trimsmp.trimpowers.util.Text.num(v);
    }

    private static String pct(double v) {
        return com.trimsmp.trimpowers.util.Text.pct(v);
    }

    private static String x(double v) {
        return n(v) + "x";
    }

    private static String cap(String s) {
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
