package com.resumate.mcp.security.oauth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@ConditionalOnProperty(name = "resumate.oauth.rate-limiter.type", havingValue = "memory", matchIfMissing = true)
public class OAuthLoginAbuseProtection implements OAuthLoginAbuseProtectionService {

    static final int MAX_FAILED_ATTEMPTS = 5;
    static final Duration WINDOW = Duration.ofMinutes(15);
    static final Duration LOCKOUT = Duration.ofMinutes(5);

    private static final Logger LOGGER = LoggerFactory.getLogger(OAuthLoginAbuseProtection.class);

    private final Clock clock;
    private final Map<String, AttemptBucket> attempts = new ConcurrentHashMap<>();

    public OAuthLoginAbuseProtection() {
        this(Clock.systemUTC());
    }

    OAuthLoginAbuseProtection(Clock clock) {
        this.clock = clock;
    }

    public boolean isAllowed(String remoteAddress, String identity) {
        return isLoginAllowed(remoteAddress, identity);
    }

    public void recordFailure(String remoteAddress, String identity, String reason) {
        recordLoginFailure(remoteAddress, identity, reason);
        LOGGER.warn("OAuth login failure reason={} remoteAddress={} identityRef={}", reason, normalizedRemoteAddress(remoteAddress), pseudonymize(identity));
    }

    public void recordThrottled(String remoteAddress, String identity) {
        LOGGER.warn("OAuth login throttled remoteAddress={} identityRef={}", normalizedRemoteAddress(remoteAddress), pseudonymize(identity));
    }

    public void recordSuccess(String remoteAddress, String identity, String userId) {
        recordLoginSuccess(remoteAddress, identity, userId);
        LOGGER.info("OAuth login success remoteAddress={} identityRef={} userRef={}", normalizedRemoteAddress(remoteAddress), pseudonymize(identity), pseudonymize(userId));
    }

    @Override
    public boolean isLoginAllowed(String remoteAddress, String identity) {
        return !bucket(ipKey(remoteAddress)).isLocked(now()) && !bucket(identityKey(identity)).isLocked(now());
    }

    @Override
    public void recordLoginFailure(String remoteAddress, String identity, String reason) {
        Instant now = now();
        bucket(ipKey(remoteAddress)).recordFailure(now);
        bucket(identityKey(identity)).recordFailure(now);
    }

    @Override
    public void recordLoginThrottled(String remoteAddress, String identity) {
        recordThrottled(remoteAddress, identity);
    }

    @Override
    public void recordLoginSuccess(String remoteAddress, String identity, String userId) {
        bucket(identityKey(identity)).clear();
    }

    @Override
    public boolean isBlocked(String type, String key) {
        return bucket(compositeKey(type, key)).isLocked(now());
    }

    @Override
    public void recordAttempt(String type, String key) {
        bucket(compositeKey(type, key)).recordFailure(now());
    }

    @Override
    public void reset(String type, String key) {
        bucket(compositeKey(type, key)).clear();
    }

    /**
     * Periodically removes buckets whose recorded attempts have all aged out of the
     * sliding window so the in-memory map does not grow without bound.
     */
    @Scheduled(fixedDelay = 300_000)
    void evictStaleBuckets() {
        int evicted = evictStaleBuckets(now());
        if (evicted > 0) {
            LOGGER.debug("Evicted {} stale OAuth login abuse buckets", evicted);
        }
    }

    int evictStaleBuckets(Instant now) {
        int before = attempts.size();
        attempts.entrySet().removeIf((entry) -> entry.getValue().isEmpty(now));
        return before - attempts.size();
    }

    private AttemptBucket bucket(String key) {
        return attempts.computeIfAbsent(key, (ignored) -> new AttemptBucket());
    }

    private Instant now() {
        return clock.instant();
    }

    private static String ipKey(String remoteAddress) {
        return "ip:" + normalizedRemoteAddress(remoteAddress);
    }

    private static String identityKey(String identity) {
        return "identity:" + normalizedIdentity(identity);
    }

    private static String compositeKey(String type, String key) {
        String normalizedType = StringUtils.hasText(type) ? type.trim() : "unknown";
        String normalizedKey = StringUtils.hasText(key) ? key.trim() : "unknown";
        return normalizedType + ":" + normalizedKey;
    }

    private static String normalizedRemoteAddress(String remoteAddress) {
        return StringUtils.hasText(remoteAddress) ? remoteAddress.trim() : "unknown";
    }

    private static String normalizedIdentity(String identity) {
        return StringUtils.hasText(identity) ? identity.trim().toLowerCase() : "unknown";
    }

    /**
     * Returns a stable pseudonymous reference (truncated SHA-256 hex) for the
     * given value, or {@code "none"} when the input is null or blank.
     */
    private static String pseudonymize(String value) {
        if (value == null || value.isBlank()) {
            return "none";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.substring(0, 12);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available.", ex);
        }
    }

    private static final class AttemptBucket {
        private final Deque<Instant> failures = new ArrayDeque<>();

        synchronized boolean isLocked(Instant now) {
            prune(now);
            return failures.size() >= MAX_FAILED_ATTEMPTS && failures.peekLast().plus(LOCKOUT).isAfter(now);
        }

        synchronized void recordFailure(Instant now) {
            prune(now);
            failures.addLast(now);
        }

        synchronized void clear() {
            failures.clear();
        }

        synchronized boolean isEmpty(Instant now) {
            prune(now);
            return failures.isEmpty();
        }

        private void prune(Instant now) {
            Instant cutoff = now.minus(WINDOW);
            while (!failures.isEmpty() && failures.peekFirst().isBefore(cutoff)) {
                failures.removeFirst();
            }
        }
    }
}
