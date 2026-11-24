package com.trimsmp.trimpowers.perk;

import com.trimsmp.trimpowers.TrimPowersPlugin;
import com.trimsmp.trimpowers.effect.EffectType;
import com.trimsmp.trimpowers.util.Damage;
import com.trimsmp.trimpowers.util.Fx;
import com.trimsmp.trimpowers.util.Lightning;
import com.trimsmp.trimpowers.util.Targets;
import io.papermc.paper.event.entity.WardenAngerChangeEvent;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.Tag;
import org.bukkit.block.Block;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Item;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.entity.Projectile;
import org.bukkit.entity.Warden;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockDropItemEvent;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.event.entity.EntityPotionEffectEvent;
import org.bukkit.event.entity.EntityTargetLivingEntityEvent;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.event.player.PlayerToggleFlightEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.util.Vector;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/** Event-driven signature passives. */
public final class PerkListener implements Listener {

    private static final Map<Material, Material> SMELTS = Map.of(
            Material.RAW_IRON, Material.IRON_INGOT,
            Material.RAW_GOLD, Material.GOLD_INGOT,
            Material.RAW_COPPER, Material.COPPER_INGOT,
            Material.ANCIENT_DEBRIS, Material.NETHERITE_SCRAP);

    private final TrimPowersPlugin plugin;
    private final PerkTask task;
    private final Map<UUID, int[]> comboHits = new HashMap<>();
    private final Map<UUID, Long> comboLastHit = new HashMap<>();
    private final Map<UUID, Long> critReadyAt = new HashMap<>();
    private boolean veinMining;

    public PerkListener(TrimPowersPlugin plugin, PerkTask task) {
        this.plugin = plugin;
        this.task = task;
    }

    private PerkParams perk(Player player, Perk perk) {
        return plugin.perks().active(player, perk);
    }

    // ---- Warden's Calm ----

    @EventHandler(ignoreCancelled = true)
    public void onWardenAnger(WardenAngerChangeEvent event) {
        if (event.getTarget() instanceof Player player && perk(player, Perk.WARDENS_CALM) != null) {
            event.setCancelled(true);
        }
    }

    @EventHandler(ignoreCancelled = true)
    public void onWardenTarget(EntityTargetLivingEntityEvent event) {
        if (event.getEntity() instanceof Warden && event.getTarget() instanceof Player player
                && perk(player, Perk.WARDENS_CALM) != null) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOW, ignoreCancelled = true)
    public void onWardenHit(EntityDamageByEntityEvent event) {
        if (event.getDamager() instanceof Warden && event.getEntity() instanceof Player player
                && perk(player, Perk.WARDENS_CALM) != null) {
            event.setCancelled(true);
        }
    }

    // ---- Deep Dark Sight ----

    @EventHandler(ignoreCancelled = true)
    public void onPotion(EntityPotionEffectEvent event) {
        if (!(event.getEntity() instanceof Player player) || event.getNewEffect() == null) {
            return;
        }
        PotionEffectType type = event.getModifiedType();
        if ((type.equals(PotionEffectType.DARKNESS) || type.equals(PotionEffectType.BLINDNESS))
                && perk(player, Perk.DEEP_DARK_SIGHT) != null) {
            event.setCancelled(true);
        } else if (type.equals(PotionEffectType.BLINDNESS) && perk(player, Perk.TRUESIGHT) != null) {
            event.setCancelled(true);
        }
    }

    // ---- Bounce ----

    @EventHandler(priority = EventPriority.HIGHEST, ignoreCancelled = true)
    public void onFall(EntityDamageEvent event) {
        if (event.getCause() != EntityDamageEvent.DamageCause.FALL || !(event.getEntity() instanceof Player player)) {
            return;
        }
        PerkParams bounce = perk(player, Perk.BOUNCE);
        float fell = player.getFallDistance();
        if (bounce == null || fell < bounce.d("min-fall", 5)) {
            return;
        }
        event.setCancelled(true);
        Location at = player.getLocation();
        if (player.isSneaking()) {
            Fx.particle(at, Particle.CLOUD, 10, 0.4, 0.02);
            Fx.sound(at, Sound.BLOCK_WOOL_FALL, 1f, 0.8f);
            return;
        }
        double up = Math.min(1.6, 0.4 + fell * 0.045);
        plugin.getServer().getScheduler().runTask(plugin, () -> {
            if (player.isOnline()) {
                player.setVelocity(player.getVelocity().setY(up));
            }
        });
        Fx.particle(at, Particle.ITEM_SLIME, 20, 0.4, 0.1);
        Fx.sound(at, Sound.BLOCK_SLIME_BLOCK_FALL, 1f, 0.8f);
        Fx.sound(at, Sound.ENTITY_SLIME_JUMP, 1f, 1.0f);
    }

