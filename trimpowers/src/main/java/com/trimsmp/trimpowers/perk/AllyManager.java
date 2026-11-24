package com.trimsmp.trimpowers.perk;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.util.Fx;
import com.trimsmp.trimpowers.util.Targets;
import com.trimsmp.trimpowers.util.Text;
import net.kyori.adventure.text.TranslatableComponent;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.entity.Enemy;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Mob;
import org.bukkit.entity.Pillager;
import org.bukkit.entity.Player;
import org.bukkit.entity.Projectile;
import org.bukkit.entity.Raider;
import org.bukkit.entity.Tameable;
import org.bukkit.entity.Vex;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.event.entity.EntityTargetLivingEntityEvent;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.BannerMeta;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.util.Vector;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Mobs that fight for a player (Pillager Escort, Vex Swarm). Allies follow their owner, attack whoever the owner is
 * fighting (or nearby hostile mobs), never hurt the owner, their pets or villagers, drop no loot, and are never saved
 * to the world, so they can't pile up or be farmed.
 */
public final class AllyManager implements Listener {

    private static final long MEMORY_MILLIS = 10_000;

    private record Ally(UUID owner, Mob mob, long expiresAt) {
    }

    /** Who last hit the owner / who the owner last hit. */
    private static final class Combat {
        UUID attacker;
        long attackerAt;
        UUID victim;
        long victimAt;
    }

    private final TrimPowersPlugin plugin;
    private final NamespacedKey ownerKey;
    private final Map<UUID, Ally> allies = new HashMap<>();
    private final Map<UUID, Combat> combat = new HashMap<>();
    private final Map<UUID, Long> escortReadyAt = new HashMap<>();
    private boolean settingTarget;
    private BukkitTask task;

    public AllyManager(TrimPowersPlugin plugin) {
        this.plugin = plugin;
        this.ownerKey = new NamespacedKey(plugin, "ally_owner");
    }

    public void start() {
        task = plugin.getServer().getScheduler().runTaskTimer(plugin, this::tick, 10L, 10L);
    }

    public void stop() {
        if (task != null) {
            task.cancel();
            task = null;
        }
        for (Ally ally : new ArrayList<>(allies.values())) {
            dismiss(ally, false);
        }
        allies.clear();
    }

    // ---- queries ----

    public UUID ownerOf(Entity entity) {
        Ally ally = entity == null ? null : allies.get(entity.getUniqueId());
        return ally == null ? null : ally.owner();
    }

    public boolean isAllyOf(Entity entity, Player owner) {
        return owner != null && owner.getUniqueId().equals(ownerOf(entity));
    }

    private int countOf(UUID owner, Class<? extends Mob> type) {
        int n = 0;
        for (Ally ally : allies.values()) {
            if (ally.owner().equals(owner) && type.isInstance(ally.mob()) && ally.mob().isValid()) {
                n++;
            }
        }
        return n;
    }

    // ---- recruiting ----

    private void recruit(Mob mob, Player owner, long millis, String label) {
        mob.getPersistentDataContainer().set(ownerKey, PersistentDataType.STRING, owner.getUniqueId().toString());
        mob.setPersistent(false);
        mob.setRemoveWhenFarAway(false);
        if (mob instanceof Raider raider) {
            raider.setCanJoinRaid(false);
            raider.setPatrolLeader(false);
            raider.setPatrolTarget(null);
        }
        mob.customName(Text.mm("<gray>" + owner.getName() + "'s <white>" + label));
        mob.setCustomNameVisible(true);
        setTarget(mob, null);
        allies.put(mob.getUniqueId(), new Ally(owner.getUniqueId(), mob, System.currentTimeMillis() + millis));
        Fx.particle(mob.getLocation().add(0, 1, 0), Particle.HAPPY_VILLAGER, 8, 0.4, 0);
    }

