package com.trimsmp.trimpowers.effect;

import com.trimsmp.trimpowers.Settings;
import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.util.Attrs;
import com.trimsmp.trimpowers.util.Damage;
import com.trimsmp.trimpowers.util.Fx;
import com.trimsmp.trimpowers.util.Targets;
import com.trimsmp.trimpowers.util.Text;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.attribute.AttributeModifier;
import org.bukkit.block.data.BlockData;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Mob;
import org.bukkit.entity.Player;
import org.bukkit.util.Vector;

import java.util.concurrent.ThreadLocalRandom;

/** What each custom effect actually does: on apply, every tick, and on removal. */
final class EffectBehaviors {

    enum Reason { EXPIRED, REMOVED, CLEANSED, CLEARED, BROKEN }

    private static final Color BLOOD = Color.fromRGB(0x8a0303);
    private static final Color STAR = Color.fromRGB(0xffe14d);
    private static final Color VINE = Color.fromRGB(0x3f7d2b);
    private static final Color EYE = Color.fromRGB(0xb26bff);
    private static final Color RAGE = Color.fromRGB(0xc4161c);
    private static final Color SCULK = Color.fromRGB(0x0f5a63);

    private final TrimPowersPlugin plugin;
    private final BlockData vineData = Material.VINE.createBlockData();
    private final BlockData bloodData = Material.REDSTONE_BLOCK.createBlockData();

    EffectBehaviors(TrimPowersPlugin plugin) {
        this.plugin = plugin;
    }

    private NamespacedKey key(EffectType type, String what) {
        return new NamespacedKey(plugin, "fx_" + type.id() + "_" + what);
    }

    private Settings settings() {
        return plugin.settings();
    }

    void onApply(LivingEntity e, ActiveEffect fx) {
        Location loc = e.getLocation();
        switch (fx.type()) {
            case STUN, ROOTED -> {
                Attrs.set(e, "movement_speed", key(fx.type(), "speed"), -1.0, AttributeModifier.Operation.MULTIPLY_SCALAR_1);
                Attrs.set(e, "jump_strength", key(fx.type(), "jump"), -1.0, AttributeModifier.Operation.MULTIPLY_SCALAR_1);
                Vector v = e.getVelocity();
                e.setVelocity(new Vector(0, Math.min(v.getY(), 0), 0));
                if (e instanceof Player player && player.isGliding()) {
                    player.setGliding(false);
                }
                if (e instanceof Mob mob) {
                    mob.getPathfinder().stopPathfinding();
                }
                if (fx.type() == EffectType.STUN) {
                    Fx.sound(loc, Sound.BLOCK_ANVIL_LAND, 0.35f, 1.9f);
                    Fx.particle(loc.clone().add(0, e.getHeight(), 0), Particle.FIREWORK, 8, 0.2, 0.05);
                } else {
                    Fx.sound(loc, Sound.BLOCK_CAVE_VINES_PLACE, 1f, 0.7f);
                    Fx.block(loc.clone().add(0, 0.3, 0), Particle.BLOCK, vineData, 25, 0.4);
                }
            }
            case FROSTBITE -> {
                Attrs.set(e, "movement_speed", key(fx.type(), "speed"), -Math.min(0.95, fx.potency()),
                        AttributeModifier.Operation.MULTIPLY_SCALAR_1);
                Fx.sound(loc, Sound.ENTITY_PLAYER_HURT_FREEZE, 0.8f, 1.2f);
                Fx.particle(loc.clone().add(0, e.getHeight() / 2, 0), Particle.SNOWFLAKE, 20, 0.35, 0.02);
            }
            case MARKED -> {
                if (settings().effectFlag("marked", "glow", true) && !e.isGlowing()) {
                    e.setGlowing(true);
                    fx.flag = true;
                }
            }
            case WARDED -> {
                fx.value = fx.potency();
                Fx.sound(loc, Sound.BLOCK_SCULK_CATALYST_BLOOM, 1f, 1.2f);
            }
            case BERSERK -> Attrs.set(e, "movement_speed", key(fx.type(), "speed"),
                    settings().effect("berserk", "speed-bonus", 0.10), AttributeModifier.Operation.MULTIPLY_SCALAR_1);
            case SHADOWSTEP -> {
                if (e instanceof Player player) {
                    for (Player other : plugin.getServer().getOnlinePlayers()) {
                        if (!other.equals(player)) {
                            other.hideEntity(plugin, player);
                        }
                    }
                }
                for (Entity near : e.getNearbyEntities(32, 16, 32)) {
                    if (near instanceof Mob mob && e.equals(mob.getTarget())) {
                        mob.setTarget(null);
                    }
                }
            }
            default -> {
            }
        }
    }

    void onRefresh(LivingEntity e, ActiveEffect fx) {
        if (fx.type() == EffectType.FROSTBITE) {
            Attrs.set(e, "movement_speed", key(fx.type(), "speed"), -Math.min(0.95, fx.potency()),
                    AttributeModifier.Operation.MULTIPLY_SCALAR_1);
        }
    }

