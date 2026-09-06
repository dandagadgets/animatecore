package com.animatecore.animation;

import com.animatecore.AnimateCorePlugin;
import com.animatecore.items.ItemAnimationUtil;
import com.animatecore.items.ModelData;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.SoundCategory;
import org.bukkit.entity.Player;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.ItemStack;
import org.bukkit.scheduler.BukkitTask;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Drives the stop-motion CustomModelData swap that makes a held tool/weapon appear to swing through
 * the frames modeled in Blockbench. One active sequence per player; a new swing pre-empts an in-flight
 * one (matching how vanilla attack-cooldown interrupts an in-progress swing on a fast follow-up hit).
 */
public class AnimationManager {

    private final AnimateCorePlugin plugin;
    private final Map<UUID, BukkitTask> activeSequences = new HashMap<>();
    private final Map<UUID, Integer> restoreModelData = new HashMap<>();

    public AnimationManager(AnimateCorePlugin plugin) {
        this.plugin = plugin;
    }

    /** Quick wind-up -> follow-through swing, used for attacks, punches and plain block-breaking swings. */
    public void playSwing(Player player, ToolKind tool, EquipmentSlot hand) {
        playSequence(player, tool, hand, ModelData.SWING_START, ModelData.SWING_END, null);
    }

    /** Longer "use" animation (mining impact / chop / till / thrust) that ends on a caller-provided callback. */
    public void playUse(Player player, ToolKind tool, EquipmentSlot hand, Runnable onComplete) {
        playSequence(player, tool, hand, ModelData.USE_START, ModelData.USE_END, onComplete);
    }

    /** Single-frame flourish (e.g. a crit hit or mace ground-smash pose) held briefly then released. */
    public void playCrit(Player player, ToolKind tool, EquipmentSlot hand) {
        ItemStack stack = heldStack(player, hand);
        if (stack == null) return;
        beginSequence(player, stack);
        ItemAnimationUtil.setFrame(stack, ModelData.crit(tool));
        long holdTicks = 4L;
        BukkitTask task = plugin.getServer().getScheduler().runTaskLater(plugin, () -> endSequence(player, hand, null), holdTicks);
        activeSequences.put(player.getUniqueId(), task);
    }

    private void playSequence(Player player, ToolKind tool, EquipmentSlot hand, int frameStart, int frameEnd, Runnable onComplete) {
        if (!plugin.getAnimateConfig().animationsEnabled()) {
            if (onComplete != null) onComplete.run();
            return;
        }
        ItemStack stack = heldStack(player, hand);
        if (stack == null) {
            if (onComplete != null) onComplete.run();
            return;
        }
        beginSequence(player, stack);

        int frameTicks = Math.max(1, plugin.getAnimateConfig().swingFrameTicks());
        runFrame(player, hand, tool, frameEnd, frameStart, frameTicks, onComplete);
    }

    private void runFrame(Player player, EquipmentSlot hand, ToolKind tool, int frameEnd,
                           int frame, int frameTicks, Runnable onComplete) {
        ItemStack stack = heldStack(player, hand);
        if (stack == null || ToolKind.fromItem(stack) != tool) {
            // Player swapped items mid-swing; bail out cleanly rather than paint the new item.
            activeSequences.remove(player.getUniqueId());
            restoreModelData.remove(player.getUniqueId());
            if (onComplete != null) onComplete.run();
            return;
        }
        ItemAnimationUtil.setFrame(stack, tool.modelBase + frame);

        if (frame >= frameEnd) {
            BukkitTask task = plugin.getServer().getScheduler().runTaskLater(plugin,
                    () -> endSequence(player, hand, onComplete), frameTicks);
            activeSequences.put(player.getUniqueId(), task);
            return;
        }

        BukkitTask task = plugin.getServer().getScheduler().runTaskLater(plugin,
                () -> runFrame(player, hand, tool, frameEnd, frame + 1, frameTicks, onComplete),
                frameTicks);
        activeSequences.put(player.getUniqueId(), task);
    }

    private void beginSequence(Player player, ItemStack stack) {
        UUID id = player.getUniqueId();
        BukkitTask running = activeSequences.remove(id);
        if (running != null) {
            running.cancel();
        }
        // Only remember a restore point the first time we touch this stack in a burst of chained swings,
        // otherwise a swing that starts mid-swing would "restore" into another animation frame.
        restoreModelData.computeIfAbsent(id, k -> {
            Integer current = ItemAnimationUtil.currentFrame(stack);
            return current == null ? Integer.MIN_VALUE : current;
        });
    }

