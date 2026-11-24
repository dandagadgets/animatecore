package com.trimsmp.trimpowers.util;

import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.Sound;

/** Particle lightning (no real lightning bolts, so no fires, no thunder heard across the map). */
public final class Lightning {

    private static final Color SPARK = Color.fromRGB(0xfff27a);

    private Lightning() {
    }

    /** A jagged arc between two points. */
    public static void arc(Location from, Location to) {
        Fx.zigzag(from, to, 0.3, 0.35, p -> {
            Fx.particle(p, Particle.ELECTRIC_SPARK, 1, 0, 0);
            Fx.dust(p, SPARK, 0.6f, 1, 0);
        });
    }

    /** A bolt from the sky onto a point. */
    public static void strike(Location target) {
        Location top = target.clone().add(0, 7, 0);
        Fx.zigzag(top, target, 0.25, 0.6, p -> {
            Fx.particle(p, Particle.ELECTRIC_SPARK, 2, 0.05, 0);
            Fx.dust(p, SPARK, 1.0f, 1, 0);
        });
        Fx.particle(target, Particle.ELECTRIC_SPARK, 25, 0.4, 0.3);
        Fx.particle(target, Particle.WAX_OFF, 10, 0.4, 0.3);
        Fx.sound(target, Sound.ENTITY_LIGHTNING_BOLT_IMPACT, 0.7f, 1.4f);
    }
}
