package com.trimsmp.trimpowers.effect;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.entity.Entity;

import java.util.UUID;

/** One custom effect currently running on an entity. */
public final class ActiveEffect {

    private final EffectType type;
    int remaining;
    int duration;
    double potency;
    UUID source;
    int age;

    /** Free numeric state (WARDED: shield health left). */
    public double value;
    /** Free location state (ANCHORED: where Recall returns you). */
    public Location location;
    /** Free flag state (MARKED: whether we turned glowing on ourselves). */
    public boolean flag;

    ActiveEffect(EffectType type, int ticks, double potency, UUID source) {
        this.type = type;
        this.remaining = ticks;
        this.duration = ticks;
        this.potency = potency;
        this.source = source;
    }

    public EffectType type() {
        return type;
    }

    public int remainingTicks() {
        return remaining;
    }

    public int durationTicks() {
        return duration;
    }

    public double potency() {
        return potency;
    }

    public int age() {
        return age;
    }

    /** Whoever applied the effect, if still loaded. */
    public Entity source() {
        return source == null ? null : Bukkit.getEntity(source);
    }
}
