package com.trimsmp.trimpowers.power;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.power.impl.BoltPower;
import com.trimsmp.trimpowers.power.impl.CoastPower;
import com.trimsmp.trimpowers.power.impl.DunePower;
import com.trimsmp.trimpowers.power.impl.EyePower;
import com.trimsmp.trimpowers.power.impl.FlowPower;
import com.trimsmp.trimpowers.power.impl.HostPower;
import com.trimsmp.trimpowers.power.impl.RaiserPower;
import com.trimsmp.trimpowers.power.impl.RibPower;
import com.trimsmp.trimpowers.power.impl.SentryPower;
import com.trimsmp.trimpowers.power.impl.ShaperPower;
import com.trimsmp.trimpowers.power.impl.SilencePower;
import com.trimsmp.trimpowers.power.impl.SnoutPower;
import com.trimsmp.trimpowers.power.impl.SpirePower;
import com.trimsmp.trimpowers.power.impl.TidePower;
import com.trimsmp.trimpowers.power.impl.VexPower;
import com.trimsmp.trimpowers.power.impl.WardPower;
import com.trimsmp.trimpowers.power.impl.WayfinderPower;
import com.trimsmp.trimpowers.power.impl.WildPower;
import com.trimsmp.trimpowers.trim.TrimProfile;
import com.trimsmp.trimpowers.util.Text;
import org.bukkit.GameMode;
import org.bukkit.Sound;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.event.entity.EntityDamageEvent;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Holds all trim powers, their cooldowns, and routes passive hooks / ability activation. */
public final class PowerManager {

    private final TrimPowersPlugin plugin;
    private final Map<String, TrimPower> powers = new LinkedHashMap<>();
    private final Map<UUID, Map<String, Long>> readyAt = new HashMap<>();
    /** Short-lived display entities spawned by abilities (removed on disable). */
    private final Set<Entity> temporaryEntities = new HashSet<>();

    public PowerManager(TrimPowersPlugin plugin) {
        this.plugin = plugin;
    }

    public void registerDefaults() {
        register(new SentryPower(plugin));
        register(new DunePower(plugin));
        register(new CoastPower(plugin));
        register(new WildPower(plugin));
        register(new WardPower(plugin));
        register(new EyePower(plugin));
        register(new VexPower(plugin));
        register(new TidePower(plugin));
        register(new SnoutPower(plugin));
        register(new RibPower(plugin));
        register(new SpirePower(plugin));
        register(new WayfinderPower(plugin));
        register(new ShaperPower(plugin));
        register(new SilencePower(plugin));
        register(new RaiserPower(plugin));
        register(new HostPower(plugin));
        register(new FlowPower(plugin));
        register(new BoltPower(plugin));
    }

    public void register(TrimPower power) {
        powers.put(power.key(), power);
    }

    public void load(FileConfiguration config) {
        for (TrimPower power : powers.values()) {
            power.load(config.getConfigurationSection("powers." + power.key()));
        }
    }

    public void shutdown() {
        for (Entity entity : temporaryEntities) {
            if (entity.isValid()) {
                entity.remove();
            }
        }
        temporaryEntities.clear();
    }

    public void trackTemporary(Entity entity) {
        temporaryEntities.add(entity);
    }

    public void untrackTemporary(Entity entity) {
        temporaryEntities.remove(entity);
    }

    public TrimPower get(String key) {
        return key == null ? null : powers.get(key);
    }

    @SuppressWarnings("unchecked")
    public <T extends TrimPower> T get(String key, Class<T> type) {
        TrimPower power = powers.get(key);
        return type.isInstance(power) ? (T) power : null;
    }

    public Collection<TrimPower> all() {
        return Collections.unmodifiableCollection(powers.values());
    }

    /** The power whose ability the player can use right now (full set + enabled), or null. */
    public TrimPower setPower(Player player) {
        TrimPower power = get(plugin.tracker().profile(player).setKey());
        return power != null && power.enabled() ? power : null;
    }

    // ---- cooldowns ----

    public long remainingMillis(Player player, String key) {
        Map<String, Long> map = readyAt.get(player.getUniqueId());
        if (map == null) {
            return 0;
        }
        return Math.max(0, map.getOrDefault(key, 0L) - System.currentTimeMillis());
    }

