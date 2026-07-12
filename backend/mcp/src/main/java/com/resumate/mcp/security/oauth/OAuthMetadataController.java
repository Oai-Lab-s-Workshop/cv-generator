package com.resumate.mcp.security.oauth;

import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class OAuthMetadataController {

    private final AuthorizationServerSettings authorizationServerSettings;

    public OAuthMetadataController(AuthorizationServerSettings authorizationServerSettings) {
        this.authorizationServerSettings = authorizationServerSettings;
    }

    @GetMapping("/.well-known/oauth-protected-resource")
    public Map<String, Object> protectedResourceMetadata() {
        String issuer = authorizationServerSettings.getIssuer();

        return Map.of(
                "resource", issuer + "/mcp",
                "authorization_servers", List.of(issuer),
                "bearer_methods_supported", List.of("header"),
                "scopes_supported", List.of("mcp")
        );
    }
}
