package com.trimsmp.trimpowers.listener;

import com.destroystokyo.paper.event.player.PlayerArmorChangeEvent;
import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.power.impl.RaiserPower;
import com.trimsmp.trimpowers.power.impl.SilencePower;
import com.trimsmp.trimpowers.power.impl.WayfinderPower;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockReceiveGameEvent;
import org.bukkit.event.entity.FoodLevelChangeEvent;
import org.bukkit.event.player.PlayerChangedWorldEvent;
import org.bukkit.event.player.PlayerExpChangeEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.event.player.PlayerRespawnEvent;

import java.util.concurrent.ThreadLocalRandom;

/** Keeps trim profiles fresh and implements the event-based passives (Wayfinder, Raiser, Silence). */
public final class PassiveListener implements Listener {

    private final TrimPowersPlugin plugin;

    public PassiveListener(TrimPowersPlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onArmorChange(PlayerArmorChangeEvent event) {
        plugin.tracker().refreshLater(event.getPlayer());
    }

    @EventHandler
    public void onJoin(PlayerJoinEvent event) {
        plugin.tracker().refreshLater(event.getPlayer());
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        plugin.tracker().forget(event.getPlayer());
        plugin.hud().forget(event.getPlayer());
    }

    @EventHandler
    public void onRespawn(PlayerRespawnEvent event) {
        // Transient attribute modifiers don't survive respawn; re-apply them.
        plugin.tracker().forget(event.getPlayer());
        plugin.tracker().refreshLater(event.getPlayer());
    }

    @EventHandler
    public void onWorldChange(PlayerChangedWorldEvent event) {
        plugin.tracker().refresh(event.getPlayer());
    }

    /** Wayfinder: chance to not lose hunger. */
    @EventHandler(ignoreCancelled = true)
    public void onHunger(FoodLevelChangeEvent event) {
        if (!(event.getEntity() instanceof Player player) || event.getFoodLevel() >= player.getFoodLevel()) {
            return;
        }
        int pieces = plugin.powers().pieces(player, "wayfinder");
        WayfinderPower wayfinder = plugin.powers().get("wayfinder", WayfinderPower.class);
        if (pieces > 0 && wayfinder != null
                && ThreadLocalRandom.current().nextDouble() < wayfinder.hungerSaveChance(pieces)) {
            event.setCancelled(true);
        }
    }

    /** Raiser: bonus experience (fractions round up randomly so small orbs still benefit). */
    @EventHandler(priority = EventPriority.HIGH)
    public void onExp(PlayerExpChangeEvent event) {
        if (event.getAmount() <= 0) {
            return;
        }
        int pieces = plugin.powers().pieces(event.getPlayer(), "raiser");
        RaiserPower raiser = plugin.powers().get("raiser", RaiserPower.class);
        if (pieces <= 0 || raiser == null) {
            return;
        }
        double boosted = event.getAmount() * (1 + raiser.xpBonus(pieces));
        int whole = (int) Math.floor(boosted);
        if (ThreadLocalRandom.current().nextDouble() < boosted - whole) {
            whole++;
        }
        event.setAmount(whole);
    }

    /** Silence: sculk sensors and shriekers don't hear you. */
    @EventHandler(ignoreCancelled = true)
    public void onSculk(BlockReceiveGameEvent event) {
        if (!(event.getEntity() instanceof Player player)) {
            return;
        }
        SilencePower silence = plugin.powers().get("silence", SilencePower.class);
        int pieces = plugin.powers().pieces(player, "silence");
        if (silence != null && pieces > 0 && pieces >= silence.sculkImmunityPieces()) {
            event.setCancelled(true);
        }
    }
}