    /** Vex Swarm: summons vexes around the owner. */
    public void summonVexes(Player owner, PerkParams params) {
        int count = Math.max(1, params.i("count", 2));
        double seconds = Math.max(1, params.d("seconds", 15));
        Location base = owner.getLocation().add(0, 1.5, 0);
        for (int i = 0; i < count; i++) {
            double angle = 2 * Math.PI * i / count;
            Location at = base.clone().add(Math.cos(angle) * 1.2, 0.3, Math.sin(angle) * 1.2);
            Vex vex = owner.getWorld().spawn(at, Vex.class, v -> {
                v.setPersistent(false);
                v.setLimitedLifetime(true);
                v.setLimitedLifetimeTicks((int) (seconds * 20) + 40);
            });
            recruit(vex, owner, (long) (seconds * 1000), "Vex");
            Fx.particle(at, Particle.WITCH, 12, 0.3, 0.05);
        }
        Fx.sound(owner.getLocation(), Sound.ENTITY_EVOKER_PREPARE_SUMMON, 1f, 1.2f);
        Fx.sound(owner.getLocation(), Sound.ENTITY_VEX_AMBIENT, 1f, 1f);
    }

    /** Pillager Escort: called regularly for players with the perk; recruits pillagers at an outpost. */
    public void checkPillagerEscort(Player owner, PerkParams params) {
        long now = System.currentTimeMillis();
        if (escortReadyAt.getOrDefault(owner.getUniqueId(), 0L) > now) {
            return;
        }
        if (!isOminousBanner(owner.getInventory().getItemInMainHand()) && !isOminousBanner(owner.getInventory().getItemInOffHand())) {
            return;
        }
        if (!nearOutpost(owner, params.d("outpost-radius", 48))) {
            return;
        }
        int wanted = Math.max(1, params.i("count", 5)) - countOf(owner.getUniqueId(), Pillager.class);
        if (wanted <= 0) {
            return;
        }
        long millis = (long) (params.d("minutes", 5) * 60_000);
        int recruited = 0;
        // First, the outpost's own pillagers join you...
        for (Entity near : owner.getNearbyEntities(32, 16, 32)) {
            if (recruited >= wanted) {
                break;
            }
            if (near instanceof Pillager pillager && !allies.containsKey(pillager.getUniqueId()) && !pillager.isDead()) {
                recruit(pillager, owner, millis, "Pillager");
                recruited++;
            }
        }
        // ...and the rest march out of the outpost.
        while (recruited < wanted) {
            ThreadLocalRandom r = ThreadLocalRandom.current();
            Location at = owner.getLocation().add(r.nextDouble(-3, 3), 0, r.nextDouble(-3, 3));
            at.setY(owner.getWorld().getHighestBlockYAt(at) + 1);
            Pillager pillager = owner.getWorld().spawn(at, Pillager.class, p -> p.setPersistent(false));
            recruit(pillager, owner, millis, "Pillager");
            recruited++;
        }
        escortReadyAt.put(owner.getUniqueId(), now + (long) (params.d("cooldown-minutes", 10) * 60_000));
        Fx.sound(owner.getLocation(), Sound.EVENT_RAID_HORN, 0.6f, 1.2f);
        plugin.hud().flash(owner, Text.mm("<gold><b>⚑ " + recruited + " pillagers rally to your banner!"));
    }

    private boolean nearOutpost(Player player, double radius) {
        try {
            var result = player.getWorld().locateNearestStructure(player.getLocation(),
                    org.bukkit.generator.structure.Structure.PILLAGER_OUTPOST, 3, false);
            if (result == null) {
                return false;
            }
            Location at = result.getLocation();
            double dx = at.getX() - player.getLocation().getX();
            double dz = at.getZ() - player.getLocation().getZ();
            return dx * dx + dz * dz <= radius * radius;
        } catch (RuntimeException ex) {
            return false;
        }
    }

    public static boolean isOminousBanner(ItemStack item) {
        if (item == null || item.getType() != Material.WHITE_BANNER || !item.hasItemMeta()) {
            return false;
        }
        ItemMeta meta = item.getItemMeta();
        if (meta.hasItemName() && meta.itemName() instanceof TranslatableComponent name
                && name.key().equals("block.minecraft.ominous_banner")) {
            return true;
        }
        return meta instanceof BannerMeta banner && banner.numberOfPatterns() >= 8;
    }

