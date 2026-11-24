package com.trimsmp.trimpowers.power.impl;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.power.AttributeSink;
import com.trimsmp.trimpowers.power.TrimPower;
import com.trimsmp.trimpowers.util.Fx;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.attribute.AttributeModifier;
import org.bukkit.block.Block;
import org.bukkit.block.BlockFace;
import org.bukkit.block.data.BlockData;
import org.bukkit.entity.BlockDisplay;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.util.Transformation;
import org.bukkit.util.Vector;
import org.joml.Quaternionf;
import org.joml.Vector3f;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Shaper (trail ruins): faster mining, and a line of erupting rock that stuns. The rocks are display entities -
 * no real blocks are ever placed or broken, so it can't grief or dupe anything.
 */
public final class ShaperPower extends TrimPower {

    public ShaperPower(TrimPowersPlugin plugin) {
        super(plugin, "shaper", "Shaper", "Earthshatter", 0x8C7B6B);
    }

    @Override
    protected int defaultCooldown() {
        return 20;
    }

    @Override
    public void collectAttributes(AttributeSink sink) {
        sink.add("block_break_speed", d("passive.mining-speed", 0.2), AttributeModifier.Operation.ADD_SCALAR);
    }

    @Override
    public long activate(Player player) {
        int length = Math.max(1, i("ability.length", 10));
        int interval = Math.max(1, i("ability.ticks-per-block", 2));
        double damage = d("ability.damage", 4);
        double stunSeconds = d("ability.stun-seconds", 1.5);
        double knockUp = d("ability.knock-up", 0.6);

        Location origin = player.getLocation();
        Vector forward = Fx.flat(origin.getDirection());
        Set<UUID> struck = new HashSet<>();
        Fx.sound(origin, Sound.ENTITY_IRON_GOLEM_DAMAGE, 0.8f, 0.6f);

        animate(length * interval, t -> {
            if (t % interval != 0) {
                return true;
            }
            int step = t / interval + 1;
            Location point = origin.clone().add(forward.clone().multiply(step));
            Block ground = findGround(point);
            if (ground == null) {
                return true;
            }
            Location top = ground.getLocation().add(0.5, 1.0, 0.5);
            BlockData data = ground.getType().isSolid() ? ground.getBlockData() : Material.STONE.createBlockData();
            for (int k = 0; k < 3; k++) {
                spawnRock(top, data);
            }
            Fx.block(top, Particle.BLOCK, data, 20, 0.4);
            Fx.block(top, Particle.DUST_PILLAR, data, 8, 0.3);
            Fx.sound(top, ground.getBlockSoundGroup().getBreakSound(), 1f, 0.6f);
            if (step % 3 == 1) {
                Fx.sound(top, Sound.ENTITY_GENERIC_EXPLODE, 0.25f, 1.6f);
            }
            for (LivingEntity target : enemies(player, top, 1.9)) {
                if (struck.add(target.getUniqueId())) {
                    hit(player, target, damage);
                    target.setVelocity(target.getVelocity().setY(knockUp));
                    effect(target, EffectType.STUN, stunSeconds, 0, player);
                }
            }
            return true;
        });
        return DEFAULT_COOLDOWN;
    }

    private static Block findGround(Location point) {
        Block block = point.getBlock().getRelative(BlockFace.UP);
        for (int dy = 0; dy < 5; dy++) {
            Block below = block.getRelative(BlockFace.DOWN);
            if (below.getType().isSolid() && block.isPassable()) {
                return below;
            }
            block = below;
        }
        return null;
    }

    private void spawnRock(Location top, BlockData data) {
        ThreadLocalRandom r = ThreadLocalRandom.current();
        float size = (float) r.nextDouble(0.45, 0.85);
        Location at = top.clone().add(r.nextDouble(-0.45, 0.45), -1.05, r.nextDouble(-0.45, 0.45));
        Quaternionf tilt = new Quaternionf().rotateXYZ(
                (float) r.nextDouble(-0.5, 0.5), (float) r.nextDouble(0, Math.PI), (float) r.nextDouble(-0.5, 0.5));
        Vector3f scale = new Vector3f(size, size, size);
        Vector3f low = new Vector3f(-size / 2, 0, -size / 2);
        Vector3f high = new Vector3f(-size / 2, 0.75f + size * 0.3f, -size / 2);

        BlockDisplay rock = top.getWorld().spawn(at, BlockDisplay.class, display -> {
            display.setBlock(data);
            display.setPersistent(false);
            display.setTransformation(new Transformation(low, tilt, scale, new Quaternionf()));
        });
        plugin.powers().trackTemporary(rock);
        later(2L, () -> move(rock, high, tilt, scale, 3));
        later(16L, () -> move(rock, low, tilt, scale, 6));
        later(24L, () -> {
            plugin.powers().untrackTemporary(rock);
            if (rock.isValid()) {
                rock.remove();
            }
        });
    }

    private static void move(BlockDisplay rock, Vector3f translation, Quaternionf tilt, Vector3f scale, int ticks) {
        if (!rock.isValid()) {
            return;
        }
        rock.setInterpolationDelay(0);
        rock.setInterpolationDuration(ticks);
        rock.setTransformation(new Transformation(translation, tilt, scale, new Quaternionf()));
    }

    @Override
    public String passiveText() {
        return "<white>+" + pct(d("passive.mining-speed", 0.2)) + "</white> mining speed.";
    }

    @Override
    public String abilityText() {
        return "Rock erupts in a <white>" + i("ability.length", 10) + "</white>-block line ahead of you, launching and <yellow>Stunning</yellow> enemies for <white>"
                + n(d("ability.stun-seconds", 1.5)) + "s</white>.";
    }
}
