package com.animatecore.commands;

import com.animatecore.AnimateCorePlugin;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;

import java.util.ArrayList;
import java.util.List;

public class AnimateCoreCommand implements CommandExecutor, TabCompleter {

    private final AnimateCorePlugin plugin;

    public AnimateCoreCommand(AnimateCorePlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (args.length == 0) {
            sendHelp(sender);
            return true;
        }

        switch (args[0].toLowerCase()) {
            case "reload" -> {
                if (!sender.hasPermission("animatecore.admin")) {
                    sender.sendMessage(err("You don't have permission to do that."));
                    return true;
                }
                plugin.getAnimateConfig().reload();
                plugin.getCinematicManager().loadAll();
                sender.sendMessage(ok("AnimateCore config and cinematics reloaded."));
            }
            case "cinematic", "cutscene" -> handleCinematic(sender, args);
            case "roll" -> {
                if (!(sender instanceof Player player)) {
                    sender.sendMessage(err("Only players can roll."));
                    return true;
                }
                if (plugin.getRollManager().tryRoll(player)) {
                    sender.sendMessage(ok("Rolled!"));
                } else {
                    sender.sendMessage(err("Can't roll right now (on cooldown, airborne, or disabled)."));
                }
            }
            case "debug" -> {
                if (!(sender instanceof Player player)) {
                    sender.sendMessage(err("Only players can use this."));
                    return true;
                }
                var held = player.getInventory().getItemInMainHand();
                var tool = com.animatecore.animation.ToolKind.fromItem(held);
                sender.sendMessage(Component.text("Held tool: " + tool.id + " (modelBase=" + tool.modelBase + ")",
                        NamedTextColor.YELLOW));
            }
            default -> sendHelp(sender);
        }
        return true;
    }

    private void handleCinematic(CommandSender sender, String[] args) {
        if (!sender.hasPermission("animatecore.admin")) {
            sender.sendMessage(err("You don't have permission to do that."));
            return;
        }
        if (args.length < 2) {
            sender.sendMessage(err("Usage: /animatecore cinematic <play|stop|list> [name] [player]"));
            return;
        }
        switch (args[1].toLowerCase()) {
            case "list" -> sender.sendMessage(ok("Cinematics: " + String.join(", ", plugin.getCinematicManager().names())));
            case "play" -> {
                if (args.length < 3) {
                    sender.sendMessage(err("Usage: /animatecore cinematic play <name> [player]"));
                    return;
                }
                Player target = args.length >= 4 ? plugin.getServer().getPlayer(args[3])
                        : (sender instanceof Player p ? p : null);
                if (target == null) {
                    sender.sendMessage(err("Specify a player (console must supply one)."));
                    return;
                }
                boolean started = plugin.getCinematicManager().play(args[2], target.getLocation(), target);
                sender.sendMessage(started ? ok("Playing '" + args[2] + "' for " + target.getName() + ".")
                        : err("No cinematic named '" + args[2] + "' (needs at least 2 camera keyframes)."));
            }
            case "stop" -> {
                Player target = args.length >= 3 ? plugin.getServer().getPlayer(args[2])
                        : (sender instanceof Player p ? p : null);
                if (target == null) {
                    sender.sendMessage(err("Specify a player."));
                    return;
                }
                plugin.getCinematicManager().stop(target);
                sender.sendMessage(ok("Stopped cinematic for " + target.getName() + "."));
            }
            default -> sender.sendMessage(err("Usage: /animatecore cinematic <play|stop|list> [name] [player]"));
        }
    }

    private void sendHelp(CommandSender sender) {
        sender.sendMessage(Component.text("AnimateCore", NamedTextColor.GOLD));
        sender.sendMessage(Component.text("/animatecore roll", NamedTextColor.GRAY)
                .append(Component.text(" - manually trigger a dodge-roll", NamedTextColor.DARK_GRAY)));
        sender.sendMessage(Component.text("/animatecore cinematic <play|stop|list> [name] [player]", NamedTextColor.GRAY));
        sender.sendMessage(Component.text("/animatecore reload", NamedTextColor.GRAY)
                .append(Component.text(" - reload config + cinematics", NamedTextColor.DARK_GRAY)));
        sender.sendMessage(Component.text("/animatecore debug", NamedTextColor.GRAY)
                .append(Component.text(" - show the detected tool in your hand", NamedTextColor.DARK_GRAY)));
    }

    private Component ok(String msg) {
        return Component.text(msg, NamedTextColor.GREEN);
    }

    private Component err(String msg) {
        return Component.text(msg, NamedTextColor.RED);
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        List<String> out = new ArrayList<>();
        if (args.length == 1) {
            out.addAll(List.of("reload", "cinematic", "roll", "debug"));
        } else if (args.length == 2 && args[0].equalsIgnoreCase("cinematic")) {
            out.addAll(List.of("play", "stop", "list"));
        } else if (args.length == 3 && args[0].equalsIgnoreCase("cinematic") && args[1].equalsIgnoreCase("play")) {
            out.addAll(plugin.getCinematicManager().names());
        }
        String prefix = args[args.length - 1].toLowerCase();
        out.removeIf(s -> !s.toLowerCase().startsWith(prefix));
        return out;
    }
}
