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
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.util.Vector;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/** Rib (nether fortresses): resist fire, and an expanding ring of soul fire. */
public final class RibPower extends TrimPower {

    private static final Set<String> FIRE_CAUSES = Set.of("FIRE", "FIRE_TICK", "LAVA", "HOT_FLOOR", "CAMPFIRE");

    public RibPower(TrimPowersPlugin plugin) {
        super(plugin, "rib", "Rib", "Hellfire Ring", 0xB33A1E);
    }

    @Override
    protected int defaultCooldown() {
        return 22;
    }

    @Override
    public void collectAttributes(AttributeSink sink) {
        sink.add("burning_time", -d("passive.burn-time-reduction", 0.8), AttributeModifier.Operation.ADD_NUMBER);
    }

    @Override
    public double incoming(Player victim, EntityDamageEvent event, double damage) {
        if (FIRE_CAUSES.contains(event.getCause().name())) {
            return damage * Math.max(0, 1 - d("passive.fire-damage-reduction", 1.0));
        }
        return damage;
    }

    @Override
    public long activate(Player player) {
        double radius = d("ability.radius", 7);
        int ticks = Math.max(1, i("ability.expand-ticks", 12));
        double damage = d("ability.damage", 4);
        double burnSeconds = d("ability.soulburn-seconds", 5);
        double burnDamage = d("ability.soulburn-damage", 1.0);
        Location center = player.getLocation().add(0, 0.2, 0);
        Set<UUID> struck = new HashSet<>();

        Fx.sound(center, Sound.ENTITY_BLAZE_SHOOT, 1f, 0.6f);
        Fx.sound(center, Sound.ITEM_FIRECHARGE_USE, 1f, 0.7f);
        animate(ticks, t -> {
            double r = 1 + (radius - 1) * (t + 1) / ticks;
            int points = (int) (r * 12);
            int[] index = {0};
            Fx.ring(center, r, points, p -> {
                Fx.particle(p, index[0]++ % 2 == 0 ? Particle.SOUL_FIRE_FLAME : Particle.FLAME, 1, 0.05, 0.02);
            });
            for (LivingEntity target : enemies(player, center, r + 1.3)) {
                Vector flat = target.getLocation().toVector().subtract(center.toVector()).setY(0);
                if (Math.abs(flat.length() - r) > 1.3 || !struck.add(target.getUniqueId())) {
                    continue;
                }
                hit(player, target, damage);
                effect(target, EffectType.SOULBURN, burnSeconds, burnDamage, player);
                if (flat.lengthSquared() > 1.0E-4) {
                    target.setVelocity(flat.normalize().multiply(0.5).setY(0.3));
                }
            }
            return true;
        });
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        double reduction = d("passive.fire-damage-reduction", 1.0);
        return (reduction >= 1.0 ? "Immune to fire and lava damage"
                : "Take <white>" + pct(reduction) + "</white> less fire/lava damage") + ", and burn for less time.";
    }

    @Override
    public String abilityText() {
        return "A ring of soul fire expands to <white>" + n(d("ability.radius", 7))
                + "</white> blocks, applying <dark_aqua>Soulburn</dark_aqua> (ignores fire resistance, halves healing).";
    }
}
