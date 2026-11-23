package com.trimsmp.trimpowers.power.impl;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Fx;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.block.Block;
import org.bukkit.block.BlockFace;
import org.bukkit.block.data.BlockData;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.util.Vector;

/** Raiser (trail ruins): bonus XP, and a ground slam that throws enemies up and stuns them. */
public final class RaiserPower extends TrimPower {

    public RaiserPower(TrimPowersPlugin plugin) {
        super(plugin, "raiser", "Raiser", "Upheaval", 0xC7643A);
    }

    @Override
    protected int defaultCooldown() {
        return 22;
    }

    public double xpBonus(int pieces) {
        return d("passive.xp-bonus-per-piece", 0.1) * pieces;
    }

    @Override
    public long activate(Player player) {
        double radius = d("ability.radius", 6);
        double damage = d("ability.damage", 3);
        double lift = d("ability.lift", 1.1);
        double stunSeconds = d("ability.stun-seconds", 2);
        Location center = player.getLocation();

        Block below = center.getBlock().getRelative(BlockFace.DOWN);
        BlockData ground = below.getType().isSolid() ? below.getBlockData() : Material.DIRT.createBlockData();
        Fx.sound(center, Sound.ENTITY_IRON_GOLEM_ATTACK, 1f, 0.6f);
        Fx.sound(center, Sound.ENTITY_EVOKER_CAST_SPELL, 0.8f, 0.8f);
        Fx.sound(center, Sound.ENTITY_GENERIC_EXPLODE, 0.4f, 1.4f);
        animate(8, t -> {
            double r = radius * (t + 1) / 8.0;
            Fx.ring(center.clone().add(0, 0.15, 0), r, (int) (r * 8), p -> {
                Fx.particle(p, Particle.CLOUD, 1, 0.05, 0.02);
                Fx.block(p, Particle.BLOCK, ground, 2, 0.1);
            });
            return true;
        });

        for (LivingEntity target : enemies(player, center, radius)) {
            hit(player, target, damage);
            Vector out = target.getLocation().toVector().subtract(center.toVector()).setY(0);
            Vector velocity = out.lengthSquared() > 1.0E-4 ? out.normalize().multiply(0.2) : new Vector();
            target.setVelocity(velocity.setY(lift));
            effect(target, EffectType.STUN, stunSeconds, 0, player);
            Fx.particle(target.getLocation(), Particle.GUST, 1, 0, 0);
        }
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "Gain <white>+" + pct(d("passive.xp-bonus-per-piece", 0.1)) + "</white> experience per piece.";
    }

    @Override
    public String abilityText() {
        return "Slam the ground, throwing enemies within <white>" + n(d("ability.radius", 6))
                + "</white> blocks into the air and <yellow>Stunning</yellow> them for <white>" + n(d("ability.stun-seconds", 2)) + "s</white>.";
    }
}