    public void setCooldown(Player player, String key, long millis) {
        readyAt.computeIfAbsent(player.getUniqueId(), id -> new HashMap<>())
                .put(key, System.currentTimeMillis() + millis);
    }

    public void resetCooldowns(Player player) {
        readyAt.remove(player.getUniqueId());
    }

    // ---- activation ----

    /**
     * Tries to fire the player's full-set ability.
     *
     * @param explicit true when typed as a command (we explain why nothing happened)
     * @return true if the player has a usable set (the triggering key press should be consumed)
     */
    public boolean tryActivate(Player player, boolean explicit) {
        if (!player.hasPermission("trimpowers.use")) {
            if (explicit) {
                Text.send(player, "<red>You don't have permission to use trim abilities.");
            }
            return false;
        }
        if (plugin.settings().isDisabled(player.getWorld())) {
            if (explicit) {
                Text.send(player, "<red>Trim powers are disabled in this world.");
            }
            return false;
        }
        TrimProfile profile = plugin.tracker().refresh(player);
        TrimPower power = get(profile.setKey());
        if (power == null) {
            if (explicit) {
                Text.send(player, "<gray>Wear <white>" + plugin.settings().piecesForAbility()
                        + "</white> armor pieces with the same trim to unlock an ability. See <white>/trims list</white>.");
            }
            return false;
        }
        if (!power.enabled()) {
            if (explicit) {
                Text.send(player, "<red>The " + power.name() + " trim power is disabled on this server.");
            }
            return false;
        }
        if (player.getGameMode() == GameMode.SPECTATOR) {
            return true;
        }
        if (plugin.effects().has(player, EffectType.STUN)) {
            deny(player, "<yellow>✪ You are stunned!");
            return true;
        }
        if (power.isMobility() && plugin.effects().has(player, EffectType.ROOTED)) {
            deny(player, "<green>⚘ You are rooted!");
            return true;
        }
        long remaining = remainingMillis(player, power.key());
        if (remaining > 0) {
            deny(player, "<gray>" + power.abilityName() + " ready in <white>"
                    + String.format(java.util.Locale.ROOT, "%.1f", remaining / 1000.0) + "s");
            return true;
        }
        plugin.hud().flash(player, Text.mm(power.tag() + "<b>✦ " + power.abilityName() + "!</b>"));
        long cooldown = power.activate(player);
        if (cooldown == TrimPower.DEFAULT_COOLDOWN) {
            cooldown = power.cooldownSeconds() * 1000L;
        }
        if (cooldown > 0) {
            setCooldown(player, power.key(), cooldown);
        }
        return true;
    }

    private void deny(Player player, String message) {
        plugin.hud().flash(player, Text.mm(message));
        player.playSound(player.getLocation(), Sound.BLOCK_NOTE_BLOCK_BASS, 0.6f, 0.6f);
    }

    // ---- passive routing ----

    public double applyOutgoing(Player attacker, LivingEntity victim, double damage, boolean melee, boolean projectile) {
        for (Map.Entry<String, Integer> entry : plugin.tracker().profile(attacker).counts().entrySet()) {
            TrimPower power = powers.get(entry.getKey());
            if (power != null && power.enabled()) {
                damage = power.outgoing(attacker, victim, damage, entry.getValue(), melee, projectile);
            }
        }
        return damage;
    }

    public double applyIncoming(Player victim, EntityDamageEvent event, double damage) {
        for (Map.Entry<String, Integer> entry : plugin.tracker().profile(victim).counts().entrySet()) {
            TrimPower power = powers.get(entry.getKey());
            if (power != null && power.enabled()) {
                damage = power.incoming(victim, event, damage, entry.getValue());
            }
        }
        return damage;
    }

    public void onMeleeHit(Player attacker, LivingEntity victim) {
        for (Map.Entry<String, Integer> entry : plugin.tracker().profile(attacker).counts().entrySet()) {
            TrimPower power = powers.get(entry.getKey());
            if (power != null && power.enabled()) {
                power.onMeleeHit(attacker, victim, entry.getValue());
            }
        }
    }

    /** Pieces of {@code key} the player wears, or 0 if that power is disabled. */
    public int pieces(Player player, String key) {
        TrimPower power = powers.get(key);
        if (power == null || !power.enabled()) {
            return 0;
        }
        return plugin.tracker().profile(player).pieces(key);
    }
}
