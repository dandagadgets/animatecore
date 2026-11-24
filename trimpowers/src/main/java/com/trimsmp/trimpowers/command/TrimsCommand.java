package com.trimsmp.trimpowers.command;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.perk.Perk;
import com.trimsmp.trimpowers.perk.PerkParams;
import com.trimsmp.trimpowers.potion.PotionPassive;
import com.trimsmp.trimpowers.potion.PotionPassiveManager;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.trim.TrimProfile;
import com.trimsmp.trimpowers.util.Text;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.HoverEvent;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.Registry;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabExecutor;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ArmorMeta;
import org.bukkit.inventory.meta.trim.ArmorTrim;
import org.bukkit.inventory.meta.trim.TrimMaterial;
import org.bukkit.inventory.meta.trim.TrimPattern;
import org.bukkit.potion.PotionEffectType;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** /trims [info|list|ability|hud|give|effect|cleanse|resetcd|reload] */
public final class TrimsCommand implements TabExecutor {

    private static final List<String> PLAYER_SUBS = List.of("info", "list", "ability", "hud", "help");
    private static final List<String> ADMIN_SUBS = List.of("editor", "potion", "perk", "give", "effect", "cleanse", "resetcd", "reload");
    private static final List<String> MATERIALS = List.of("quartz", "iron", "netherite", "redstone", "copper",
            "gold", "emerald", "diamond", "lapis", "amethyst");
    private static final Material[] NETHERITE_SET = {Material.NETHERITE_HELMET, Material.NETHERITE_CHESTPLATE,
            Material.NETHERITE_LEGGINGS, Material.NETHERITE_BOOTS};

    private final TrimPowersPlugin plugin;

    public TrimsCommand(TrimPowersPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        String sub = args.length == 0 ? "info" : args[0].toLowerCase(Locale.ROOT);
        if (ADMIN_SUBS.contains(sub) && !sender.hasPermission("trimpowers.admin")) {
            Text.send(sender, "<red>You don't have permission to do that.");
            return true;
        }
        switch (sub) {
            case "info" -> info(sender);
            case "list" -> list(sender);
            case "ability", "use" -> {
                if (sender instanceof Player player) {
                    plugin.powers().tryActivate(player, true);
                } else {
                    Text.send(sender, "<red>Only players can use abilities.");
                }
            }
            case "hud" -> {
                if (sender instanceof Player player) {
                    boolean shown = plugin.hud().toggle(player);
                    Text.send(player, "Trim HUD " + (shown ? "<green>shown" : "<red>hidden") + "<gray>.");
                }
            }
            case "give" -> give(sender, args);
            case "effect" -> effect(sender, args);
            case "cleanse" -> cleanse(sender, args);
            case "resetcd" -> resetCooldowns(sender, args);
            case "editor" -> {
                if (sender instanceof Player player) {
                    plugin.editor().openMain(player);
                } else {
                    Text.send(sender, "<red>Only players can open the editor. Use /trims potion or /trims perk instead.");
                }
            }
            case "potion", "potions" -> potionCommand(sender, args);
            case "perk", "perks" -> perkCommand(sender, args);
            case "reload" -> {
                plugin.reload();
                Text.send(sender, "<green>Config reloaded.");
            }
            default -> help(sender);
        }
        return true;
    }

    private void help(CommandSender sender) {
        Text.raw(sender, Text.PREFIX + "<white>Trim Powers</white> <gray>— wear a full trimmed set, gain powers.");
        Text.raw(sender, " <gray>Wear a <white>full set</white> (all 4 armor pieces with the same trim) to unlock that trim's"
                + " <white>passive</white>, <white>potions</white>, <white>signature passives</white> and <white>ability</white>.");
        if (plugin.settings().sneakSwapTrigger()) {
            Text.raw(sender, " <gray>Use your ability: <white>Sneak + F</white> (swap hands) or <white>/trims ability</white>.");
        } else {
            Text.raw(sender, " <gray>Use your ability: <white>/trims ability</white>.");
        }
        Text.raw(sender, " <white>/trims info</white> <gray>your trim · <white>/trims list</white> <gray>all trims · <white>/trims hud</white> <gray>toggle HUD");
        if (sender.hasPermission("trimpowers.admin")) {
            Text.raw(sender, " <dark_gray>admin: <gold>/trims editor</gold> <gray>choose each trim's potions and passives");
            Text.raw(sender, " <dark_gray>admin: <gray>/trims potion <trim> add|remove|clear|list · perk <trim> add|remove|list");
            Text.raw(sender, " <dark_gray>admin: <gray>/trims give <pattern> [material] [player] · effect <player> <effect> <seconds> [potency] · cleanse [player] · resetcd [player] · reload");
        }
    }

