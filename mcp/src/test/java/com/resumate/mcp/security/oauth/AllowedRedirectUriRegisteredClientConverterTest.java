package com.resumate.mcp.security.oauth;

import com.resumate.mcp.config.OAuthProperties;
import com.resumate.mcp.service.PocketBaseClient;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.server.authorization.OAuth2ClientRegistration;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.InstanceOfAssertFactories.type;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AllowedRedirectUriRegisteredClientConverterTest {

    private final PocketBaseClient pocketBaseClient = mock(PocketBaseClient.class);
    private final TokenSettings tokenSettings = TokenSettings.builder()
            .accessTokenTimeToLive(Duration.ofHours(1))
            .refreshTokenTimeToLive(Duration.ofDays(90))
            .build();

    @Test
    void convert_allowsClaudeRedirectAndRequiresPkcePublicClient() {
        AllowedRedirectUriRegisteredClientConverter converter = converter(List.of("https://claude.ai/*"));
        OAuth2ClientRegistration registration = registration("https://claude.ai/api/mcp/auth_callback");

        RegisteredClient registeredClient = converter.convert(registration);

        assertThat(registeredClient.getRedirectUris()).containsExactly("https://claude.ai/api/mcp/auth_callback");
        assertThat(registeredClient.getClientAuthenticationMethods()).containsExactly(ClientAuthenticationMethod.NONE);
        assertThat(registeredClient.getAuthorizationGrantTypes()).containsExactlyInAnyOrder(
                AuthorizationGrantType.AUTHORIZATION_CODE,
                AuthorizationGrantType.REFRESH_TOKEN
        );
        assertThat(registeredClient.getClientSettings().isRequireProofKey()).isTrue();
        assertThat(registeredClient.getClientSettings().isRequireAuthorizationConsent()).isTrue();
        assertThat(registeredClient.getTokenSettings()).isEqualTo(tokenSettings);
    }

    @Test
    void convert_rejectsDisallowedRedirectUri() {
        AllowedRedirectUriRegisteredClientConverter converter = converter(List.of("https://claude.ai/*"));

        assertThatThrownBy(() -> converter.convert(registration("https://evil.example/callback")))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .asInstanceOf(type(OAuth2AuthenticationException.class))
                .extracting((ex) -> ex.getError().getErrorCode())
                .isEqualTo("invalid_redirect_uri");
    }

    @Test
    void convert_reusesExistingClientForSameClientNameAndRedirectUris() {
        when(pocketBaseClient.findOAuthClientByClientNameAndRedirectUris(
                "claude.ai",
                List.of("https://claude.ai/api/mcp/auth_callback")
        )).thenReturn(Optional.of(new PocketBaseClient.OAuthClientRecord(
                "pb-client-record",
                "existing-client-id",
                null,
                "claude.ai",
                List.of("https://claude.ai/api/mcp/auth_callback"),
                List.of("authorization_code", "refresh_token"),
                List.of("mcp"),
                Map.of(),
                null
        )));

        RegisteredClient registeredClient = converter(List.of("https://claude.ai/*"))
                .convert(registration("https://claude.ai/api/mcp/auth_callback"));

        assertThat(registeredClient.getId()).isEqualTo("pb-client-record");
        assertThat(registeredClient.getClientId()).isEqualTo("existing-client-id");
    }

    private AllowedRedirectUriRegisteredClientConverter converter(List<String> patterns) {
        return new AllowedRedirectUriRegisteredClientConverter(
                pocketBaseClient,
                new OAuthProperties("https://mcp.example.test", "jwk", Duration.ofHours(1), Duration.ofDays(90), patterns),
                tokenSettings
        );
    }

    private static OAuth2ClientRegistration registration(String redirectUri) {
        return OAuth2ClientRegistration.builder()
                .clientName("claude.ai")
                .redirectUri(redirectUri)
                .grantType("authorization_code")
                .grantType("refresh_token")
                .responseType("code")
                .scope("mcp")
                .tokenEndpointAuthenticationMethod("none")
                .build();
    }
}
