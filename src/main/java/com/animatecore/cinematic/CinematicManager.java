package com.animatecore.cinematic;

import com.animatecore.AnimateCorePlugin;
import com.animatecore.items.PropModelData;
import com.animatecore.util.DisplayEntityUtil;
import com.animatecore.util.MathUtil;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import net.kyori.adventure.title.Title;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.SoundCategory;
import org.bukkit.entity.ItemDisplay;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitTask;

import java.io.File;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Plays scripted camera-path cutscenes for one or more viewers. The default camera implementation
 * (spectator gamemode + per-tick teleport along a Catmull-Rom spline through the cinematic's keyframes)
 * needs no dependency beyond the Paper API; see {@link com.animatecore.cinematic.camera.CameraLock} for
 * the optional, ProtocolLib-backed hard camera lock.
 */
public class CinematicManager {

    private final AnimateCorePlugin plugin;
    private final Map<String, Cinematic> cinematics = new HashMap<>();
    private final Map<UUID, Session> sessions = new HashMap<>();
    private File folder;

    public CinematicManager(AnimateCorePlugin plugin) {
        this.plugin = plugin;
    }

    public void loadAll() {
        folder = new File(plugin.getDataFolder(), "cinematics");
        if (!folder.exists()) {
            folder.mkdirs();
        }
        File bundled = new File(folder, "hero_intro.yml");
        if (!bundled.exists()) {
            plugin.saveResource("cinematics/hero_intro.yml", false);
        }

        cinematics.clear();
        File[] files = folder.listFiles((dir, name) -> name.endsWith(".yml"));
        if (files != null) {
            for (File f : files) {
                try {
                    Cinematic c = CinematicLoader.load(f);
                    cinematics.put(c.id().toLowerCase(), c);
                } catch (Exception ex) {
                    plugin.getLogger().warning("Failed to load cinematic " + f.getName() + ": " + ex.getMessage());
                }
            }
        }
        plugin.getLogger().info("Loaded " + cinematics.size() + " cinematic(s).");
    }

    public List<String> names() {
        return new ArrayList<>(cinematics.keySet());
    }

    public boolean isPlaying(Player player) {
        return sessions.containsKey(player.getUniqueId());
    }

    public boolean play(String name, Location origin, Player viewer) {
        Cinematic cinematic = cinematics.get(name.toLowerCase());
        if (cinematic == null || cinematic.camera().size() < 2) return false;
        stop(viewer);

        Session session = new Session(cinematic, origin, viewer);
        sessions.put(viewer.getUniqueId(), session);
        session.start();
        return true;
    }

    public void stop(Player viewer) {
        Session session = sessions.remove(viewer.getUniqueId());
        if (session != null) {
            session.end();
        }
    }

    public void stopAll() {
        new ArrayList<>(sessions.keySet()).forEach(id -> {
            Player p = plugin.getServer().getPlayer(id);
            if (p != null) stop(p);
        });
    }

    private class Session {
        final Cinematic cinematic;
        final Location origin;
        final Player viewer;
        final GameMode previousGameMode;
        final Location previousLocation;
        final Map<String, ItemDisplay> actors = new HashMap<>();
        BukkitTask task;
        int tick = 0;
        int cueIndex = 0;
        boolean cameraLocked = false;
        org.bukkit.entity.ArmorStand cameraRig;

        Session(Cinematic cinematic, Location origin, Player viewer) {
            this.cinematic = cinematic;
            this.origin = origin;
            this.viewer = viewer;
            this.previousGameMode = viewer.getGameMode();
            this.previousLocation = viewer.getLocation();
        }

        void start() {
            viewer.setGameMode(GameMode.SPECTATOR);
            viewer.teleport(sampleCameraSafe(0));

            if (plugin.getAnimateConfig().preferProtocolLibCamera()
                    && com.animatecore.cinematic.camera.CameraLock.isAvailable()) {
                Location camStart = sampleCameraSafe(0);
                cameraRig = camStart.getWorld().spawn(camStart, org.bukkit.entity.ArmorStand.class, a -> {
                    a.setMarker(true);
                    a.setInvisible(true);
                    a.setInvulnerable(true);
                    a.setPersistent(false);
                    a.setGravity(false);
                    a.setSilent(true);
                });
                cameraLocked = com.animatecore.cinematic.camera.CameraLock.lock(viewer, cameraRig);
            }

            for (ActorDefinition def : cinematic.actors()) {
                Location at = origin.clone().add(def.offset().x, def.offset().y, def.offset().z);
                ItemDisplay display = DisplayEntityUtil.spawnItemActor(at, PropModelData.propItem(def.propModelData()), 1.0f);
                actors.put(def.id(), display);
            }
            task = plugin.getServer().getScheduler().runTaskTimer(plugin, this::tick, 0L, 1L);
        }

        private Location sampleCameraSafe(int t) {
            try {
                return sampleCamera(t);
            } catch (Exception ex) {
                return origin.clone();
            }
        }

        void tick() {
            if (!viewer.isOnline() || tick > cinematic.durationTicks()) {
                stop(viewer);
                return;
            }
            if (plugin.getAnimateConfig().cinematicSkipOnSneak() && viewer.isSneaking()) {
                stop(viewer);
                return;
            }

            Location camLoc = sampleCamera(tick);
            if (cameraLocked && cameraRig != null && !cameraRig.isDead()) {
                cameraRig.teleport(camLoc);
            } else {
                viewer.teleport(camLoc);
            }

            for (ActorDefinition def : cinematic.actors()) {
                puppet(def, actors.get(def.id()), tick);
            }

            while (cueIndex < cinematic.cues().size() && cinematic.cues().get(cueIndex).tick() <= tick) {
                fireCue(cinematic.cues().get(cueIndex));
                cueIndex++;
            }

            tick++;
        }

        private Location sampleCamera(int t) {
            List<CameraKeyframe> kf = cinematic.camera();
            int idx = 0;
            while (idx < kf.size() - 2 && kf.get(idx + 1).tick() < t) {
                idx++;
            }
            CameraKeyframe a = kf.get(idx);
            CameraKeyframe b = kf.get(Math.min(idx + 1, kf.size() - 1));
            CameraKeyframe prev = kf.get(Math.max(idx - 1, 0));
            CameraKeyframe next = kf.get(Math.min(idx + 2, kf.size() - 1));

            int span = Math.max(1, b.tick() - a.tick());
            double localT = Math.max(0, Math.min(1, (t - a.tick()) / (double) span));

            Location p0 = toLocation(prev);
            Location p1 = toLocation(a);
            Location p2 = toLocation(b);
            Location p3 = toLocation(next);
            return MathUtil.catmullRom(p0, p1, p2, p3, localT);
        }

        private Location toLocation(CameraKeyframe k) {
            Location loc = origin.clone().add(k.x(), k.y(), k.z());
            loc.setYaw(k.yaw() + origin.getYaw());
            loc.setPitch(k.pitch());
            return loc;
        }

        private void puppet(ActorDefinition def, ItemDisplay display, int t) {
            if (display == null || def.poses().isEmpty()) return;
            List<ActorPose> poses = def.poses();
            int idx = 0;
            while (idx < poses.size() - 1 && poses.get(idx + 1).tick() <= t) idx++;
            ActorPose a = poses.get(idx);
            ActorPose b = poses.get(Math.min(idx + 1, poses.size() - 1));
            int span = Math.max(1, b.tick() - a.tick());
            float localT = (float) Math.max(0, Math.min(1, (t - a.tick()) / (double) span));

            org.joml.Vector3f translation = lerp(a.translation(), b.translation(), localT);
            org.joml.Vector3f scale = lerp(a.scale(), b.scale(), localT);
            float pitch = lerpAngle(a.pitchDeg(), b.pitchDeg(), localT);
            float yaw = lerpAngle(a.yawDeg(), b.yawDeg(), localT);
            float roll = lerpAngle(a.rollDeg(), b.rollDeg(), localT);

            DisplayEntityUtil.animateTo(display, translation, pitch, yaw, roll, scale, 2);
        }

        private org.joml.Vector3f lerp(org.joml.Vector3f a, org.joml.Vector3f b, float t) {
            return new org.joml.Vector3f(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
        }

        private float lerpAngle(float a, float b, float t) {
            return a + (b - a) * t;
        }

        private void fireCue(CinematicCue cue) {
            if (cue.title() != null || cue.subtitle() != null) {
                var title = LegacyComponentSerializer.legacyAmpersand().deserialize(cue.title() == null ? "" : cue.title());
                var subtitle = LegacyComponentSerializer.legacyAmpersand().deserialize(cue.subtitle() == null ? "" : cue.subtitle());
                viewer.showTitle(Title.title(title, subtitle,
                        Title.Times.times(Duration.ofMillis(400), Duration.ofSeconds(2), Duration.ofMillis(600))));
            }
            if (cue.sound() != null && !cue.sound().isBlank()) {
                viewer.playSound(viewer.getLocation(), cue.sound(), SoundCategory.MASTER, 1.0f, 1.0f);
            }
        }

        void end() {
            if (task != null) task.cancel();
            actors.values().forEach(ItemDisplay::remove);
            actors.clear();
            if (cameraLocked && viewer.isOnline()) {
                com.animatecore.cinematic.camera.CameraLock.release(viewer);
            }
            if (cameraRig != null) {
                cameraRig.remove();
            }
            if (viewer.isOnline()) {
                viewer.setGameMode(previousGameMode);
                viewer.teleport(previousLocation);
                viewer.clearTitle();
            }
        }
    }
}
