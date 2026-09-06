package com.animatecore.cinematic.camera;

import com.comphenix.protocol.PacketType;
import com.comphenix.protocol.ProtocolLibrary;
import com.comphenix.protocol.events.PacketContainer;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;

/**
 * Optional, best-effort hard camera lock: sends the vanilla "set camera" packet so a viewer's screen
 * renders from another entity's position/rotation entirely, with free-look disabled - a proper cutscene
 * camera. Only used when the ProtocolLib plugin is installed (see {@code cinematics.prefer-protocollib-camera}
 * in config.yml); {@link com.animatecore.cinematic.CinematicManager}'s spectator+teleport path is the
 * fully-supported default and needs no extra plugin, so any failure here is caught and swallowed - the
 * cinematic simply keeps running in the portable mode instead.
 */
public final class CameraLock {

    private CameraLock() {
    }

    public static boolean isAvailable() {
        try {
            return org.bukkit.Bukkit.getPluginManager().getPlugin("ProtocolLib") != null
                    && org.bukkit.Bukkit.getPluginManager().getPlugin("ProtocolLib").isEnabled();
        } catch (Throwable t) {
            return false;
        }
    }

    /** Locks {@code viewer}'s camera onto {@code target}. Call {@link #release(Player)} to restore it. */
    public static boolean lock(Player viewer, Entity target) {
        try {
            PacketContainer packet = ProtocolLibrary.getProtocolManager().createPacket(PacketType.Play.Server.CAMERA);
            packet.getIntegers().write(0, target.getEntityId());
            ProtocolLibrary.getProtocolManager().sendServerPacket(viewer, packet);
            return true;
        } catch (Throwable t) {
            return false;
        }
    }

    /** Restores {@code viewer}'s camera to their own entity. */
    public static boolean release(Player viewer) {
        return lock(viewer, viewer);
    }
}