    // ---- melee procs: Static Charge, Chain Reaction, Undertow pull ----

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onHit(EntityDamageByEntityEvent event) {
        if (Damage.isInternal() || Damage.isProbe() || !(event.getEntity() instanceof LivingEntity victim)) {
            return;
        }
        if (event.getCause() != EntityDamageEvent.DamageCause.ENTITY_ATTACK) {
            return;
        }
        Entity damager = event.getDamager();

        // Static Charge: the victim strikes back with lightning.
        if (victim instanceof Player defender && damager instanceof LivingEntity attacker && !(damager instanceof Projectile)) {
            PerkParams charge = perk(defender, Perk.STATIC_CHARGE);
            if (charge != null && ThreadLocalRandom.current().nextDouble() < charge.d("chance", 0.15)
                    && Targets.canAffect(plugin, defender, attacker)) {
                Lightning.strike(attacker.getLocation());
                Damage.ability(attacker, charge.d("damage", 3), defender);
                plugin.effects().apply(attacker, EffectType.SHOCKED, (int) Math.round(charge.d("shocked-seconds", 2) * 20),
                        plugin.settings().effect("overcharged", "shocked-damage", 0.5), defender);
            }
        }

        if (!(damager instanceof Player attacker)) {
            return;
        }

        // Crushing Crits: critical hits stun.
        PerkParams crits = perk(attacker, Perk.CRUSHING_CRITS);
        if (crits != null && event.isCritical()) {
            long now = System.currentTimeMillis();
            if (critReadyAt.getOrDefault(attacker.getUniqueId(), 0L) <= now && Targets.canAffect(plugin, attacker, victim)) {
                critReadyAt.put(attacker.getUniqueId(), now + (long) (crits.d("cooldown", 6) * 1000));
                plugin.effects().apply(victim, EffectType.STUN, (int) Math.round(crits.d("stun-seconds", 0.75) * 20), 0, attacker);
                Fx.sound(victim.getLocation(), Sound.ENTITY_IRON_GOLEM_DAMAGE, 0.8f, 0.7f);
            }
        }

        // Undertow: pull enemies in water toward you.
        PerkParams undertow = perk(attacker, Perk.UNDERTOW);
        if (undertow != null && victim.isInWater()) {
            double pull = undertow.d("pull", 0.5);
            plugin.getServer().getScheduler().runTask(plugin, () -> {
                if (victim.isValid() && attacker.isOnline()) {
                    Vector toward = attacker.getLocation().toVector().subtract(victim.getLocation().toVector());
                    if (toward.lengthSquared() > 1.0E-4) {
                        victim.setVelocity(toward.normalize().multiply(pull).setY(0.1));
                        Fx.particle(victim.getLocation().add(0, 0.5, 0), Particle.BUBBLE, 12, 0.3, 0.05);
                    }
                }
            });
        }

        // Chain Reaction: every Nth hit in a row arcs lightning.
        PerkParams chain = perk(attacker, Perk.CHAIN_REACTION);
        if (chain != null) {
            long now = System.currentTimeMillis();
            UUID id = attacker.getUniqueId();
            long window = (long) (chain.d("window-seconds", 4) * 1000);
            int[] count = comboHits.computeIfAbsent(id, k -> new int[1]);
            if (now - comboLastHit.getOrDefault(id, 0L) > window) {
                count[0] = 0;
            }
            comboLastHit.put(id, now);
            count[0]++;
            if (count[0] >= Math.max(1, chain.i("hits", 4))) {
                count[0] = 0;
                Location from = victim.getLocation().add(0, victim.getHeight() * 0.6, 0);
                for (LivingEntity target : Targets.around(plugin, attacker, victim.getLocation(), chain.d("radius", 5))) {
                    if (target.equals(victim)) {
                        continue;
                    }
                    Lightning.arc(from, target.getLocation().add(0, target.getHeight() * 0.6, 0));
                    Damage.ability(target, chain.d("damage", 3), attacker);
                    plugin.effects().apply(target, EffectType.SHOCKED, 40,
                            plugin.settings().effect("overcharged", "shocked-damage", 0.5), attacker);
                    Fx.sound(target.getLocation(), Sound.ENTITY_LIGHTNING_BOLT_IMPACT, 0.5f, 1.8f);
                    break;
                }
            }
        }
    }

