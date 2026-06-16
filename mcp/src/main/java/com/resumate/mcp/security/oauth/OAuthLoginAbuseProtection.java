package com.resumate.mcp.security.oauth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class OAuthLoginAbuseProtection {

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
        return !bucket(ipKey(remoteAddress)).isLocked(now()) && !bucket(identityKey(identity)).isLocked(now());
    }

    public void recordFailure(String remoteAddress, String identity, String reason) {
        Instant now = now();
        bucket(ipKey(remoteAddress)).recordFailure(now);
        bucket(identityKey(identity)).recordFailure(now);
        LOGGER.warn("OAuth login failure reason={} remoteAddress={} identity={}", reason, normalizedRemoteAddress(remoteAddress), normalizedIdentity(identity));
    }

    public void recordThrottled(String remoteAddress, String identity) {
        LOGGER.warn("OAuth login throttled remoteAddress={} identity={}", normalizedRemoteAddress(remoteAddress), normalizedIdentity(identity));
    }

    public void recordSuccess(String remoteAddress, String identity, String userId) {
        bucket(ipKey(remoteAddress)).clear();
        bucket(identityKey(identity)).clear();
        LOGGER.info("OAuth login success remoteAddress={} identity={} userId={}", normalizedRemoteAddress(remoteAddress), normalizedIdentity(identity), userId);
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

    private static String normalizedRemoteAddress(String remoteAddress) {
        return StringUtils.hasText(remoteAddress) ? remoteAddress.trim() : "unknown";
    }

    private static String normalizedIdentity(String identity) {
        return StringUtils.hasText(identity) ? identity.trim().toLowerCase() : "unknown";
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

        private void prune(Instant now) {
            Instant cutoff = now.minus(WINDOW);
            while (!failures.isEmpty() && failures.peekFirst().isBefore(cutoff)) {
                failures.removeFirst();
            }
        }
    }
}
