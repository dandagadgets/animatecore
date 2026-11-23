package com.trimsmp.trimpowers.listener;

import com.trimsmp.trimpowers.Settings;
import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.ActiveEffect;
import com.trimsmp.trimpowers.effect.EffectManager;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.power.impl.SentryPower;
import com.trimsmp.trimpowers.util.Damage;
import com.trimsmp.trimpowers.util.Fx;
import com.trimsmp.trimpowers.util.Targets;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.entity.Projectile;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.entity.EntityRegainHealthEvent;
import org.bukkit.persistence.PersistentDataContainer;
import org.bukkit.persistence.PersistentDataType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * All damage math in one place: trim passives, Hexed / Berserk / Marked / Warded / Shadowstep multipliers, stun
 * attack-blocking, and on-hit procs (Overcharge chain lightning, Berserk lifesteal, Volley bleed, Wild roots).
 */
public final class CombatListener implements Listener {

    private static final Set<String> UNBLOCKABLE = Set.of("VOID", "KILL", "WORLD_BORDER", "SUICIDE");
    private static final Color SPARK = Color.fromRGB(0xfff27a);

    private final TrimPowersPlugin plugin;
    private final Map<UUID, Long> chainReadyAt = new HashMap<>();

    public CombatListener(TrimPowersPlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onDamage(EntityDamageEvent event) {
        if (Damage.isProbe() || !(event.getEntity() instanceof LivingEntity victim)) {
            return;
        }
        EffectManager effects = plugin.effects();
        Settings settings = plugin.settings();
        boolean internal = Damage.isInternal();

        LivingEntity attacker = null;
        boolean melee = false;
        boolean projectile = false;
        if (event instanceof EntityDamageByEntityEvent byEntity) {
            Entity damager = byEntity.getDamager();
            if (damager instanceof Projectile shot && shot.getShooter() instanceof LivingEntity shooter) {
                attacker = shooter;
                projectile = !internal;
            } else if (damager instanceof LivingEntity living) {
                attacker = living;
                EntityDamageEvent.DamageCause cause = event.getCause();
                melee = !internal && (cause == EntityDamageEvent.DamageCause.ENTITY_ATTACK
                        || cause == EntityDamageEvent.DamageCause.ENTITY_SWEEP_ATTACK);
            }
        }

        if (melee && effects.has(attacker, EffectType.STUN)) {
            event.setCancelled(true);
            return;
        }

        double damage = event.getDamage();
        if (attacker != null && !internal) {
            if (attacker instanceof Player player) {
                damage = plugin.powers().applyOutgoing(player, victim, damage, melee, projectile);
            }
            ActiveEffect hex = effects.get(attacker, EffectType.HEXED);
            if (hex != null) {
                damage *= Math.max(0, 1 - hex.potency());
            }
            if (melee) {
                ActiveEffect berserk = effects.get(attacker, EffectType.BERSERK);
                if (berserk != null) {
                    damage *= 1 + berserk.potency();
                }
            }
            if ((melee || projectile) && effects.has(attacker, EffectType.SHADOWSTEP)) {
                effects.remove(attacker, EffectType.SHADOWSTEP);
                if (melee && attacker instanceof Player player) {
                    damage *= 1 + settings.effect("shadowstep", "reveal-bonus-damage", 0.6);
                    double bleedSeconds = settings.effect("shadowstep", "reveal-bleed-seconds", 4);
                    if (bleedSeconds > 0 && Targets.canAffect(plugin, player, victim)) {
                        effects.apply(victim, EffectType.BLEED, (int) Math.round(bleedSeconds * 20),
                                settings.effect("shadowstep", "reveal-bleed-damage", 1.0), player);
                    }
                    Fx.particle(victim.getLocation().add(0, 1, 0), Particle.SCULK_SOUL, 10, 0.3, 0.05);
                }
            }
        }

        ActiveEffect mark = effects.get(victim, EffectType.MARKED);
        if (mark != null) {
            damage *= 1 + mark.potency();
        }
        if (victim instanceof Player player) {
            damage = plugin.powers().applyIncoming(player, event, damage);
        }
        if (event.getCause() == EntityDamageEvent.DamageCause.FALL && effects.has(victim, EffectType.CUSHIONED)) {
            event.setCancelled(true);
            return;
        }

        ActiveEffect ward = effects.get(victim, EffectType.WARDED);
        if (ward != null && damage > 0 && !UNBLOCKABLE.contains(event.getCause().name())) {
            double absorbed = Math.min(ward.value, damage);
            ward.value -= absorbed;
            damage -= absorbed;
            Location chest = victim.getLocation().add(0, victim.getHeight() * 0.55, 0);
            Fx.particle(chest, Particle.SCULK_CHARGE_POP, 6, 0.4, 0.02);
            if (ward.value <= 0.01) {
                effects.breakWard(victim);
            } else {
                Fx.sound(chest, Sound.BLOCK_SCULK_BREAK, 0.8f, 1.4f);
            }
            if (damage <= 1.0E-4) {
                event.setCancelled(true);
                Fx.sound(chest, Sound.ITEM_SHIELD_BLOCK, 0.7f, 1.2f);
                return;
            }
        }
        event.setDamage(Math.max(0, damage));
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onHit(EntityDamageByEntityEvent event) {
        if (Damage.isInternal() || Damage.isProbe() || !(event.getEntity() instanceof LivingEntity victim)) {
            return;
        }
        Entity damager = event.getDamager();
        if (damager instanceof Projectile shot) {
            volleyBleed(shot, victim);
            return;
        }
        if (!(damager instanceof Player attacker) || event.getCause() != EntityDamageEvent.DamageCause.ENTITY_ATTACK) {
            return;
        }
        plugin.powers().onMeleeHit(attacker, victim);

        EffectManager effects = plugin.effects();
        ActiveEffect berserk = effects.get(attacker, EffectType.BERSERK);
        if (berserk != null) {
            double heal = event.getFinalDamage() * plugin.settings().effect("berserk", "lifesteal", 0.15);
            if (heal > 0) {
                attacker.heal(heal, EntityRegainHealthEvent.RegainReason.MAGIC);
            }
        }
        ActiveEffect overcharge = effects.get(attacker, EffectType.OVERCHARGED);
        if (overcharge != null) {
            chainLightning(attacker, victim, overcharge);
        }
    }

    private void volleyBleed(Projectile shot, LivingEntity victim) {
        SentryPower sentry = plugin.powers().get("sentry", SentryPower.class);
        if (sentry == null || !(shot.getShooter() instanceof Player shooter)) {
            return;
        }
        PersistentDataContainer data = shot.getPersistentDataContainer();
        Double seconds = data.get(sentry.bleedSecondsKey(), PersistentDataType.DOUBLE);
        if (seconds == null || seconds <= 0 || !Targets.canAffect(plugin, shooter, victim)) {
            return;
        }
        Double damage = data.get(sentry.bleedDamageKey(), PersistentDataType.DOUBLE);
        plugin.effects().apply(victim, EffectType.BLEED, (int) Math.round(seconds * 20),
                damage == null ? 1.0 : damage, shooter);
    }

    private void chainLightning(Player attacker, LivingEntity victim, ActiveEffect overcharge) {
        Settings settings = plugin.settings();
        long now = System.currentTimeMillis();
        long cooldownMs = (long) (settings.effect("overcharged", "proc-cooldown-ticks", 10) * 50);
        if (chainReadyAt.getOrDefault(attacker.getUniqueId(), 0L) > now) {
            return;
        }
        chainReadyAt.put(attacker.getUniqueId(), now + cooldownMs);

        int maxTargets = (int) settings.effect("overcharged", "chain-targets", 3);
        double radius = settings.effect("overcharged", "chain-radius", 5);
        int shockTicks = (int) Math.round(settings.effect("overcharged", "shocked-seconds", 3) * 20);
        double shockDamage = settings.effect("overcharged", "shocked-damage", 0.5);

        if (Targets.canAffect(plugin, attacker, victim)) {
            plugin.effects().apply(victim, EffectType.SHOCKED, shockTicks, shockDamage, attacker);
        }
        Location from = victim.getLocation().add(0, victim.getHeight() * 0.6, 0);
        Fx.particle(from, Particle.ELECTRIC_SPARK, 15, 0.3, 0.2);
        List<LivingEntity> nearby = Targets.around(plugin, attacker, victim.getLocation(), radius);
        int chained = 0;
        for (LivingEntity target : nearby) {
            if (chained >= maxTargets) {
                break;
            }
            if (target.equals(victim)) {
                continue;
            }
            Location to = target.getLocation().add(0, target.getHeight() * 0.6, 0);
            Fx.zigzag(from, to, 0.3, 0.35, p -> {
                Fx.particle(p, Particle.ELECTRIC_SPARK, 1, 0, 0);
                Fx.dust(p, SPARK, 0.6f, 1, 0);
            });
            Damage.ability(target, overcharge.potency(), attacker);
            plugin.effects().apply(target, EffectType.SHOCKED, shockTicks, shockDamage, attacker);
            from = to;
            chained++;
        }
        Fx.sound(victim.getLocation(), Sound.ENTITY_LIGHTNING_BOLT_IMPACT, 0.5f, 1.6f);
    }
}
