package com.resumate.mcp.security.oauth;

import org.springframework.util.StringUtils;

import java.net.URI;

public final class OAuthEndpointUrls {

    private OAuthEndpointUrls() {
    }

    public static String normalizedIssuer(String publicBaseUrl) {
        if (!StringUtils.hasText(publicBaseUrl)) {
            throw new IllegalStateException("MCP_PUBLIC_BASE_URL is required for OAuth authorization server startup.");
        }

        URI uri = URI.create(publicBaseUrl.trim());
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
            throw new IllegalStateException("MCP_PUBLIC_BASE_URL must be an absolute HTTPS URL.");
        }
        if (StringUtils.hasText(uri.getQuery()) || StringUtils.hasText(uri.getFragment())) {
            throw new IllegalStateException("MCP_PUBLIC_BASE_URL must not include query parameters or fragments.");
        }

        String issuer = uri.toString();
        return issuer.endsWith("/") ? issuer.substring(0, issuer.length() - 1) : issuer;
    }

    public static String mcpAudience(String publicBaseUrl) {
        return normalizedIssuer(publicBaseUrl) + "/mcp";
    }

    public static String protectedResourceMetadataUrl(String publicBaseUrl) {
        return normalizedIssuer(publicBaseUrl) + "/.well-known/oauth-protected-resource";
    }
}
