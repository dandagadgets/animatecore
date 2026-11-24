package com.trimsmp.trimpowers.potion;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.trim.TrimProfile;
import org.bukkit.NamespacedKey;
import org.bukkit.Registry;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.entity.Player;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Permanent potion effects granted by trims ({@code powers.<trim>.potions} in config.yml).
 *
 * <p>Effects are applied with infinite duration while the player qualifies and removed as soon as they don't.
 * Which effects we granted is stored on the player (persistent data), so even after a crash we know exactly which
 * effects to take back on the next join, and never touch effects that came from real potions or beacons.
 */
public final class PotionPassiveManager {

    private static final Map<String, String> ALIASES = Map.ofEntries(
            Map.entry("jump", "jump_boost"),
            Map.entry("fast_digging", "haste"),
            Map.entry("slow_digging", "mining_fatigue"),
            Map.entry("increase_damage", "strength"),
            Map.entry("damage_resistance", "resistance"),
            Map.entry("slow", "slowness"),
            Map.entry("confusion", "nausea"),
            Map.entry("hero", "hero_of_the_village"));

    private final TrimPowersPlugin plugin;
    private final NamespacedKey grantedKey;
    private final Map<String, List<PotionPassive>> byTrim = new HashMap<>();

    public PotionPassiveManager(TrimPowersPlugin plugin) {
        this.plugin = plugin;
        this.grantedKey = new NamespacedKey(plugin, "granted_potions");
    }

    // ---- config ----

    public void load(FileConfiguration config) {
        byTrim.clear();
        for (TrimPower power : plugin.powers().all()) {
            List<PotionPassive> list = new ArrayList<>();
            for (Map<?, ?> entry : config.getMapList("powers." + power.key() + ".potions")) {
                PotionEffectType type = parseType(String.valueOf(entry.get("effect")));
                if (type == null) {
                    plugin.getLogger().warning("Unknown or instant potion effect '" + entry.get("effect")
                            + "' in powers." + power.key() + ".potions - skipped.");
                    continue;
                }
                list.add(new PotionPassive(type, clampLevel(toInt(entry.get("level"), 1)), clampPieces(toInt(entry.get("pieces"), 4))));
            }
            list.sort(Comparator.comparingInt(PotionPassive::pieces).thenComparing(p -> name(p.type())));
            byTrim.put(power.key(), list);
        }
    }

    public List<PotionPassive> of(String trimKey) {
        return Collections.unmodifiableList(byTrim.getOrDefault(trimKey, List.of()));
    }

    public PotionPassive find(String trimKey, PotionEffectType type) {
        for (PotionPassive passive : of(trimKey)) {
            if (passive.type().equals(type)) {
                return passive;
            }
        }
        return null;
    }

    /** Adds or replaces the trim's entry for this effect, saves config.yml and re-applies to everyone. */
    public void set(String trimKey, PotionEffectType type, int level, int pieces) {
        List<PotionPassive> list = new ArrayList<>(of(trimKey));
        list.removeIf(p -> p.type().equals(type));
        list.add(new PotionPassive(type, clampLevel(level), clampPieces(pieces)));
        save(trimKey, list);
    }

    public boolean remove(String trimKey, PotionEffectType type) {
        List<PotionPassive> list = new ArrayList<>(of(trimKey));
        boolean removed = list.removeIf(p -> p.type().equals(type));
        if (removed) {
            save(trimKey, list);
        }
        return removed;
    }

    public void clear(String trimKey) {
        save(trimKey, new ArrayList<>());
    }

