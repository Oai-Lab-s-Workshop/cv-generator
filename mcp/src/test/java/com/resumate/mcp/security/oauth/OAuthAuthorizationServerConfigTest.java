package com.resumate.mcp.security.oauth;

import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.resumate.mcp.config.OAuthProperties;
import com.resumate.mcp.support.OAuthTestPropertiesInitializer;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OAuthAuthorizationServerConfigTest {

    private static final String TEST_JWK = OAuthTestPropertiesInitializer.testJwk();

    private final OAuthAuthorizationServerConfig config = new OAuthAuthorizationServerConfig();

    @Test
    void authorizationServerSettings_usesRequiredHttpsIssuerWithoutTrailingSlash() {
        AuthorizationServerSettings settings = config.authorizationServerSettings(properties("https://mcp.example.test/", TEST_JWK));

        assertThat(settings.getIssuer()).isEqualTo("https://mcp.example.test");
        assertThat(settings.getAuthorizationEndpoint()).isEqualTo("/oauth/authorize");
        assertThat(settings.getTokenEndpoint()).isEqualTo("/oauth/token");
        assertThat(settings.getClientRegistrationEndpoint()).isEqualTo("/oauth/register");
        assertThat(settings.getJwkSetEndpoint()).isEqualTo("/oauth/jwks");
    }

    @Test
    void authorizationServerSettings_rejectsMissingOrNonHttpsIssuer() {
        assertThatThrownBy(() -> config.authorizationServerSettings(properties("", TEST_JWK)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MCP_PUBLIC_BASE_URL is required");

        assertThatThrownBy(() -> config.authorizationServerSettings(properties("http://mcp.example.test", TEST_JWK)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("absolute HTTPS URL");
    }

    @Test
    void jwkSource_rejectsMissingOrInvalidJwk() {
        assertThatThrownBy(() -> config.jwkSource(properties("https://mcp.example.test", "")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MCP_OAUTH_JWK is required");

        assertThatThrownBy(() -> config.jwkSource(properties("https://mcp.example.test", "not-json")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("private RSA JWK");
    }

    @Test
    void jwkSource_acceptsPrivateRsaJwk() {
        JWKSource<SecurityContext> jwkSource = config.jwkSource(properties("https://mcp.example.test", TEST_JWK));

        assertThat(jwkSource).isNotNull();
    }

    @Test
    void tokenSettings_useJwtAccessTokensAndConfiguredRefreshTtl() {
        TokenSettings settings = config.oauthTokenSettings(new OAuthProperties(
                "https://mcp.example.test",
                TEST_JWK,
                null,
                Duration.ofDays(30),
                List.of("https://claude.ai/*")
        ));

        assertThat(settings.getAccessTokenFormat()).isEqualTo(OAuth2TokenFormat.SELF_CONTAINED);
        assertThat(settings.getAccessTokenTimeToLive()).isEqualTo(Duration.ofHours(1));
        assertThat(settings.getRefreshTokenTimeToLive()).isEqualTo(Duration.ofDays(30));
        assertThat(settings.isReuseRefreshTokens()).isFalse();
    }

    private static OAuthProperties properties(String publicBaseUrl, String jwk) {
        return new OAuthProperties(publicBaseUrl, jwk, Duration.ofHours(1), Duration.ofDays(90), List.of("https://claude.ai/*"));
    }
}
