package com.resumate.mcp.security;

import com.resumate.mcp.service.PocketBaseClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AiTokenUsageRecorder {

    private static final Logger logger = LoggerFactory.getLogger(AiTokenUsageRecorder.class);

    private final PocketBaseClient pocketBaseClient;
    private final Map<String, Instant> pendingUsage = new ConcurrentHashMap<>();

    public AiTokenUsageRecorder(PocketBaseClient pocketBaseClient) {
        this.pocketBaseClient = pocketBaseClient;
    }

    public void recordUsed(String tokenId) {
        pendingUsage.put(tokenId, Instant.now());
    }

    @Scheduled(fixedDelay = 60_000)
    void flushPendingUsage() {
        Map<String, Instant> snapshot = new HashMap<>(pendingUsage);
        for (Map.Entry<String, Instant> entry : snapshot.entrySet()) {
            if (!pendingUsage.remove(entry.getKey(), entry.getValue())) {
                continue;
            }
            try {
                pocketBaseClient.markAiTokenUsed(entry.getKey(), entry.getValue());
            } catch (RuntimeException ex) {
                pendingUsage.merge(entry.getKey(), entry.getValue(), (previous, current) -> previous.isAfter(current) ? previous : current);
                logger.warn("Deferred MCP API key lastUsedAt update failed tokenId={} message={}", entry.getKey(), ex.getMessage());
            }
        }
    }
}
