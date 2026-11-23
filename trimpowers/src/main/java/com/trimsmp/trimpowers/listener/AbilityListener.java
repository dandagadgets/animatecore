package com.trimsmp.trimpowers.listener;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerSwapHandItemsEvent;

/**
 * Shift + F (swap hands while sneaking) fires your full-set ability. If you don't have a full set, the key does
 * its normal off-hand swap.
 */
public final class AbilityListener implements Listener {

    private final TrimPowersPlugin plugin;

    public AbilityListener(TrimPowersPlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onSwap(PlayerSwapHandItemsEvent event) {
        Player player = event.getPlayer();
        if (!plugin.settings().sneakSwapTrigger() || !player.isSneaking() || !player.hasPermission("trimpowers.use")) {
            return;
        }
        if (plugin.settings().isDisabled(player.getWorld()) || plugin.powers().setPower(player) == null) {
            return;
        }
        event.setCancelled(true);
        plugin.powers().tryActivate(player, false);
    }
}
