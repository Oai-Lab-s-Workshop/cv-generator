package com.resumate.mcp.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "resumate.cors")
public record CorsProperties(
    List<String> allowedOrigins
) {}