    void onTick(LivingEntity e, ActiveEffect fx) {
        int age = fx.age();
        Location loc = e.getLocation();
        double height = e.getHeight();
        switch (fx.type()) {
            case BLEED -> {
                int interval = (int) Math.max(1, settings().effect("bleed", "interval-ticks", 20));
                if (age % interval == 0) {
                    Damage.dot(e, fx.potency(), fx.source());
                    Fx.block(loc.clone().add(0, height * 0.6, 0), Particle.BLOCK, bloodData, 10, 0.2);
                }
                if (age % 4 == 0) {
                    Fx.dust(loc.clone().add(0, height * 0.55, 0), BLOOD, 1.1f, 3, 0.25);
                }
            }
            case STUN -> {
                if (age % 2 == 0) {
                    double angle = age * 0.45;
                    Location head = loc.clone().add(0, height + 0.25, 0);
                    for (int i = 0; i < 3; i++) {
                        double a = angle + i * (2 * Math.PI / 3);
                        Fx.dust(head.clone().add(Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45), STAR, 0.9f, 1, 0);
                    }
                }
                if (age % 10 == 0) {
                    Fx.particle(loc.clone().add(0, height + 0.25, 0), Particle.ELECTRIC_SPARK, 3, 0.25, 0);
                }
            }
            case ROOTED -> {
                if (age % 5 == 0) {
                    Fx.ring(loc.clone().add(0, 0.1, 0), 0.55, 6, p -> Fx.dust(p, VINE, 1.2f, 1, 0.02));
                    Fx.block(loc.clone().add(0, 0.4, 0), Particle.BLOCK, vineData, 3, 0.25);
                }
            }
            case FROSTBITE -> {
                if (settings().effectFlag("frostbite", "freeze-visual", true)) {
                    int target = Math.min(e.getMaxFreezeTicks() - 1, 120);
                    if (e.getFreezeTicks() < target) {
                        e.setFreezeTicks(target);
                    }
                }
                if (age % 4 == 0) {
                    Fx.particle(loc.clone().add(0, height * 0.6, 0), Particle.SNOWFLAKE, 2, 0.3, 0.01);
                }
            }
            case SHOCKED -> {
                int interval = (int) Math.max(1, settings().effect("shocked", "interval-ticks", 15));
                if (age % interval == 0) {
                    Damage.dot(e, fx.potency(), fx.source());
                    Fx.particle(loc.clone().add(0, height / 2, 0), Particle.ELECTRIC_SPARK, 14, 0.3, 0.1);
                    Fx.sound(loc, Sound.BLOCK_REDSTONE_TORCH_BURNOUT, 0.5f, 1.8f);
                    ThreadLocalRandom r = ThreadLocalRandom.current();
                    e.setVelocity(e.getVelocity().add(new Vector(r.nextDouble(-0.15, 0.15), 0.08, r.nextDouble(-0.15, 0.15))));
                    if (e instanceof Player player && settings().effectFlag("shocked", "interrupt-items", true)) {
                        player.clearActiveItem();
                    }
                } else if (age % 3 == 0) {
                    Fx.particle(loc.clone().add(0, height / 2, 0), Particle.ELECTRIC_SPARK, 1, 0.3, 0.02);
                }
            }
            case MARKED -> {
                if (age % 8 == 0) {
                    Location above = loc.clone().add(0, height + 0.45, 0);
                    Fx.ring(above, 0.25, 8, p -> Fx.dust(p, EYE, 0.7f, 1, 0));
                    Fx.dust(above, Color.BLACK, 0.8f, 1, 0);
                }
            }
            case SOULBURN -> {
                int interval = (int) Math.max(1, settings().effect("soulburn", "interval-ticks", 20));
                if (age % interval == 0) {
                    Damage.dot(e, fx.potency(), fx.source());
                    Fx.sound(loc, Sound.ENTITY_GENERIC_BURN, 0.4f, 0.7f);
                }
                if (age % 3 == 0) {
                    Fx.particle(loc.clone().add(0, height * 0.4, 0), Particle.SOUL_FIRE_FLAME, 2, 0.25, 0.02);
                }
            }
            case HEXED -> {
                if (age % 6 == 0) {
                    Fx.particle(loc.clone().add(0, height * 0.7, 0), Particle.WITCH, 2, 0.3, 0);
                }
            }
            case WARDED -> {
                if (age % 2 == 0) {
                    double a = age * 0.3;
                    Location chest = loc.clone().add(0, height * 0.55, 0);
                    for (int i = 0; i < 2; i++) {
                        double ai = a + i * Math.PI;
                        Fx.dust(chest.clone().add(Math.cos(ai) * 0.8, Math.sin(a * 0.7) * 0.4, Math.sin(ai) * 0.8), SCULK, 1.0f, 1, 0);
                    }
                }
                if (age % 15 == 0) {
                    Fx.particle(loc.clone().add(0, height * 0.5, 0), Particle.SCULK_SOUL, 1, 0.4, 0.01);
                }
            }
            case BERSERK -> {
                if (age % 4 == 0) {
                    Fx.dust(loc.clone().add(0, height * 0.5, 0), RAGE, 1.3f, 2, 0.35);
                }
                if (age % 20 == 0) {
                    Fx.particle(loc.clone().add(0, height + 0.3, 0), Particle.ANGRY_VILLAGER, 1, 0.2, 0);
                }
            }
            case OVERCHARGED -> {
                if (age % 3 == 0) {
                    Fx.particle(loc.clone().add(0, height * 0.5, 0), Particle.ELECTRIC_SPARK, 3, 0.4, 0.05);
                }
            }
            case SHADOWSTEP -> {
                if (e instanceof Player player && age % 5 == 0) {
                    // Only the vanished player sees these, so they know they're hidden.
                    player.spawnParticle(Particle.SCULK_SOUL, loc.clone().add(0, 0.2, 0), 1, 0.3, 0.1, 0.3, 0);
                }
            }
            case CUSHIONED -> {
                if (age % 3 == 0 && e.getFallDistance() > 1.5f) {
                    Fx.particle(loc, Particle.CLOUD, 2, 0.2, 0.01);
                }
            }
            case ANCHORED -> {
                Location anchor = fx.location;
                if (anchor != null && anchor.getWorld() != null && age % 4 == 0) {
                    double rise = (age % 40) / 20.0;
                    Fx.particle(anchor.clone().add(0, rise, 0), Particle.END_ROD, 1, 0.05, 0.0);
                    if (age % 20 == 0) {
                        Fx.ring(anchor.clone().add(0, 0.1, 0), 0.7, 12, p -> Fx.particle(p, Particle.WAX_ON, 1, 0, 0));
                    }
                }
                if (fx.remainingTicks() == 60 && e instanceof Player player) {
                    player.playSound(player.getLocation(), Sound.BLOCK_NOTE_BLOCK_PLING, 0.6f, 0.8f);
                }
            }
        }
    }