    // ---- ticking: follow, fight, expire ----

    private void tick() {
        long now = System.currentTimeMillis();
        for (Ally ally : new ArrayList<>(allies.values())) {
            Mob mob = ally.mob();
            if (!mob.isValid() || mob.isDead()) {
                allies.remove(mob.getUniqueId());
                continue;
            }
            Player owner = Bukkit.getPlayer(ally.owner());
            if (owner == null || !owner.isOnline() || owner.isDead() || now > ally.expiresAt()) {
                dismiss(ally, true);
                continue;
            }
            if (!mob.getWorld().equals(owner.getWorld()) || mob.getLocation().distanceSquared(owner.getLocation()) > 32 * 32) {
                mob.teleport(owner.getLocation().add(ThreadLocalRandom.current().nextDouble(-2, 2), 0.5,
                        ThreadLocalRandom.current().nextDouble(-2, 2)));
                setTarget(mob, null);
                continue;
            }
            LivingEntity target = mob.getTarget();
            if (target == null || !target.isValid() || target.isDead() || !allowedTarget(owner, mob, target)
                    || target.getLocation().distanceSquared(owner.getLocation()) > 24 * 24) {
                target = chooseTarget(owner, mob);
                setTarget(mob, target);
            }
            if (target == null) {
                follow(mob, owner);
            }
        }
    }

    private LivingEntity chooseTarget(Player owner, Mob mob) {
        Combat memo = combat.get(owner.getUniqueId());
        long now = System.currentTimeMillis();
        if (memo != null) {
            for (UUID id : new UUID[]{memo.attackerAt + MEMORY_MILLIS > now ? memo.attacker : null,
                    memo.victimAt + MEMORY_MILLIS > now ? memo.victim : null}) {
                Entity entity = id == null ? null : Bukkit.getEntity(id);
                if (entity instanceof LivingEntity living && living.isValid() && !living.isDead()
                        && allowedTarget(owner, mob, living)) {
                    return living;
                }
            }
        }
        LivingEntity best = null;
        double bestDistance = Double.MAX_VALUE;
        for (LivingEntity near : owner.getWorld().getNearbyLivingEntities(owner.getLocation(), 14)) {
            if (!(near instanceof Enemy) || !allowedTarget(owner, mob, near)) {
                continue;
            }
            double distance = near.getLocation().distanceSquared(owner.getLocation());
            if (distance < bestDistance) {
                best = near;
                bestDistance = distance;
            }
        }
        return best;
    }

    /** Never the owner, their allies or pets, villagers or golems; players only if PvP rules allow. */
    private boolean allowedTarget(Player owner, Mob ally, LivingEntity target) {
        if (target.equals(owner) || target.equals(ally) || isAllyOf(target, owner)) {
            return false;
        }
        if (target instanceof Tameable pet && pet.isTamed() && owner.getUniqueId().equals(pet.getOwnerUniqueId())) {
            return false;
        }
        if (ally instanceof Raider && target instanceof Raider) {
            return false; // raiders can't hurt each other anyway
        }
        Combat memo = combat.get(owner.getUniqueId());
        boolean fighting = memo != null && (target.getUniqueId().equals(memo.attacker) || target.getUniqueId().equals(memo.victim));
        if (target instanceof Player player) {
            return fighting && Targets.canAffect(plugin, owner, player);
        }
        return target instanceof Enemy || fighting;
    }

    private void follow(Mob mob, Player owner) {
        Location to = owner.getLocation();
        double distance = mob.getLocation().distance(to);
        if (distance < 4) {
            return;
        }
        if (mob instanceof Vex) {
            Vector toward = to.clone().add(0, 1.5, 0).toVector().subtract(mob.getLocation().toVector());
            mob.setVelocity(toward.normalize().multiply(Math.min(0.6, 0.15 + distance * 0.03)));
        } else {
            mob.getPathfinder().moveTo(to, 1.2);
        }
    }

