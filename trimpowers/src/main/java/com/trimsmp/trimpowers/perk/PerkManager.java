package com.trimsmp.trimpowers.perk;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.power.AttributeSink;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.trim.TrimProfile;
import org.bukkit.Material;
import org.bukkit.Tag;
import org.bukkit.attribute.AttributeModifier;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.entity.AbstractArrow;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.entity.Trident;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.inventory.ItemStack;

import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/** Loads which perks each trim has and answers "does this player have perk X right now?". */
public final class PerkManager {

    private static final double BASE_JUMP = 0.42;

    private final TrimPowersPlugin plugin;
    private final Map<String, Map<Perk, PerkParams>> byTrim = new HashMap<>();

    public PerkManager(TrimPowersPlugin plugin) {
        this.plugin = plugin;
    }

    public void load(FileConfiguration config) {
        byTrim.clear();
        for (TrimPower power : plugin.powers().all()) {
            Map<Perk, PerkParams> perks = new EnumMap<>(Perk.class);
            ConfigurationSection section = config.getConfigurationSection("powers." + power.key() + ".perks");
            if (section != null) {
                for (String id : section.getKeys(false)) {
                    Perk perk = Perk.byId(id);
                    if (perk == null) {
                        plugin.getLogger().warning("Unknown perk '" + id + "' in powers." + power.key() + ".perks - skipped.");
                        continue;
                    }
                    Object value = section.get(id);
                    if (Boolean.FALSE.equals(value)) {
                        continue;
                    }
                    Map<String, Object> values = value instanceof ConfigurationSection child
                            ? new LinkedHashMap<>(child.getValues(false)) : new LinkedHashMap<>();
                    perks.put(perk, new PerkParams(perk, values));
                }
            }
            byTrim.put(power.key(), perks);
        }
    }

    public Map<Perk, PerkParams> of(String trimKey) {
        return Collections.unmodifiableMap(byTrim.getOrDefault(trimKey, Map.of()));
    }

    /** Turns a perk on (with default values) or off for a trim, saves config.yml and re-applies to everyone. */
    public boolean toggle(String trimKey, Perk perk) {
        String path = "powers." + trimKey + ".perks." + perk.id();
        boolean nowOn = !of(trimKey).containsKey(perk);
        if (nowOn) {
            if (perk.defaults().isEmpty()) {
                plugin.getConfig().set(path, true);
            } else {
                plugin.getConfig().set(path, null);
                ConfigurationSection created = plugin.getConfig().createSection(path);
                perk.defaults().forEach(created::set);
            }
        } else {
            plugin.getConfig().set(path, null);
        }
        plugin.saveConfig();
        load(plugin.getConfig());
        plugin.tracker().resetAll();
        return nowOn;
    }

    /** The perk's values if the player wears a full set of a trim that has it, else null. */
    public PerkParams active(Player player, Perk perk) {
        return active(plugin.tracker().profile(player), perk);
    }

    public PerkParams active(TrimProfile profile, Perk perk) {
        int needed = plugin.settings().piecesForAbility();
        for (Map.Entry<String, Integer> entry : profile.counts().entrySet()) {
            if (entry.getValue() < needed) {
                continue;
            }
            TrimPower power = plugin.powers().get(entry.getKey());
            if (power == null || !power.enabled()) {
                continue;
            }
            PerkParams params = of(entry.getKey()).get(perk);
            if (params != null) {
                return params;
            }
        }
        return null;
    }

    public boolean has(Player player, Perk perk) {
        return active(player, perk) != null;
    }

    // ---- stat perks ----

    public void collectAttributes(TrimProfile profile, AttributeSink sink) {
        PerkParams jump = active(profile, Perk.EXTRA_JUMP);
        if (jump != null) {
            double blocks = Math.max(0, jump.d("blocks", 2));
            sink.add("jump_strength", jumpVelocityFor(jumpHeight(BASE_JUMP) + blocks) - BASE_JUMP,
                    AttributeModifier.Operation.ADD_NUMBER);
            sink.add("safe_fall_distance", blocks, AttributeModifier.Operation.ADD_NUMBER);
        }
        PerkParams crawl = active(profile, Perk.SHADOW_CRAWL);
        if (crawl != null) {
            sink.add("sneaking_speed", Math.max(0, crawl.d("sneak-speed", 1.0) - 0.3), AttributeModifier.Operation.ADD_NUMBER);
        }
    }

    // ---- damage perks ----

    public double outgoing(Player attacker, LivingEntity victim, double damage, boolean melee, boolean projectile, Entity damager) {
        PerkParams weapon = active(attacker, Perk.WEAPON_DAMAGE);
        if (weapon != null) {
            String kind = weaponKind(attacker, melee, projectile, damager);
            if (kind != null) {
                damage *= weapon.d(kind, 1.0);
            }
        }
        PerkParams undertow = active(attacker, Perk.UNDERTOW);
        if (undertow != null && victim.isInWater()) {
            damage *= 1 + undertow.d("damage-bonus", 0.3);
        }
        PerkParams ocean = active(attacker, Perk.OCEAN_BLESSING);
        if (ocean != null && attacker.isInWaterOrRainOrBubbleColumn()) {
            damage *= 1 + ocean.d("damage-bonus", 0.25);
        }
        PerkParams level = active(attacker, Perk.LEVEL_POWER);
        if (level != null) {
            damage *= 1 + Math.min(level.d("max", 0.3), attacker.getLevel() * level.d("per-level", 0.01));
        }
        return damage;
    }

    public double incoming(Player victim, EntityDamageEvent event, double damage) {
        if (event.getCause() == EntityDamageEvent.DamageCause.FALL) {
            PerkParams fall = active(victim, Perk.FALL_DAMAGE);
            if (fall != null) {
                damage *= Math.max(0, fall.d("multiplier", 0.5));
            }
        }
        return damage;
    }

    /** "sword", "axe", "bow", ... for the weapon that dealt this hit, or null. */
    private static String weaponKind(Player attacker, boolean melee, boolean projectile, Entity damager) {
        if (projectile) {
            if (damager instanceof Trident) {
                return "trident";
            }
            if (damager instanceof AbstractArrow arrow) {
                ItemStack weapon = arrow.getWeapon();
                if (weapon != null && weapon.getType() == Material.CROSSBOW) {
                    return "crossbow";
                }
                return "bow";
            }
            return null;
        }
        if (!melee) {
            return null;
        }
        Material held = attacker.getInventory().getItemInMainHand().getType();
        if (Tag.ITEMS_SWORDS.isTagged(held)) {
            return "sword";
        }
        if (Tag.ITEMS_AXES.isTagged(held)) {
            return "axe";
        }
        if (Tag.ITEMS_PICKAXES.isTagged(held)) {
            return "pickaxe";
        }
        if (held == Material.MACE) {
            return "mace";
        }
        if (held == Material.TRIDENT) {
            return "trident";
        }
        return null;
    }

    /** Peak height of a jump with the given starting velocity (vanilla physics). */
    static double jumpHeight(double velocity) {
        double y = 0;
        double v = velocity;
        while (v > 0) {
            y += v;
            v = (v - 0.08) * 0.98;
        }
        return y;
    }

    /** Starting velocity needed to reach the given jump height. */
    static double jumpVelocityFor(double height) {
        double low = 0;
        double high = 5;
        for (int i = 0; i < 60; i++) {
            double mid = (low + high) / 2;
            if (jumpHeight(mid) < height) {
                low = mid;
            } else {
                high = mid;
            }
        }
        return high;
    }
}
