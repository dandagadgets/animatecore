package com.trimsmp.trimpowers.perk;

import java.util.List;
import java.util.Map;

/** A perk's values from config, falling back to the perk's defaults. */
public final class PerkParams {

    public static final List<String> WEAPONS = List.of("sword", "axe", "mace", "trident", "pickaxe", "bow", "crossbow");

    private final Perk perk;
    private final Map<String, Object> values;

    public PerkParams(Perk perk, Map<String, Object> values) {
        this.perk = perk;
        this.values = values;
    }

    public Perk perk() {
        return perk;
    }

    public Map<String, Object> values() {
        return values;
    }

    private Object raw(String key) {
        Object value = values.get(key);
        if (value != null) {
            return value;
        }
        // Weapon multipliers listed in config replace the defaults entirely (so "axe: 2" doesn't also boost swords).
        if (perk == Perk.WEAPON_DAMAGE && !values.isEmpty()) {
            return null;
        }
        return perk.defaults().get(key);
    }

    public double d(String key, double def) {
        Object value = raw(key);
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return value == null ? def : Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return def;
        }
    }

    public int i(String key, int def) {
        return (int) Math.round(d(key, def));
    }

    public boolean b(String key, boolean def) {
        Object value = raw(key);
        if (value instanceof Boolean bool) {
            return bool;
        }
        return value == null ? def : Boolean.parseBoolean(String.valueOf(value));
    }
}