    private void endSequence(Player player, EquipmentSlot hand, Runnable onComplete) {
        UUID id = player.getUniqueId();
        activeSequences.remove(id);
        ItemStack stack = heldStack(player, hand);
        Integer restore = restoreModelData.remove(id);
        if (stack != null && restore != null) {
            ItemAnimationUtil.clearFrame(stack, restore == Integer.MIN_VALUE ? null : restore);
        }
        if (onComplete != null) onComplete.run();
    }

    public void cancel(Player player, EquipmentSlot hand) {
        UUID id = player.getUniqueId();
        BukkitTask task = activeSequences.remove(id);
        if (task != null) task.cancel();
        ItemStack stack = heldStack(player, hand);
        Integer restore = restoreModelData.remove(id);
        if (stack != null && restore != null) {
            ItemAnimationUtil.clearFrame(stack, restore == Integer.MIN_VALUE ? null : restore);
        }
    }

    private ItemStack heldStack(Player player, EquipmentSlot hand) {
        ItemStack stack = hand == EquipmentSlot.OFF_HAND
                ? player.getInventory().getItemInOffHand()
                : player.getInventory().getItemInMainHand();
        return stack.getType().isAir() ? null : stack;
    }

    // ---- Feedback helpers shared by the listeners ----------------------------------------------------

    public void swingFeedback(Player player, ToolKind tool) {
        if (!plugin.getAnimateConfig().particlesEnabled()) return;
        Location at = handLocation(player);
        switch (tool) {
            case SWORD -> player.getWorld().spawnParticle(Particle.SWEEP_ATTACK, at, 1, 0, 0, 0, 0);
            case AXE -> player.getWorld().spawnParticle(Particle.CRIT, at, 6, 0.15, 0.1, 0.15, 0.02);
            case PICKAXE -> player.getWorld().spawnParticle(Particle.CRIT, at, 4, 0.1, 0.1, 0.1, 0.01);
            case SHOVEL -> player.getWorld().spawnParticle(Particle.CLOUD, at, 3, 0.1, 0.05, 0.1, 0.01);
            case HOE -> player.getWorld().spawnParticle(Particle.HAPPY_VILLAGER, at, 3, 0.15, 0.1, 0.15, 0);
            case SPEAR -> player.getWorld().spawnParticle(Particle.CRIT, at, 5, 0.05, 0.05, 0.4, 0.05);
            case MACE -> player.getWorld().spawnParticle(Particle.EXPLOSION, at, 0, 0, 0, 0, 0);
            case FIST -> player.getWorld().spawnParticle(Particle.CLOUD, at, 2, 0.05, 0.05, 0.05, 0);
        }
        playToolSound(player, tool, tool.customSwingSoundKey(), tool.swingSound(), 0.8f, 1.0f);
    }

    public void hitFeedback(Player player, ToolKind tool, Location target) {
        if (!plugin.getAnimateConfig().particlesEnabled()) return;
        switch (tool) {
            case MACE -> player.getWorld().spawnParticle(Particle.EXPLOSION, target, 1, 0, 0, 0, 0);
            case SPEAR -> player.getWorld().spawnParticle(Particle.CRIT, target, 10, 0.2, 0.2, 0.2, 0.1);
            default -> player.getWorld().spawnParticle(Particle.CRIT, target, 6, 0.2, 0.2, 0.2, 0.08);
        }
        playToolSound(player, tool, tool.customHitSoundKey(), Sound.ENTITY_PLAYER_ATTACK_STRONG, 1.0f, 1.0f);
    }

    public void playToolSound(Player player, ToolKind tool, String customKey, Sound fallback, float volume, float pitch) {
        if (plugin.getAnimateConfig().customSoundsEnabled()) {
            player.getWorld().playSound(player.getLocation(), customKey, SoundCategory.PLAYERS, volume, pitch);
        } else {
            player.getWorld().playSound(player.getLocation(), fallback, SoundCategory.PLAYERS, volume, pitch);
        }
    }

    private Location handLocation(Player player) {
        return player.getEyeLocation().add(player.getLocation().getDirection().normalize().multiply(0.9)).subtract(0, 0.3, 0);
    }
}
