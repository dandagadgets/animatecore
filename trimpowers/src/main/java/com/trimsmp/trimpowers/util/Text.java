package com.trimsmp.trimpowers.util;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.minimessage.MiniMessage;
import org.bukkit.command.CommandSender;

/** MiniMessage helpers. */
public final class Text {

    public static final String PREFIX = "<gradient:#c9a26b:#e3c27e><b>Trims</b></gradient> <dark_gray>»</dark_gray> ";
    private static final MiniMessage MM = MiniMessage.miniMessage();

    private Text() {
    }

    public static Component mm(String miniMessage) {
        return MM.deserialize(miniMessage);
    }

    public static void send(CommandSender to, String miniMessage) {
        to.sendMessage(mm(PREFIX + miniMessage));
    }

    public static void raw(CommandSender to, String miniMessage) {
        to.sendMessage(mm(miniMessage));
    }

    /** Formats a number without a trailing ".0" (3.0 -> "3", 2.5 -> "2.5"). */
    public static String num(double value) {
        if (Math.abs(value - Math.rint(value)) < 1.0E-9) {
            return String.valueOf((long) Math.rint(value));
        }
        return String.valueOf(Math.round(value * 100.0) / 100.0);
    }

    /** 0.15 -> "15%". */
    public static String pct(double fraction) {
        return num(fraction * 100.0) + "%";
    }
}
