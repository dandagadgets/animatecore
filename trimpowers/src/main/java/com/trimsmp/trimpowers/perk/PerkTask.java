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
    private final NamespacedKey rushKey;
    private final Map<UUID, Long> rushUntil = new HashMap<>();
    private BukkitTask task;
    private int tick;

    public PerkTask(TrimPowersPlugin plugin) {
        this.plugin = plugin;
        this.pathKey = new NamespacedKey(plugin, "perk_pathfinder");
        this.rushKey = new NamespacedKey(plugin, "perk_spectral_rush");
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
        if (rushUntil.remove(player.getUniqueId()) != null) {
            Attrs.remove(player, "movement_speed", rushKey);
        }
    }

    /** Spectral Rush: a short speed burst after getting hit. */
    void spectralRush(Player player, PerkParams params) {
        Attrs.set(player, "movement_speed", rushKey, params.d("speed-bonus", 0.3), AttributeModifier.Operation.ADD_SCALAR);
        boolean fresh = !rushUntil.containsKey(player.getUniqueId());
        rushUntil.put(player.getUniqueId(), System.currentTimeMillis() + (long) (params.d("seconds", 2) * 1000));
        if (fresh) {
            Fx.particle(player.getLocation().add(0, 1, 0), Particle.WHITE_ASH, 15, 0.4, 0.05);
            Fx.sound(player.getLocation(), Sound.ENTITY_VEX_CHARGE, 0.6f, 1.6f);
        }
    }

    private void run() {
        tick += 2;
        long now = System.currentTimeMillis();
        for (Player player : plugin.getServer().getOnlinePlayers()) {
            doubleJump(player);
            Long rush = rushUntil.get(player.getUniqueId());
            if (rush != null && rush <= now) {
                rushUntil.remove(player.getUniqueId());
                Attrs.remove(player, "movement_speed", rushKey);
            }
            if (tick % 10 == 0) {
                pathfinder(player);
            }
            if (tick % 20 == 0) {
                oceanBlessing(player);
                sunBlessed(player);
                overgrowth(player);
            }
            if (tick % 40 == 0) {
                PerkParams escort = plugin.perks().active(player, Perk.PILLAGER_ESCORT);
                if (escort != null) {
                    plugin.allies().checkPillagerEscort(player, escort);
                }
            }
        }
        if (tick % 10 == 0) {
            truesight();
        }
    }

    // ---- Sun-Blessed & Overgrowth ----

    private void sunBlessed(Player player) {
        PerkParams params = plugin.perks().active(player, Perk.SUN_BLESSED);
        if (params == null || player.isDead() || !player.getWorld().isDayTime() || player.getWorld().hasStorm()
                || player.getLocation().getBlock().getLightFromSky() < 15) {
            return;
        }
        regenerate(player, params.d("heal-per-second", 0.4), Particle.WAX_ON);
    }

    private void overgrowth(Player player) {
        PerkParams params = plugin.perks().active(player, Perk.OVERGROWTH);
        if (params == null || player.isDead()) {
            return;
        }
        Material below = player.getLocation().subtract(0, 0.2, 0).getBlock().getType();
        if (below == Material.GRASS_BLOCK || below == Material.MOSS_BLOCK || below == Material.MOSS_CARPET
                || below == Material.PODZOL || below == Material.ROOTED_DIRT || below == Material.MYCELIUM
                || org.bukkit.Tag.LEAVES.isTagged(below)) {
            regenerate(player, params.d("heal-per-second", 0.4), Particle.HAPPY_VILLAGER);
        }
    }

    private void regenerate(Player player, double amount, Particle particle) {
        if (amount > 0 && player.getHealth() < getMaxHealth(player)) {
            player.heal(amount, EntityRegainHealthEvent.RegainReason.MAGIC_REGEN);
            if (tick % 60 == 0) {
                Fx.particle(player.getLocation().add(0, 1.2, 0), particle, 4, 0.4, 0);
            }
        }
    }

    // ---- Truesight: Shadowstep can't hide players from you ----

    private void truesight() {
        for (var hidden : plugin.effects().entitiesWith(com.trimsmp.trimpowers.effect.EffectType.SHADOWSTEP)) {
            if (!(hidden instanceof Player stepper)) {
                continue;
            }
            for (Player viewer : plugin.getServer().getOnlinePlayers()) {
                if (viewer.equals(stepper)) {
                    continue;
                }
                if (plugin.perks().has(viewer, Perk.TRUESIGHT)) {
                    viewer.showEntity(plugin, stepper);
                } else {
                    viewer.hideEntity(plugin, stepper);
                }
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
