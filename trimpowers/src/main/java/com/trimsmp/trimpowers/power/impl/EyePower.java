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

import java.util.List;

/** Eye (strongholds): longer reach, and marking every enemy around you so they take extra damage. */
public final class EyePower extends TrimPower {

    private static final Color EYE = Color.fromRGB(0xb26bff);

    public EyePower(TrimPowersPlugin plugin) {
        super(plugin, "eye", "Eye", "All-Seeing Eye", 0x9B6BE0);
    }

    @Override
    protected int defaultCooldown() {
        return 30;
    }

    @Override
    public void collectAttributes(AttributeSink sink) {
        sink.add("block_interaction_range", d("passive.block-reach", 2.0), AttributeModifier.Operation.ADD_NUMBER);
    }

    @Override
    public long activate(Player player) {
        double radius = d("ability.radius", 24);
        double seconds = d("ability.mark-seconds", 8);
        double bonus = d("ability.extra-damage-taken", 0.2);
        Location eye = player.getEyeLocation();
        List<LivingEntity> targets = enemies(player, player.getLocation(), radius);
        if (targets.isEmpty()) {
            flash(player, "<gray>The Eye sees no enemies nearby.");
            return NO_COOLDOWN;
        }
        Fx.sound(eye, Sound.ENTITY_ENDER_EYE_DEATH, 1f, 0.6f);
        Fx.sound(eye, Sound.BLOCK_END_PORTAL_FRAME_FILL, 1f, 0.8f);
        animate(10, t -> {
            double r = 1 + (radius * 0.5) * (t + 1) / 10.0;
            Fx.ring(eye, r, (int) (r * 6), p -> Fx.particle(p, Particle.END_ROD, 1, 0, 0));
            return true;
        });
        for (LivingEntity target : targets) {
            effect(target, EffectType.MARKED, seconds, bonus, player);
            Fx.line(eye, target.getEyeLocation(), 0.6, p -> Fx.dust(p, EYE, 0.8f, 1, 0));
            if (target instanceof Player marked) {
                marked.playSound(marked.getLocation(), Sound.ENTITY_ELDER_GUARDIAN_CURSE, 0.4f, 1.4f);
                if (b("ability.screen-effect", true)) {
                    marked.spawnParticle(Particle.ELDER_GUARDIAN, marked.getLocation(), 1);
                }
            }
        }
        flash(player, tag() + "<b>✦ All-Seeing Eye</b> <gray>marked <white>" + targets.size() + "</white> "
                + (targets.size() == 1 ? "enemy" : "enemies"));
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "<white>+" + n(d("passive.block-reach", 2.0)) + "</white> block reach (building and mining).";
    }

    @Override
    public String abilityText() {
        return "<light_purple>Mark</light_purple> every enemy within <white>" + n(d("ability.radius", 24))
                + "</white> blocks for <white>" + n(d("ability.mark-seconds", 8)) + "s</white>: they glow and take <white>+"
                + pct(d("ability.extra-damage-taken", 0.2)) + "</white> damage.";
    }
}
