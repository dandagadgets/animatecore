package com.animatecore.fx;

import com.animatecore.AnimateCorePlugin;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.SoundCategory;
import org.bukkit.block.Block;
import org.bukkit.block.data.BlockData;
import org.bukkit.entity.BlockDisplay;
import org.bukkit.util.Transformation;
import org.bukkit.util.Vector;
import org.joml.AxisAngle4f;
import org.joml.Quaternionf;
import org.joml.Vector3f;

import java.util.concurrent.ThreadLocalRandom;

/**
 * Cosmetic impact FX for axe-on-log hits. Deliberately never mutates the real block: flying chip debris
 * is its own short-lived {@link BlockDisplay}, so there is no risk of a shake-and-restore racing against
 * (and resurrecting) a block the player has actually broken.
 */
public class ChoppingFx {

    private final AnimateCorePlugin plugin;

    public ChoppingFx(AnimateCorePlugin plugin) {
        this.plugin = plugin;
    }

    /** Per-swing impact: wood-chip debris + dust puff at the exact spot the axe connected. */
    public void chopImpact(Block block, Vector hitPosition) {
        BlockData data = block.getType().createBlockData();
        Location at = hitPosition != null ? hitPosition.toLocation(block.getWorld()) : block.getLocation().add(0.5, 0.5, 0.5);

        if (plugin.getAnimateConfig().particlesEnabled()) {
            block.getWorld().spawnParticle(Particle.BLOCK, at, 8, 0.15, 0.15, 0.15, data);
        }
        spawnChip(block.getLocation(), data);
    }

    /** Bigger burst when a log is actually felled - see {@code fx.timber-fx} config. */
    public void timberBurst(Block block) {
        Location at = block.getLocation().add(0.5, 0.5, 0.5);
        BlockData data = block.getType().createBlockData();
        block.getWorld().spawnParticle(Particle.BLOCK, at, 20, 0.3, 0.4, 0.3, data);
        block.getWorld().playSound(at, "animatecore.tool.axe.timber", SoundCategory.BLOCKS, 1.0f, 1.0f);
        for (int n = 0; n < 3; n++) {
            spawnChip(block.getLocation(), data);
        }
    }

    private void spawnChip(Location blockLoc, BlockData data) {
        Location spawnAt = blockLoc.clone().add(0.5, 0.5, 0.5);
        BlockDisplay chip = spawnAt.getWorld().spawn(spawnAt, BlockDisplay.class, d -> {
            d.setBlock(data);
            d.setPersistent(false);
            float s = 0.18f;
            d.setTransformation(new Transformation(new Vector3f(-s / 2, -s / 2, -s / 2), new Quaternionf(),
                    new Vector3f(s, s, s), new Quaternionf()));
        });

        ThreadLocalRandom rng = ThreadLocalRandom.current();
        Vector velocity = new Vector(rng.nextDouble(-0.15, 0.15), rng.nextDouble(0.12, 0.22), rng.nextDouble(-0.15, 0.15));
        Vector spinAxis = new Vector(rng.nextDouble(-1, 1), rng.nextDouble(-1, 1), rng.nextDouble(-1, 1)).normalize();
        float spinSpeed = rng.nextFloat(20f, 50f);

        int lifetimeTicks = 14;
        new org.bukkit.scheduler.BukkitRunnable() {
            int tick = 0;

            @Override
            public void run() {
                if (tick >= lifetimeTicks || chip.isDead()) {
                    chip.remove();
                    cancel();
                    return;
                }
                Location next = chip.getLocation().add(velocity);
                velocity.setY(velocity.getY() - 0.02); // gravity
                chip.teleport(next);
                float angle = spinSpeed * (tick + 1);
                Quaternionf rot = new Quaternionf(new AxisAngle4f((float) Math.toRadians(angle),
                        (float) spinAxis.getX(), (float) spinAxis.getY(), (float) spinAxis.getZ()));
                float s = 0.18f;
                chip.setInterpolationDuration(2);
                chip.setInterpolationDelay(0);
                chip.setTransformation(new Transformation(new Vector3f(-s / 2, -s / 2, -s / 2), rot,
                        new Vector3f(s, s, s), new Quaternionf()));
                tick++;
            }
        }.runTaskTimer(plugin, 1L, 1L);
    }
}
