package com.trimsmp.trimpowers.potion;

import org.bukkit.potion.PotionEffectType;

/**
 * A permanent potion effect granted while wearing a trim's full set.
 *
 * @param type  the effect
 * @param level 1-based level (Speed II = 2)
 */
public record PotionPassive(PotionEffectType type, int level) {

    public int amplifier() {
        return level - 1;
    }
}
