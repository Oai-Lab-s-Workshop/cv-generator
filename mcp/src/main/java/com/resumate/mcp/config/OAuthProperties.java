package com.resumate.mcp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

@ConfigurationProperties(prefix = "resumate.oauth")
public record OAuthProperties(
        String publicBaseUrl,
        String jwk,
        Duration accessTokenTtl,
        Duration refreshTokenTtl,
        List<String> allowedRedirectUriPatterns
) {
}
