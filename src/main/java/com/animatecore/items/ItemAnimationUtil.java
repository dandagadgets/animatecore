package com.animatecore.items;

import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

/**
 * Thin helper around {@link ItemMeta#setCustomModelData(Integer)}. AnimateCore never persists these
 * changes to the underlying save data beyond the live ItemStack instance held in the player's hand -
 * frames are swapped on the actual stack in the inventory slot each tick and restored to the item's
 * real (or absent) CustomModelData once the animation finishes, so plugins/commands relying on the
 * item's true identity are unaffected between animations.
 */
public final class ItemAnimationUtil {

    private ItemAnimationUtil() {
    }

    public static void setFrame(ItemStack stack, int customModelData) {
        if (stack == null || stack.getType().isAir()) {
            return;
        }
        ItemMeta meta = stack.getItemMeta();
        if (meta == null) {
            return;
        }
        meta.setCustomModelData(customModelData);
        stack.setItemMeta(meta);
    }

    public static void clearFrame(ItemStack stack, Integer restoreTo) {
        if (stack == null || stack.getType().isAir()) {
            return;
        }
        ItemMeta meta = stack.getItemMeta();
        if (meta == null) {
            return;
        }
        meta.setCustomModelData(restoreTo);
        stack.setItemMeta(meta);
    }

    public static Integer currentFrame(ItemStack stack) {
        if (stack == null || stack.getType().isAir()) {
            return null;
        }
        ItemMeta meta = stack.getItemMeta();
        if (meta == null || !meta.hasCustomModelData()) {
            return null;
        }
        return meta.getCustomModelData();
    }
}
