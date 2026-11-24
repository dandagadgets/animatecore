package com.trimsmp.trimpowers.gui;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.perk.Perk;
import com.trimsmp.trimpowers.perk.PerkParams;
import com.trimsmp.trimpowers.potion.PotionPassive;
import com.trimsmp.trimpowers.potion.PotionPassiveManager;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Text;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.TextDecoration;
import org.bukkit.Material;
import org.bukkit.Sound;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.ClickType;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.InventoryHolder;
import org.bukkit.inventory.ItemFlag;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.inventory.meta.PotionMeta;
import org.bukkit.potion.PotionEffectType;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * /trims editor - a chest menu where admins choose, for every trim, which permanent potion effects it gives and
 * which signature passives (perks) it has. Every click saves to config.yml and applies instantly.
 */
public final class TrimEditor implements Listener {

    private static final int[] TRIM_SLOTS = {10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 29, 30, 32, 33};

    private enum Page { MAIN, TRIM, POTIONS, PERKS }

    private static final class Holder implements InventoryHolder {
        final Page page;
        final String trim;
        final List<Object> slots = new ArrayList<>();
        Inventory inventory;

        Holder(Page page, String trim) {
            this.page = page;
            this.trim = trim;
        }

        @Override
        public Inventory getInventory() {
            return inventory;
        }
    }

    private final TrimPowersPlugin plugin;

    public TrimEditor(TrimPowersPlugin plugin) {
        this.plugin = plugin;
    }

    // ---- pages ----

    public void openMain(Player player) {
        Holder holder = new Holder(Page.MAIN, null);
        Inventory inv = create(holder, 45, "<dark_gray>Trim Editor");
        List<TrimPower> powers = new ArrayList<>(plugin.powers().all());
        for (int i = 0; i < powers.size() && i < TRIM_SLOTS.length; i++) {
            TrimPower power = powers.get(i);
            List<String> lore = new ArrayList<>(summary(power));
            lore.add("");
            lore.add("<yellow>Click to edit");
            inv.setItem(TRIM_SLOTS[i], item(trimIcon(power), power.tag() + "<b>" + power.name() + " Trim", lore, false));
            setSlot(holder, TRIM_SLOTS[i], power.key());
        }
        inv.setItem(40, item(Material.BOOK, "<gold>How it works", List.of(
                "<gray>Potions and passives apply while",
                "<gray>wearing the trim. Changes save to",
                "<gray>config.yml and apply instantly."), false));
        player.openInventory(inv);
    }

    private void openTrim(Player player, String trim) {
        TrimPower power = plugin.powers().get(trim);
        Holder holder = new Holder(Page.TRIM, trim);
        Inventory inv = create(holder, 27, "<dark_gray>Edit " + power.name() + " Trim");
        inv.setItem(4, item(trimIcon(power), power.tag() + "<b>" + power.name() + " Trim", summary(power), false));
        inv.setItem(11, potionItem(null, power.tag() + "<b>Potion Effects", List.of(
                "<gray>Permanent potion effects while",
                "<gray>wearing this trim.", "", "<yellow>Click to choose"), plugin.potions().of(trim).size() > 0));
        setSlot(holder, 11, "potions");
        inv.setItem(15, item(Material.NETHER_STAR, power.tag() + "<b>Signature Passives", List.of(
                "<gray>Special always-on passives for",
                "<gray>wearing the full set.", "", "<yellow>Click to choose"), !plugin.perks().of(trim).isEmpty()));
        setSlot(holder, 15, "perks");
        inv.setItem(18, item(Material.ARROW, "<gray>« Back", List.of(), false));
        setSlot(holder, 18, "back");
        player.openInventory(inv);
    }

