package com.trimsmp.trimpowers.power.impl;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.power.AttributeSink;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Fx;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.attribute.AttributeModifier;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.event.entity.EntityRegainHealthEvent;

import java.util.List;

/** Host (trail ruins): extra max health, and a siphon that drains life from enemies around you. */
public final class HostPower extends TrimPower {

    private static final Color SOUL = Color.fromRGB(0x5fd3c8);

    public HostPower(TrimPowersPlugin plugin) {
        super(plugin, "host", "Host", "Soul Siphon", 0x5FA89E);
    }

    @Override
    protected int defaultCooldown() {
        return 25;
    }

    @Override
    public void collectAttributes(AttributeSink sink) {
        sink.add("max_health", d("passive.max-health", 4.0), AttributeModifier.Operation.ADD_NUMBER);
    }

    @Override
    public long activate(Player player) {
        double radius = d("ability.radius", 7);
        int maxTargets = Math.max(1, i("ability.max-targets", 5));
        double damage = d("ability.damage", 3);
        double healRatio = d("ability.heal-ratio", 0.5);
        List<LivingEntity> targets = enemies(player, player.getLocation(), radius);
        if (targets.isEmpty()) {
            flash(player, "<gray>No souls nearby to siphon.");
            return NO_COOLDOWN;
        }
        if (targets.size() > maxTargets) {
            targets = targets.subList(0, maxTargets);
        }

        double drained = 0;
        for (LivingEntity target : targets) {
            double before = target.getHealth();
            hit(player, target, damage);
            drained += Math.max(0, before - (target.isDead() ? 0 : target.getHealth()));
            effect(target, EffectType.HEXED, d("ability.hex-seconds", 5), d("ability.hex-strength", 0.2), player);
            Location from = target.getEyeLocation();
            animate(12, t -> {
                if (!alive(player)) {
                    return false;
                }
                Location to = player.getLocation().add(0, 1, 0);
                double f = (t + 1) / 12.0;
                Location point = from.clone().add(to.toVector().subtract(from.toVector()).multiply(f));
                Fx.particle(point, Particle.SOUL, 1, 0.05, 0.01);
                Fx.dust(point, SOUL, 1.0f, 2, 0.08);
                return true;
            });
        }
        double heal = drained * healRatio;
        later(12L, () -> {
            if (alive(player) && heal > 0) {
                player.heal(heal, EntityRegainHealthEvent.RegainReason.MAGIC);
                Fx.particle(player.getLocation().add(0, 1.2, 0), Particle.HEART, 3, 0.4, 0);
            }
        });
        Fx.sound(player.getLocation(), Sound.PARTICLE_SOUL_ESCAPE, 1.5f, 0.7f);
        Fx.sound(player.getLocation(), Sound.ENTITY_WITHER_SHOOT, 0.3f, 1.6f);
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "<white>+" + n(d("passive.max-health", 4.0)) + "</white> max health.";
    }

    @Override
    public String abilityText() {
        return "Drain up to <white>" + i("ability.max-targets", 5) + "</white> enemies within <white>" + n(d("ability.radius", 7))
                + "</white> blocks, healing <white>" + pct(d("ability.heal-ratio", 0.5)) + "</white> of the damage and <dark_purple>Hexing</dark_purple> them.";
    }
}
