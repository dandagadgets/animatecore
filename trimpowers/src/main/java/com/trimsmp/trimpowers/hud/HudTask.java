package com.trimsmp.trimpowers.hud;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.ActiveEffect;
import com.trimsmp.trimpowers.power.TrimPower;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.JoinConfiguration;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import org.bukkit.NamespacedKey;
import org.bukkit.entity.Player;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.scheduler.BukkitTask;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Action-bar HUD: your ability's cooldown and the custom effects on you. Toggle with /trims hud. */
public final class HudTask {

    private static final long FLASH_MILLIS = 1500;

    private final TrimPowersPlugin plugin;
    private final NamespacedKey hiddenKey;
    private final Map<UUID, Long> flashUntil = new HashMap<>();
    private BukkitTask task;

    public HudTask(TrimPowersPlugin plugin) {
        this.plugin = plugin;
        this.hiddenKey = new NamespacedKey(plugin, "hud_hidden");
    }

    public void start() {
        task = plugin.getServer().getScheduler().runTaskTimer(plugin, this::tick, 10L, 10L);
    }

    public void stop() {
        if (task != null) {
            task.cancel();
            task = null;
        }
    }

    /** Shows a message on the action bar and holds it for a moment before the HUD resumes. */
    public void flash(Player player, Component message) {
        player.sendActionBar(message);
        flashUntil.put(player.getUniqueId(), System.currentTimeMillis() + FLASH_MILLIS);
    }

    public void forget(Player player) {
        flashUntil.remove(player.getUniqueId());
    }

    /** @return true if the HUD is now shown */
    public boolean toggle(Player player) {
        if (player.getPersistentDataContainer().has(hiddenKey, PersistentDataType.BYTE)) {
            player.getPersistentDataContainer().remove(hiddenKey);
            return true;
        }
        player.getPersistentDataContainer().set(hiddenKey, PersistentDataType.BYTE, (byte) 1);
        return false;
    }

    private void tick() {
        if (!plugin.settings().hudEnabled()) {
            return;
        }
        long now = System.currentTimeMillis();
        for (Player player : plugin.getServer().getOnlinePlayers()) {
            if (player.getPersistentDataContainer().has(hiddenKey, PersistentDataType.BYTE)) {
                continue;
            }
            if (flashUntil.getOrDefault(player.getUniqueId(), 0L) > now) {
                continue;
            }
            Component line = build(player);
            if (line != null) {
                player.sendActionBar(line);
            }
        }
    }

    private Component build(Player player) {
        List<Component> parts = new ArrayList<>();
        TrimPower power = plugin.powers().setPower(player);
        if (power != null) {
            long remaining = plugin.powers().remainingMillis(player, power.key());
            Component name = Component.text("✦ " + power.abilityName() + " ", power.color());
            if (remaining > 0) {
                parts.add(name.append(Component.text((remaining + 999) / 1000 + "s", NamedTextColor.GRAY)));
            } else if (plugin.settings().hudShowReady()) {
                parts.add(name.append(Component.text("READY", NamedTextColor.GREEN, TextDecoration.BOLD)));
            }
        }
        for (ActiveEffect effect : plugin.effects().active(player)) {
            int seconds = (effect.remainingTicks() + 19) / 20;
            parts.add(Component.text(effect.type().icon() + " " + effect.type().displayName() + " " + seconds + "s",
                    effect.type().color()));
        }
        if (parts.isEmpty()) {
            return null;
        }
        return Component.join(JoinConfiguration.separator(Component.text("  |  ", NamedTextColor.DARK_GRAY)), parts);
    }
}
