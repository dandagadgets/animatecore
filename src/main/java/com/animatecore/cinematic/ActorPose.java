package com.animatecore.cinematic;

import org.joml.Vector3f;

/** One pose keyframe for a {@link ActorDefinition}, interpolated client-side via Display transformation. */
public record ActorPose(int tick, Vector3f translation, float pitchDeg, float yawDeg, float rollDeg, Vector3f scale) {
}