    private void info(CommandSender sender) {
        if (!(sender instanceof Player player)) {
            help(sender);
            return;
        }
        TrimProfile profile = plugin.tracker().refresh(player);
        TrimPower power = plugin.powers().get(profile.setKey());
        if (power == null) {
            if (profile.isEmpty()) {
                Text.send(player, "<gray>You aren't wearing any trimmed armor. See <white>/trims list</white> for what each trim does.");
                return;
            }
            Text.raw(player, Text.PREFIX + "<gray>No full set yet. Wear all <white>4</white> pieces with the same trim to activate it:");
            for (Map.Entry<String, Integer> entry : profile.counts().entrySet()) {
                TrimPower worn = plugin.powers().get(entry.getKey());
                if (worn != null) {
                    Text.raw(player, " " + worn.tag() + "■ " + worn.name() + " <gray>" + entry.getValue() + "/4 pieces");
                }
            }
            return;
        }
        if (!power.enabled()) {
            Text.send(player, power.tag() + power.name() + " <gray>set — <red>this trim is disabled on the server.");
            return;
        }
        Text.raw(player, Text.PREFIX + power.tag() + "<b>" + power.name() + " Set</b> <green>active");
        Text.raw(player, "  <dark_gray>Passive: <gray>" + power.passiveText());
        for (PotionPassive potion : plugin.potions().of(power.key())) {
            Text.raw(player, "  <dark_gray>Potion: <aqua>" + PotionPassiveManager.describe(potion));
        }
        for (Map.Entry<Perk, PerkParams> perk : plugin.perks().of(power.key()).entrySet()) {
            Text.raw(player, "  <dark_gray>Signature: <light_purple>" + perk.getKey().displayName() + " <gray>"
                    + perk.getKey().describe(perk.getValue()));
        }
        long remaining = plugin.powers().remainingMillis(player, power.key());
        String status = remaining > 0 ? "<gray>" + ((remaining + 999) / 1000) + "s" : "<green>ready";
        Text.raw(player, "  <dark_gray>Ability: " + power.tag() + power.abilityName()
                + " <dark_gray>[" + status + "<dark_gray>] <gray>" + power.abilityText());
    }

    private void list(CommandSender sender) {
        Text.raw(sender, Text.PREFIX + "<white>All trims</white> <dark_gray>(full set of 4 pieces · hover for details)");
        for (TrimPower power : plugin.powers().all()) {
            String hover = power.tag() + "<b>" + power.name() + " Set</b> <dark_gray>(all 4 pieces)\n"
                    + "<gray>Passive: <white>" + power.passiveText()
                    + extrasHover(power) + "\n"
                    + "<gray>Ability: " + power.tag() + power.abilityName() + "\n<white>" + power.abilityText() + "\n"
                    + "<dark_gray>Cooldown: " + power.cooldownSeconds() + "s" + (power.enabled() ? "" : " <red>(disabled)");
            Component line = Text.mm(" " + power.tag() + "■ " + power.name() + " <dark_gray>— <gray>" + power.abilityName())
                    .hoverEvent(HoverEvent.showText(Text.mm(hover)));
            sender.sendMessage(line);
        }
    }

    private String extrasHover(TrimPower power) {
        StringBuilder sb = new StringBuilder();
        for (PotionPassive potion : plugin.potions().of(power.key())) {
            sb.append("\n<gray>Potion: <aqua>").append(PotionPassiveManager.describe(potion));
        }
        for (Map.Entry<Perk, PerkParams> perk : plugin.perks().of(power.key()).entrySet()) {
            sb.append("\n<light_purple>").append(perk.getKey().displayName()).append(": <white>")
                    .append(perk.getKey().describe(perk.getValue()));
        }
        return sb.toString();
    }

