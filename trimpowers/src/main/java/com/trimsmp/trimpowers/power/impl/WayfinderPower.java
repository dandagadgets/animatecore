package com.trimsmp.trimpowers.power.impl;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.ActiveEffect;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.power.AttributeSink;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Fx;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.attribute.AttributeModifier;
import org.bukkit.entity.Player;
import org.bukkit.event.entity.EntityRegainHealthEvent;

/** Wayfinder (trail ruins): slower hunger, and a two-step Recall that returns you to a placed anchor. */
public final class WayfinderPower extends TrimPower {

    public WayfinderPower(TrimPowersPlugin plugin) {
        super(plugin, "wayfinder", "Wayfinder", "Recall", 0xC28B5A);
    }

    @Override
    protected int defaultCooldown() {
        return 25;
    }

    @Override
    public boolean isMobility() {
        return true;
    }

    @Override
    public void collectAttributes(AttributeSink sink) {
        sink.add("movement_efficiency", d("passive.terrain-efficiency", 0.4), AttributeModifier.Operation.ADD_NUMBER);
    }

    /** Chance that a point of hunger loss is skipped. */
    public double hungerSaveChance() {
        return Math.min(1.0, d("passive.hunger-save-chance", 0.4));
    }

    @Override
    public long activate(Player player) {
        ActiveEffect anchor = plugin.effects().get(player, EffectType.ANCHORED);
        if (anchor == null || anchor.location == null) {
            double window = d("ability.anchor-seconds", 20);
            ActiveEffect placed = effect(player, EffectType.ANCHORED, window, 0, player);
            if (placed == null) {
                return NO_COOLDOWN;
            }
            placed.location = player.getLocation().clone();
            Fx.sound(player.getLocation(), Sound.BLOCK_RESPAWN_ANCHOR_SET_SPAWN, 0.8f, 1.3f);
            Fx.ring(player.getLocation().add(0, 0.1, 0), 0.9, 16, p -> Fx.particle(p, Particle.WAX_ON, 1, 0, 0));
            flash(player, tag() + "<b>⚓ Anchor set</b> <gray>— use again within <white>" + n(window) + "s</white> to Recall");
            return 1000L; // tiny cooldown so a double-press doesn't instantly recall
        }

        Location to = anchor.location;
        plugin.effects().remove(player, EffectType.ANCHORED);
        if (to.getWorld() == null || !to.getWorld().equals(player.getWorld())) {
            flash(player, "<red>Your anchor is in another world.");
            return NO_COOLDOWN;
        }
        Location from = player.getLocation();
        Fx.particle(from.clone().add(0, 1, 0), Particle.REVERSE_PORTAL, 40, 0.3, 0.1);
        Fx.sound(from, Sound.ENTITY_ENDERMAN_TELEPORT, 0.8f, 0.8f);
        if (player.isInsideVehicle()) {
            player.leaveVehicle();
        }
        Location target = to.clone();
        target.setYaw(from.getYaw());
        target.setPitch(from.getPitch());
        player.teleport(target);
        player.setFallDistance(0);
        effect(player, EffectType.CUSHIONED, 2, 0, player);

        double heal = d("ability.heal", 4);
        if (heal > 0) {
            player.heal(heal, EntityRegainHealthEvent.RegainReason.MAGIC);
        }
        if (b("ability.cleanse", true)) {
            plugin.effects().cleanse(player, true);
        }
        for (double y = 0; y < 3; y += 0.25) {
            Fx.particle(target.clone().add(0, y, 0), Particle.END_ROD, 1, 0.2, 0.01);
        }
        Fx.sound(target, Sound.BLOCK_RESPAWN_ANCHOR_CHARGE, 1f, 1.2f);
        return DEFAULT_COOLDOWN;
    }

    @Override
    public String passiveText() {
        return "<white>" + pct(d("passive.hunger-save-chance", 0.4))
                + "</white> chance to not lose hunger; rough terrain slows you less.";
    }

    @Override
    public String abilityText() {
        return "Use once to drop an anchor, again within <white>" + n(d("ability.anchor-seconds", 20))
                + "s</white> to teleport back to it, healing and cleansing debuffs.";
    }
}
