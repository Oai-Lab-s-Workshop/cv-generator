package com.resumate.mcp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "resumate.frontend")
public record FrontendProperties(String baseUrl) {
}