    private void openPotions(Player player, String trim) {
        TrimPower power = plugin.powers().get(trim);
        Holder holder = new Holder(Page.POTIONS, trim);
        Inventory inv = create(holder, 54, "<dark_gray>" + power.name() + " » Potions");
        List<PotionEffectType> types = PotionPassiveManager.grantableTypes();
        for (int i = 0; i < types.size() && i < 45; i++) {
            PotionEffectType type = types.get(i);
            PotionPassive current = plugin.potions().find(trim, type);
            List<String> lore = new ArrayList<>();
            if (current == null) {
                lore.add("<dark_gray>Not given");
            } else {
                lore.add("<green>Gives " + PotionPassiveManager.describe(current) + " <gray>with <white>" + current.pieces()
                        + "</white> piece" + (current.pieces() == 1 ? "" : "s"));
            }
            lore.add("");
            lore.add("<yellow>Left-click<gray>: add / level up");
            lore.add("<yellow>Right-click<gray>: level down / remove");
            lore.add("<yellow>Shift-click<gray>: pieces needed (1-4)");
            String name = (current == null ? "<white>" : "<green><b>") + PotionPassiveManager.pretty(type)
                    + (current == null ? "" : " " + PotionPassiveManager.roman(current.level()));
            inv.setItem(i, potionItem(type, name, lore, current != null));
            setSlot(holder, i, type);
        }
        inv.setItem(45, item(Material.ARROW, "<gray>« Back", List.of(), false));
        setSlot(holder, 45, "back");
        inv.setItem(53, item(Material.BARRIER, "<red>Remove all potions", List.of("<gray>From the " + power.name() + " trim"), false));
        setSlot(holder, 53, "clear");
        player.openInventory(inv);
    }

    private void openPerks(Player player, String trim) {
        TrimPower power = plugin.powers().get(trim);
        Holder holder = new Holder(Page.PERKS, trim);
        Inventory inv = create(holder, 36, "<dark_gray>" + power.name() + " » Passives");
        Map<Perk, PerkParams> active = plugin.perks().of(trim);
        Perk[] perks = Perk.values();
        for (int i = 0; i < perks.length && i < 27; i++) {
            Perk perk = perks[i];
            PerkParams params = active.get(perk);
            boolean on = params != null;
            List<String> lore = new ArrayList<>(wrap("<gray>" + perk.describe(params != null ? params : new PerkParams(perk, Map.of()))));
            lore.add("");
            lore.add(on ? "<green><b>ON</b> <gray>— click to turn off" : "<red>OFF <gray>— click to turn on");
            if (!perk.defaults().isEmpty()) {
                lore.add("<dark_gray>Numbers: powers." + trim + ".perks." + perk.id());
            }
            inv.setItem(i, item(perk.icon(), (on ? "<green><b>" : "<white>") + perk.displayName(), lore, on));
            setSlot(holder, i, perk);
        }
        inv.setItem(27, item(Material.ARROW, "<gray>« Back", List.of(), false));
        setSlot(holder, 27, "back");
        inv.setItem(31, item(Material.BOOK, "<gold>Signature passives", List.of(
                "<gray>Active while wearing a full set",
                "<gray>(" + plugin.settings().piecesForAbility() + " pieces) of this trim.",
                "<gray>Any passive works on any trim."), false));
        player.openInventory(inv);
    }

    // ---- clicks ----

    @EventHandler
    public void onClick(InventoryClickEvent event) {
        if (!(event.getInventory().getHolder() instanceof Holder holder)) {
            return;
        }
        event.setCancelled(true);
        if (!(event.getWhoClicked() instanceof Player player) || event.getClickedInventory() != event.getView().getTopInventory()) {
            return;
        }
        if (!player.hasPermission("trimpowers.admin")) {
            player.closeInventory();
            return;
        }
        int slot = event.getRawSlot();
        Object target = slot < holder.slots.size() ? holder.slots.get(slot) : null;
        if (target == null) {
            return;
        }
        click(player);
        if ("back".equals(target)) {
            switch (holder.page) {
                case TRIM -> openMain(player);
                case POTIONS, PERKS -> openTrim(player, holder.trim);
                default -> {
                }
            }
            return;
        }
        switch (holder.page) {
            case MAIN -> openTrim(player, (String) target);
            case TRIM -> {
                if ("potions".equals(target)) {
                    openPotions(player, holder.trim);
                } else if ("perks".equals(target)) {
                    openPerks(player, holder.trim);
                }
            }
            case POTIONS -> {
                if ("clear".equals(target)) {
                    plugin.potions().clear(holder.trim);
                } else if (target instanceof PotionEffectType type) {
                    editPotion(holder.trim, type, event.getClick());
                }
                openPotions(player, holder.trim);
            }
            case PERKS -> {
                if (target instanceof Perk perk) {
                    plugin.perks().toggle(holder.trim, perk);
                    openPerks(player, holder.trim);
                }
            }
        }
    }

    @EventHandler
    public void onDrag(InventoryDragEvent event) {
        if (event.getInventory().getHolder() instanceof Holder) {
            event.setCancelled(true);
        }
    }

