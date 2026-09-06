package com.animatecore.util;

import org.bukkit.Location;
import org.bukkit.World;

/** Catmull-Rom spline interpolation used to turn a handful of cinematic keyframes into a smooth camera path. */
public final class MathUtil {

    private MathUtil() {
    }

    /**
     * @param p0..p3 four control points surrounding the segment (clamp the ends by repeating p0/p3)
     * @param t      0..1 position within the p1->p2 segment
     */
    public static Location catmullRom(Location p0, Location p1, Location p2, Location p3, double t) {
        World world = p1.getWorld();
        double t2 = t * t;
        double t3 = t2 * t;

        double x = 0.5 * ((2 * p1.getX()) + (-p0.getX() + p2.getX()) * t
                + (2 * p0.getX() - 5 * p1.getX() + 4 * p2.getX() - p3.getX()) * t2
                + (-p0.getX() + 3 * p1.getX() - 3 * p2.getX() + p3.getX()) * t3);
        double y = 0.5 * ((2 * p1.getY()) + (-p0.getY() + p2.getY()) * t
                + (2 * p0.getY() - 5 * p1.getY() + 4 * p2.getY() - p3.getY()) * t2
                + (-p0.getY() + 3 * p1.getY() - 3 * p2.getY() + p3.getY()) * t3);
        double z = 0.5 * ((2 * p1.getZ()) + (-p0.getZ() + p2.getZ()) * t
                + (2 * p0.getZ() - 5 * p1.getZ() + 4 * p2.getZ() - p3.getZ()) * t2
                + (-p0.getZ() + 3 * p1.getZ() - 3 * p2.getZ() + p3.getZ()) * t3);

        float yaw = (float) lerpAngle(p1.getYaw(), p2.getYaw(), t);
        float pitch = (float) lerp(p1.getPitch(), p2.getPitch(), t);

        return new Location(world, x, y, z, yaw, pitch);
    }

    public static double lerp(double a, double b, double t) {
        return a + (b - a) * t;
    }

    /** Shortest-path angle interpolation so a camera doesn't spin the long way around at the 180/-180 seam. */
    public static double lerpAngle(double a, double b, double t) {
        double diff = ((b - a + 540) % 360) - 180;
        return a + diff * t;
    }
}
