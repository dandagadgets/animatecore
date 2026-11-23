package com.trimsmp.trimpowers.util;

import com.trimsmp.trimpowers.Settings;
import com.trimsmp.trimpowers.TrimPowersPlugin;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.damage.DamageSource;
import org.bukkit.damage.DamageType;
import org.bukkit.entity.ArmorStand;
import org.bukkit.entity.Enemy;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.entity.Tameable;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.scoreboard.Team;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Decides who an ability is allowed to hit. */
public final class Targets {

    private Targets() {
    }

    /** Every living entity within {@code radius} of {@code center} that {@code caster} may affect, nearest first. */
    public static List<LivingEntity> around(TrimPowersPlugin plugin, Player caster, Location center, double radius) {
        List<LivingEntity> result = new ArrayList<>();
        double radiusSq = radius * radius;
        for (LivingEntity entity : center.getWorld().getNearbyLivingEntities(center, radius)) {
            if (entity.getLocation().distanceSquared(center) <= radiusSq && canAffect(plugin, caster, entity)) {
                result.add(entity);
            }
        }
        result.sort(Comparator.comparingDouble(e -> e.getLocation().distanceSquared(center)));
        return result;
    }

    public static boolean canAffect(TrimPowersPlugin plugin, Player caster, Entity target) {
        if (!(target instanceof LivingEntity living) || target.equals(caster) || living.isDead() || !living.isValid()) {
            return false;
        }
        if (target instanceof ArmorStand || living.isInvulnerable()) {
            return false;
        }
        Settings settings = plugin.settings();
        if (target instanceof Player player) {
            if (!settings.targetPlayers() || !player.getWorld().getPVP()) {
                return false;
            }
            if (player.getGameMode() == GameMode.CREATIVE || player.getGameMode() == GameMode.SPECTATOR) {
                return false;
            }
            if (sameTeamNoFriendlyFire(caster, player)) {
                return false;
            }
        } else if (target instanceof Tameable tameable && tameable.isTamed()
                && tameable.getOwnerUniqueId() != null && tameable.getOwnerUniqueId().equals(caster.getUniqueId())) {
            return false;
        } else if (target instanceof Enemy) {
            if (!settings.targetHostileMobs()) {
                return false;
            }
        } else if (!settings.targetOtherMobs()) {
            return false;
        }
        return !settings.respectProtection() || probe(caster, living);
    }

    private static boolean sameTeamNoFriendlyFire(Player a, Player b) {
        Team team = a.getScoreboard().getEntryTeam(a.getName());
        return team != null && !team.allowFriendlyFire() && team.hasEntry(b.getName());
    }

    /**
     * Fires a zero-damage attack event so region/claim/PvP-protection plugins (WorldGuard, GriefPrevention, ...)
     * get to veto the ability exactly like they would veto a punch.
     */
    private static boolean probe(Player caster, LivingEntity target) {
        EntityDamageByEntityEvent event = new EntityDamageByEntityEvent(caster, target,
                EntityDamageEvent.DamageCause.ENTITY_ATTACK,
                DamageSource.builder(DamageType.PLAYER_ATTACK).withCausingEntity(caster).withDirectEntity(caster).build(),
                0.0);
        Damage.probe(() -> caster.getServer().getPluginManager().callEvent(event));
        return !event.isCancelled();
    }
}
