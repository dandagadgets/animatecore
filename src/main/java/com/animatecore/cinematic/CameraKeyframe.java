package com.animatecore.cinematic;

/** One point on a cinematic's camera path, in coordinates relative to the play() origin. */
public record CameraKeyframe(int tick, double x, double y, double z, float yaw, float pitch) {
}
