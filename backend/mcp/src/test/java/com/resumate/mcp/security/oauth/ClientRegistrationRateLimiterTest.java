package com.resumate.mcp.security.oauth;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class ClientRegistrationRateLimiterTest {

    private static final Instant NOW = Instant.parse("2026-06-19T12:00:00Z");

    private final ClientRegistrationRateLimiter limiter = new ClientRegistrationRateLimiter(Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void isAllowed_permitsUpToMaxRegistrations() {
        assertThat(limiter.isAllowed("203.0.113.10")).isTrue();

        for (int i = 0; i < ClientRegistrationRateLimiter.MAX_REGISTRATIONS - 1; i++) {
            limiter.recordRegistration("203.0.113.10");
        }

        assertThat(limiter.isAllowed("203.0.113.10")).isTrue();
    }

    @Test
    void isAllowed_blocksAfterMaxRegistrations() {
        for (int i = 0; i < ClientRegistrationRateLimiter.MAX_REGISTRATIONS; i++) {
            limiter.recordRegistration("203.0.113.10");
        }

        assertThat(limiter.isAllowed("203.0.113.10")).isFalse();
    }

    @Test
    void isAllowed_tracksSeparatelyPerIp() {
        for (int i = 0; i < ClientRegistrationRateLimiter.MAX_REGISTRATIONS; i++) {
            limiter.recordRegistration("203.0.113.10");
        }

        assertThat(limiter.isAllowed("203.0.113.10")).isFalse();
        assertThat(limiter.isAllowed("203.0.113.20")).isTrue();
    }

    @Test
    void evictStaleBuckets_removesBucketsAfterWindowElapses() {
        limiter.recordRegistration("203.0.113.10");

        assertThat(limiter.evictStaleBuckets(NOW)).isZero();

        Instant afterWindow = NOW.plus(ClientRegistrationRateLimiter.WINDOW).plusSeconds(1);
        assertThat(limiter.evictStaleBuckets(afterWindow)).isEqualTo(1);
        assertThat(limiter.evictStaleBuckets(afterWindow)).isZero();
    }

    @Test
    void evictStaleBuckets_keepsNonEmptyBuckets() {
        for (int i = 0; i < ClientRegistrationRateLimiter.MAX_REGISTRATIONS; i++) {
            limiter.recordRegistration("203.0.113.10");
        }
        assertThat(limiter.isAllowed("203.0.113.10")).isFalse();

        assertThat(limiter.evictStaleBuckets(NOW)).isZero();
        assertThat(limiter.isAllowed("203.0.113.10")).isFalse();
    }

    @Test
    void isAllowed_returnsTrueAgainAfterWindowElapses() {
        MutableClock clock = new MutableClock(NOW);
        ClientRegistrationRateLimiter limiter = new ClientRegistrationRateLimiter(clock);

        for (int i = 0; i < ClientRegistrationRateLimiter.MAX_REGISTRATIONS; i++) {
            limiter.recordRegistration("203.0.113.10");
        }
        assertThat(limiter.isAllowed("203.0.113.10")).isFalse();

        clock.advanceBy(ClientRegistrationRateLimiter.WINDOW.plusSeconds(1));
        assertThat(limiter.isAllowed("203.0.113.10")).isTrue();
    }

    @Test
    void tryRecordRegistration_allowsOnlyMaxRegistrationsUnderConcurrency() throws Exception {
        int threadCount = ClientRegistrationRateLimiter.MAX_REGISTRATIONS + 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch ready = new CountDownLatch(threadCount);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger allowed = new AtomicInteger();

        try {
            for (int i = 0; i < threadCount; i++) {
                executor.submit(() -> {
                    ready.countDown();
                    try {
                        start.await();
                        if (limiter.tryRecordRegistration("203.0.113.10")) {
                            allowed.incrementAndGet();
                        }
                    } catch (InterruptedException ex) {
                        Thread.currentThread().interrupt();
                    }
                });
            }

            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            executor.shutdown();
            assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
        } finally {
            executor.shutdownNow();
        }

        assertThat(allowed.get()).isEqualTo(ClientRegistrationRateLimiter.MAX_REGISTRATIONS);
    }

    private static final class MutableClock extends Clock {

        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        private void advanceBy(java.time.Duration duration) {
            this.instant = this.instant.plus(duration);
        }

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
