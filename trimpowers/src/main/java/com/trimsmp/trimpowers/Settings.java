package com.trimsmp.trimpowers;

import org.bukkit.World;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.FileConfiguration;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/** Global settings from the {@code settings:} and {@code effects:} sections of config.yml. */
public final class Settings {

    private int piecesForAbility = 4;
    private boolean sneakSwapTrigger = true;
    private final Set<String> disabledWorlds = new HashSet<>();
    private boolean hudEnabled = true;
    private boolean hudShowReady = true;
    private boolean targetPlayers = true;
    private boolean targetHostileMobs = true;
    private boolean targetOtherMobs = false;
    private boolean respectProtection = true;
    private boolean bossCrowdControlImmunity = true;
    private boolean milkCleanses = true;
    private ConfigurationSection effects;

    public void load(FileConfiguration config) {
        piecesForAbility = Math.max(1, Math.min(4, config.getInt("settings.pieces-for-ability", 4)));
        sneakSwapTrigger = !"COMMAND_ONLY".equalsIgnoreCase(config.getString("settings.trigger", "SNEAK_SWAP"));
        disabledWorlds.clear();
        for (String world : config.getStringList("settings.disabled-worlds")) {
            disabledWorlds.add(world.toLowerCase(Locale.ROOT));
        }
        hudEnabled = config.getBoolean("settings.hud.enabled", true);
        hudShowReady = config.getBoolean("settings.hud.show-ready", true);
        targetPlayers = config.getBoolean("settings.targets.players", true);
        targetHostileMobs = config.getBoolean("settings.targets.hostile-mobs", true);
        targetOtherMobs = config.getBoolean("settings.targets.other-mobs", false);
        respectProtection = config.getBoolean("settings.targets.respect-protection", true);
        bossCrowdControlImmunity = config.getBoolean("settings.boss-crowd-control-immunity", true);
        milkCleanses = config.getBoolean("settings.milk-cleanses-debuffs", true);
        effects = config.getConfigurationSection("effects");
    }

    /** A value from {@code effects.<effect>.<key>}. */
    public double effect(String effect, String key, double def) {
        return effects == null ? def : effects.getDouble(effect + "." + key, def);
    }

    public boolean effectFlag(String effect, String key, boolean def) {
        return effects == null ? def : effects.getBoolean(effect + "." + key, def);
    }

    public int piecesForAbility() {
        return piecesForAbility;
    }

    public boolean sneakSwapTrigger() {
        return sneakSwapTrigger;
    }

    public boolean isDisabled(World world) {
        return world != null && disabledWorlds.contains(world.getName().toLowerCase(Locale.ROOT));
    }

    public boolean hudEnabled() {
        return hudEnabled;
    }

    public boolean hudShowReady() {
        return hudShowReady;
    }

    public boolean targetPlayers() {
        return targetPlayers;
    }

    public boolean targetHostileMobs() {
        return targetHostileMobs;
    }

    public boolean targetOtherMobs() {
        return targetOtherMobs;
    }

    public boolean respectProtection() {
        return respectProtection;
    }

    public boolean bossCrowdControlImmunity() {
        return bossCrowdControlImmunity;
    }

    public boolean milkCleanses() {
        return milkCleanses;
    }
}
