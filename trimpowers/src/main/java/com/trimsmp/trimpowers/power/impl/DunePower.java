package com.trimsmp.trimpowers.power.impl;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.power.AttributeSink;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Fx;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.attribute.AttributeModifier;
import org.bukkit.block.data.BlockData;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.util.Vector;

/** Dune (desert pyramids): sturdy footing, and a blinding sandstorm that follows you. */
public final class DunePower extends TrimPower {

    private static final Color SAND = Color.fromRGB(0xdbc28f);
    private final BlockData sandData = Material.SAND.createBlockData();

    public DunePower(TrimPowersPlugin plugin) {
        super(plugin, "dune", "Dune", "Sandstorm", 0xE3C27E);
    }

    @Override
    protected int defaultCooldown() {
        return 25;
    }

    @Override
    public void collectAttributes(AttributeSink sink) {
        sink.add("knockback_resistance", d("passive.knockback-resistance", 0.32),
                AttributeModifier.Operation.ADD_NUMBER);
    }

    @Override
    public long activate(Player player) {
        int ticks = (int) Math.round(d("ability.duration", 5) * 20);
        double radius = d("ability.radius", 5);
        double damage = d("ability.damage-per-second", 1.5);
        int blindTicks = (int) Math.round(d("ability.blindness-seconds", 2) * 20);

        Fx.sound(player.getLocation(), Sound.ITEM_BRUSH_BRUSHING_SAND, 1.2f, 0.6f);
        Fx.sound(player.getLocation(), Sound.ENTITY_HUSK_AMBIENT, 0.7f, 0.6f);
        animate(ticks, t -> {
            if (!alive(player)) {
                return false;
            }
            Location center = player.getLocation().add(0, 0.1, 0);
            if (t % 2 == 0) {
                for (int arm = 0; arm < 3; arm++) {
                    for (int h = 0; h < 4; h++) {
                        double angle = t * 0.35 + arm * (2 * Math.PI / 3) + h * 0.6;
                        double r = radius * (0.35 + 0.65 * (h / 3.0));
                        Location point = center.clone().add(Math.cos(angle) * r, h * 0.7, Math.sin(angle) * r);
                        Fx.block(point, Particle.FALLING_DUST, sandData, 1, 0.2);
                        Fx.dust(point, SAND, 1.6f, 1, 0.3);
                    }
                }
            }
            if (t % 20 == 0) {
                Fx.sound(center, Sound.BLOCK_SAND_BREAK, 1f, 0.5f);
                for (LivingEntity target : enemies(player, center, radius)) {
                    hit(player, target, damage);
                    target.addPotionEffect(new PotionEffect(PotionEffectType.BLINDNESS, blindTicks, 0, false, false, true));
                    Vector push = target.getLocation().toVector().subtract(center.toVector()).setY(0);
                    if (push.lengthSquared() > 1.0E-4) {
                        target.setVelocity(target.getVelocity().add(push.normalize().multiply(0.35)));
                    }
                }
            }
            return true;
        });
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "<white>+" + pct(d("passive.knockback-resistance", 0.32)) + "</white> knockback resistance.";
    }

    @Override
    public String abilityText() {
        return "A <white>" + n(d("ability.duration", 5)) + "s</white> sandstorm around you damages and blinds enemies within <white>"
                + n(d("ability.radius", 5)) + "</white> blocks.";
    }
}