    // ---- Vein Miner ----

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onBreak(BlockBreakEvent event) {
        if (veinMining) {
            return;
        }
        Player player = event.getPlayer();
        Block origin = event.getBlock();
        Tag<Material> family = oreFamily(origin.getType());
        if (family == null || player.getGameMode() == GameMode.CREATIVE) {
            return;
        }
        PerkParams vein = perk(player, Perk.VEIN_MINER);
        if (vein == null || (vein.b("require-sneak", true) && !player.isSneaking())) {
            return;
        }
        ItemStack tool = player.getInventory().getItemInMainHand();
        if (origin.getDrops(tool, player).isEmpty()) {
            return; // wrong tool (e.g. stone pickaxe on diamond) - don't vein mine
        }
        List<Block> veinBlocks = collectVein(origin, family, Math.max(1, vein.i("max-blocks", 16)) - 1);
        if (veinBlocks.isEmpty()) {
            return;
        }
        Material toolType = tool.getType();
        plugin.getServer().getScheduler().runTask(plugin, () -> {
            veinMining = true;
            try {
                for (Block block : veinBlocks) {
                    if (!player.isOnline() || player.getInventory().getItemInMainHand().getType() != toolType) {
                        break; // tool broke or was switched
                    }
                    if (family.isTagged(block.getType())) {
                        player.breakBlock(block);
                    }
                }
            } finally {
                veinMining = false;
            }
        });
    }

    private static List<Block> collectVein(Block origin, Tag<Material> family, int limit) {
        List<Block> found = new ArrayList<>();
        Set<Block> seen = new HashSet<>();
        Deque<Block> queue = new ArrayDeque<>();
        seen.add(origin);
        queue.add(origin);
        while (!queue.isEmpty() && found.size() < limit) {
            Block current = queue.poll();
            for (int dx = -1; dx <= 1 && found.size() < limit; dx++) {
                for (int dy = -1; dy <= 1 && found.size() < limit; dy++) {
                    for (int dz = -1; dz <= 1 && found.size() < limit; dz++) {
                        Block next = current.getRelative(dx, dy, dz);
                        if (seen.add(next) && family.isTagged(next.getType())) {
                            found.add(next);
                            queue.add(next);
                        }
                    }
                }
            }
        }
        return found;
    }

    private static Tag<Material> oreFamily(Material type) {
        for (Tag<Material> tag : List.of(Tag.COAL_ORES, Tag.IRON_ORES, Tag.COPPER_ORES, Tag.GOLD_ORES,
                Tag.REDSTONE_ORES, Tag.LAPIS_ORES, Tag.DIAMOND_ORES, Tag.EMERALD_ORES)) {
            if (tag.isTagged(type)) {
                return tag;
            }
        }
        if (type == Material.NETHER_QUARTZ_ORE || type == Material.NETHER_GOLD_ORE || type == Material.ANCIENT_DEBRIS) {
            return single(type);
        }
        return null;
    }

    private static Tag<Material> single(Material type) {
        return new Tag<>() {
            @Override
            public boolean isTagged(Material item) {
                return item == type;
            }

            @Override
            public Set<Material> getValues() {
                return Set.of(type);
            }

            @Override
            public org.bukkit.NamespacedKey getKey() {
                return type.getKey();
            }
        };
    }

    // ---- Auto-Smelt & Prospector ----

