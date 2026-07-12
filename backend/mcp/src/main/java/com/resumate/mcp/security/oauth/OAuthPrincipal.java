package com.resumate.mcp.security.oauth;

import com.resumate.mcp.security.McpPrincipal;

public record OAuthPrincipal(
        String userId,
        String label,
        String clientId
) implements McpPrincipal {

    private static final String AUTH_SOURCE = "OAUTH";

    @Override
    public String authSource() {
        return AUTH_SOURCE;
    }

    @Override
    public String getName() {
        return label == null || label.isBlank() ? userId : label;
    }
}
