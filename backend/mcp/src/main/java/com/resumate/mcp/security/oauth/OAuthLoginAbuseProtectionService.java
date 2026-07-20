package com.resumate.mcp.security.oauth;

/**
 * Abstraction over the OAuth login abuse / rate-limiting store.
 *
 * <p>Implementations track failed-attempt counters keyed by a logical {@code type}
 * (for example {@code "ip"} or {@code "identity"}) and an opaque {@code key} value.
 * This allows the storage backend (in-memory or Redis) to be swapped without changing
 * the calling code.
 */
public interface OAuthLoginAbuseProtectionService {

    /**
     * Returns whether the given {@code type}/{@code key} pair is currently blocked
     * because it has exceeded the allowed number of failed attempts.
     */
    boolean isBlocked(String type, String key);

    /**
     * Records a single failed attempt for the given {@code type}/{@code key} pair.
     */
    void recordAttempt(String type, String key);

    /**
     * Clears any recorded attempts for the given {@code type}/{@code key} pair,
     * typically after a successful authentication.
     */
    void reset(String type, String key);

    default boolean isLoginAllowed(String remoteAddress, String identity) {
        return !isBlocked("ip", remoteAddress) && !isBlocked("identity", identity);
    }

    default void recordLoginFailure(String remoteAddress, String identity, String reason) {
        recordAttempt("ip", remoteAddress);
        recordAttempt("identity", identity);
    }

    default void recordLoginThrottled(String remoteAddress, String identity) {
    }

    default void recordLoginSuccess(String remoteAddress, String identity, String userId) {
        reset("identity", identity);
    }
}