    /** /trims potion <trim> add <effect> [level] | remove <effect> | clear | list */
    private void potionCommand(CommandSender sender, String[] args) {
        if (args.length < 3) {
            Text.send(sender, "<gray>Usage: /trims potion <trim> add <effect> [level] | remove <effect> | clear | list");
            return;
        }
        TrimPower power = plugin.powers().get(args[1].toLowerCase(Locale.ROOT));
        if (power == null) {
            Text.send(sender, "<red>Unknown trim: " + args[1]);
            return;
        }
        String action = args[2].toLowerCase(Locale.ROOT);
        switch (action) {
            case "list" -> {
                List<PotionPassive> potions = plugin.potions().of(power.key());
                Text.send(sender, power.tag() + power.name() + "<gray> potions: " + (potions.isEmpty() ? "<dark_gray>none" : ""));
                for (PotionPassive potion : potions) {
                    Text.raw(sender, " <aqua>" + PotionPassiveManager.describe(potion));
                }
            }
            case "clear" -> {
                plugin.potions().clear(power.key());
                Text.send(sender, "<green>Removed all potions from the " + power.name() + " trim.");
            }
            case "add", "set", "remove" -> {
                if (args.length < 4) {
                    Text.send(sender, "<red>Name a potion effect, e.g. speed, strength, night_vision.");
                    return;
                }
                PotionEffectType type = PotionPassiveManager.parseType(args[3]);
                if (type == null) {
                    Text.send(sender, "<red>Unknown (or instant) potion effect: " + args[3]);
                    return;
                }
                if (action.equals("remove")) {
                    boolean removed = plugin.potions().remove(power.key(), type);
                    Text.send(sender, removed ? "<green>Removed " + PotionPassiveManager.pretty(type) + " from " + power.name() + "."
                            : "<gray>" + power.name() + " doesn't give " + PotionPassiveManager.pretty(type) + ".");
                    return;
                }
                try {
                    int level = args.length >= 5 ? Integer.parseInt(args[4]) : 1;
                    plugin.potions().set(power.key(), type, level);
                    PotionPassive now = plugin.potions().find(power.key(), type);
                    Text.send(sender, "<green>The " + power.name() + " set now gives " + PotionPassiveManager.describe(now) + ".");
                } catch (NumberFormatException ex) {
                    Text.send(sender, "<red>Level must be a whole number.");
                }
            }
            default -> Text.send(sender, "<red>Use add, remove, clear or list.");
        }
    }

    /** /trims perk <trim> add|remove <perk> | list */
    private void perkCommand(CommandSender sender, String[] args) {
        if (args.length < 3) {
            Text.send(sender, "<gray>Usage: /trims perk <trim> add <perk> | remove <perk> | list");
            return;
        }
        TrimPower power = plugin.powers().get(args[1].toLowerCase(Locale.ROOT));
        if (power == null) {
            Text.send(sender, "<red>Unknown trim: " + args[1]);
            return;
        }
        String action = args[2].toLowerCase(Locale.ROOT);
        if (action.equals("list")) {
            Map<Perk, PerkParams> perks = plugin.perks().of(power.key());
            Text.send(sender, power.tag() + power.name() + "<gray> signature passives: " + (perks.isEmpty() ? "<dark_gray>none" : ""));
            for (Map.Entry<Perk, PerkParams> perk : perks.entrySet()) {
                Text.raw(sender, " <light_purple>" + perk.getKey().displayName() + " <gray>" + perk.getKey().describe(perk.getValue()));
            }
            return;
        }
        Perk perk = args.length >= 4 ? Perk.byId(args[3]) : null;
        if (perk == null) {
            Text.send(sender, "<red>Name a passive: " + String.join(", ", Arrays.stream(Perk.values()).map(Perk::id).toList()));
            return;
        }
        boolean has = plugin.perks().of(power.key()).containsKey(perk);
        boolean wantOn = action.equals("add");
        if (!wantOn && !action.equals("remove")) {
            Text.send(sender, "<red>Use add, remove or list.");
            return;
        }
        if (has != wantOn) {
            plugin.perks().toggle(power.key(), perk);
        }
        Text.send(sender, (wantOn ? "<green>" + power.name() + " now has " : "<green>" + power.name() + " no longer has ")
                + perk.displayName() + ".");
    }

    @SuppressWarnings("deprecation")
    private void give(CommandSender sender, String[] args) {
        if (args.length < 2) {
            Text.send(sender, "<gray>Usage: /trims give <pattern> [material] [player]");
            return;
        }
        TrimPattern pattern = Registry.TRIM_PATTERN.get(NamespacedKey.minecraft(args[1].toLowerCase(Locale.ROOT)));
        if (pattern == null) {
            Text.send(sender, "<red>Unknown trim pattern: " + args[1]);
            return;
        }
        String materialName = args.length >= 3 ? args[2].toLowerCase(Locale.ROOT) : "gold";
        TrimMaterial material = Registry.TRIM_MATERIAL.get(NamespacedKey.minecraft(materialName));
        if (material == null) {
            Text.send(sender, "<red>Unknown trim material: " + materialName);
            return;
        }
        Player target = args.length >= 4 ? Bukkit.getPlayerExact(args[3]) : sender instanceof Player p ? p : null;
        if (target == null) {
            Text.send(sender, "<red>Player not found.");
            return;
        }
        for (Material type : NETHERITE_SET) {
            ItemStack item = new ItemStack(type);
            ArmorMeta meta = (ArmorMeta) item.getItemMeta();
            meta.setTrim(new ArmorTrim(material, pattern));
            item.setItemMeta(meta);
            target.getInventory().addItem(item).values()
                    .forEach(left -> target.getWorld().dropItemNaturally(target.getLocation(), left));
        }
        Text.send(sender, "<green>Gave " + target.getName() + " a " + args[1].toLowerCase(Locale.ROOT)
                + " trimmed netherite set (" + materialName + ").");
    }