    @EventHandler(ignoreCancelled = true)
    public void onDrops(BlockDropItemEvent event) {
        Material broken = event.getBlockState().getType();
        if (oreFamily(broken) == null) {
            return;
        }
        Player player = event.getPlayer();
        PerkParams smelt = perk(player, Perk.AUTO_SMELT);
        PerkParams prospector = perk(player, Perk.PROSPECTOR);
        if (smelt == null && prospector == null) {
            return;
        }
        boolean silk = player.getInventory().getItemInMainHand().containsEnchantment(Enchantment.SILK_TOUCH);
        boolean doubled = prospector != null && !silk && ThreadLocalRandom.current().nextDouble() < prospector.d("chance", 0.15);
        boolean changed = false;
        for (Item item : event.getItems()) {
            ItemStack stack = item.getItemStack();
            if (smelt != null && SMELTS.containsKey(stack.getType())) {
                stack = stack.withType(SMELTS.get(stack.getType()));
                changed = true;
            }
            // Never double the ore block itself (silk touch / ancient debris) - that would be a dupe loop.
            if (doubled && stack.getType() != broken) {
                stack.setAmount(Math.min(stack.getMaxStackSize(), stack.getAmount() * 2));
                changed = true;
            }
            item.setItemStack(stack);
        }
        if (changed) {
            Location at = event.getBlock().getLocation().add(0.5, 0.5, 0.5);
            if (smelt != null) {
                Fx.particle(at, Particle.FLAME, 6, 0.25, 0.02);
            }
            if (doubled) {
                Fx.particle(at, Particle.HAPPY_VILLAGER, 8, 0.3, 0);
                Fx.sound(at, Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 0.6f, 1.6f);
            }
        }
    }

    // ---- Wisdom & XP Hunter ----

    @EventHandler(priority = EventPriority.HIGH)
    public void onPlayerDeath(PlayerDeathEvent event) {
        Player player = event.getEntity();
        PerkParams wisdom = perk(player, Perk.WISDOM);
        if (wisdom == null || event.getKeepLevel()) {
            return;
        }
        double keep = Math.max(0, Math.min(1, wisdom.d("keep-levels", 0.5)));
        event.setNewLevel((int) Math.floor(player.getLevel() * keep));
        event.setDroppedExp((int) Math.round(event.getDroppedExp() * (1 - keep)));
    }

    @EventHandler(priority = EventPriority.HIGH)
    public void onKill(EntityDeathEvent event) {
        Player killer = event.getEntity().getKiller();
        if (killer == null || killer.equals(event.getEntity())) {
            return;
        }
        PerkParams hunter = perk(killer, Perk.XP_HUNTER);
        if (hunter != null && !(event.getEntity() instanceof Player) && event.getDroppedExp() > 0) {
            event.setDroppedExp((int) Math.round(event.getDroppedExp() * hunter.d("multiplier", 1.5)));
        }
        PerkParams bloodlust = perk(killer, Perk.BLOODLUST);
        if (bloodlust != null && !killer.isDead()) {
            killer.heal(bloodlust.d("heal", 4), org.bukkit.event.entity.EntityRegainHealthEvent.RegainReason.MAGIC);
            int ticks = (int) Math.round(bloodlust.d("speed-seconds", 3) * 20);
            if (ticks > 0) {
                killer.addPotionEffect(new org.bukkit.potion.PotionEffect(PotionEffectType.SPEED, ticks, 1, true, false, true));
            }
            Fx.dust(killer.getLocation().add(0, 1, 0), org.bukkit.Color.fromRGB(0x8a0303), 1.4f, 12, 0.4);
            Fx.sound(killer.getLocation(), Sound.ENTITY_PLAYER_BURP, 0.6f, 0.6f);
        }
    }

    // ---- Piercing Shots ----

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onLaunch(org.bukkit.event.entity.ProjectileLaunchEvent event) {
        if (event.getEntity() instanceof org.bukkit.entity.AbstractArrow arrow && !(arrow instanceof org.bukkit.entity.Trident)
                && arrow.getShooter() instanceof Player shooter) {
            PerkParams piercing = perk(shooter, Perk.PIERCING_SHOTS);
            if (piercing != null) {
                arrow.setPierceLevel(Math.min(127, arrow.getPierceLevel() + Math.max(0, piercing.i("extra-pierce", 1))));
            }
        }
    }

    // ---- Beast Tamer ----

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onPetDamage(EntityDamageByEntityEvent event) {
        if (Damage.isProbe()) {
            return;
        }
        if (event.getDamager() instanceof org.bukkit.entity.Tameable pet && pet.isTamed()
                && pet.getOwner() instanceof Player owner && owner.isOnline()) {
            PerkParams tamer = perk(owner, Perk.BEAST_TAMER);
            if (tamer != null) {
                event.setDamage(event.getDamage() * (1 + tamer.d("damage-bonus", 0.5)));
            }
        }
        if (event.getEntity() instanceof org.bukkit.entity.Tameable pet && pet.isTamed()
                && pet.getOwner() instanceof Player owner && owner.isOnline()) {
            PerkParams tamer = perk(owner, Perk.BEAST_TAMER);
            if (tamer != null) {
                event.setDamage(event.getDamage() * Math.max(0, 1 - tamer.d("damage-reduction", 0.5)));
            }
        }
    }