    private void save(String trimKey, List<PotionPassive> list) {
        List<Map<String, Object>> raw = new ArrayList<>();
        for (PotionPassive passive : list) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("effect", name(passive.type()));
            entry.put("level", passive.level());
            entry.put("pieces", passive.pieces());
            raw.add(entry);
        }
        plugin.getConfig().set("powers." + trimKey + ".potions", raw);
        plugin.saveConfig();
        load(plugin.getConfig());
        for (Player player : plugin.getServer().getOnlinePlayers()) {
            apply(player, plugin.tracker().profile(player));
        }
    }

    // ---- applying to players ----

    /** Makes the player's trim potion effects match what their armor grants right now. */
    public void apply(Player player, TrimProfile profile) {
        Map<PotionEffectType, Integer> desired = new HashMap<>();
        if (!player.isDead()) {
            for (Map.Entry<String, Integer> entry : profile.counts().entrySet()) {
                TrimPower power = plugin.powers().get(entry.getKey());
                if (power == null || !power.enabled()) {
                    continue;
                }
                for (PotionPassive passive : of(entry.getKey())) {
                    if (entry.getValue() >= passive.pieces()) {
                        desired.merge(passive.type(), passive.amplifier(), Math::max);
                    }
                }
            }
        }

        Map<PotionEffectType, Integer> granted = readGranted(player);
        Map<PotionEffectType, Integer> stillGranted = new HashMap<>();
        for (Map.Entry<PotionEffectType, Integer> entry : granted.entrySet()) {
            Integer want = desired.get(entry.getKey());
            if (want == null || want < entry.getValue()) {
                takeBack(player, entry.getKey(), entry.getValue());
            } else {
                stillGranted.put(entry.getKey(), entry.getValue());
            }
        }
        for (Map.Entry<PotionEffectType, Integer> entry : desired.entrySet()) {
            PotionEffectType type = entry.getKey();
            int amplifier = entry.getValue();
            PotionEffect current = player.getPotionEffect(type);
            boolean ours = current != null && current.isInfinite() && stillGranted.getOrDefault(type, -1) == current.getAmplifier();
            if (current != null && !ours && current.getAmplifier() > amplifier) {
                continue; // something stronger (potion, beacon, other plugin) is active - leave it alone
            }
            if (current == null || current.getAmplifier() < amplifier || !current.isInfinite()) {
                player.addPotionEffect(new PotionEffect(type, PotionEffect.INFINITE_DURATION, amplifier, true, false, true));
            }
            stillGranted.put(type, amplifier);
        }
        if (!stillGranted.equals(granted)) {
            writeGranted(player, stillGranted);
        }
    }

    /** Removes every potion effect this plugin granted the player. */
    public void clear(Player player) {
        for (Map.Entry<PotionEffectType, Integer> entry : readGranted(player).entrySet()) {
            takeBack(player, entry.getKey(), entry.getValue());
        }
        player.getPersistentDataContainer().remove(grantedKey);
    }

    private static void takeBack(Player player, PotionEffectType type, int amplifier) {
        PotionEffect current = player.getPotionEffect(type);
        if (current != null && current.isInfinite() && current.getAmplifier() == amplifier) {
            player.removePotionEffect(type);
        }
    }

    private Map<PotionEffectType, Integer> readGranted(Player player) {
        Map<PotionEffectType, Integer> result = new HashMap<>();
        String raw = player.getPersistentDataContainer().get(grantedKey, PersistentDataType.STRING);
        if (raw == null || raw.isEmpty()) {
            return result;
        }
        for (String part : raw.split(";")) {
            String[] kv = part.split("=");
            if (kv.length != 2) {
                continue;
            }
            PotionEffectType type = Registry.EFFECT.get(NamespacedKey.minecraft(kv[0]));
            if (type != null) {
                result.put(type, toInt(kv[1], 0));
            }
        }
        return result;
    }

    private void writeGranted(Player player, Map<PotionEffectType, Integer> granted) {
        if (granted.isEmpty()) {
            player.getPersistentDataContainer().remove(grantedKey);
            return;
        }
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<PotionEffectType, Integer> entry : granted.entrySet()) {
            if (!sb.isEmpty()) {
                sb.append(';');
            }
            sb.append(name(entry.getKey())).append('=').append(entry.getValue());
        }
        player.getPersistentDataContainer().set(grantedKey, PersistentDataType.STRING, sb.toString());
    }

    // ---- names ----

    /** Effects that can be granted permanently (instant ones like Instant Health or Saturation can't be). */
    public static List<PotionEffectType> grantableTypes() {
        List<PotionEffectType> types = new ArrayList<>();
        for (PotionEffectType type : Registry.EFFECT) {
            if (!type.isInstant()) {
                types.add(type);
            }
        }
        types.sort(Comparator.comparing((PotionEffectType t) -> t.getCategory().ordinal()).thenComparing(PotionPassiveManager::name));
        return types;
    }

    public static PotionEffectType parseType(String input) {
        if (input == null) {
            return null;
        }
        String id = input.toLowerCase(Locale.ROOT).trim().replace(' ', '_').replace("minecraft:", "");
        id = ALIASES.getOrDefault(id, id);
        PotionEffectType type = Registry.EFFECT.get(NamespacedKey.minecraft(id));
        return type == null || type.isInstant() ? null : type;
    }

    @SuppressWarnings("deprecation")
    public static String name(PotionEffectType type) {
        return type.getKey().getKey();
    }

    /** "hero_of_the_village" -> "Hero Of The Village". */
    public static String pretty(PotionEffectType type) {
        StringBuilder sb = new StringBuilder();
        for (String word : name(type).split("_")) {
            if (!sb.isEmpty()) {
                sb.append(' ');
            }
            sb.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
        }
        return sb.toString();
    }

    public static String roman(int level) {
        String[] numerals = {"I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"};
        return level >= 1 && level <= numerals.length ? numerals[level - 1] : String.valueOf(level);
    }

    public static String describe(PotionPassive passive) {
        return pretty(passive.type()) + " " + roman(passive.level());
    }

    private static int clampLevel(int level) {
        return Math.max(1, Math.min(10, level));
    }

    private static int clampPieces(int pieces) {
        return Math.max(1, Math.min(4, pieces));
    }

    private static int toInt(Object value, int def) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return value == null ? def : Integer.parseInt(String.valueOf(value).trim());
        } catch (NumberFormatException ex) {
            return def;
        }
    }
}