    private void effect(CommandSender sender, String[] args) {
        if (args.length < 4) {
            Text.send(sender, "<gray>Usage: /trims effect <player> <effect> <seconds> [potency]");
            return;
        }
        Player target = Bukkit.getPlayerExact(args[1]);
        EffectType type = EffectType.byId(args[2]);
        if (target == null || type == null) {
            Text.send(sender, "<red>Unknown " + (target == null ? "player" : "effect") + ".");
            return;
        }
        try {
            double seconds = Double.parseDouble(args[3]);
            double potency = args.length >= 5 ? Double.parseDouble(args[4]) : type.defaultPotency();
            var applied = plugin.effects().apply(target, type, (int) Math.round(seconds * 20), potency,
                    sender instanceof Player p ? p : null);
            if (applied != null && type == EffectType.ANCHORED && applied.location == null) {
                applied.location = target.getLocation().clone();
            }
            Text.send(sender, applied == null
                    ? "<red>" + target.getName() + " is immune right now."
                    : "<green>Applied " + type.displayName() + " to " + target.getName() + " for " + Text.num(seconds) + "s.");
        } catch (NumberFormatException ex) {
            Text.send(sender, "<red>Seconds and potency must be numbers.");
        }
    }

    private void cleanse(CommandSender sender, String[] args) {
        Player target = args.length >= 2 ? Bukkit.getPlayerExact(args[1]) : sender instanceof Player p ? p : null;
        if (target == null) {
            Text.send(sender, "<red>Player not found.");
            return;
        }
        int before = plugin.effects().active(target).size();
        plugin.effects().clear(target);
        Text.send(sender, "<green>Removed " + before + " custom effect(s) from " + target.getName() + ".");
    }

    private void resetCooldowns(CommandSender sender, String[] args) {
        Player target = args.length >= 2 ? Bukkit.getPlayerExact(args[1]) : sender instanceof Player p ? p : null;
        if (target == null) {
            Text.send(sender, "<red>Player not found.");
            return;
        }
        plugin.powers().resetCooldowns(target);
        Text.send(sender, "<green>Reset ability cooldowns for " + target.getName() + ".");
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        boolean admin = sender.hasPermission("trimpowers.admin");
        if (args.length == 1) {
            List<String> subs = new ArrayList<>(PLAYER_SUBS);
            if (admin) {
                subs.addAll(ADMIN_SUBS);
            }
            return filter(subs, args[0]);
        }
        if (!admin) {
            return List.of();
        }
        String sub = args[0].toLowerCase(Locale.ROOT);
        return switch (sub) {
            case "give" -> switch (args.length) {
                case 2 -> filter(plugin.powers().all().stream().map(TrimPower::key).toList(), args[1]);
                case 3 -> filter(MATERIALS, args[2]);
                case 4 -> filter(onlineNames(), args[3]);
                default -> List.of();
            };
            case "effect" -> switch (args.length) {
                case 2 -> filter(onlineNames(), args[1]);
                case 3 -> filter(Arrays.stream(EffectType.values()).map(EffectType::id).toList(), args[2]);
                case 4 -> List.of("5", "10");
                default -> List.of();
            };
            case "cleanse", "resetcd" -> args.length == 2 ? filter(onlineNames(), args[1]) : List.of();
            case "potion", "potions" -> switch (args.length) {
                case 2 -> filter(plugin.powers().all().stream().map(TrimPower::key).toList(), args[1]);
                case 3 -> filter(List.of("add", "remove", "clear", "list"), args[2]);
                case 4 -> filter(PotionPassiveManager.grantableTypes().stream().map(PotionPassiveManager::name).toList(), args[3]);
                case 5 -> List.of("1", "2", "3");
                default -> List.of();
            };
            case "perk", "perks" -> switch (args.length) {
                case 2 -> filter(plugin.powers().all().stream().map(TrimPower::key).toList(), args[1]);
                case 3 -> filter(List.of("add", "remove", "list"), args[2]);
                case 4 -> filter(Arrays.stream(Perk.values()).map(Perk::id).toList(), args[3]);
                default -> List.of();
            };
            default -> List.of();
        };
    }

    private static List<String> onlineNames() {
        return Bukkit.getOnlinePlayers().stream().map(Player::getName).toList();
    }

    private static List<String> filter(List<String> options, String prefix) {
        String lower = prefix.toLowerCase(Locale.ROOT);
        return options.stream().filter(o -> o.toLowerCase(Locale.ROOT).startsWith(lower)).toList();
    }
}
