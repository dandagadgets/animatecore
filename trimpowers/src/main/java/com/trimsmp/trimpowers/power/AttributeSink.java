package com.trimsmp.trimpowers.power;

import org.bukkit.attribute.AttributeModifier;

/** Collects passive attribute bonuses ("movement_speed", 0.12, ADD_SCALAR). */
@FunctionalInterface
public interface AttributeSink {
    void add(String attribute, double amount, AttributeModifier.Operation operation);
}
