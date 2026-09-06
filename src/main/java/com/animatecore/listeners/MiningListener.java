package com.animatecore.listeners;

import com.animatecore.AnimateCorePlugin;
import com.animatecore.animation.ToolKind;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.SoundCategory;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.ItemStack;

import java.util.EnumSet;
import java.util.Set;

/** Impact FX for blocks actually being broken - layered on top of the swing {@link ActionListener} started. */
public class MiningListener implements Listener {

    private static final Set<Material> ORES = EnumSet.of(
            Material.COAL_ORE, Material.DEEPSLATE_COAL_ORE, Material.IRON_ORE, Material.DEEPSLATE_IRON_ORE,
            Material.COPPER_ORE, Material.DEEPSLATE_COPPER_ORE, Material.GOLD_ORE, Material.DEEPSLATE_GOLD_ORE,
            Material.REDSTONE_ORE, Material.DEEPSLATE_REDSTONE_ORE, Material.LAPIS_ORE, Material.DEEPSLATE_LAPIS_ORE,
            Material.DIAMOND_ORE, Material.DEEPSLATE_DIAMOND_ORE, Material.EMERALD_ORE, Material.DEEPSLATE_EMERALD_ORE,
            Material.NETHER_GOLD_ORE, Material.NETHER_QUARTZ_ORE, Material.ANCIENT_DEBRIS);

    private static final Set<Material> DIGGABLE = EnumSet.of(
            Material.DIRT, Material.GRASS_BLOCK, Material.SAND, Material.GRAVEL, Material.CLAY,
            Material.SOUL_SAND, Material.SOUL_SOIL, Material.MYCELIUM, Material.PODZOL, Material.FARMLAND,
            Material.DIRT_PATH, Material.ROOTED_DIRT, Material.MUD);

    private static final Set<Material> CROPS = EnumSet.of(
            Material.WHEAT, Material.CARROTS, Material.POTATOES, Material.BEETROOTS, Material.NETHER_WART,
            Material.HAY_BLOCK);

    private final AnimateCorePlugin plugin;

    public MiningListener(AnimateCorePlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler(ignoreCancelled = true)
    public void onBreak(BlockBreakEvent event) {
        if (!plugin.getAnimateConfig().miningEnabled() && !plugin.getAnimateConfig().choppingEnabled()) return;

        Player player = event.getPlayer();
        ItemStack held = player.getInventory().getItemInMainHand();
        ToolKind tool = ToolKind.fromItem(held);
        Block block = event.getBlock();
        Material type = block.getType();

        if (tool == ToolKind.AXE && ActionListener.isLog(type)) {
            if (plugin.getAnimateConfig().choppingEnabled() && plugin.getAnimateConfig().timberFxEnabled()) {
                plugin.getChoppingFx().timberBurst(block);
            }
            return;
        }

        if (!plugin.getAnimateConfig().miningEnabled()) return;

        if (tool == ToolKind.PICKAXE && ORES.contains(type)) {
            if (plugin.getAnimateConfig().oreSparkleEnabled()) {
                block.getWorld().spawnParticle(Particle.HAPPY_VILLAGER, block.getLocation().add(0.5, 0.5, 0.5), 8, 0.25, 0.25, 0.25);
                block.getWorld().playSound(block.getLocation(), "animatecore.tool.pickaxe.ore", SoundCategory.BLOCKS, 1.0f, 1.0f);
            }
        } else if (tool == ToolKind.SHOVEL && DIGGABLE.contains(type)) {
            block.getWorld().spawnParticle(Particle.BLOCK, block.getLocation().add(0.5, 0.5, 0.5), 10, 0.3, 0.1, 0.3, type.createBlockData());
        } else if (tool == ToolKind.HOE && CROPS.contains(type)) {
            block.getWorld().spawnParticle(Particle.HAPPY_VILLAGER, block.getLocation().add(0.5, 0.5, 0.5), 5, 0.25, 0.25, 0.25);
        }
    }
}
