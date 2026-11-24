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
        if (event.getEntity() instanceof Player || event.getEntity().getKiller() == null) {
            return;
        }
        PerkParams hunter = perk(event.getEntity().getKiller(), Perk.XP_HUNTER);
        if (hunter != null && event.getDroppedExp() > 0) {
            event.setDroppedExp((int) Math.round(event.getDroppedExp() * hunter.d("multiplier", 1.5)));
        }
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
        task.forget(event.getPlayer());
    }
}
