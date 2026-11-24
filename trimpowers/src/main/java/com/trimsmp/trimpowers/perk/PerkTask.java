package com.trimsmp.trimpowers.perk;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.util.Attrs;
import com.trimsmp.trimpowers.util.Fx;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.attribute.AttributeModifier;
import org.bukkit.entity.Player;
import org.bukkit.event.entity.EntityRegainHealthEvent;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.util.Vector;

import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Perks that need to check something continuously: Double Jump, Pathfinder, Ocean's Blessing. */
public final class PerkTask {

    private static final Set<Material> PATHS = EnumSet.of(
            Material.DIRT_PATH, Material.GRAVEL, Material.SAND, Material.RED_SAND, Material.COARSE_DIRT,
            Material.PACKED_MUD, Material.MUD_BRICKS, Material.COBBLESTONE, Material.MOSSY_COBBLESTONE,
            Material.STONE_BRICKS, Material.MOSSY_STONE_BRICKS, Material.CRACKED_STONE_BRICKS, Material.SMOOTH_STONE,
            Material.POLISHED_ANDESITE, Material.POLISHED_DIORITE, Material.POLISHED_GRANITE, Material.BRICKS,
            Material.DEEPSLATE_BRICKS, Material.DEEPSLATE_TILES, Material.POLISHED_DEEPSLATE, Material.POLISHED_BLACKSTONE,
            Material.POLISHED_BLACKSTONE_BRICKS, Material.SANDSTONE, Material.SMOOTH_SANDSTONE, Material.CUT_SANDSTONE,
            Material.RED_SANDSTONE, Material.SMOOTH_RED_SANDSTONE, Material.TUFF_BRICKS, Material.POLISHED_TUFF,
            Material.COBBLESTONE_SLAB, Material.STONE_BRICK_SLAB, Material.SMOOTH_STONE_SLAB);

    private final TrimPowersPlugin plugin;
    private final NamespacedKey pathKey;
    /** Players we turned allowFlight on for (so we never interfere with /fly or creative). */
    private final Set<UUID> doubleJumpArmed = new HashSet<>();
    private final Map<UUID, Long> doubleJumpReadyAt = new HashMap<>();
    private final Set<UUID> pathBoosted = new HashSet<>();
    private BukkitTask task;
    private int tick;

    public PerkTask(TrimPowersPlugin plugin) {
        this.plugin = plugin;
        this.pathKey = new NamespacedKey(plugin, "perk_pathfinder");
    }

    public void start() {
        task = plugin.getServer().getScheduler().runTaskTimer(plugin, this::run, 2L, 2L);
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

    public void forget(Player player) {
        disarm(player);
        doubleJumpReadyAt.remove(player.getUniqueId());
        if (pathBoosted.remove(player.getUniqueId())) {
            Attrs.remove(player, "movement_speed", pathKey);
        }
    }

    private void run() {
        tick += 2;
        for (Player player : plugin.getServer().getOnlinePlayers()) {
            doubleJump(player);
            if (tick % 10 == 0) {
                pathfinder(player);
            }
            if (tick % 20 == 0) {
                oceanBlessing(player);
            }
        }
    }

    // ---- Double Jump ----

    private boolean survivalLike(Player player) {
        return player.getGameMode() == GameMode.SURVIVAL || player.getGameMode() == GameMode.ADVENTURE;
    }

    @SuppressWarnings("deprecation") // Player#isOnGround is client-reported but fine for arming a double jump
    private void doubleJump(Player player) {
        UUID id = player.getUniqueId();
        boolean has = survivalLike(player) && plugin.perks().has(player, Perk.DOUBLE_JUMP);
        if (!has) {
            disarm(player);
            return;
        }
        if (doubleJumpArmed.contains(id)) {
            return;
        }
        if (player.getAllowFlight()) {
            return; // flight granted by something else (/fly etc.) - leave it alone
        }
        if (player.isOnGround() && doubleJumpReadyAt.getOrDefault(id, 0L) <= System.currentTimeMillis()) {
            player.setAllowFlight(true);
            doubleJumpArmed.add(id);
        }
    }

    private void disarm(Player player) {
        if (doubleJumpArmed.remove(player.getUniqueId()) && survivalLike(player)) {
            player.setFlying(false);
            player.setAllowFlight(false);
        }
    }

    /** Called when the player presses jump mid-air. @return true if we used it as a double jump. */
    boolean handleDoubleJump(Player player) {
        if (!doubleJumpArmed.contains(player.getUniqueId()) || !survivalLike(player)) {
            return false;
        }
        PerkParams params = plugin.perks().active(player, Perk.DOUBLE_JUMP);
        disarm(player);
        if (params == null) {
            return true;
        }
        Vector forward = Fx.flat(player.getLocation().getDirection()).multiply(params.d("forward", 0.4));
        player.setVelocity(new Vector(forward.getX(), params.d("power", 0.9), forward.getZ()));
        player.setFallDistance(0);
        doubleJumpReadyAt.put(player.getUniqueId(), System.currentTimeMillis() + (long) (params.d("cooldown", 3) * 1000));
        Location at = player.getLocation();
        Fx.particle(at, Particle.GUST, 1, 0, 0);
        Fx.particle(at, Particle.CLOUD, 8, 0.3, 0.02);
        Fx.sound(at, Sound.ENTITY_BREEZE_JUMP, 0.8f, 1.2f);
        return true;
    }

    // ---- Pathfinder ----

    private void pathfinder(Player player) {
        PerkParams params = plugin.perks().active(player, Perk.PATHFINDER);
        boolean onPath = params != null && player.isOnGround()
                && PATHS.contains(player.getLocation().subtract(0, 0.2, 0).getBlock().getType());
        UUID id = player.getUniqueId();
        if (onPath && pathBoosted.add(id)) {
            Attrs.set(player, "movement_speed", pathKey, params.d("speed-bonus", 0.3), AttributeModifier.Operation.ADD_SCALAR);
        } else if (!onPath && pathBoosted.remove(id)) {
            Attrs.remove(player, "movement_speed", pathKey);
        }
    }

    // ---- Ocean's Blessing ----

    private void oceanBlessing(Player player) {
        PerkParams params = plugin.perks().active(player, Perk.OCEAN_BLESSING);
        if (params == null || player.isDead() || !player.isInWaterOrRainOrBubbleColumn()) {
            return;
        }
        double heal = params.d("heal-per-second", 0.4);
        if (heal > 0 && player.getHealth() < getMaxHealth(player)) {
            player.heal(heal, EntityRegainHealthEvent.RegainReason.MAGIC_REGEN);
            if (tick % 60 == 0) {
                Fx.particle(player.getLocation().add(0, 1.2, 0), Particle.DRIPPING_WATER, 6, 0.3, 0);
            }
        }
    }

    private static double getMaxHealth(Player player) {
        var attribute = Attrs.get("max_health");
        var instance = attribute == null ? null : player.getAttribute(attribute);
        return instance == null ? 20.0 : instance.getValue();
    }
}
