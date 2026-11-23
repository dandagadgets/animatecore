package com.trimsmp.trimpowers.effect;

import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextColor;

import java.util.Locale;

/**
 * The custom status effects. "Potency" means something different per effect - see {@link #potencyMeaning}.
 */
public enum EffectType {

    // Debuffs
    BLEED("Bleed", "♦", NamedTextColor.RED, true, false, 1.0, "damage per tick"),
    STUN("Stun", "✪", NamedTextColor.YELLOW, true, true, 0, "-"),
    ROOTED("Rooted", "⚘", NamedTextColor.GREEN, true, true, 0, "-"),
    FROSTBITE("Frostbite", "❄", NamedTextColor.AQUA, true, false, 0.35, "slow fraction"),
    SHOCKED("Shocked", "⚡", NamedTextColor.YELLOW, true, false, 0.5, "damage per zap"),
    MARKED("Marked", "◎", NamedTextColor.LIGHT_PURPLE, true, false, 0.2, "extra damage taken"),
    SOULBURN("Soulburn", "♨", NamedTextColor.DARK_AQUA, true, false, 1.0, "damage per tick"),
    HEXED("Hexed", "☠", NamedTextColor.DARK_PURPLE, true, false, 0.25, "damage dealt reduction"),

    // Buffs
    WARDED("Warded", "⛨", TextColor.color(0x29dfeb), false, false, 8.0, "shield health"),
    BERSERK("Berserk", "⚔", NamedTextColor.RED, false, false, 0.3, "melee damage bonus"),
    OVERCHARGED("Overcharged", "⚡", NamedTextColor.GOLD, false, false, 3.0, "chain lightning damage"),
    SHADOWSTEP("Shadowstep", "☾", NamedTextColor.GRAY, false, false, 0, "-"),
    CUSHIONED("Cushioned", "☁", NamedTextColor.WHITE, false, false, 0, "-"),
    ANCHORED("Anchored", "⚓", NamedTextColor.AQUA, false, false, 0, "-");

    private final String displayName;
    private final String icon;
    private final TextColor color;
    private final boolean debuff;
    private final boolean crowdControl;
    private final double defaultPotency;
    private final String potencyMeaning;

    EffectType(String displayName, String icon, TextColor color, boolean debuff, boolean crowdControl,
               double defaultPotency, String potencyMeaning) {
        this.displayName = displayName;
        this.icon = icon;
        this.color = color;
        this.debuff = debuff;
        this.crowdControl = crowdControl;
        this.defaultPotency = defaultPotency;
        this.potencyMeaning = potencyMeaning;
    }

    /** Lower-case id used in config and commands ("frostbite"). */
    public String id() {
        return name().toLowerCase(Locale.ROOT);
    }

    public String displayName() {
        return displayName;
    }

    public String icon() {
        return icon;
    }

    public TextColor color() {
        return color;
    }

    public boolean isDebuff() {
        return debuff;
    }

    /** Stun/root style effects that bosses can be immune to. */
    public boolean isCrowdControl() {
        return crowdControl;
    }

    public double defaultPotency() {
        return defaultPotency;
    }

    public String potencyMeaning() {
        return potencyMeaning;
    }

    public static EffectType byId(String id) {
        for (EffectType type : values()) {
            if (type.id().equalsIgnoreCase(id)) {
                return type;
            }
        }
        return null;
    }
}
