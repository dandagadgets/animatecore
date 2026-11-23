package com.trimsmp.trimpowers.power.impl;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Fx;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.entity.Player;
import org.bukkit.event.entity.EntityDamageEvent;

/** Ward (ancient cities): flat damage reduction, and a sculk shield that bursts when broken. */
public final class WardPower extends TrimPower {

    public WardPower(TrimPowersPlugin plugin) {
        super(plugin, "ward", "Ward", "Bulwark", 0x1E6E75);
    }

    @Override
    protected int defaultCooldown() {
        return 30;
    }

    @Override
    public double incoming(Player victim, EntityDamageEvent event, double damage, int pieces) {
        double reduction = Math.min(0.8, d("passive.damage-reduction-per-piece", 0.03) * pieces);
        return damage * (1 - reduction);
    }

    @Override
    public long activate(Player player) {
        effect(player, EffectType.WARDED, d("ability.duration", 10), d("ability.shield", 10), player);
        Location chest = player.getLocation().add(0, 1, 0);
        Fx.sphere(chest, 1.3, 40, p -> Fx.particle(p, Particle.SCULK_SOUL, 1, 0, 0.01));
        Fx.particle(chest, Particle.SCULK_CHARGE_POP, 20, 0.6, 0.02);
        Fx.sound(chest, Sound.ENTITY_WARDEN_SONIC_CHARGE, 0.7f, 1.4f);
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "Take <white>" + pct(d("passive.damage-reduction-per-piece", 0.03)) + "</white> less damage per piece.";
    }

    @Override
    public String abilityText() {
        return "Gain a <aqua>Warded</aqua> shield that absorbs <white>" + n(d("ability.shield", 10))
                + "</white> damage for <white>" + n(d("ability.duration", 10))
                + "s</white>. If it breaks, it releases a sonic pulse that knocks enemies away.";
    }
}
