package com.animatecore.cinematic;

import java.util.List;

public record Cinematic(String id, int durationTicks, List<CameraKeyframe> camera,
                         List<ActorDefinition> actors, List<CinematicCue> cues) {
}
