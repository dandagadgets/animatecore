package com.animatecore.listeners;

import com.animatecore.AnimateCorePlugin;
import com.animatecore.animation.ToolKind;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.player.PlayerAnimationEvent;
import org.bukkit.event.player.PlayerAnimationType;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.ItemStack;
import org.bukkit.util.RayTraceResult;

/**
 * The universal swing trigger. Bukkit fires {@link PlayerAnimationEvent} for every left-click arm
 * swing - punches, block-breaking swipes and weapon attacks alike - so it is the single place that
 * starts the Blockbench swing animation; block-break/attack listeners layer impact-specific FX on top.
 */
public class ActionListener implements Listener {

    private final AnimateCorePlugin plugin;

    public ActionListener(AnimateCorePlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler(ignoreCancelled = true)
    public void onSwing(PlayerAnimationEvent event) {
        if (event.getAnimationType() != PlayerAnimationType.ARM_SWING) return;
        if (!plugin.getAnimateConfig().animationsEnabled()) return;

        Player player = event.getPlayer();
        ItemStack held = player.getInventory().getItemInMainHand();
        ToolKind tool = ToolKind.fromItem(held);

        plugin.getAnimationManager().playSwing(player, tool, EquipmentSlot.HAND);
        plugin.getAnimationManager().swingFeedback(player, tool);

        if (tool == ToolKind.AXE && plugin.getAnimateConfig().choppingEnabled()
                && plugin.getAnimateConfig().treeShakeEnabled()) {
            tryChopImpact(player);
        }
    }

    private void tryChopImpact(Player player) {
        RayTraceResult trace = player.rayTraceBlocks(5.0);
        if (trace == null || trace.getHitBlock() == null) return;
        Block block = trace.getHitBlock();
        if (!isLog(block.getType())) return;
        plugin.getChoppingFx().chopImpact(block, trace.getHitPosition());
    }

    @EventHandler(ignoreCancelled = true)
    public void onRightClick(PlayerInteractEvent event) {
        if (event.getAction() != Action.RIGHT_CLICK_BLOCK || event.getHand() != EquipmentSlot.HAND) return;
        Player player = event.getPlayer();
        ItemStack held = event.getItem();
        ToolKind tool = ToolKind.fromItem(held);
        Block block = event.getClickedBlock();
        if (block == null) return;

        if (tool == ToolKind.HOE && plugin.getAnimateConfig().miningEnabled() && isTillable(block.getType())) {
            plugin.getAnimationManager().playUse(player, tool, EquipmentSlot.HAND, () ->
                    player.getWorld().spawnParticle(Particle.HAPPY_VILLAGER, block.getLocation().add(0.5, 1, 0.5), 6, 0.3, 0.1, 0.3));
            plugin.getAnimationManager().playToolSound(player, tool, tool.customSwingSoundKey(), tool.swingSound(), 0.8f, 1.0f);
        } else if (tool == ToolKind.AXE && plugin.getAnimateConfig().choppingEnabled() && isLog(block.getType())) {
            plugin.getAnimationManager().playUse(player, tool, EquipmentSlot.HAND, () -> {
                Location at = block.getLocation().add(0.5, 0.5, 0.5);
                player.getWorld().spawnParticle(Particle.ITEM, at, 10, 0.3, 0.3, 0.3, 0, new ItemStack(Material.STICK));
            });
        }
    }

    public static boolean isLog(Material material) {
        String name = material.name();
        return (name.endsWith("_LOG") || name.endsWith("_WOOD") || name.endsWith("_STEM") || name.endsWith("_HYPHAE"))
                && !name.startsWith("STRIPPED_");
    }

    private boolean isTillable(Material material) {
        return material == Material.GRASS_BLOCK || material == Material.DIRT || material == Material.DIRT_PATH
                || material == Material.ROOTED_DIRT;
    }
}
