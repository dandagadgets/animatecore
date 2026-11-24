package com.trimsmp.trimpowers.trim;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Attrs;
import org.bukkit.NamespacedKey;
import org.bukkit.attribute.AttributeModifier;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitTask;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Keeps each player's {@link TrimProfile} up to date and applies the full-set passive bonuses of the trim they wear.
 * Re-scans on armor change and once a second as a safety net.
 */
public final class TrimTracker {

    private final TrimPowersPlugin plugin;
    private final Map<UUID, TrimProfile> profiles = new HashMap<>();
    private final Map<UUID, Map<NamespacedKey, String>> appliedModifiers = new HashMap<>();
    private BukkitTask task;

    public TrimTracker(TrimPowersPlugin plugin) {
        this.plugin = plugin;
    }

    public void start() {
        task = plugin.getServer().getScheduler().runTaskTimer(plugin, () -> {
            for (Player player : plugin.getServer().getOnlinePlayers()) {
                refresh(player);
                passiveTick(player);
            }
        }, 20L, 20L);
    }

    public void stop() {
        if (task != null) {
            task.cancel();
            task = null;
        }
        for (Player player : plugin.getServer().getOnlinePlayers()) {
            forget(player);
        }
    }

    public TrimProfile profile(Player player) {
        TrimProfile profile = profiles.get(player.getUniqueId());
        return profile != null ? profile : refresh(player);
    }

    /** Re-scans the player's armor; re-applies passive attributes if anything changed. */
    public TrimProfile refresh(Player player) {
        TrimProfile now = plugin.settings().isDisabled(player.getWorld())
                ? TrimProfile.EMPTY
                : TrimProfile.scan(player);
        TrimProfile before = profiles.put(player.getUniqueId(), now);
        plugin.potions().apply(player, now);
        if (before == null || !before.counts().equals(now.counts())) {
            applyAttributes(player, now);
            if (before != null && before.setKey() != null && !before.setKey().equals(now.setKey())) {
                TrimPower power = plugin.powers().get(before.setKey());
                if (power != null) {
                    power.clearPassive(player);
                }
            }
        }
        return now;
    }

    /** Next-tick refresh (armor change events fire before the inventory is fully updated). */
    public void refreshLater(Player player) {
        plugin.getServer().getScheduler().runTask(plugin, () -> {
            if (player.isOnline()) {
                refresh(player);
            }
        });
    }

    /** Removes everything this plugin gave the player (on quit / disable). */
    public void forget(Player player) {
        TrimProfile profile = profiles.remove(player.getUniqueId());
        removeAttributes(player);
        plugin.potions().clear(player);
        if (profile != null && profile.setKey() != null) {
            TrimPower power = plugin.powers().get(profile.setKey());
            if (power != null) {
                power.clearPassive(player);
            }
        }
    }

    /** After a config reload: drop and recompute everything. */
    public void resetAll() {
        for (Player player : plugin.getServer().getOnlinePlayers()) {
            forget(player);
            refresh(player);
        }
    }

    private void passiveTick(Player player) {
        TrimProfile profile = profiles.get(player.getUniqueId());
        if (profile == null || player.isDead()) {
            return;
        }
        TrimPower power = plugin.powers().get(profile.setKey());
        if (power != null && power.enabled()) {
            power.passiveTick(player);
        }
    }

    private void applyAttributes(Player player, TrimProfile profile) {
        removeAttributes(player);
        Map<String, Double> sums = new HashMap<>();
        TrimPower power = plugin.powers().get(profile.setKey());
        if (power != null && power.enabled()) {
            power.collectAttributes((attribute, amount, operation) ->
                    sums.merge(attribute + "|" + operation.name(), amount, Double::sum));
        }
        plugin.perks().collectAttributes(profile, (attribute, amount, operation) ->
                sums.merge(attribute + "|" + operation.name(), amount, Double::sum));
        Map<NamespacedKey, String> applied = new HashMap<>();
        for (Map.Entry<String, Double> entry : sums.entrySet()) {
            if (Math.abs(entry.getValue()) < 1.0E-9) {
                continue;
            }
            String[] parts = entry.getKey().split("\\|");
            AttributeModifier.Operation operation = AttributeModifier.Operation.valueOf(parts[1]);
            NamespacedKey key = new NamespacedKey(plugin,
                    "passive_" + parts[0] + "_" + operation.name().toLowerCase(Locale.ROOT));
            Attrs.set(player, parts[0], key, entry.getValue(), operation);
            applied.put(key, parts[0]);
        }
        appliedModifiers.put(player.getUniqueId(), applied);
    }

    private void removeAttributes(Player player) {
        Map<NamespacedKey, String> applied = appliedModifiers.remove(player.getUniqueId());
        if (applied == null) {
            return;
        }
        Set<NamespacedKey> keys = new HashSet<>(applied.keySet());
        for (NamespacedKey key : keys) {
            Attrs.remove(player, applied.get(key), key);
        }
    }
}
