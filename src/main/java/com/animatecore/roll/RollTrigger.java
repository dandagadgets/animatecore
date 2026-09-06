package com.animatecore.roll;

public enum RollTrigger {
    /**
     * Fires the instant a sprinting player (already holding W + the sprint key) presses the sneak key.
     * This is AnimateCore's implementation of "W + Shift + Ctrl": Minecraft's protocol only reports
     * toggled key STATES to the server (sneak on/off, sprint on/off) rather than raw per-tick key
     * presses, so there is no packet that literally says "these three keys are down right now". Catching
     * sneak-while-sprinting is the closest and most natural-feeling server-observable equivalent, and it
     * requires all three real inputs (forward movement to sprint, sprint held, then sneak) in one motion.
     */
    SPRINT_THEN_SNEAK,
    /** Fallback for players who bind sneak to toggle rather than hold: double-tap sneak while moving. */
    DOUBLE_TAP_SNEAK
}
