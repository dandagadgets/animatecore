package com.animatecore.cinematic;

/** A scripted moment: title/subtitle text and/or a sound cue fired when playback reaches {@code tick}. */
public record CinematicCue(int tick, String title, String subtitle, String sound) {
}
