package com.resumate.mcp.security.oauth;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class OAuthLoginAbuseProtectionTest {

    private static final Instant NOW = Instant.parse("2026-06-19T12:00:00Z");

    private final OAuthLoginAbuseProtection protection = new OAuthLoginAbuseProtection(Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void recordAttempt_blocksAfterMaxFailedAttempts() {
        assertThat(protection.isBlocked("identity", "user@example.com")).isFalse();

        for (int i = 0; i < OAuthLoginAbuseProtection.MAX_FAILED_ATTEMPTS; i++) {
            protection.recordAttempt("identity", "user@example.com");
        }

        assertThat(protection.isBlocked("identity", "user@example.com")).isTrue();
    }

    @Test
    void reset_clearsRecordedAttempts() {
        for (int i = 0; i < OAuthLoginAbuseProtection.MAX_FAILED_ATTEMPTS; i++) {
            protection.recordAttempt("ip", "203.0.113.10");
        }
        assertThat(protection.isBlocked("ip", "203.0.113.10")).isTrue();

        protection.reset("ip", "203.0.113.10");

        assertThat(protection.isBlocked("ip", "203.0.113.10")).isFalse();
    }

    @Test
    void evictStaleBuckets_removesBucketsAfterWindowElapses() {
        protection.recordAttempt("identity", "user@example.com");

        // Still inside the sliding window -> the bucket is retained.
        assertThat(protection.evictStaleBuckets(NOW)).isZero();

        // Once the window elapses the recorded attempt has aged out -> bucket is evicted.
        Instant afterWindow = NOW.plus(OAuthLoginAbuseProtection.WINDOW).plusSeconds(1);
        assertThat(protection.evictStaleBuckets(afterWindow)).isEqualTo(1);

        // Nothing is left to evict on a subsequent pass.
        assertThat(protection.evictStaleBuckets(afterWindow)).isZero();
    }

    @Test
    void evictStaleBuckets_keepsBucketsThatAreStillBlocking() {
        for (int i = 0; i < OAuthLoginAbuseProtection.MAX_FAILED_ATTEMPTS; i++) {
            protection.recordAttempt("identity", "user@example.com");
        }
        assertThat(protection.isBlocked("identity", "user@example.com")).isTrue();

        // A bucket with live attempts must never be evicted out from under an active block.
        assertThat(protection.evictStaleBuckets(NOW)).isZero();
        assertThat(protection.isBlocked("identity", "user@example.com")).isTrue();
    }

    @Test
    void evictStaleBuckets_onlyRemovesBucketsWhoseAttemptsHaveExpired() {
        MutableClock clock = new MutableClock(NOW);
        OAuthLoginAbuseProtection protection = new OAuthLoginAbuseProtection(clock);

        protection.recordAttempt("ip", "stale");

        // Record a second bucket's attempt almost a full window later.
        clock.setInstant(NOW.plus(OAuthLoginAbuseProtection.WINDOW).minusSeconds(60));
        protection.recordAttempt("ip", "fresh");

        // Probe just past the original window: "stale" has aged out, "fresh" has not.
        Instant probe = NOW.plus(OAuthLoginAbuseProtection.WINDOW).plusSeconds(1);
        assertThat(protection.evictStaleBuckets(probe)).isEqualTo(1);

        // The surviving "fresh" bucket is retained on a second pass.
        assertThat(protection.evictStaleBuckets(probe)).isZero();
    }

    @Test
    void recordLoginSuccess_doesNotClearSharedIpBucket() {
        for (int i = 0; i < OAuthLoginAbuseProtection.MAX_FAILED_ATTEMPTS; i++) {
            protection.recordLoginFailure("203.0.113.10", "victim@example.com", "invalid_credentials");
        }
        assertThat(protection.isBlocked("ip", "203.0.113.10")).isTrue();

        protection.recordLoginSuccess("203.0.113.10", "attacker@example.com", "user-id");

        assertThat(protection.isBlocked("ip", "203.0.113.10")).isTrue();
    }

    private static final class MutableClock extends Clock {

        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        private void setInstant(Instant instant) {
            this.instant = instant;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
