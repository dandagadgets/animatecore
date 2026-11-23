package com.trimsmp.trimpowers.listener;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.EffectManager;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.util.Attrs;
import com.trimsmp.trimpowers.util.Text;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.event.entity.EntityRegainHealthEvent;
import org.bukkit.event.entity.EntityTargetLivingEntityEvent;
import org.bukkit.event.entity.EntityToggleGlideEvent;
import org.bukkit.event.entity.ProjectileLaunchEvent;
import org.bukkit.event.player.PlayerItemConsumeEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.event.player.PlayerTeleportEvent;

import java.util.Set;

/** Non-damage behaviour of custom effects. */
public final class EffectListener implements Listener {

    private static final Set<String> ESCAPE_TELEPORTS = Set.of("ENDER_PEARL", "CHORUS_FRUIT", "CONSUMABLE_EFFECT");

    private final TrimPowersPlugin plugin;
    private final String namespace;

    public EffectListener(TrimPowersPlugin plugin) {
        this.plugin = plugin;
        this.namespace = new NamespacedKey(plugin, "x").getNamespace();
    }

    private EffectManager effects() {
        return plugin.effects();
    }

    private boolean immobilized(LivingEntity entity) {
        return effects().has(entity, EffectType.STUN) || effects().has(entity, EffectType.ROOTED);
    }

    /** Soulburn halves (configurable) all healing. */
    @EventHandler(ignoreCancelled = true)
    public void onRegain(EntityRegainHealthEvent event) {
        if (event.getEntity() instanceof LivingEntity living && effects().has(living, EffectType.SOULBURN)) {
            double reduction = plugin.settings().effect("soulburn", "healing-reduction", 0.5);
            event.setAmount(event.getAmount() * Math.max(0, 1 - reduction));
        }
    }

    /** Mobs can't lock on to someone in Shadowstep. */
    @EventHandler(ignoreCancelled = true)
    public void onTarget(EntityTargetLivingEntityEvent event) {
        if (event.getTarget() != null && effects().has(event.getTarget(), EffectType.SHADOWSTEP)) {
            event.setCancelled(true);
        }
    }

    /** Stunned or rooted players can't pearl / chorus out. */
    @EventHandler(ignoreCancelled = true)
    public void onTeleport(PlayerTeleportEvent event) {
        if (ESCAPE_TELEPORTS.contains(event.getCause().name()) && immobilized(event.getPlayer())) {
            event.setCancelled(true);
            plugin.hud().flash(event.getPlayer(), Text.mm("<yellow>You can't escape while immobilized!"));
        }
    }

    @EventHandler(ignoreCancelled = true)
    public void onGlide(EntityToggleGlideEvent event) {
        if (event.isGliding() && event.getEntity() instanceof LivingEntity living && immobilized(living)) {
            event.setCancelled(true);
        }
    }

    /** Stunned entities can't shoot or throw anything. */
    @EventHandler(ignoreCancelled = true)
    public void onLaunch(ProjectileLaunchEvent event) {
        if (event.getEntity().getShooter() instanceof LivingEntity shooter && effects().has(shooter, EffectType.STUN)) {
            event.setCancelled(true);
        }
    }

    @EventHandler(ignoreCancelled = true)
    public void onConsume(PlayerItemConsumeEvent event) {
        if (event.getItem().getType() == Material.MILK_BUCKET && plugin.settings().milkCleanses()) {
            Player player = event.getPlayer();
            plugin.getServer().getScheduler().runTask(plugin, () -> {
                if (effects().cleanse(player, true) > 0) {
                    plugin.hud().flash(player, Text.mm("<white>The milk washed away your ailments."));
                }
            });
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onDeath(EntityDeathEvent event) {
        effects().clear(event.getEntity());
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        effects().clear(event.getPlayer());
    }

    @EventHandler
    public void onJoin(PlayerJoinEvent event) {
        Player joined = event.getPlayer();
        Attrs.stripNamespace(joined, namespace);
        for (LivingEntity hidden : effects().entitiesWith(EffectType.SHADOWSTEP)) {
            if (hidden instanceof Player player && !player.equals(joined)) {
                joined.hideEntity(plugin, player);
            }
        }
    }
}
