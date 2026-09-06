package com.animatecore.listeners;

import com.animatecore.AnimateCorePlugin;
import org.bukkit.Particle;
import org.bukkit.SoundCategory;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerItemConsumeEvent;

/**
 * Vanilla already plays the raise-to-mouth eating/drinking loop natively; AnimateCore layers a "bite"
 * flourish onto the moment consumption completes.
 */
public class EatListener implements Listener {

    private final AnimateCorePlugin plugin;

    public EatListener(AnimateCorePlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler(ignoreCancelled = true)
    public void onConsume(PlayerItemConsumeEvent event) {
        if (!plugin.getAnimateConfig().eatingEnabled() || !plugin.getAnimateConfig().biteFxEnabled()) return;

        Player player = event.getPlayer();
        player.getWorld().spawnParticle(Particle.ITEM, player.getEyeLocation().add(
                player.getLocation().getDirection().multiply(0.5)).subtract(0, 0.2, 0),
                10, 0.08, 0.08, 0.08, 0.02, event.getItem());

        if (plugin.getAnimateConfig().customSoundsEnabled()) {
            player.getWorld().playSound(player.getLocation(), "animatecore.action.bite", SoundCategory.PLAYERS, 0.7f, 1.0f);
        }
    }
}
