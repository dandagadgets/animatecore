package com.trimsmp.trimpowers.util;

import org.bukkit.NamespacedKey;
import org.bukkit.Registry;
import org.bukkit.attribute.Attribute;
import org.bukkit.attribute.AttributeInstance;
import org.bukkit.attribute.AttributeModifier;
import org.bukkit.entity.LivingEntity;
import org.bukkit.inventory.EquipmentSlotGroup;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Attribute helpers. Attributes are looked up by registry key ("movement_speed", "block_break_speed", ...) so the
 * plugin keeps working across 1.21.x, where the keys lost their "generic."/"player." prefixes. All modifiers are
 * transient: they are never saved to player or mob data, so a crash can't leave anyone permanently slowed.
 */
public final class Attrs {

    private static final Map<String, Optional<Attribute>> CACHE = new HashMap<>();

    private Attrs() {
    }

    public static Attribute get(String name) {
        return CACHE.computeIfAbsent(name, n -> {
            for (String candidate : new String[]{"generic." + n, "player." + n, n}) {
                Attribute attribute = Registry.ATTRIBUTE.get(NamespacedKey.minecraft(candidate));
                if (attribute != null) {
                    return Optional.of(attribute);
                }
            }
            return Optional.empty();
        }).orElse(null);
    }

    public static void set(LivingEntity entity, String attribute, NamespacedKey key, double amount,
                           AttributeModifier.Operation operation) {
        Attribute attr = get(attribute);
        if (attr == null) {
            return;
        }
        AttributeInstance instance = entity.getAttribute(attr);
        if (instance == null) {
            return;
        }
        instance.removeModifier(key);
        instance.addTransientModifier(new AttributeModifier(key, amount, operation, EquipmentSlotGroup.ANY));
    }

    public static void remove(LivingEntity entity, String attribute, NamespacedKey key) {
        Attribute attr = get(attribute);
        if (attr == null) {
            return;
        }
        AttributeInstance instance = entity.getAttribute(attr);
        if (instance != null) {
            instance.removeModifier(key);
        }
    }

    /** Removes every modifier whose key lives in the given namespace (cleanup safety net). */
    public static void stripNamespace(LivingEntity entity, String namespace) {
        for (Attribute attr : Registry.ATTRIBUTE) {
            AttributeInstance instance = entity.getAttribute(attr);
            if (instance == null) {
                continue;
            }
            List<AttributeModifier> doomed = new ArrayList<>();
            for (AttributeModifier modifier : instance.getModifiers()) {
                if (namespace.equals(modifier.getKey().getNamespace())) {
                    doomed.add(modifier);
                }
            }
            doomed.forEach(instance::removeModifier);
        }
    }
}
