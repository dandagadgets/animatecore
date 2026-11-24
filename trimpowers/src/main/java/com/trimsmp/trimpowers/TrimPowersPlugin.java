package com.trimsmp.trimpowers;

import com.trimsmp.trimpowers.command.TrimsCommand;
import com.trimsmp.trimpowers.effect.EffectManager;
import com.trimsmp.trimpowers.gui.TrimEditor;
import com.trimsmp.trimpowers.hud.HudTask;
import com.trimsmp.trimpowers.listener.AbilityListener;
import com.trimsmp.trimpowers.listener.CombatListener;
import com.trimsmp.trimpowers.listener.EffectListener;
import com.trimsmp.trimpowers.listener.PassiveListener;
import com.trimsmp.trimpowers.perk.PerkListener;
import com.trimsmp.trimpowers.perk.PerkManager;
import com.trimsmp.trimpowers.perk.PerkTask;
import com.trimsmp.trimpowers.potion.PotionPassiveManager;
import com.trimsmp.trimpowers.power.PowerManager;
import com.trimsmp.trimpowers.trim.TrimTracker;
import org.bukkit.command.PluginCommand;
import org.bukkit.entity.Player;
import org.bukkit.plugin.PluginManager;
import org.bukkit.plugin.java.JavaPlugin;

/**
 * TrimPowers - every armor trim pattern grants passive perks that scale with how many trimmed pieces you wear,
 * and a full set of one pattern unlocks an active ability (Shift + F by default). Abilities apply custom status
 * effects (bleed, stun, frostbite, shocked, ...) handled by {@link EffectManager}.
 */
public final class TrimPowersPlugin extends JavaPlugin {

    private Settings settings;
    private EffectManager effects;
    private PowerManager powers;
    private TrimTracker tracker;
    private HudTask hud;
    private PotionPassiveManager potions;
    private PerkManager perks;
    private PerkTask perkTask;
    private TrimEditor editor;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        this.settings = new Settings();
        settings.load(getConfig());

        this.effects = new EffectManager(this);
        this.powers = new PowerManager(this);
        powers.registerDefaults();
        powers.load(getConfig());
        this.potions = new PotionPassiveManager(this);
        potions.load(getConfig());
        this.perks = new PerkManager(this);
        perks.load(getConfig());
        this.perkTask = new PerkTask(this);
        this.editor = new TrimEditor(this);
        this.tracker = new TrimTracker(this);
        this.hud = new HudTask(this);

        PluginManager pm = getServer().getPluginManager();
        pm.registerEvents(new CombatListener(this), this);
        pm.registerEvents(new EffectListener(this), this);
        pm.registerEvents(new PassiveListener(this), this);
        pm.registerEvents(new AbilityListener(this), this);
        pm.registerEvents(new PerkListener(this, perkTask), this);
        pm.registerEvents(editor, this);

        TrimsCommand command = new TrimsCommand(this);
        PluginCommand pluginCommand = getCommand("trims");
        if (pluginCommand != null) {
            pluginCommand.setExecutor(command);
            pluginCommand.setTabCompleter(command);
        }

        effects.start();
        tracker.start();
        hud.start();
        perkTask.start();
        for (Player player : getServer().getOnlinePlayers()) {
            tracker.refresh(player);
        }
        getLogger().info("TrimPowers enabled with " + powers.all().size() + " trim powers.");
    }

    @Override
    public void onDisable() {
        if (hud != null) {
            hud.stop();
        }
        if (perkTask != null) {
            perkTask.stop();
        }
        if (tracker != null) {
            tracker.stop();
        }
        if (effects != null) {
            effects.stop();
        }
        if (powers != null) {
            powers.shutdown();
        }
    }

    /** Re-reads config.yml and re-applies every online player's passives. */
    public void reload() {
        reloadConfig();
        settings.load(getConfig());
        powers.load(getConfig());
        potions.load(getConfig());
        perks.load(getConfig());
        tracker.resetAll();
    }

    public Settings settings() {
        return settings;
    }

    public EffectManager effects() {
        return effects;
    }

    public PowerManager powers() {
        return powers;
    }

    public TrimTracker tracker() {
        return tracker;
    }

    public HudTask hud() {
        return hud;
    }

    public PotionPassiveManager potions() {
        return potions;
    }

    public PerkManager perks() {
        return perks;
    }

    public TrimEditor editor() {
        return editor;
    }
}
