package com.trimsmp.trimpowers.potion;

import org.bukkit.potion.PotionEffectType;

/**
 * A permanent potion effect granted by a trim.
 *
 * @param type   the effect
 * @param level  1-based level (Speed II = 2)
 * @param pieces how many pieces of that trim must be worn (1-4)
 */
public record PotionPassive(PotionEffectType type, int level, int pieces) {

    public int amplifier() {
        return level - 1;
    }
}
