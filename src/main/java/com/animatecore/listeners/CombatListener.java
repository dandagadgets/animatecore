package com.animatecore.listeners;

import com.animatecore.AnimateCorePlugin;
import com.animatecore.animation.ToolKind;
import org.bukkit.Particle;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.ItemStack;
import org.bukkit.util.Vector;

/** Per-weapon combat flourishes layered on top of the base swing {@link ActionListener} already started. */
public class CombatListener implements Listener {

    private final AnimateCorePlugin plugin;

    public CombatListener(AnimateCorePlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onHit(EntityDamageByEntityEvent event) {
        if (!plugin.getAnimateConfig().combatEnabled()) return;
        if (!(event.getDamager() instanceof Player player)) return;
        if (!(event.getEntity() instanceof LivingEntity victim)) return;

        ItemStack held = player.getInventory().getItemInMainHand();
        ToolKind tool = ToolKind.fromItem(held);

        plugin.getAnimationManager().hitFeedback(player, tool, victim.getEyeLocation());

        if (!plugin.getAnimateConfig().weaponFxEnabled()) return;

        boolean falling = player.getFallDistance() > 0 && !player.isOnGround();

        switch (tool) {
            case AXE -> {
                if (falling) {
                    plugin.getAnimationManager().playCrit(player, tool, EquipmentSlot.HAND);
                }
            }
            case SPEAR -> spearLunge(player, victim);
            case MACE -> {
                if (player.getFallDistance() >= 1.5) {
                    macSmash(player, victim);
                }
            }
            default -> {
            }
        }
    }

    /** Sprinting spear hits carry the player's momentum into the target for a piercing thrust feel. */
    private void spearLunge(Player player, LivingEntity victim) {
        if (!player.isSprinting()) return;
        Vector push = player.getLocation().getDirection().setY(0.05).normalize().multiply(0.5);
        victim.setVelocity(victim.getVelocity().add(push));
        victim.getWorld().spawnParticle(Particle.CRIT, victim.getLocation().add(0, 1, 0), 12, 0.15, 0.3, 0.15, 0.15);
    }

    /** Mirrors vanilla's fall-height mace bonus with a small knockback shockwave for nearby mobs too. */
    private void macSmash(Player player, LivingEntity victim) {
        victim.getWorld().spawnParticle(Particle.EXPLOSION, victim.getLocation(), 1);
        victim.getWorld().spawnParticle(Particle.CLOUD, victim.getLocation(), 20, 0.4, 0.1, 0.4, 0.05);
        double radius = 2.5;
        for (Entity nearby : victim.getNearbyEntities(radius, radius, radius)) {
            if (nearby instanceof LivingEntity le && !le.equals(player)) {
                Vector away = le.getLocation().toVector().subtract(victim.getLocation().toVector());
                if (away.lengthSquared() < 1.0E-4) continue;
                away.normalize().multiply(0.6).setY(0.3);
                le.setVelocity(le.getVelocity().add(away));
            }
        }
    }
}
