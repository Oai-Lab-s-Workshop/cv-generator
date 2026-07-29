package com.resumate.materialmcp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * PocketBase configuration properties for Material MCP.
 * This server connects to the same PocketBase instance as the main MCP
 * but is restricted to material creation operations only.
 */
@ConfigurationProperties(prefix = "pocketbase")
public record PocketBaseProperties(
        String baseUrl,
        String serviceUserEmail,
        String serviceUserPassword
) {
}