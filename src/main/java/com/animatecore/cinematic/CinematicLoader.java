package com.animatecore.cinematic;

import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.YamlConfiguration;
import org.joml.Vector3f;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/** Parses a cinematic definition (see {@code src/main/resources/cinematics/hero_intro.yml}) from YAML. */
public final class CinematicLoader {

    private CinematicLoader() {
    }

    public static Cinematic load(File file) {
        YamlConfiguration yaml = YamlConfiguration.loadConfiguration(file);
        String id = yaml.getString("name", file.getName().replace(".yml", ""));
        int duration = yaml.getInt("duration-ticks", 100);

        List<CameraKeyframe> camera = new ArrayList<>();
        for (Object raw : yaml.getMapList("camera")) {
            ConfigurationSection s = toSection(raw);
            camera.add(new CameraKeyframe(
                    asInt(s, "tick", 0),
                    asDouble(s, "x", 0), asDouble(s, "y", 0), asDouble(s, "z", 0),
                    (float) asDouble(s, "yaw", 0), (float) asDouble(s, "pitch", 0)));
        }
        camera.sort((a, b) -> Integer.compare(a.tick(), b.tick()));

        List<ActorDefinition> actors = new ArrayList<>();
        for (Object raw : yaml.getMapList("actors")) {
            ConfigurationSection s = toSection(raw);
            String actorId = String.valueOf(s.get("id", "actor"));
            int propModel = asInt(s, "prop-model", 0);
            ConfigurationSection off = s.getConfigurationSection("offset");
            Vector3f offset = off == null ? new Vector3f() : new Vector3f(
                    (float) asDouble(off, "x", 0), (float) asDouble(off, "y", 0), (float) asDouble(off, "z", 0));

            List<ActorPose> poses = new ArrayList<>();
            List<?> poseList = s.getMapList("poses") == null ? List.of() : s.getMapList("poses");
            for (Object poseRaw : poseList) {
                ConfigurationSection p = toSection(poseRaw);
                ConfigurationSection t = p.getConfigurationSection("translation");
                ConfigurationSection r = p.getConfigurationSection("rotation");
                ConfigurationSection sc = p.getConfigurationSection("scale");
                Vector3f translation = t == null ? new Vector3f() : new Vector3f(
                        (float) asDouble(t, "x", 0), (float) asDouble(t, "y", 0), (float) asDouble(t, "z", 0));
                Vector3f scale = sc == null ? new Vector3f(1, 1, 1) : new Vector3f(
                        (float) asDouble(sc, "x", 1), (float) asDouble(sc, "y", 1), (float) asDouble(sc, "z", 1));
                float pitch = r == null ? 0 : (float) asDouble(r, "pitch", 0);
                float yaw = r == null ? 0 : (float) asDouble(r, "yaw", 0);
                float roll = r == null ? 0 : (float) asDouble(r, "roll", 0);
                poses.add(new ActorPose(asInt(p, "tick", 0), translation, pitch, yaw, roll, scale));
            }
            poses.sort((a, b) -> Integer.compare(a.tick(), b.tick()));
            actors.add(new ActorDefinition(actorId, propModel, offset, poses));
        }

        List<CinematicCue> cues = new ArrayList<>();
        for (Object raw : yaml.getMapList("cues")) {
            ConfigurationSection s = toSection(raw);
            cues.add(new CinematicCue(asInt(s, "tick", 0),
                    s.getString("title", null), s.getString("subtitle", null), s.getString("sound", null)));
        }
        cues.sort((a, b) -> Integer.compare(a.tick(), b.tick()));

        return new Cinematic(id, duration, camera, actors, cues);
    }

    @SuppressWarnings("unchecked")
    private static ConfigurationSection toSection(Object raw) {
        YamlConfiguration wrapper = new YamlConfiguration();
        if (raw instanceof java.util.Map<?, ?> map) {
            for (var entry : map.entrySet()) {
                wrapper.set(String.valueOf(entry.getKey()), entry.getValue());
            }
        }
        return wrapper;
    }

    private static int asInt(ConfigurationSection s, String path, int def) {
        return s.isSet(path) ? s.getInt(path) : def;
    }

    private static double asDouble(ConfigurationSection s, String path, double def) {
        return s.isSet(path) ? s.getDouble(path) : def;
    }
}
