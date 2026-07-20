package com.resumate.mcp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for the OAuth login abuse / rate-limiting backend.
 *
 * <p>{@code type} selects the implementation of
 * {@code com.resumate.mcp.security.oauth.OAuthLoginAbuseProtectionService}:
 * {@code "memory"} (default) keeps counters in-process, while {@code "redis"}
 * stores them in a shared Redis instance for multi-node deployments.
 */
@ConfigurationProperties(prefix = "resumate.oauth.rate-limiter")
public record OAuthRateLimiterProperties(
        String type
) {
    public OAuthRateLimiterProperties {
        if (type == null || type.isBlank()) {
            type = "memory";
        }
    }
}
