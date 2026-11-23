package com.trimsmp.trimpowers.util;

import org.bukkit.damage.DamageSource;
import org.bukkit.damage.DamageType;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;

/**
 * Deals plugin damage. While plugin damage is being dealt, {@link #isInternal()} is true so listeners don't treat
 * it as a real melee hit (no chain-lightning off chain-lightning, no root procs off a bleed tick, ...).
 */
public final class Damage {

    private static int internalDepth;
    private static int probeDepth;

    private Damage() {
    }

    public static boolean isInternal() {
        return internalDepth > 0;
    }

    /** True while a protection probe event is being fired (see {@link Targets}). */
    public static boolean isProbe() {
        return probeDepth > 0;
    }

    /** Direct ability damage: counts as an attack from the caster (armor applies, kill credit goes to them). */
    public static void ability(LivingEntity target, double amount, Entity source) {
        if (amount <= 0 || target.isDead()) {
            return;
        }
        DamageType type = source instanceof Player ? DamageType.PLAYER_ATTACK : DamageType.MOB_ATTACK;
        deal(target, amount, source, type);
    }

    /** Damage-over-time tick (bleed, soulburn, shocked): bypasses armor, kill credit to the source if known. */
    public static void dot(LivingEntity target, double amount, Entity source) {
        if (amount <= 0 || target.isDead()) {
            return;
        }
        deal(target, amount, source, DamageType.GENERIC);
    }

    private static void deal(LivingEntity target, double amount, Entity source, DamageType type) {
        int previousNoDamageTicks = target.getNoDamageTicks();
        internalDepth++;
        try {
            target.setNoDamageTicks(0);
            if (source != null && source.isValid() && source.getWorld().equals(target.getWorld())) {
                target.damage(amount, DamageSource.builder(type)
                        .withCausingEntity(source)
                        .withDirectEntity(source)
                        .build());
            } else {
                // Attack-type sources need an attacker for their death message; fall back to generic damage.
                target.damage(amount, DamageSource.builder(DamageType.GENERIC).build());
            }
        } finally {
            internalDepth--;
            if (!target.isDead()) {
                target.setNoDamageTicks(previousNoDamageTicks);
            }
        }
    }

    static void probe(Runnable runnable) {
        probeDepth++;
        try {
            runnable.run();
        } finally {
            probeDepth--;
        }
    }
}