    void onRemove(LivingEntity e, ActiveEffect fx, Reason reason) {
        switch (fx.type()) {
            case STUN, ROOTED -> {
                Attrs.remove(e, "movement_speed", key(fx.type(), "speed"));
                Attrs.remove(e, "jump_strength", key(fx.type(), "jump"));
            }
            case FROSTBITE -> {
                Attrs.remove(e, "movement_speed", key(fx.type(), "speed"));
                if (e.isValid() && e.getFreezeTicks() <= 140) {
                    e.setFreezeTicks(0);
                }
            }
            case MARKED -> {
                if (fx.flag) {
                    e.setGlowing(false);
                }
            }
            case BERSERK -> Attrs.remove(e, "movement_speed", key(fx.type(), "speed"));
            case SHADOWSTEP -> {
                if (e instanceof Player player) {
                    for (Player other : plugin.getServer().getOnlinePlayers()) {
                        other.showEntity(plugin, player);
                    }
                }
                if (e.isValid()) {
                    Location at = e.getLocation().add(0, e.getHeight() / 2, 0);
                    Fx.particle(at, Particle.SQUID_INK, 20, 0.3, 0.05);
                    Fx.sound(at, Sound.ENTITY_ILLUSIONER_MIRROR_MOVE, 0.8f, 0.7f);
                }
            }
            case WARDED -> {
                if (reason == Reason.BROKEN && e.isValid()) {
                    wardBreakPulse(e, fx);
                } else if (e.isValid()) {
                    Fx.sound(e.getLocation(), Sound.BLOCK_BEACON_DEACTIVATE, 0.6f, 1.4f);
                }
            }
            case ANCHORED -> {
                if (reason == Reason.EXPIRED && e instanceof Player player && player.isOnline()) {
                    Text.send(player, "<gray>Your Recall anchor faded.");
                }
            }
            default -> {
            }
        }
    }

    /** When a Ward shield is broken it releases a sonic pulse that knocks everyone nearby away. */
    private void wardBreakPulse(LivingEntity owner, ActiveEffect fx) {
        double radius = settings().effect("warded", "break-pulse-radius", 5.0);
        double damage = settings().effect("warded", "break-pulse-damage", 3.0);
        double knockback = settings().effect("warded", "break-pulse-knockback", 1.2);
        Location center = owner.getLocation().add(0, 1, 0);
        Fx.sound(center, Sound.ENTITY_WARDEN_SONIC_BOOM, 0.9f, 1.3f);
        Fx.ring(center, 1.6, 10, p -> Fx.particle(p, Particle.SONIC_BOOM, 1, 0, 0));
        Fx.ring(center, radius, 40, p -> Fx.particle(p, Particle.SCULK_SOUL, 1, 0.05, 0.02));
        if (!(owner instanceof Player player)) {
            return;
        }
        for (LivingEntity target : Targets.around(plugin, player, owner.getLocation(), radius)) {
            Damage.ability(target, damage, player);
            Vector push = target.getLocation().toVector().subtract(owner.getLocation().toVector()).setY(0);
            if (push.lengthSquared() < 1.0E-4) {
                push = new Vector(0, 0, 0.1);
            }
            target.setVelocity(push.normalize().multiply(knockback).setY(0.45));
        }
    }
}
