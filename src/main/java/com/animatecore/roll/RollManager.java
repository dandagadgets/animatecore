package com.animatecore.roll;

import com.animatecore.AnimateCorePlugin;
import com.animatecore.items.PropModelData;
import com.animatecore.util.DisplayEntityUtil;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.SoundCategory;
import org.bukkit.entity.ItemDisplay;
import org.bukkit.entity.Player;
import org.bukkit.util.Vector;
import org.joml.Vector3f;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * The dodge-roll ability. See {@link RollTrigger} for why "W + Shift + Ctrl" is implemented as
 * sprint-then-sneak rather than raw key-state reading - Minecraft's network protocol simply never
 * exposes literal held-key state to the server, only toggle events, so this is the truest achievable
 * equivalent without requiring a client-side mod.
 */
public class RollManager {

    private final AnimateCorePlugin plugin;
    private final Map<UUID, Long> lastRoll = new HashMap<>();
    private final Set<UUID> rolling = new HashSet<>();

    public RollManager(AnimateCorePlugin plugin) {
        this.plugin = plugin;
    }

    public boolean isRolling(Player player) {
        return rolling.contains(player.getUniqueId());
    }

    /**
     * @return true if a roll was performed (caller should cancel whatever input event triggered this,
     * e.g. the sneak-toggle, so the player keeps sprinting through the roll instead of crouching).
     */
    public boolean tryRoll(Player player) {
        if (!plugin.getAnimateConfig().rollEnabled()) return false;
        if (!player.hasPermission("animatecore.use")) return false;
        if (isRolling(player)) return false;

        long now = System.currentTimeMillis();
        long cooldown = plugin.getAnimateConfig().rollCooldownMs();
        Long last = lastRoll.get(player.getUniqueId());
        if (last != null && now - last < cooldown) {
            return false;
        }

        if (!player.isOnGround() && !plugin.getAnimateConfig().rollAllowInAir() && !player.isInWater()) {
            return false;
        }
        if (player.isInWater() && !plugin.getAnimateConfig().rollAllowInWater()) {
            return false;
        }
        if (player.getFoodLevel() <= 1 && plugin.getAnimateConfig().rollHungerCost() > 0) {
            return false;
        }

        lastRoll.put(player.getUniqueId(), now);
        performRoll(player);
        return true;
    }

    private void performRoll(Player player) {
        UUID id = player.getUniqueId();
        rolling.add(id);

        // Derived from yaw (always unit-length) rather than getDirection().setY(0).normalize(), which
        // would try to normalize a zero-length vector - and throw - when looking straight up or down.
        float yawRad = (float) Math.toRadians(player.getLocation().getYaw());
        Vector direction = new Vector(-Math.sin(yawRad), 0, Math.cos(yawRad));
        double strength = plugin.getAnimateConfig().rollDashStrength();
        Vector dash = direction.clone().multiply(strength);
        dash.setY(Math.max(player.getVelocity().getY(), 0.12));
        player.setVelocity(dash);

        int iframes = plugin.getAnimateConfig().rollInvulnerabilityTicks();
        if (iframes > 0) {
            player.setNoDamageTicks(Math.max(player.getNoDamageTicks(), iframes));
        }

        float hungerCost = plugin.getAnimateConfig().rollHungerCost();
        if (hungerCost > 0) {
            player.setExhaustion(player.getExhaustion() + hungerCost);
        }

        playRollFx(player, direction);
        spawnRollActor(player, direction);

        int rollDurationTicks = 8;
        plugin.getServer().getScheduler().runTaskLater(plugin, () -> rolling.remove(id), rollDurationTicks);
    }

    private void playRollFx(Player player, Vector direction) {
        Location loc = player.getLocation();
        if (plugin.getAnimateConfig().particlesEnabled()) {
            loc.getWorld().spawnParticle(Particle.CLOUD, loc.clone().add(0, 0.2, 0), 10, 0.3, 0.1, 0.3, 0.02);
            loc.getWorld().spawnParticle(Particle.SWEEP_ATTACK, loc.clone().add(direction.clone().multiply(0.6)).add(0, 0.6, 0), 1, 0, 0, 0, 0);
        }
        if (plugin.getAnimateConfig().customSoundsEnabled()) {
            loc.getWorld().playSound(loc, "animatecore.ability.roll", SoundCategory.PLAYERS, 0.9f, 1.0f);
        } else {
            loc.getWorld().playSound(loc, Sound.ENTITY_PLAYER_ATTACK_SWEEP, SoundCategory.PLAYERS, 0.8f, 1.4f);
        }
    }

    /** Spawns a short-lived motion-blur "streak" actor that spins along the dash path (see roll.bbmodel). */
    private void spawnRollActor(Player player, Vector direction) {
        Location start = player.getLocation().clone().add(0, 1.0, 0);
        ItemDisplay actor = DisplayEntityUtil.spawnItemActor(start, PropModelData.propItem(PropModelData.ROLL_STREAK), 1.0f);

        float yaw = (float) Math.toDegrees(Math.atan2(-direction.getX(), direction.getZ()));
        int ticks = 8;
        new org.bukkit.scheduler.BukkitRunnable() {
            int i = 0;

            @Override
            public void run() {
                if (i >= ticks || actor.isDead() || !player.isOnline()) {
                    actor.remove();
                    cancel();
                    return;
                }
                Location at = player.getLocation().clone().add(0, 1.0, 0);
                actor.teleport(at);
                float spin = (360f / ticks) * (i + 1) * 2;
                DisplayEntityUtil.rotateAxis(actor, new Vector3f(0, 0, 0), new Vector3f(1, 0, 0), spin,
                        new Vector3f(1.1f, 1.1f, 1.1f), 2);
                actor.setRotation(yaw, 0);
                i++;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }
}
