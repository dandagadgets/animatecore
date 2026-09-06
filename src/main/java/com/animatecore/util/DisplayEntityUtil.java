package com.animatecore.util;

import org.bukkit.Location;
import org.bukkit.entity.Display;
import org.bukkit.entity.ItemDisplay;
import org.bukkit.inventory.ItemStack;
import org.joml.AxisAngle4f;
import org.joml.Quaternionf;
import org.joml.Vector3f;

/** Small helpers for spawning and puppeting {@link ItemDisplay} entities used as cinematic/roll actors. */
public final class DisplayEntityUtil {

    private DisplayEntityUtil() {
    }

    public static ItemDisplay spawnItemActor(Location at, ItemStack model, float scale) {
        ItemDisplay display = at.getWorld().spawn(at, ItemDisplay.class, d -> {
            d.setItemStack(model);
            d.setBillboard(Display.Billboard.FIXED);
            d.setPersistent(false);
            d.setInterpolationDuration(2);
            d.setInterpolationDelay(0);
            d.setTeleportDuration(1);
            d.setTransformation(transformation(new Vector3f(0, 0, 0), new Quaternionf(),
                    new Vector3f(scale, scale, scale), new Quaternionf()));
        });
        return display;
    }

    /** Smoothly interpolates the actor to a new pose over the next {@code durationTicks} client ticks. */
    public static void animateTo(ItemDisplay display, Vector3f translation, float pitchDeg, float yawDeg,
                                  float rollDeg, Vector3f scale, int durationTicks) {
        display.setInterpolationDuration(durationTicks);
        display.setInterpolationDelay(0);
        Quaternionf rotation = new Quaternionf()
                .rotateY((float) Math.toRadians(yawDeg))
                .rotateX((float) Math.toRadians(pitchDeg))
                .rotateZ((float) Math.toRadians(rollDeg));
        display.setTransformation(transformation(translation, rotation, scale, new Quaternionf()));
    }

    public static void rotateAxis(ItemDisplay display, Vector3f translation, Vector3f axis, float angleDeg,
                                   Vector3f scale, int durationTicks) {
        display.setInterpolationDuration(durationTicks);
        display.setInterpolationDelay(0);
        Quaternionf rotation = new Quaternionf(new AxisAngle4f((float) Math.toRadians(angleDeg), axis.x, axis.y, axis.z));
        display.setTransformation(transformation(translation, rotation, scale, new Quaternionf()));
    }

    private static org.bukkit.util.Transformation transformation(Vector3f translation, Quaternionf leftRotation,
                                                                   Vector3f scale, Quaternionf rightRotation) {
        return new org.bukkit.util.Transformation(translation, leftRotation, scale, rightRotation);
    }
}
