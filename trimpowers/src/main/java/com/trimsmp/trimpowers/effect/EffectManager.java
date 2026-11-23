package com.trimsmp.trimpowers.effect;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import org.bukkit.GameMode;
import org.bukkit.entity.Boss;
import org.bukkit.entity.ElderGuardian;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.entity.Warden;
import org.bukkit.scheduler.BukkitTask;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Tracks and ticks custom effects on any living entity. */
public final class EffectManager {

    private final TrimPowersPlugin plugin;
    private final EffectBehaviors behaviors;
    private final Map<UUID, Holder> holders = new HashMap<>();
    private BukkitTask task;

    private static final class Holder {
        final LivingEntity entity;
        final EnumMap<EffectType, ActiveEffect> effects = new EnumMap<>(EffectType.class);

        Holder(LivingEntity entity) {
            this.entity = entity;
        }
    }

    public EffectManager(TrimPowersPlugin plugin) {
        this.plugin = plugin;
        this.behaviors = new EffectBehaviors(plugin);
    }

    public void start() {
        task = plugin.getServer().getScheduler().runTaskTimer(plugin, this::tick, 1L, 1L);
    }

    public void stop() {
        if (task != null) {
            task.cancel();
            task = null;
        }
        for (Holder holder : new ArrayList<>(holders.values())) {
            clear(holder.entity);
        }
        holders.clear();
    }

    /**
     * Applies (or refreshes) an effect. Re-applying keeps the longer duration and the stronger potency.
     *
     * @return the running effect, or null if the target is immune
     */
    public ActiveEffect apply(LivingEntity target, EffectType type, int ticks, double potency, Entity source) {
        if (target == null || ticks <= 0 || target.isDead() || !target.isValid()) {
            return null;
        }
        if (type.isDebuff() && target instanceof Player player
                && (player.getGameMode() == GameMode.CREATIVE || player.getGameMode() == GameMode.SPECTATOR)) {
            return null;
        }
        if (type.isCrowdControl() && plugin.settings().bossCrowdControlImmunity() && isBoss(target)) {
            return null;
        }
        Holder holder = holders.computeIfAbsent(target.getUniqueId(), id -> new Holder(target));
        ActiveEffect existing = holder.effects.get(type);
        UUID sourceId = source == null ? null : source.getUniqueId();
        if (existing != null) {
            existing.remaining = Math.max(existing.remaining, ticks);
            existing.duration = Math.max(existing.duration, existing.remaining);
            if (potency > existing.potency) {
                existing.potency = potency;
                if (type == EffectType.WARDED) {
                    existing.value = Math.max(existing.value, potency);
                }
            }
            if (sourceId != null) {
                existing.source = sourceId;
            }
            behaviors.onRefresh(target, existing);
            return existing;
        }
        ActiveEffect effect = new ActiveEffect(type, ticks, potency, sourceId);
        holder.effects.put(type, effect);
        behaviors.onApply(target, effect);
        return effect;
    }

    public ActiveEffect get(LivingEntity entity, EffectType type) {
        Holder holder = holders.get(entity.getUniqueId());
        return holder == null ? null : holder.effects.get(type);
    }

    public boolean has(LivingEntity entity, EffectType type) {
        return get(entity, type) != null;
    }

    public Collection<ActiveEffect> active(LivingEntity entity) {
        Holder holder = holders.get(entity.getUniqueId());
        return holder == null ? Collections.emptyList() : Collections.unmodifiableCollection(holder.effects.values());
    }

    /** Players currently under {@code type} (used to re-hide Shadowstep players from people who join). */
    public List<LivingEntity> entitiesWith(EffectType type) {
        List<LivingEntity> result = new ArrayList<>();
        for (Holder holder : holders.values()) {
            if (holder.effects.containsKey(type)) {
                result.add(holder.entity);
            }
        }
        return result;
    }

    public boolean remove(LivingEntity entity, EffectType type) {
        return remove(entity, type, EffectBehaviors.Reason.REMOVED);
    }

    boolean remove(LivingEntity entity, EffectType type, EffectBehaviors.Reason reason) {
        Holder holder = holders.get(entity.getUniqueId());
        if (holder == null) {
            return false;
        }
        ActiveEffect effect = holder.effects.remove(type);
        if (effect == null) {
            return false;
        }
        if (holder.effects.isEmpty()) {
            holders.remove(entity.getUniqueId());
        }
        behaviors.onRemove(holder.entity, effect, reason);
        return true;
    }

    /** Removes the shield and triggers its break pulse. */
    public void breakWard(LivingEntity entity) {
        remove(entity, EffectType.WARDED, EffectBehaviors.Reason.BROKEN);
    }

    /** Removes debuffs only (or everything when {@code debuffsOnly} is false). Returns how many were removed. */
    public int cleanse(LivingEntity entity, boolean debuffsOnly) {
        Holder holder = holders.get(entity.getUniqueId());
        if (holder == null) {
            return 0;
        }
        int removed = 0;
        for (EffectType type : new ArrayList<>(holder.effects.keySet())) {
            if (!debuffsOnly || type.isDebuff()) {
                if (remove(entity, type, EffectBehaviors.Reason.CLEANSED)) {
                    removed++;
                }
            }
        }
        return removed;
    }

    public void clear(LivingEntity entity) {
        Holder holder = holders.get(entity.getUniqueId());
        if (holder == null) {
            return;
        }
        for (EffectType type : new ArrayList<>(holder.effects.keySet())) {
            remove(holder.entity, type, EffectBehaviors.Reason.CLEARED);
        }
    }

    private void tick() {
        for (Holder holder : new ArrayList<>(holders.values())) {
            LivingEntity entity = holder.entity;
            if (!entity.isValid() || entity.isDead()) {
                clear(entity);
                continue;
            }
            for (ActiveEffect effect : new ArrayList<>(holder.effects.values())) {
                if (holder.effects.get(effect.type()) != effect) {
                    continue; // removed or replaced while ticking another effect
                }
                effect.age++;
                effect.remaining--;
                behaviors.onTick(entity, effect);
                if (effect.remaining <= 0 && holder.effects.get(effect.type()) == effect) {
                    remove(entity, effect.type(), EffectBehaviors.Reason.EXPIRED);
                }
            }
        }
        // Drop holders that lost their last effect during callbacks.
        Iterator<Holder> it = holders.values().iterator();
        while (it.hasNext()) {
            if (it.next().effects.isEmpty()) {
                it.remove();
            }
        }
    }

    private static boolean isBoss(LivingEntity entity) {
        return entity instanceof Boss || entity instanceof Warden || entity instanceof ElderGuardian;
    }
}
