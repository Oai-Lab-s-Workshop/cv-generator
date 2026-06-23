package com.resumate.mcp.security;

public record AiTokenPrincipal(
        String tokenId,
        String userId,
        String label,
        String tokenPrefix
) implements McpPrincipal {

    private static final String AUTH_SOURCE = "API_KEY";

    public AiTokenPrincipal(String tokenId, String userId, String label) {
        this(tokenId, userId, label, null);
    }

    @Override
    public String getName() {
        return label == null || label.isBlank() ? tokenId : label;
    }

    @Override
    public String authSource() {
        return AUTH_SOURCE;
    }
}
