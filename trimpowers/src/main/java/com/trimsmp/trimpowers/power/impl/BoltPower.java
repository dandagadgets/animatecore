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
import org.bukkit.entity.Player;

/** Bolt (trial chambers): faster swings, and an overcharge that chains lightning off every hit. */
public final class BoltPower extends TrimPower {

    public BoltPower(TrimPowersPlugin plugin) {
        super(plugin, "bolt", "Bolt", "Overcharge", 0xD9A441);
    }

    @Override
    protected int defaultCooldown() {
        return 30;
    }

    @Override
    public void collectAttributes(AttributeSink sink) {
        sink.add("attack_speed", d("passive.attack-speed", 0.16), AttributeModifier.Operation.ADD_SCALAR);
    }

    @Override
    public long activate(Player player) {
        effect(player, EffectType.OVERCHARGED, d("ability.duration", 8), d("ability.chain-damage", 3), player);
        Location chest = player.getLocation().add(0, 1, 0);
        Fx.sphere(chest, 1.2, 50, p -> Fx.particle(p, Particle.ELECTRIC_SPARK, 1, 0, 0.05));
        Fx.particle(chest, Particle.WAX_OFF, 20, 0.6, 0.5);
        Fx.sound(chest, Sound.ITEM_TRIDENT_THUNDER, 0.6f, 1.4f);
        if (b("ability.lightning-visual", false)) {
            player.getWorld().strikeLightningEffect(player.getLocation());
        }
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "<white>+" + pct(d("passive.attack-speed", 0.16)) + "</white> attack speed.";
    }

    @Override
    public String abilityText() {
        int chain = (int) plugin.settings().effect("overcharged", "chain-targets", 3);
        return "<gold>Overcharge</gold> for <white>" + n(d("ability.duration", 8)) + "s</white>: melee hits arc lightning to <white>"
                + chain + "</white> nearby enemies for <white>" + n(d("ability.chain-damage", 3)) + "</white> damage and <yellow>Shock</yellow> them.";
    }
}
