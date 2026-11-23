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
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.util.Vector;

/** Spire (end cities): soft landings, and a launch skyward that levitates enemies below. */
public final class SpirePower extends TrimPower {

    public SpirePower(TrimPowersPlugin plugin) {
        super(plugin, "spire", "Spire", "Skyward", 0xB38BB3);
    }

    @Override
    protected int defaultCooldown() {
        return 18;
    }

    @Override
    public boolean isMobility() {
        return true;
    }

    @Override
    public void collectAttributes(int pieces, AttributeSink sink) {
        sink.add("fall_damage_multiplier", -d("passive.fall-damage-reduction-per-piece", 0.15) * pieces,
                AttributeModifier.Operation.ADD_NUMBER);
    }

    @Override
    public long activate(Player player) {
        Location base = player.getLocation();
        double radius = d("ability.radius", 4);
        int levitationTicks = (int) Math.round(d("ability.levitation-seconds", 2) * 20);
        double damage = d("ability.damage", 2);
        for (LivingEntity target : enemies(player, base, radius)) {
            hit(player, target, damage);
            target.addPotionEffect(new PotionEffect(PotionEffectType.LEVITATION, levitationTicks, 1, false, true, true));
        }

        Vector forward = Fx.flat(base.getDirection()).multiply(0.3);
        player.setVelocity(new Vector(forward.getX(), d("ability.launch-power", 1.5), forward.getZ()));
        effect(player, EffectType.CUSHIONED, d("ability.cushion-seconds", 6), 0, player);

        for (double y = 0; y < 6; y += 0.3) {
            Fx.particle(base.clone().add(0, y, 0), Particle.END_ROD, 1, 0.1, 0.01);
        }
        Fx.ring(base.clone().add(0, 0.1, 0), radius, 30, p -> Fx.particle(p, Particle.REVERSE_PORTAL, 2, 0.05, 0.02));
        Fx.sound(base, Sound.ENTITY_SHULKER_SHOOT, 1f, 0.8f);
        Fx.sound(base, Sound.ENTITY_ENDER_DRAGON_FLAP, 0.6f, 1.2f);
        animate(20, t -> {
            if (!alive(player)) {
                return false;
            }
            Fx.particle(player.getLocation(), Particle.END_ROD, 2, 0.15, 0.01);
            return true;
        });
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "Take <white>" + pct(d("passive.fall-damage-reduction-per-piece", 0.15)) + "</white> less fall damage per piece.";
    }

    @Override
    public String abilityText() {
        return "Launch yourself into the sky and float down safely. Enemies within <white>" + n(d("ability.radius", 4))
                + "</white> blocks are lifted with levitation.";
    }
}