    private void setTarget(Mob mob, LivingEntity target) {
        settingTarget = true;
        try {
            mob.setTarget(target);
        } finally {
            settingTarget = false;
        }
    }

    private void dismiss(Ally ally, boolean effects) {
        allies.remove(ally.mob().getUniqueId());
        Mob mob = ally.mob();
        if (mob.isValid()) {
            if (effects) {
                Fx.particle(mob.getLocation().add(0, 1, 0), Particle.POOF, 12, 0.3, 0.02);
            }
            mob.remove();
        }
    }

    private void dismissAll(UUID owner) {
        for (Ally ally : new ArrayList<>(allies.values())) {
            if (ally.owner().equals(owner)) {
                dismiss(ally, true);
            }
        }
    }

    // ---- events ----

    @EventHandler(ignoreCancelled = true)
    public void onTarget(EntityTargetLivingEntityEvent event) {
        if (settingTarget || event.getTarget() == null || !(event.getEntity() instanceof Mob mob)) {
            return;
        }
        Ally ally = allies.get(mob.getUniqueId());
        if (ally == null) {
            return;
        }
        Player owner = Bukkit.getPlayer(ally.owner());
        if (owner == null || !allowedTarget(owner, mob, event.getTarget())) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOW, ignoreCancelled = true)
    public void onFriendlyFire(EntityDamageByEntityEvent event) {
        Entity damager = event.getDamager();
        Entity source = damager instanceof Projectile shot && shot.getShooter() instanceof Entity shooter ? shooter : damager;
        UUID sourceOwner = ownerOf(source);
        UUID victimOwner = ownerOf(event.getEntity());
        if (sourceOwner != null) {
            Entity victim = event.getEntity();
            boolean protectedVictim = victim.getUniqueId().equals(sourceOwner) || sourceOwner.equals(victimOwner)
                    || (victim instanceof Tameable pet && sourceOwner.equals(pet.getOwnerUniqueId()));
            if (protectedVictim) {
                event.setCancelled(true);
            }
        }
        if (victimOwner != null && source.getUniqueId().equals(victimOwner)) {
            event.setCancelled(true); // you can't hurt your own allies
        }
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onCombat(EntityDamageByEntityEvent event) {
        Entity damager = event.getDamager();
        Entity source = damager instanceof Projectile shot && shot.getShooter() instanceof Entity shooter ? shooter : damager;
        long now = System.currentTimeMillis();
        if (event.getEntity() instanceof Player victim && hasAllies(victim.getUniqueId())
                && source instanceof LivingEntity && !victim.getUniqueId().equals(ownerOf(source))) {
            Combat memo = combat.computeIfAbsent(victim.getUniqueId(), k -> new Combat());
            memo.attacker = source.getUniqueId();
            memo.attackerAt = now;
        }
        if (source instanceof Player attacker && hasAllies(attacker.getUniqueId())
                && event.getEntity() instanceof LivingEntity && !attacker.getUniqueId().equals(ownerOf(event.getEntity()))) {
            Combat memo = combat.computeIfAbsent(attacker.getUniqueId(), k -> new Combat());
            memo.victim = event.getEntity().getUniqueId();
            memo.victimAt = now;
        }
    }

    private boolean hasAllies(UUID owner) {
        for (Ally ally : allies.values()) {
            if (ally.owner().equals(owner)) {
                return true;
            }
        }
        return false;
    }

    @EventHandler
    public void onAllyDeath(EntityDeathEvent event) {
        if (allies.remove(event.getEntity().getUniqueId()) != null) {
            event.getDrops().clear();
            event.setDroppedExp(0);
        }
    }

    @EventHandler
    public void onOwnerDeath(PlayerDeathEvent event) {
        dismissAll(event.getEntity().getUniqueId());
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        dismissAll(event.getPlayer().getUniqueId());
        combat.remove(event.getPlayer().getUniqueId());
    }
}
