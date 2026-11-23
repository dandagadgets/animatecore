package com.trimsmp.trimpowers.util;

import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.SoundCategory;
import org.bukkit.block.data.BlockData;
import org.bukkit.util.Vector;

import java.util.function.Consumer;

/** Small particle and sound helpers used by the abilities and effects. */
public final class Fx {

    private Fx() {
    }

    public static void particle(Location at, Particle particle, int count, double spread, double speed) {
        at.getWorld().spawnParticle(particle, at, count, spread, spread, spread, speed);
    }

    public static void particle(Location at, Particle particle, int count, double dx, double dy, double dz, double speed) {
        at.getWorld().spawnParticle(particle, at, count, dx, dy, dz, speed);
    }

    public static void dust(Location at, Color color, float size, int count, double spread) {
        at.getWorld().spawnParticle(Particle.DUST, at, count, spread, spread, spread, 0,
                new Particle.DustOptions(color, size));
    }

    public static void block(Location at, Particle particle, BlockData data, int count, double spread) {
        at.getWorld().spawnParticle(particle, at, count, spread, spread, spread, 0, data);
    }

    public static void sound(Location at, Sound sound, float volume, float pitch) {
        at.getWorld().playSound(at, sound, SoundCategory.PLAYERS, volume, pitch);
    }

    /** Calls {@code action} for evenly spaced points on a horizontal circle. */
    public static void ring(Location center, double radius, int points, Consumer<Location> action) {
        for (int i = 0; i < points; i++) {
            double angle = 2 * Math.PI * i / points;
            action.accept(center.clone().add(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
        }
    }

    /** Calls {@code action} for points every {@code step} blocks from {@code from} to {@code to}. */
    public static void line(Location from, Location to, double step, Consumer<Location> action) {
        Vector delta = to.toVector().subtract(from.toVector());
        double length = delta.length();
        if (length < 1.0E-4) {
            action.accept(from.clone());
            return;
        }
        Vector unit = delta.multiply(1.0 / length);
        for (double d = 0; d <= length; d += step) {
            action.accept(from.clone().add(unit.clone().multiply(d)));
        }
    }

    /** A jagged "lightning" line: the straight line with random sideways jitter. */
    public static void zigzag(Location from, Location to, double step, double jitter, Consumer<Location> action) {
        line(from, to, step, point -> action.accept(point.add(
                (Math.random() - 0.5) * jitter, (Math.random() - 0.5) * jitter, (Math.random() - 0.5) * jitter)));
    }

    /** Random points on a sphere surface. */
    public static void sphere(Location center, double radius, int points, Consumer<Location> action) {
        for (int i = 0; i < points; i++) {
            Vector v = new Vector(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
            if (v.lengthSquared() < 1.0E-4) {
                continue;
            }
            action.accept(center.clone().add(v.normalize().multiply(radius)));
        }
    }

    /** Horizontal, normalized version of a direction (falls back to +Z if looking straight up/down). */
    public static Vector flat(Vector direction) {
        Vector flat = direction.clone().setY(0);
        return flat.lengthSquared() < 1.0E-4 ? new Vector(0, 0, 1) : flat.normalize();
    }
}
