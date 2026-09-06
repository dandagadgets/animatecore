package com.animatecore.animation;

import org.bukkit.Material;
import org.bukkit.Sound;
import org.bukkit.inventory.ItemStack;

import java.util.EnumSet;
import java.util.Set;

/**
 * Every tool/weapon AnimateCore gives a distinct swing animation, model and sound set to.
 * {@code modelBase} is the CustomModelData value that plays the tool's idle/base look; each swing
 * frame is {@code modelBase + frameIndex} (see {@link com.animatecore.items.ModelData}).
 */
public enum ToolKind {

    SWORD(1000, "sword", true, false, false),
    AXE(1100, "axe", true, true, false),
    PICKAXE(1200, "pickaxe", true, false, true),
    SHOVEL(1300, "shovel", true, false, true),
    HOE(1400, "hoe", true, false, true),
    SPEAR(1500, "spear", true, false, false),
    MACE(1600, "mace", true, false, false),
    FIST(1700, "fist", false, false, false);

    private static final Set<Material> SWORDS = EnumSet.of(
            Material.WOODEN_SWORD, Material.STONE_SWORD, Material.IRON_SWORD,
            Material.GOLDEN_SWORD, Material.DIAMOND_SWORD, Material.NETHERITE_SWORD);
    private static final Set<Material> AXES = EnumSet.of(
            Material.WOODEN_AXE, Material.STONE_AXE, Material.IRON_AXE,
            Material.GOLDEN_AXE, Material.DIAMOND_AXE, Material.NETHERITE_AXE);
    private static final Set<Material> PICKAXES = EnumSet.of(
            Material.WOODEN_PICKAXE, Material.STONE_PICKAXE, Material.IRON_PICKAXE,
            Material.GOLDEN_PICKAXE, Material.DIAMOND_PICKAXE, Material.NETHERITE_PICKAXE);
    private static final Set<Material> SHOVELS = EnumSet.of(
            Material.WOODEN_SHOVEL, Material.STONE_SHOVEL, Material.IRON_SHOVEL,
            Material.GOLDEN_SHOVEL, Material.DIAMOND_SHOVEL, Material.NETHERITE_SHOVEL);
    private static final Set<Material> HOES = EnumSet.of(
            Material.WOODEN_HOE, Material.STONE_HOE, Material.IRON_HOE,
            Material.GOLDEN_HOE, Material.DIAMOND_HOE, Material.NETHERITE_HOE);

    /** AnimateCore's spear is a re-skinned Trident (no vanilla spear item exists to build on). */
    private static final Material SPEAR_BASE = Material.TRIDENT;
    /** Mace is a real vanilla 1.21 item; AnimateCore re-poses it with its own frame set. */
    private static final Material MACE_BASE = Material.MACE;

    public final int modelBase;
    public final String id;
    public final boolean isWeaponOrTool;
    public final boolean choppingTool;
    public final boolean miningTool;

    ToolKind(int modelBase, String id, boolean isWeaponOrTool, boolean choppingTool, boolean miningTool) {
        this.modelBase = modelBase;
        this.id = id;
        this.isWeaponOrTool = isWeaponOrTool;
        this.choppingTool = choppingTool;
        this.miningTool = miningTool;
    }

    public static ToolKind fromItem(ItemStack stack) {
        if (stack == null || stack.getType().isAir()) {
            return FIST;
        }
        Material m = stack.getType();
        if (SWORDS.contains(m)) return SWORD;
        if (AXES.contains(m)) return AXE;
        if (PICKAXES.contains(m)) return PICKAXE;
        if (SHOVELS.contains(m)) return SHOVEL;
        if (HOES.contains(m)) return HOE;
        if (m == SPEAR_BASE) return SPEAR;
        if (m == MACE_BASE) return MACE;
        return FIST;
    }

    public Sound swingSound() {
        return switch (this) {
            case SWORD -> Sound.ITEM_TRIDENT_RIPTIDE_1;
            case AXE -> Sound.ITEM_AXE_STRIP;
            case PICKAXE -> Sound.BLOCK_STONE_HIT;
            case SHOVEL -> Sound.BLOCK_GRAVEL_HIT;
            case HOE -> Sound.ITEM_HOE_TILL;
            case SPEAR -> Sound.ITEM_TRIDENT_THROW;
            case MACE -> Sound.ITEM_MACE_SMASH_GROUND;
            case FIST -> Sound.ENTITY_PLAYER_ATTACK_WEAK;
        };
    }

    /** Custom sound event key in the resource pack's sounds.json, played instead of the vanilla fallback. */
    public String customSwingSoundKey() {
        return "animatecore.tool." + id + ".swing";
    }

    public String customHitSoundKey() {
        return "animatecore.tool." + id + ".hit";
    }
}