    // ---- Seeker, Sand Veil, Spectral Rush (when you get hit) ----

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onDefend(EntityDamageByEntityEvent event) {
        if (Damage.isInternal() || Damage.isProbe() || !(event.getEntity() instanceof Player defender)) {
            return;
        }
        Entity damager = event.getDamager();
        boolean melee = event.getCause() == EntityDamageEvent.DamageCause.ENTITY_ATTACK;
        LivingEntity attacker = damager instanceof Projectile shot && shot.getShooter() instanceof LivingEntity shooter
                ? shooter : damager instanceof LivingEntity living ? living : null;

        PerkParams rush = perk(defender, Perk.SPECTRAL_RUSH);
        if (rush != null) {
            task.spectralRush(defender, rush);
        }
        if (attacker == null || attacker.equals(defender)) {
            return;
        }
        PerkParams seeker = perk(defender, Perk.SEEKER);
        if (seeker != null && Targets.canAffect(plugin, defender, attacker)) {
            plugin.effects().apply(attacker, EffectType.MARKED, (int) Math.round(seeker.d("mark-seconds", 3) * 20),
                    seeker.d("extra-damage", 0.2), defender);
        }
        PerkParams veil = perk(defender, Perk.SAND_VEIL);
        if (veil != null && melee && ThreadLocalRandom.current().nextDouble() < veil.d("chance", 0.2)
                && Targets.canAffect(plugin, defender, attacker)) {
            attacker.addPotionEffect(new org.bukkit.potion.PotionEffect(PotionEffectType.BLINDNESS,
                    (int) Math.round(veil.d("blind-seconds", 2) * 20), 0, false, false, true));
            Fx.block(attacker.getEyeLocation(), Particle.FALLING_DUST, Material.SAND.createBlockData(), 15, 0.3);
            Fx.sound(attacker.getLocation(), Sound.BLOCK_SAND_BREAK, 1f, 0.8f);
        }
    }

    // ---- Soul Shield ----

    private final Map<UUID, Long> soulShieldReadyAt = new HashMap<>();

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onLowHealth(EntityDamageEvent event) {
        if (!(event.getEntity() instanceof Player player)) {
            return;
        }
        PerkParams shield = perk(player, Perk.SOUL_SHIELD);
        if (shield == null) {
            return;
        }
        double after = player.getHealth() - event.getFinalDamage();
        long now = System.currentTimeMillis();
        if (after <= 0 || after >= shield.d("below-hearts", 4) * 2 || soulShieldReadyAt.getOrDefault(player.getUniqueId(), 0L) > now) {
            return;
        }
        soulShieldReadyAt.put(player.getUniqueId(), now + (long) (shield.d("cooldown", 60) * 1000));
        int ticks = (int) Math.round(shield.d("seconds", 5) * 20);
        int amplifier = Math.max(0, shield.i("level", 2) - 1);
        plugin.getServer().getScheduler().runTask(plugin, () -> {
            if (player.isOnline() && !player.isDead()) {
                player.addPotionEffect(new org.bukkit.potion.PotionEffect(PotionEffectType.RESISTANCE, ticks, amplifier, true, true, true));
                Fx.particle(player.getLocation().add(0, 1, 0), Particle.SOUL, 20, 0.5, 0.05);
                Fx.sound(player.getLocation(), Sound.PARTICLE_SOUL_ESCAPE, 1.5f, 0.8f);
                plugin.hud().flash(player, com.trimsmp.trimpowers.util.Text.mm("<aqua><b>⛨ Soul Shield!"));
            }
        });
    }

    // ---- Double Jump ----

    @EventHandler(ignoreCancelled = true)
    public void onFlightToggle(PlayerToggleFlightEvent event) {
        Player player = event.getPlayer();
        if (event.isFlying() && task.handleDoubleJump(player)) {
            event.setCancelled(true);
        }
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        UUID id = event.getPlayer().getUniqueId();
        comboHits.remove(id);
        comboLastHit.remove(id);
        critReadyAt.remove(id);
        soulShieldReadyAt.remove(id);
        task.forget(event.getPlayer());
    }
}
