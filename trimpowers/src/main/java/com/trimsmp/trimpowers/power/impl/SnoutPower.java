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

/** Snout (bastions): heavier hits, and a berserk rage with lifesteal. */
public final class SnoutPower extends TrimPower {

    private static final Color RAGE = Color.fromRGB(0xc4161c);

    public SnoutPower(TrimPowersPlugin plugin) {
        super(plugin, "snout", "Snout", "Berserk", 0xE0A43A);
    }

    @Override
    protected int defaultCooldown() {
        return 35;
    }

    @Override
    public void collectAttributes(int pieces, AttributeSink sink) {
        sink.add("attack_knockback", d("passive.knockback-per-piece", 0.15) * pieces, AttributeModifier.Operation.ADD_NUMBER);
    }

    @Override
    public double outgoing(Player attacker, LivingEntity victim, double damage, int pieces, boolean melee, boolean projectile) {
        return melee ? damage * (1 + d("passive.melee-damage-per-piece", 0.03) * pieces) : damage;
    }

    @Override
    public long activate(Player player) {
        effect(player, EffectType.BERSERK, d("ability.duration", 8), d("ability.damage-bonus", 0.3), player);
        Location chest = player.getLocation().add(0, 1, 0);
        Fx.particle(chest, Particle.ANGRY_VILLAGER, 6, 0.5, 0);
        Fx.ring(player.getLocation().add(0, 0.1, 0), 1.4, 24, p -> Fx.dust(p, RAGE, 1.6f, 1, 0.05));
        Fx.sound(chest, Sound.ENTITY_PIGLIN_BRUTE_ANGRY, 1f, 0.8f);
        Fx.sound(chest, Sound.ENTITY_RAVAGER_ROAR, 0.5f, 1.3f);
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "<white>+" + pct(d("passive.melee-damage-per-piece", 0.03)) + "</white> melee damage and extra knockback per piece.";
    }

    @Override
    public String abilityText() {
        return "Go <red>Berserk</red> for <white>" + n(d("ability.duration", 8)) + "s</white>: <white>+"
                + pct(d("ability.damage-bonus", 0.3)) + "</white> melee damage, extra speed, and lifesteal.";
    }
}
