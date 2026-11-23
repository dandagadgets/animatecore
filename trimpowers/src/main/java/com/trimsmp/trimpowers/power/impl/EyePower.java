package com.trimsmp.trimpowers.power.impl;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Fx;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Eye (strongholds): night vision, and marking every enemy around you so they take extra damage. */
public final class EyePower extends TrimPower {

    private static final int NIGHT_VISION_TICKS = 320;
    private static final Color EYE = Color.fromRGB(0xb26bff);
    private final Set<UUID> nightVisionGiven = new HashSet<>();

    public EyePower(TrimPowersPlugin plugin) {
        super(plugin, "eye", "Eye", "All-Seeing Eye", 0x9B6BE0);
    }

    @Override
    protected int defaultCooldown() {
        return 30;
    }

    @Override
    public void passiveTick(Player player, int pieces) {
        if (pieces >= i("passive.night-vision-pieces", 2)) {
            PotionEffect current = player.getPotionEffect(PotionEffectType.NIGHT_VISION);
            if (current == null || current.getDuration() < 240) {
                player.addPotionEffect(new PotionEffect(PotionEffectType.NIGHT_VISION, NIGHT_VISION_TICKS, 0, true, false, true));
                nightVisionGiven.add(player.getUniqueId());
            }
        } else {
            clearPassive(player);
        }
    }

    @Override
    public void clearPassive(Player player) {
        if (nightVisionGiven.remove(player.getUniqueId())) {
            PotionEffect current = player.getPotionEffect(PotionEffectType.NIGHT_VISION);
            if (current != null && current.getDuration() <= NIGHT_VISION_TICKS) {
                player.removePotionEffect(PotionEffectType.NIGHT_VISION);
            }
        }
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
        return "Night vision while wearing <white>" + i("passive.night-vision-pieces", 2) + "+</white> pieces.";
    }

    @Override
    public String abilityText() {
        return "<light_purple>Mark</light_purple> every enemy within <white>" + n(d("ability.radius", 24))
                + "</white> blocks for <white>" + n(d("ability.mark-seconds", 8)) + "s</white>: they glow and take <white>+"
                + pct(d("ability.extra-damage-taken", 0.2)) + "</white> damage.";
    }
}
