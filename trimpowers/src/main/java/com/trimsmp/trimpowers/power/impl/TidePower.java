package com.trimsmp.trimpowers.power.impl;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Fx;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.util.Vector;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/** Tide (ocean monuments): stronger in water or rain, and a freezing tidal wave. */
public final class TidePower extends TrimPower {

    private static final Color FOAM = Color.fromRGB(0xe8f6ff);
    private static final Color DEEP = Color.fromRGB(0x2f6fb0);

    public TidePower(TrimPowersPlugin plugin) {
        super(plugin, "tide", "Tide", "Tidal Wave", 0x2F6FB0);
    }

    @Override
    protected int defaultCooldown() {
        return 20;
    }

    @Override
    public double outgoing(Player attacker, LivingEntity victim, double damage, boolean melee, boolean projectile) {
        if (attacker.isInWaterOrRainOrBubbleColumn()) {
            return damage * (1 + d("passive.wet-damage", 0.2));
        }
        return damage;
    }

    @Override
    public long activate(Player player) {
        double length = d("ability.length", 12);
        int travelTicks = Math.max(1, i("ability.travel-ticks", 14));
        double halfWidth = d("ability.width", 4.4) / 2.0;
        double damage = d("ability.damage", 4);
        double push = d("ability.push", 1.1);
        double frostSeconds = d("ability.frostbite-seconds", 4);
        double frostSlow = d("ability.frostbite-slow", 0.35);

        Location origin = player.getLocation();
        Vector forward = Fx.flat(origin.getDirection());
        Vector side = forward.getCrossProduct(new Vector(0, 1, 0)).normalize();
        Set<UUID> struck = new HashSet<>();

        Fx.sound(origin, Sound.ITEM_BUCKET_EMPTY, 1f, 0.6f);
        Fx.sound(origin, Sound.AMBIENT_UNDERWATER_EXIT, 1f, 0.8f);
        animate(travelTicks, t -> {
            double s = (t + 1) * length / travelTicks;
            Location front = origin.clone().add(forward.clone().multiply(s));
            for (double w = -halfWidth; w <= halfWidth; w += 0.5) {
                double crest = 1.8 + 0.3 * Math.sin(w * 1.7 + t * 0.8);
                for (double y = 0; y <= crest; y += 0.6) {
                    Location p = front.clone().add(side.clone().multiply(w)).add(0, y, 0);
                    Fx.particle(p, Particle.SPLASH, 2, 0.1, 0.05);
                    if (y == 0) {
                        Fx.dust(p, DEEP, 1.4f, 1, 0.1);
                    }
                }
                Location top = front.clone().add(side.clone().multiply(w)).add(0, crest, 0);
                Fx.dust(top, FOAM, 1.2f, 1, 0.05);
                Fx.particle(top, Particle.FALLING_WATER, 1, 0.1, 0);
            }
            if (t % 4 == 0) {
                Fx.sound(front, Sound.ENTITY_GENERIC_SPLASH, 0.9f, 0.7f);
            }
            for (LivingEntity target : enemies(player, front.clone().add(0, 1, 0), halfWidth + 1.2)) {
                Vector offset = target.getLocation().toVector().subtract(front.toVector());
                if (Math.abs(offset.dot(forward)) > 1.6 || !struck.add(target.getUniqueId())) {
                    continue;
                }
                hit(player, target, damage);
                target.setVelocity(forward.clone().multiply(push).setY(0.35));
                effect(target, EffectType.FROSTBITE, frostSeconds, frostSlow, player);
            }
            return true;
        });
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "Deal <white>+" + pct(d("passive.wet-damage", 0.2)) + "</white> damage while in water or rain.";
    }

    @Override
    public String abilityText() {
        return "Send a <white>" + n(d("ability.length", 12)) + "</white>-block wave forward that sweeps enemies away and gives them <aqua>Frostbite</aqua>.";
    }
}
