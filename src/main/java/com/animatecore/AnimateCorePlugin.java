package com.animatecore;

import com.animatecore.animation.AnimationManager;
import com.animatecore.cinematic.CinematicManager;
import com.animatecore.commands.AnimateCoreCommand;
import com.animatecore.config.AnimateCoreConfig;
import com.animatecore.fx.ChoppingFx;
import com.animatecore.listeners.ActionListener;
import com.animatecore.listeners.CombatListener;
import com.animatecore.listeners.EatListener;
import com.animatecore.listeners.JoinListener;
import com.animatecore.listeners.MiningListener;
import com.animatecore.listeners.SwimListener;
import com.animatecore.roll.RollListener;
import com.animatecore.roll.RollManager;
import org.bukkit.plugin.java.JavaPlugin;

public class AnimateCorePlugin extends JavaPlugin {

    private AnimateCoreConfig animateConfig;
    private AnimationManager animationManager;
    private RollManager rollManager;
    private CinematicManager cinematicManager;
    private ChoppingFx choppingFx;
    private SwimListener swimListener;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        this.animateConfig = new AnimateCoreConfig(this);
        this.animationManager = new AnimationManager(this);
        this.rollManager = new RollManager(this);
        this.cinematicManager = new CinematicManager(this);
        this.choppingFx = new ChoppingFx(this);

        cinematicManager.loadAll();

        getServer().getPluginManager().registerEvents(new ActionListener(this), this);
        getServer().getPluginManager().registerEvents(new MiningListener(this), this);
        getServer().getPluginManager().registerEvents(new CombatListener(this), this);
        getServer().getPluginManager().registerEvents(new EatListener(this), this);
        getServer().getPluginManager().registerEvents(new RollListener(this), this);
        getServer().getPluginManager().registerEvents(new JoinListener(this), this);

        swimListener = new SwimListener(this);
        swimListener.start();

        AnimateCoreCommand command = new AnimateCoreCommand(this);
        var pluginCommand = getCommand("animatecore");
        if (pluginCommand != null) {
            pluginCommand.setExecutor(command);
            pluginCommand.setTabCompleter(command);
        }

        boolean protocolLib = getServer().getPluginManager().getPlugin("ProtocolLib") != null;
        getLogger().info("AnimateCore enabled. ProtocolLib camera-lock " + (protocolLib ? "available." : "not installed (using portable spectator camera)."));
    }

    @Override
    public void onDisable() {
        if (cinematicManager != null) {
            cinematicManager.stopAll();
        }
        if (swimListener != null) {
            swimListener.stop();
        }
    }

    public AnimateCoreConfig getAnimateConfig() {
        return animateConfig;
    }

    public AnimationManager getAnimationManager() {
        return animationManager;
    }

    public RollManager getRollManager() {
        return rollManager;
    }

    public CinematicManager getCinematicManager() {
        return cinematicManager;
    }

    public ChoppingFx getChoppingFx() {
        return choppingFx;
    }
}
