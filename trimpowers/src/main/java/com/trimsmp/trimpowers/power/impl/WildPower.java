package com.trimsmp.trimpowers.power.impl;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Fx;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.block.data.BlockData;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/** Wild (jungle temples): melee hits can root, and an ability that roots everyone around you. */
public final class WildPower extends TrimPower {

    private static final Color LEAF = Color.fromRGB(0x4e9a3a);
    private final BlockData mossData = Material.MOSS_BLOCK.createBlockData();
    private final BlockData vineData = Material.VINE.createBlockData();

    public WildPower(TrimPowersPlugin plugin) {
        super(plugin, "wild", "Wild", "Entangle", 0x4E9A3A);
    }

    @Override
    protected int defaultCooldown() {
        return 22;
    }

    @Override
    public void onMeleeHit(Player attacker, LivingEntity victim, int pieces) {
        double chance = d("passive.root-chance-per-piece", 0.04) * pieces;
        if (ThreadLocalRandom.current().nextDouble() < chance && canAffect(attacker, victim)) {
            effect(victim, EffectType.ROOTED, d("passive.root-seconds", 1.5), 0, attacker);
        }
    }

    @Override
    public long activate(Player player) {
        double radius = d("ability.radius", 7);
        double seconds = d("ability.root-seconds", 3.5);
        double damage = d("ability.damage", 2);
        Location center = player.getLocation().add(0, 0.15, 0);

        Fx.sound(center, Sound.BLOCK_AZALEA_LEAVES_BREAK, 1.2f, 0.6f);
        Fx.sound(center, Sound.BLOCK_ROOTS_BREAK, 1.2f, 0.7f);
        animate(8, t -> {
            double r = radius * (t + 1) / 8.0;
            Fx.ring(center, r, (int) (r * 9), p -> {
                Fx.dust(p, LEAF, 1.4f, 1, 0.05);
                if (ThreadLocalRandom.current().nextInt(3) == 0) {
                    Fx.block(p, Particle.BLOCK, mossData, 1, 0.1);
                }
            });
            return true;
        });

        List<LivingEntity> targets = enemies(player, center, radius);
        for (LivingEntity target : targets) {
            hit(player, target, damage);
            effect(target, EffectType.ROOTED, seconds, 0, player);
            Location base = target.getLocation();
            for (double y = 0; y < target.getHeight(); y += 0.3) {
                double a = y * 4;
                Fx.block(base.clone().add(Math.cos(a) * 0.45, y, Math.sin(a) * 0.45), Particle.BLOCK, vineData, 2, 0.05);
            }
            Fx.particle(base.clone().add(0, 0.5, 0), Particle.HAPPY_VILLAGER, 6, 0.4, 0);
        }
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "Melee hits have a <white>" + pct(d("passive.root-chance-per-piece", 0.04))
                + "</white> chance per piece to <green>Root</green> the target.";
    }

    @Override
    public String abilityText() {
        return "Vines burst from the ground, <green>Rooting</green> enemies within <white>" + n(d("ability.radius", 7))
                + "</white> blocks for <white>" + n(d("ability.root-seconds", 3.5)) + "s</white>.";
    }
}
