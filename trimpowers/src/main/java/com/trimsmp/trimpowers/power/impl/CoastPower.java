package com.trimsmp.trimpowers.power.impl;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.power.AttributeSink;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Fx;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.attribute.AttributeModifier;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.util.Vector;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/** Coast (shipwrecks): at home in the water, and a riptide surge you can use anywhere. */
public final class CoastPower extends TrimPower {

    public CoastPower(TrimPowersPlugin plugin) {
        super(plugin, "coast", "Coast", "Riptide Surge", 0x3FA7C4);
    }

    @Override
    protected int defaultCooldown() {
        return 14;
    }

    @Override
    public boolean isMobility() {
        return true;
    }

    @Override
    public void collectAttributes(int pieces, AttributeSink sink) {
        sink.add("water_movement_efficiency", d("passive.swim-speed-per-piece", 0.1) * pieces, AttributeModifier.Operation.ADD_NUMBER);
        sink.add("oxygen_bonus", d("passive.oxygen-bonus-per-piece", 1.0) * pieces, AttributeModifier.Operation.ADD_NUMBER);
    }

    @Override
    public long activate(Player player) {
        double power = d("ability.power", 1.9);
        double damage = d("ability.damage", 4);
        double hitRadius = d("ability.hit-radius", 2.0);
        double knockback = d("ability.knockback", 1.0);

        Vector direction = player.getLocation().getDirection().normalize();
        direction.setY(Math.max(direction.getY(), 0.15) + 0.25);
        player.setVelocity(direction.clone().normalize().multiply(power));
        effect(player, EffectType.CUSHIONED, 3, 0, player);

        Fx.sound(player.getLocation(), Sound.ITEM_TRIDENT_RIPTIDE_3, 1f, 1f);
        Fx.sound(player.getLocation(), Sound.ENTITY_PLAYER_SPLASH_HIGH_SPEED, 0.8f, 1f);
        Fx.ring(player.getLocation().add(0, 0.2, 0), 1.2, 16, p -> Fx.particle(p, Particle.SPLASH, 4, 0.1, 0.1));

        Set<UUID> struck = new HashSet<>();
        animate(14, t -> {
            if (!alive(player)) {
                return false;
            }
            Location at = player.getLocation().add(0, 0.8, 0);
            Fx.particle(at, Particle.SPLASH, 12, 0.4, 0.1);
            Fx.particle(at, Particle.BUBBLE_POP, 4, 0.3, 0.02);
            Fx.particle(at, Particle.FALLING_WATER, 3, 0.4, 0);
            for (LivingEntity target : enemies(player, at, hitRadius)) {
                if (struck.add(target.getUniqueId())) {
                    hit(player, target, damage);
                    Vector push = target.getLocation().toVector().subtract(player.getLocation().toVector()).setY(0);
                    if (push.lengthSquared() < 1.0E-4) {
                        push = direction.clone().setY(0);
                    }
                    target.setVelocity(push.normalize().multiply(knockback).setY(0.35));
                    Fx.particle(target.getLocation().add(0, 1, 0), Particle.SPLASH, 30, 0.4, 0.2);
                }
            }
            return true;
        });
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "<white>+" + pct(d("passive.swim-speed-per-piece", 0.1)) + "</white> swim speed and <white>+"
                + n(d("passive.oxygen-bonus-per-piece", 1.0)) + "</white> oxygen per piece.";
    }

    @Override
    public String abilityText() {
        return "Surge forward like a riptide trident (no rain needed), slamming enemies in your path for <white>"
                + n(d("ability.damage", 4)) + "</white> damage.";
    }
}
