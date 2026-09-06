package com.animatecore.items;

import com.animatecore.animation.ToolKind;

/**
 * CustomModelData layout used by the bundled resource pack.
 *
 * <pre>
 *   base + 0        idle / vanilla look (no override applied)
 *   base + 1..4     swing wind-up -> follow-through frames
 *   base + 5..7     tool-specific "use" frames (mining/chopping/tilling impact, thrust, smash)
 *   base + 8        crit / heavy-hit frame
 * </pre>
 *
 * See {@code resourcepack/assets/minecraft/models/item/*.json} for the matching overrides and
 * {@code blockbench/*.bbmodel} for the source models each frame's model file was exported from.
 */
public final class ModelData {

    private ModelData() {
    }

    public static final int IDLE = 0;
    public static final int SWING_START = 1;
    public static final int SWING_END = 4;
    public static final int USE_START = 5;
    public static final int USE_END = 7;
    public static final int CRIT = 8;

    public static final int FRAME_COUNT = CRIT + 1;

    public static int idle(ToolKind tool) {
        return tool.modelBase + IDLE;
    }

    public static int swingFrame(ToolKind tool, int frame) {
        int clamped = Math.max(SWING_START, Math.min(SWING_END, frame));
        return tool.modelBase + clamped;
    }

    public static int useFrame(ToolKind tool, int frame) {
        int clamped = Math.max(USE_START, Math.min(USE_END, frame));
        return tool.modelBase + clamped;
    }

    public static int crit(ToolKind tool) {
        return tool.modelBase + CRIT;
    }

    public static int swingFrameCount() {
        return SWING_END - SWING_START + 1;
    }

    public static int useFrameCount() {
        return USE_END - USE_START + 1;
    }
}
