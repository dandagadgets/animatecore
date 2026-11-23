package com.trimsmp.trimpowers.trim;

import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ArmorMeta;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.inventory.meta.trim.ArmorTrim;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Which trim patterns a player is wearing and how many pieces of each.
 *
 * @param counts pattern key ("sentry", "bolt", ...) to number of worn pieces, helmet-first order
 * @param setKey the pattern that has enough pieces to unlock its ability, or null
 */
public record TrimProfile(Map<String, Integer> counts, String setKey) {

    public static final TrimProfile EMPTY = new TrimProfile(Collections.emptyMap(), null);

    public int pieces(String key) {
        return counts.getOrDefault(key, 0);
    }

    public boolean isEmpty() {
        return counts.isEmpty();
    }

    public static TrimProfile scan(Player player, int piecesForAbility) {
        ItemStack[] armor = player.getInventory().getArmorContents(); // boots, legs, chest, helmet
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (int i = armor.length - 1; i >= 0; i--) {
            String key = patternKey(armor[i]);
            if (key != null) {
                counts.merge(key, 1, Integer::sum);
            }
        }
        if (counts.isEmpty()) {
            return EMPTY;
        }
        String setKey = null;
        int best = 0;
        for (Map.Entry<String, Integer> entry : counts.entrySet()) {
            if (entry.getValue() >= piecesForAbility && entry.getValue() > best) {
                best = entry.getValue();
                setKey = entry.getKey();
            }
        }
        return new TrimProfile(Collections.unmodifiableMap(counts), setKey);
    }

    @SuppressWarnings("deprecation") // Keyed#getKey on registry values: fine for vanilla patterns on 1.21.x
    public static String patternKey(ItemStack item) {
        if (item == null || item.getType().isAir() || !item.hasItemMeta()) {
            return null;
        }
        ItemMeta meta = item.getItemMeta();
        if (!(meta instanceof ArmorMeta armorMeta) || !armorMeta.hasTrim()) {
            return null;
        }
        ArmorTrim trim = armorMeta.getTrim();
        if (trim == null) {
            return null;
        }
        try {
            return trim.getPattern().getKey().getKey();
        } catch (RuntimeException ex) {
            return null; // datapack pattern without a resolvable key
        }
    }
}
