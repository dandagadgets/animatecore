package com.trimsmp.trimpowers.power.impl;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Fx;
import org.bukkit.Location;
import org.bukkit.NamespacedKey;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.entity.AbstractArrow;
import org.bukkit.entity.Arrow;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.util.Vector;

/** Sentry (pillager outposts): ranged damage, and a fan of bleeding arrows. */
public final class SentryPower extends TrimPower {

    private final NamespacedKey bleedSecondsKey;
    private final NamespacedKey bleedDamageKey;

    public SentryPower(TrimPowersPlugin plugin) {
        super(plugin, "sentry", "Sentry", "Volley", 0xC9A26B);
        this.bleedSecondsKey = new NamespacedKey(plugin, "volley_bleed_seconds");
        this.bleedDamageKey = new NamespacedKey(plugin, "volley_bleed_damage");
    }

    public NamespacedKey bleedSecondsKey() {
        return bleedSecondsKey;
    }

    public NamespacedKey bleedDamageKey() {
        return bleedDamageKey;
    }

    @Override
    protected int defaultCooldown() {
        return 18;
    }

    @Override
    public double outgoing(Player attacker, LivingEntity victim, double damage, boolean melee, boolean projectile) {
        return projectile ? damage * (1 + d("passive.projectile-damage", 0.24)) : damage;
    }

    @Override
    public long activate(Player player) {
        int arrows = Math.max(1, i("ability.arrows", 5));
        double spread = d("ability.spread-degrees", 10);
        double speed = d("ability.speed", 2.6);
        double arrowDamage = d("ability.arrow-damage", 2.0);
        double bleedSeconds = d("ability.bleed-seconds", 4);
        double bleedDamage = d("ability.bleed-damage", 1.0);

        Location eye = player.getEyeLocation();
        Vector direction = eye.getDirection().normalize();
        for (int k = 0; k < arrows; k++) {
            double offset = (k - (arrows - 1) / 2.0) * spread;
            Vector velocity = direction.clone().rotateAroundY(Math.toRadians(offset)).multiply(speed);
            Arrow arrow = player.launchProjectile(Arrow.class, velocity);
            arrow.setPickupStatus(AbstractArrow.PickupStatus.DISALLOWED);
            arrow.setCritical(true);
            arrow.setDamage(arrowDamage);
            arrow.getPersistentDataContainer().set(bleedSecondsKey, PersistentDataType.DOUBLE, bleedSeconds);
            arrow.getPersistentDataContainer().set(bleedDamageKey, PersistentDataType.DOUBLE, bleedDamage);
            later(100L, () -> {
                if (arrow.isValid()) {
                    arrow.remove();
                }
            });
        }
        Location muzzle = eye.clone().add(direction.clone().multiply(1.2));
        Fx.particle(muzzle, Particle.CRIT, 25, 0.25, 0.3);
        Fx.particle(muzzle, Particle.SMOKE, 8, 0.15, 0.02);
        Fx.sound(eye, Sound.ITEM_CROSSBOW_SHOOT, 1f, 0.8f);
        for (int k = 0; k < 3; k++) {
            float pitch = 0.9f + k * 0.2f;
            later(k * 2L, () -> Fx.sound(player.getLocation(), Sound.ENTITY_ARROW_SHOOT, 0.8f, pitch));
        }
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "Projectiles deal <white>+" + pct(d("passive.projectile-damage", 0.24)) + "</white> damage.";
    }

    @Override
    public String abilityText() {
        return "Fire a fan of <white>" + i("ability.arrows", 5) + "</white> arrows that inflict <red>Bleed</red> for <white>"
                + n(d("ability.bleed-seconds", 4)) + "s</white>.";
    }
}
