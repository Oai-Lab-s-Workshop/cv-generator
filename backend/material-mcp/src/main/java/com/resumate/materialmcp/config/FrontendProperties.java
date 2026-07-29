package com.resumate.materialmcp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for frontend URLs.
 */
@ConfigurationProperties(prefix = "frontend")
public record FrontendProperties(String baseUrl) {}