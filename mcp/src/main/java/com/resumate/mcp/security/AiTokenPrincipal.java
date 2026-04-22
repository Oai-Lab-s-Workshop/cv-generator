package com.resumate.mcp.security;

import java.security.Principal;

public record AiTokenPrincipal(
        String tokenId,
        String userId,
        String label,
        String tokenPrefix
) implements Principal {

    public AiTokenPrincipal(String tokenId, String userId, String label) {
        this(tokenId, userId, label, null);
    }

    @Override
    public String getName() {
        return label == null || label.isBlank() ? tokenId : label;
    }
}
