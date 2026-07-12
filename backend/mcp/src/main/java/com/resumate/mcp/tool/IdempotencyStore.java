package com.resumate.mcp.tool;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Component
public class IdempotencyStore {

    private final Cache<String, IdempotencyRecord> cache;

    public IdempotencyStore(@Value("${resumate.mcp.idempotency.ttl:5m}") Duration ttl) {
        this.cache = Caffeine.newBuilder()
                .expireAfterWrite(ttl)
                .build();
    }

    public IdempotencyRecord get(String userId, String key) {
        return cache.getIfPresent(cacheKey(userId, key));
    }

    public void put(String userId, String key, String profileId, String slug) {
        cache.put(cacheKey(userId, key), new IdempotencyRecord(profileId, slug, Instant.now()));
    }

    private static String cacheKey(String userId, String key) {
        return userId + ":" + key;
    }

    public record IdempotencyRecord(String profileId, String slug, Instant createdAt) {
    }
}
