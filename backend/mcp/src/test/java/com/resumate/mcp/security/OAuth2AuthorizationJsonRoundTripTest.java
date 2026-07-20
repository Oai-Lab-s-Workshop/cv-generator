package com.resumate.mcp.security;

import com.resumate.mcp.security.oauth.OAuth2AuthorizationStateCodec;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationCode;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class OAuth2AuthorizationJsonRoundTripTest {

    private final ObjectMapper pocketBaseJsonMapper = JsonMapper.builder().build();

    @Test
    void oauth2Authorization_roundTripsThroughPocketBaseJsonFieldShape() {
        Instant issuedAt = Instant.parse("2026-06-11T18:00:00Z");
        OAuth2Authorization authorization = OAuth2Authorization.withRegisteredClient(registeredClient())
                .principalName("pb-user-123")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizedScopes(Set.of("mcp"))
                .attribute("pocketbase_user_id", "pb-user-123")
                .token(new OAuth2AuthorizationCode("auth-code-value", issuedAt, issuedAt.plusSeconds(300)))
                .accessToken(new OAuth2AccessToken(
                        OAuth2AccessToken.TokenType.BEARER,
                        "access-token-value",
                        issuedAt,
                        issuedAt.plusSeconds(3600),
                        Set.of("mcp")
                ))
                .refreshToken(new OAuth2RefreshToken("refresh-token-value", issuedAt, issuedAt.plusSeconds(90 * 24 * 3600)))
                .build();

        Map<String, Object> state = OAuth2AuthorizationStateCodec.toState(authorization);
        String storedJson = pocketBaseJsonMapper.writeValueAsString(state);
        assertThat(storedJson).doesNotContain("auth-code-value");
        assertThat(storedJson).doesNotContain("access-token-value");
        assertThat(storedJson).doesNotContain("refresh-token-value");

        Map<String, Object> pocketBaseState = pocketBaseJsonMapper.readValue(storedJson, new TypeReference<>() {
        });
        OAuth2Authorization restored = OAuth2AuthorizationStateCodec.fromState(
                pocketBaseState,
                registeredClient(),
                Map.of(
                        "authorizationCode", "auth-code-value",
                        "accessToken", "access-token-value",
                        "refreshToken", "refresh-token-value"
                )
        );

        assertThat(restored.getId()).isEqualTo(authorization.getId());
        assertThat(restored.getRegisteredClientId()).isEqualTo("registered-client-id");
        assertThat(restored.getPrincipalName()).isEqualTo("pb-user-123");
        assertThat(restored.getAuthorizationGrantType()).isEqualTo(AuthorizationGrantType.AUTHORIZATION_CODE);
        assertThat(restored.getAuthorizedScopes()).containsExactly("mcp");
        assertThat((String) restored.getAttribute("pocketbase_user_id")).isEqualTo("pb-user-123");
        assertThat(restored.getToken(OAuth2AuthorizationCode.class).getToken().getTokenValue()).isEqualTo("auth-code-value");
        assertThat(restored.getAccessToken().getToken().getTokenValue()).isEqualTo("access-token-value");
        assertThat(restored.getRefreshToken().getToken().getTokenValue()).isEqualTo("refresh-token-value");
    }

    private static RegisteredClient registeredClient() {
        return RegisteredClient.withId("registered-client-id")
                .clientId("claude-ai")
                .clientName("claude.ai")
                .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri("https://claude.ai/api/mcp/auth_callback")
                .scope("mcp")
                .clientSettings(ClientSettings.builder().requireProofKey(true).build())
                .build();
    }
}
