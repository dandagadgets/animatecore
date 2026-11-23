package com.trimsmp.trimpowers.power.impl;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.power.AttributeSink;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Fx;
import org.bukkit.Color;
import org.bukkit.FluidCollisionMode;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.attribute.AttributeModifier;
import org.bukkit.block.Block;
import org.bukkit.block.BlockFace;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.util.RayTraceResult;
import org.bukkit.util.Vector;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/** Vex (woodland mansions): quick on your feet, and a short-range blink that hexes enemies. */
public final class VexPower extends TrimPower {

    private static final Color GHOST = Color.fromRGB(0xc7d3e6);

    public VexPower(TrimPowersPlugin plugin) {
        super(plugin, "vex", "Vex", "Phase Blink", 0xA8B5C8);
    }

    @Override
    protected int defaultCooldown() {
        return 10;
    }

    @Override
    public boolean isMobility() {
        return true;
    }

    @Override
    public void collectAttributes(int pieces, AttributeSink sink) {
        sink.add("movement_speed", d("passive.speed-per-piece", 0.04) * pieces, AttributeModifier.Operation.ADD_SCALAR);
    }

    @Override
    public long activate(Player player) {
        double range = d("ability.range", 10);
        Location start = player.getLocation();
        Vector direction = player.getEyeLocation().getDirection().normalize();
        RayTraceResult ray = player.getWorld().rayTraceBlocks(player.getEyeLocation(), direction, range,
                FluidCollisionMode.NEVER, true);
        double distance = ray == null ? range
                : ray.getHitPosition().distance(player.getEyeLocation().toVector()) - 0.6;

        Location destination = null;
        for (double s = distance; s >= 1.5; s -= 0.5) {
            Location candidate = start.clone().add(direction.clone().multiply(s));
            if (safe(candidate)) {
                destination = candidate;
                break;
            }
        }
        if (destination == null) {
            flash(player, "<red>No room to blink!");
            return NO_COOLDOWN;
        }
        destination.setYaw(start.getYaw());
        destination.setPitch(start.getPitch());

        Location from = start.clone().add(0, 1, 0);
        Location to = destination.clone().add(0, 1, 0);
        Fx.line(from, to, 0.4, p -> {
            Fx.dust(p, GHOST, 1.0f, 1, 0.05);
            Fx.particle(p, Particle.WITCH, 1, 0.05, 0);
        });
        Fx.particle(from, Particle.REVERSE_PORTAL, 30, 0.3, 0.05);
        Fx.sound(start, Sound.ENTITY_VEX_CHARGE, 1f, 1.2f);

        Vector velocity = player.getVelocity();
        if (player.isInsideVehicle()) {
            player.leaveVehicle();
        }
        player.teleport(destination);
        player.setVelocity(velocity);
        player.setFallDistance(0);
        effect(player, EffectType.CUSHIONED, 2, 0, player);

        Fx.particle(to, Particle.REVERSE_PORTAL, 30, 0.3, 0.05);
        Fx.sound(destination, Sound.ENTITY_ENDERMAN_TELEPORT, 0.8f, 1.5f);

        double hexRadius = d("ability.hex-radius", 3);
        double hexSeconds = d("ability.hex-seconds", 5);
        double hexPotency = d("ability.hex-strength", 0.25);
        double damage = d("ability.damage", 2);
        Set<UUID> struck = new HashSet<>();
        for (Location point : new Location[]{start, destination}) {
            for (LivingEntity target : enemies(player, point, hexRadius)) {
                if (struck.add(target.getUniqueId())) {
                    hit(player, target, damage);
                    effect(target, EffectType.HEXED, hexSeconds, hexPotency, player);
                }
            }
        }
        return DEFAULT_COOLDOWN;
    }

    private static boolean safe(Location feet) {
        Block block = feet.getBlock();
        Block head = block.getRelative(BlockFace.UP);
        return block.isPassable() && head.isPassable()
                && block.getType() != Material.LAVA && head.getType() != Material.LAVA;
    }

    @Override
    public String passiveText() {
        return "<white>+" + pct(d("passive.speed-per-piece", 0.04)) + "</white> movement speed per piece.";
    }

    @Override
    public String abilityText() {
        return "Blink up to <white>" + n(d("ability.range", 10)) + "</white> blocks forward. Enemies near where you left and where you land are <dark_purple>Hexed</dark_purple> (deal <white>-"
                + pct(d("ability.hex-strength", 0.25)) + "</white> damage).";
    }
}
