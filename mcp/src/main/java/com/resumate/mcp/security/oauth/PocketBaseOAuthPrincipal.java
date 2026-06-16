package com.resumate.mcp.security.oauth;

import org.springframework.security.core.AuthenticatedPrincipal;

import java.io.Serializable;

public record PocketBaseOAuthPrincipal(
        String userId,
        String email,
        String displayName
) implements AuthenticatedPrincipal, Serializable {

    @Override
    public String getName() {
        return userId;
    }
}
