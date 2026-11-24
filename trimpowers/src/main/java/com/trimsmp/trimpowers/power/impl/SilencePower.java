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

/** Silence (ancient cities): sneak fast and unheard by sculk, and vanish completely. */
public final class SilencePower extends TrimPower {

    public SilencePower(TrimPowersPlugin plugin) {
        super(plugin, "silence", "Silence", "Shadowstep", 0x2B3A4A);
    }

    @Override
    protected int defaultCooldown() {
        return 30;
    }

    @Override
    public void collectAttributes(AttributeSink sink) {
        sink.add("sneaking_speed", d("passive.sneak-speed", 0.6), AttributeModifier.Operation.ADD_SCALAR);
    }

    /** Whether sculk sensors and shriekers ignore the wearer. */
    public boolean sculkImmunity() {
        return b("passive.sculk-immunity", true);
    }

    @Override
    public long activate(Player player) {
        double seconds = d("ability.duration", 6);
        effect(player, EffectType.SHADOWSTEP, seconds, 0, player);
        Location chest = player.getLocation().add(0, 1, 0);
        Fx.particle(chest, Particle.SQUID_INK, 30, 0.4, 0.05);
        Fx.particle(chest, Particle.LARGE_SMOKE, 15, 0.4, 0.02);
        Fx.particle(chest, Particle.SCULK_SOUL, 8, 0.4, 0.03);
        Fx.sound(chest, Sound.ENTITY_ILLUSIONER_CAST_SPELL, 1f, 0.6f);
        Fx.sound(chest, Sound.ENTITY_WARDEN_NEARBY_CLOSER, 0.6f, 1.2f);
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "<white>+" + pct(d("passive.sneak-speed", 0.6)) + "</white> sneak speed"
                + (sculkImmunity() ? ", and sculk sensors and shriekers can't hear you." : ".");
    }

    @Override
    public String abilityText() {
        double bonus = plugin.settings().effect("shadowstep", "reveal-bonus-damage", 0.6);
        return "Vanish from players and mobs for <white>" + n(d("ability.duration", 6))
                + "s</white>. Your first hit out of it deals <white>+" + pct(bonus) + "</white> damage and causes <red>Bleed</red>.";
    }
}
