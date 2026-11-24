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

/** Flow (trial chambers): breeze-light jumps, and a wind dash that blasts enemies away. */
public final class FlowPower extends TrimPower {

    public FlowPower(TrimPowersPlugin plugin) {
        super(plugin, "flow", "Flow", "Gale Dash", 0x8FD3D6);
    }

    @Override
    protected int defaultCooldown() {
        return 12;
    }

    @Override
    public boolean isMobility() {
        return true;
    }

    @Override
    public void collectAttributes(AttributeSink sink) {
        sink.add("safe_fall_distance", d("passive.safe-fall", 4.0), AttributeModifier.Operation.ADD_NUMBER);
        sink.add("jump_strength", d("passive.jump-strength", 0.08), AttributeModifier.Operation.ADD_NUMBER);
    }

    @Override
    public long activate(Player player) {
        Location origin = player.getLocation();
        double radius = d("ability.burst-radius", 4);
        double push = d("ability.burst-knockback", 1.4);
        double damage = d("ability.damage", 2);
        for (LivingEntity target : enemies(player, origin, radius)) {
            hit(player, target, damage);
            Vector away = target.getLocation().toVector().subtract(origin.toVector()).setY(0);
            if (away.lengthSquared() < 1.0E-4) {
                away = new Vector(0, 0, 0.1);
            }
            target.setVelocity(away.normalize().multiply(push).setY(0.5));
        }

        Vector direction = origin.getDirection().normalize();
        direction.setY(Math.max(direction.getY(), 0.1));
        player.setVelocity(direction.normalize().multiply(d("ability.dash-power", 2.0)));
        effect(player, EffectType.CUSHIONED, d("ability.cushion-seconds", 4), 0, player);

        Fx.particle(origin.clone().add(0, 0.5, 0), Particle.GUST_EMITTER_SMALL, 1, 0, 0);
        Fx.sound(origin, Sound.ENTITY_WIND_CHARGE_WIND_BURST, 1f, 1f);
        Fx.sound(origin, Sound.ENTITY_BREEZE_SHOOT, 0.8f, 1.2f);
        animate(10, t -> {
            if (!alive(player)) {
                return false;
            }
            Fx.particle(player.getLocation().add(0, 0.8, 0), Particle.SMALL_GUST, 2, 0.3, 0);
            return true;
        });
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "<white>+" + n(d("passive.safe-fall", 4.0)) + "</white> safe fall distance and higher jumps.";
    }

    @Override
    public String abilityText() {
        return "Dash where you're looking on a gust of wind, blasting enemies within <white>" + n(d("ability.burst-radius", 4))
                + "</white> blocks away. No fall damage afterwards.";
    }
}
