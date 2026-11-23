package com.trimsmp.trimpowers.power;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.ActiveEffect;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.util.Damage;
import com.trimsmp.trimpowers.util.Targets;
import com.trimsmp.trimpowers.util.Text;
import net.kyori.adventure.text.format.TextColor;
import org.bukkit.Location;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.scheduler.BukkitRunnable;

import java.util.List;

/**
 * One trim pattern's power: passive perks that scale per worn piece, plus a full-set ability.
 * Every number is read from {@code powers.<key>} in config.yml, with the defaults written here.
 */
public abstract class TrimPower {

    /** {@link #activate} result: the ability fizzled, don't start the cooldown. */
    public static final long NO_COOLDOWN = 0L;
    /** {@link #activate} result: start the configured cooldown. */
    public static final long DEFAULT_COOLDOWN = -1L;

    protected final TrimPowersPlugin plugin;
    private final String key;
    private final String name;
    private final String abilityName;
    private final TextColor color;
    private ConfigurationSection config;

    protected TrimPower(TrimPowersPlugin plugin, String key, String name, String abilityName, int rgb) {
        this.plugin = plugin;
        this.key = key;
        this.name = name;
        this.abilityName = abilityName;
        this.color = TextColor.color(rgb);
    }

    public final void load(ConfigurationSection section) {
        this.config = section;
    }

    public String key() {
        return key;
    }

    public String name() {
        return name;
    }

    public String abilityName() {
        return abilityName;
    }

    public TextColor color() {
        return color;
    }

    /** "<#c9a26b>" for MiniMessage strings. */
    public String tag() {
        return "<" + color.asHexString() + ">";
    }

    public boolean enabled() {
        return config == null || config.getBoolean("enabled", true);
    }

    public int cooldownSeconds() {
        return i("cooldown", defaultCooldown());
    }

    protected abstract int defaultCooldown();

    /** Movement abilities can't be used while rooted. */
    public boolean isMobility() {
        return false;
    }

    // ---- passive hooks (pieces = how many pieces of this trim are worn) ----

    public void collectAttributes(int pieces, AttributeSink sink) {
    }

    /** Called once a second while at least one piece is worn. */
    public void passiveTick(Player player, int pieces) {
    }

    /** The player no longer wears any piece of this trim. */
    public void clearPassive(Player player) {
    }

    public double outgoing(Player attacker, LivingEntity victim, double damage, int pieces, boolean melee, boolean projectile) {
        return damage;
    }

    public double incoming(Player victim, EntityDamageEvent event, double damage, int pieces) {
        return damage;
    }

    public void onMeleeHit(Player attacker, LivingEntity victim, int pieces) {
    }

    // ---- ability ----

    /**
     * Runs the full-set ability.
     *
     * @return {@link #DEFAULT_COOLDOWN}, {@link #NO_COOLDOWN}, or a custom cooldown in milliseconds
     */
    public abstract long activate(Player player);

    /** MiniMessage description of the passive, using the current config values. */
    public abstract String passiveText();

    /** MiniMessage description of the ability, using the current config values. */
    public abstract String abilityText();

    // ---- helpers for subclasses ----

    protected double d(String path, double def) {
        return config == null ? def : config.getDouble(path, def);
    }

    protected int i(String path, int def) {
        return config == null ? def : config.getInt(path, def);
    }

    protected boolean b(String path, boolean def) {
        return config == null ? def : config.getBoolean(path, def);
    }

    protected static String n(double value) {
        return Text.num(value);
    }

    protected static String pct(double fraction) {
        return Text.pct(fraction);
    }

    protected List<LivingEntity> enemies(Player caster, Location center, double radius) {
        return Targets.around(plugin, caster, center, radius);
    }

    protected boolean canAffect(Player caster, Entity target) {
        return Targets.canAffect(plugin, caster, target);
    }

    protected void hit(Player caster, LivingEntity target, double damage) {
        Damage.ability(target, damage, caster);
    }

    protected ActiveEffect effect(LivingEntity target, EffectType type, double seconds, double potency, Entity source) {
        return plugin.effects().apply(target, type, (int) Math.round(seconds * 20), potency, source);
    }

    protected void flash(Player player, String miniMessage) {
        plugin.hud().flash(player, Text.mm(miniMessage));
    }

    protected void later(long ticks, Runnable runnable) {
        plugin.getServer().getScheduler().runTaskLater(plugin, runnable, ticks);
    }

    /** Step callback for {@link #animate}; return false to stop early. */
    @FunctionalInterface
    protected interface Step {
        boolean tick(int t);
    }

    /** Runs {@code step} once per tick for {@code ticks} ticks (t = 0 .. ticks-1). */
    protected void animate(int ticks, Step step) {
        new BukkitRunnable() {
            private int t;

            @Override
            public void run() {
                if (t >= ticks || !step.tick(t)) {
                    cancel();
                    return;
                }
                t++;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    protected static boolean alive(Player player) {
        return player.isOnline() && !player.isDead();
    }
}
