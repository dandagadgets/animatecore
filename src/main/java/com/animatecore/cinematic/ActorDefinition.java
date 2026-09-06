package com.animatecore.cinematic;

import org.joml.Vector3f;

import java.util.List;

/** A Display-entity "actor" spawned relative to a cinematic's origin and puppeted through a list of poses. */
public record ActorDefinition(String id, int propModelData, Vector3f offset, List<ActorPose> poses) {
}
