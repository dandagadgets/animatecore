package com.animatecore.roll;

import com.animatecore.AnimateCorePlugin;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerToggleSneakEvent;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class RollListener implements Listener {

    private static final long DOUBLE_TAP_WINDOW_MS = 300;

    private final AnimateCorePlugin plugin;
    private final Map<UUID, Long> lastSneakPress = new HashMap<>();

    public RollListener(AnimateCorePlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onToggleSneak(PlayerToggleSneakEvent event) {
        if (!event.isSneaking()) {
            return; // Only the press (start-sneaking) edge can start a roll.
        }
        Player player = event.getPlayer();
        RollTrigger trigger = plugin.getAnimateConfig().rollTrigger();

        if (trigger == RollTrigger.SPRINT_THEN_SNEAK) {
            if (player.isSprinting()) {
                if (plugin.getRollManager().tryRoll(player)) {
                    event.setCancelled(true); // stay sprinting instead of crouching
                }
            }
            return;
        }

        // DOUBLE_TAP_SNEAK
        long now = System.currentTimeMillis();
        Long last = lastSneakPress.put(player.getUniqueId(), now);
        if (last != null && now - last <= DOUBLE_TAP_WINDOW_MS) {
            if (plugin.getRollManager().tryRoll(player)) {
                event.setCancelled(true);
                lastSneakPress.remove(player.getUniqueId());
            }
        }
    }
}