    private void editPotion(String trim, PotionEffectType type, ClickType click) {
        PotionPassive current = plugin.potions().find(trim, type);
        int defaultPieces = plugin.settings().piecesForAbility();
        if (click.isShiftClick()) {
            if (current == null) {
                plugin.potions().set(trim, type, 1, 1);
            } else {
                plugin.potions().set(trim, type, current.level(), current.pieces() % 4 + 1);
            }
        } else if (click.isRightClick()) {
            if (current != null) {
                if (current.level() <= 1) {
                    plugin.potions().remove(trim, type);
                } else {
                    plugin.potions().set(trim, type, current.level() - 1, current.pieces());
                }
            }
        } else if (current == null) {
            plugin.potions().set(trim, type, 1, defaultPieces);
        } else {
            plugin.potions().set(trim, type, Math.min(10, current.level() + 1), current.pieces());
        }
    }

    // ---- helpers ----

    private List<String> summary(TrimPower power) {
        List<String> lore = new ArrayList<>();
        List<PotionPassive> potions = plugin.potions().of(power.key());
        lore.add("<gray>Potions:");
        if (potions.isEmpty()) {
            lore.add(" <dark_gray>none");
        }
        for (PotionPassive potion : potions) {
            lore.add(" <aqua>" + PotionPassiveManager.describe(potion) + " <dark_gray>(" + potion.pieces() + " pc)");
        }
        Map<Perk, PerkParams> perks = plugin.perks().of(power.key());
        lore.add("<gray>Signature passives:");
        if (perks.isEmpty()) {
            lore.add(" <dark_gray>none");
        }
        for (Perk perk : perks.keySet()) {
            lore.add(" <light_purple>" + perk.displayName());
        }
        return lore;
    }

    private static Material trimIcon(TrimPower power) {
        Material material = Material.matchMaterial(power.key().toUpperCase(Locale.ROOT) + "_ARMOR_TRIM_SMITHING_TEMPLATE");
        return material != null ? material : Material.PAPER;
    }

    private static Inventory create(Holder holder, int size, String title) {
        Inventory inventory = org.bukkit.Bukkit.createInventory(holder, size, Text.mm(title));
        holder.inventory = inventory;
        return inventory;
    }

    private static void setSlot(Holder holder, int slot, Object value) {
        while (holder.slots.size() <= slot) {
            holder.slots.add(null);
        }
        holder.slots.set(slot, value);
    }

    private static ItemStack item(Material material, String name, List<String> lore, boolean glow) {
        ItemStack stack = new ItemStack(material);
        decorate(stack, name, lore, glow);
        return stack;
    }

    private static ItemStack potionItem(PotionEffectType type, String name, List<String> lore, boolean glow) {
        ItemStack stack = new ItemStack(Material.POTION);
        if (type != null && stack.getItemMeta() instanceof PotionMeta meta) {
            meta.setColor(type.getColor());
            stack.setItemMeta(meta);
        }
        decorate(stack, name, lore, glow);
        return stack;
    }

    private static void decorate(ItemStack stack, String name, List<String> lore, boolean glow) {
        ItemMeta meta = stack.getItemMeta();
        meta.displayName(plain(name));
        List<Component> lines = new ArrayList<>();
        for (String line : lore) {
            lines.add(plain(line));
        }
        meta.lore(lines);
        meta.addItemFlags(ItemFlag.HIDE_ADDITIONAL_TOOLTIP, ItemFlag.HIDE_ATTRIBUTES, ItemFlag.HIDE_ENCHANTS);
        meta.setEnchantmentGlintOverride(glow);
        stack.setItemMeta(meta);
    }

    private static Component plain(String miniMessage) {
        return Text.mm(miniMessage).decoration(TextDecoration.ITALIC, false);
    }

    /** Splits a long description into lore lines of ~34 visible characters. */
    private static List<String> wrap(String miniMessage) {
        List<String> lines = new ArrayList<>();
        StringBuilder line = new StringBuilder();
        int visible = 0;
        for (String word : miniMessage.split(" ")) {
            int length = word.replaceAll("<[^>]*>", "").length();
            if (visible > 0 && visible + length > 34) {
                lines.add(line.toString());
                line = new StringBuilder("<gray>");
                visible = 0;
            }
            if (visible > 0) {
                line.append(' ');
                visible++;
            }
            line.append(word);
            visible += length;
        }
        if (!line.isEmpty()) {
            lines.add(line.toString());
        }
        return lines;
    }

    private static void click(Player player) {
        player.playSound(player.getLocation(), Sound.UI_BUTTON_CLICK, 0.5f, 1.2f);
    }
}
