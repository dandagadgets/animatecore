package com.animatecore.listeners;

import com.animatecore.AnimateCorePlugin;
import org.bukkit.Particle;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitTask;

/**
 * Vanilla already fully animates the swimming pose; this only adds a cosmetic speed-line bubble trail
 * when a player is swimming and sprinting at the same time, via a lightweight repeating tick.
 */
public class SwimListener {

    private final AnimateCorePlugin plugin;
    private BukkitTask task;

    public SwimListener(AnimateCorePlugin plugin) {
        this.plugin = plugin;
    }

    public void start() {
        task = plugin.getServer().getScheduler().runTaskTimer(plugin, this::tick, 5L, 3L);
    }

    public void stop() {
        if (task != null) task.cancel();
    }

    private void tick() {
        if (!plugin.getAnimateConfig().swimmingEnabled() || !plugin.getAnimateConfig().bubbleTrailEnabled()) return;

        for (Player player : plugin.getServer().getOnlinePlayers()) {
            if (player.isSwimming() && player.isSprinting()) {
                player.getWorld().spawnParticle(Particle.BUBBLE_POP, player.getLocation().add(0, 0.3, 0),
                        4, 0.2, 0.1, 0.2, 0.01);
                player.getWorld().spawnParticle(Particle.SPLASH, player.getLocation().add(0, 0.3, 0),
                        2, 0.15, 0.05, 0.15, 0.01);
            }
        }
    }
}
