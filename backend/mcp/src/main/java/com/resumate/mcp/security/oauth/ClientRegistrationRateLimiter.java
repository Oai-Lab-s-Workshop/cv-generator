package com.resumate.mcp.security.oauth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ClientRegistrationRateLimiter {

    static final int MAX_REGISTRATIONS = 10;
    static final Duration WINDOW = Duration.ofHours(1);

    private static final Logger LOGGER = LoggerFactory.getLogger(ClientRegistrationRateLimiter.class);

    private final Clock clock;
    private final Map<String, RegistrationBucket> registrations = new ConcurrentHashMap<>();

    public ClientRegistrationRateLimiter() {
        this(Clock.systemUTC());
    }

    ClientRegistrationRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public boolean isAllowed(String remoteAddress) {
        return !bucket(key(remoteAddress)).isExceeded(now());
    }

    public boolean tryRecordRegistration(String remoteAddress) {
        boolean recorded = bucket(key(remoteAddress)).tryRecord(now());
        if (recorded) {
            LOGGER.debug("OAuth client registration recorded for IP {}", normalizedAddress(remoteAddress));
        }
        return recorded;
    }

    public void recordRegistration(String remoteAddress) {
        bucket(key(remoteAddress)).record(now());
        LOGGER.debug("OAuth client registration recorded for IP {}", normalizedAddress(remoteAddress));
    }

    @Scheduled(fixedDelay = 300_000)
    void evictStaleBuckets() {
        int evicted = evictStaleBuckets(now());
        if (evicted > 0) {
            LOGGER.debug("Evicted {} stale client registration rate-limit buckets", evicted);
        }
    }

    int evictStaleBuckets(Instant now) {
        int before = registrations.size();
        registrations.entrySet().removeIf((entry) -> entry.getValue().isEmpty(now));
        return before - registrations.size();
    }

    private RegistrationBucket bucket(String key) {
        return registrations.computeIfAbsent(key, (ignored) -> new RegistrationBucket());
    }

    private Instant now() {
        return clock.instant();
    }

    private static String key(String remoteAddress) {
        return StringUtils.hasText(remoteAddress) ? remoteAddress.trim() : "unknown";
    }

    private static String normalizedAddress(String remoteAddress) {
        return StringUtils.hasText(remoteAddress) ? remoteAddress.trim() : "unknown";
    }

    private static final class RegistrationBucket {
        private final Deque<Instant> timestamps = new ArrayDeque<>();

        synchronized boolean isExceeded(Instant now) {
            prune(now);
            return timestamps.size() >= MAX_REGISTRATIONS;
        }

        synchronized void record(Instant now) {
            prune(now);
            timestamps.addLast(now);
        }

        synchronized boolean tryRecord(Instant now) {
            prune(now);
            if (timestamps.size() >= MAX_REGISTRATIONS) {
                return false;
            }
            timestamps.addLast(now);
            return true;
        }

        synchronized boolean isEmpty(Instant now) {
            prune(now);
            return timestamps.isEmpty();
        }

        private void prune(Instant now) {
            Instant cutoff = now.minus(WINDOW);
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
                timestamps.removeFirst();
            }
        }
    }
}
