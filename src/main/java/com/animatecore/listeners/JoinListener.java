package com.animatecore.listeners;

import com.animatecore.AnimateCorePlugin;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;

/** Optionally prompts joining players to download AnimateCore's resource pack, if a URL is configured. */
public class JoinListener implements Listener {

    private final AnimateCorePlugin plugin;

    public JoinListener(AnimateCorePlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onJoin(PlayerJoinEvent event) {
        String url = plugin.getAnimateConfig().resourcePackUrl();
        if (url == null || url.isBlank()) return;

        Player player = event.getPlayer();
        try {
            byte[] hash = hexToBytes(plugin.getAnimateConfig().resourcePackSha1());
            String promptText = plugin.getAnimateConfig().resourcePackPromptMessage();
            Component prompt = (promptText == null || promptText.isBlank())
                    ? null
                    : LegacyComponentSerializer.legacyAmpersand().deserialize(promptText);
            boolean force = plugin.getAnimateConfig().resourcePackForced();

            if (hash != null && prompt != null) {
                player.setResourcePack(url, hash, prompt, force);
            } else if (hash != null) {
                player.setResourcePack(url, hash, force);
            } else {
                player.setResourcePack(url);
            }
        } catch (Exception ex) {
            plugin.getLogger().warning("Failed to send resource pack to " + player.getName() + ": " + ex.getMessage());
        }
    }

    private byte[] hexToBytes(String hex) {
        if (hex == null || hex.isBlank()) return null;
        String clean = hex.trim();
        if (clean.length() % 2 != 0) return null;
        byte[] out = new byte[clean.length() / 2];
        for (int i = 0; i < out.length; i++) {
            out[i] = (byte) Integer.parseInt(clean.substring(i * 2, i * 2 + 2), 16);
        }
        return out;
    }
}
