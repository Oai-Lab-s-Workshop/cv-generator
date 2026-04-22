package com.resumate.mcp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "resumate.pocketbase")
public record PocketBaseProperties(
        String baseUrl,
        String serviceUserEmail,
        String serviceUserPassword
) {
}
