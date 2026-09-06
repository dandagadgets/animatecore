package com.animatecore.items;

import org.bukkit.Material;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

/** CustomModelData for non-held "prop" models used by Display-entity actors (roll streak, cinematic rig). */
public final class PropModelData {

    private PropModelData() {
    }

    /** Base item every prop model overrides from; a plain flat paper card is invisible without an override. */
    public static final Material PROP_BASE_ITEM = Material.PAPER;

    public static final int ROLL_STREAK = 9000;
    public static final int CINEMATIC_ACTOR_KNIGHT = 9100;
    public static final int CINEMATIC_TORCH_FLAME = 9200;

    public static ItemStack propItem(int customModelData) {
        ItemStack stack = new ItemStack(PROP_BASE_ITEM);
        ItemMeta meta = stack.getItemMeta();
        meta.setCustomModelData(customModelData);
        stack.setItemMeta(meta);
        return stack;
    }
}
