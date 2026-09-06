package com.animatecore.config;

import com.animatecore.roll.RollTrigger;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.plugin.java.JavaPlugin;

/** Typed wrapper around {@code config.yml} so the rest of the plugin never touches raw config paths. */
public class AnimateCoreConfig {

    private final JavaPlugin plugin;
    private FileConfiguration cfg;

    public AnimateCoreConfig(JavaPlugin plugin) {
        this.plugin = plugin;
        reload();
    }

    public void reload() {
        plugin.reloadConfig();
        this.cfg = plugin.getConfig();
    }

    public boolean animationsEnabled() {
        return cfg.getBoolean("animations.enabled", true);
    }

    public int swingFrameTicks() {
        return cfg.getInt("animations.swing-frame-ticks", 1);
    }

    public boolean customSoundsEnabled() {
        return cfg.getBoolean("animations.custom-sounds", true);
    }

    public boolean particlesEnabled() {
        return cfg.getBoolean("animations.particles", true);
    }

    public boolean choppingEnabled() {
        return cfg.getBoolean("chopping.enabled", true);
    }

    public boolean timberFxEnabled() {
        return cfg.getBoolean("chopping.timber-fx", true);
    }

    public boolean treeShakeEnabled() {
        return cfg.getBoolean("chopping.tree-shake", true);
    }

    public boolean miningEnabled() {
        return cfg.getBoolean("mining.enabled", true);
    }

    public boolean oreSparkleEnabled() {
        return cfg.getBoolean("mining.ore-sparkle", true);
    }

    public boolean combatEnabled() {
        return cfg.getBoolean("combat.enabled", true);
    }

    public boolean weaponFxEnabled() {
        return cfg.getBoolean("combat.weapon-fx", true);
    }

    public boolean eatingEnabled() {
        return cfg.getBoolean("eating.enabled", true);
    }

    public boolean biteFxEnabled() {
        return cfg.getBoolean("eating.bite-fx", true);
    }

    public boolean swimmingEnabled() {
        return cfg.getBoolean("swimming.enabled", true);
    }

    public boolean bubbleTrailEnabled() {
        return cfg.getBoolean("swimming.bubble-trail", true);
    }

    public boolean rollEnabled() {
        return cfg.getBoolean("roll.enabled", true);
    }

    public RollTrigger rollTrigger() {
        try {
            return RollTrigger.valueOf(cfg.getString("roll.trigger", "SPRINT_THEN_SNEAK"));
        } catch (IllegalArgumentException ex) {
            return RollTrigger.SPRINT_THEN_SNEAK;
        }
    }

    public long rollCooldownMs() {
        return cfg.getLong("roll.cooldown-ms", 700);
    }

    public double rollDashStrength() {
        return cfg.getDouble("roll.dash-strength", 1.6);
    }

    public int rollInvulnerabilityTicks() {
        return cfg.getInt("roll.invulnerability-ticks", 6);
    }

    public float rollHungerCost() {
        return (float) cfg.getDouble("roll.hunger-cost", 1.0);
    }

    public boolean rollAllowInAir() {
        return cfg.getBoolean("roll.allow-in-air", false);
    }

    public boolean rollAllowInWater() {
        return cfg.getBoolean("roll.allow-in-water", true);
    }

    public boolean cinematicsEnabled() {
        return cfg.getBoolean("cinematics.enabled", true);
    }

    public boolean preferProtocolLibCamera() {
        return cfg.getBoolean("cinematics.prefer-protocollib-camera", true);
    }

    public boolean cinematicSkipOnSneak() {
        return cfg.getBoolean("cinematics.skip-on-sneak", true);
    }

    public String resourcePackUrl() {
        return cfg.getString("resource-pack.url", "");
    }

    public String resourcePackSha1() {
        return cfg.getString("resource-pack.sha1", "");
    }

    public String resourcePackPromptMessage() {
        return cfg.getString("resource-pack.prompt-message", "");
    }

    public boolean resourcePackForced() {
        return cfg.getBoolean("resource-pack.force", false);
    }
}
