package com.resumate.mcp.security.oauth;

import com.resumate.mcp.service.PocketBaseClient;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationCode;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsent;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PocketBaseOAuthPersistenceTest {

    private static final Instant ISSUED_AT = Instant.parse("2026-06-12T10:00:00Z");

    private final PocketBaseClient pocketBaseClient = mock(PocketBaseClient.class);

    private final RegisteredClient registeredClient = registeredClient();

    @Test
    void registeredClientRepository_savesAndLoadsClientThroughPocketBase() {
        PocketBaseRegisteredClientRepository repository = new PocketBaseRegisteredClientRepository(pocketBaseClient);

        when(pocketBaseClient.findOAuthClientByClientId("claude-ai")).thenReturn(Optional.empty());
        repository.save(registeredClient);

        ArgumentCaptor<PocketBaseClient.OAuthClientPayload> payloadCaptor = ArgumentCaptor.forClass(PocketBaseClient.OAuthClientPayload.class);
        verify(pocketBaseClient).createOAuthClient(payloadCaptor.capture());
        assertThat(payloadCaptor.getValue().clientId()).isEqualTo("claude-ai");
        assertThat(payloadCaptor.getValue().redirectUris()).containsExactly("https://claude.ai/api/mcp/auth_callback");
        assertThat(payloadCaptor.getValue().grantTypes()).containsExactlyInAnyOrder("authorization_code", "refresh_token");
        assertThat(payloadCaptor.getValue().tokenSettings()).containsEntry(
                "settings.token.access-token-time-to-live",
                "PT1H"
        );

        when(pocketBaseClient.findOAuthClientByRecordId("pb-client-record")).thenReturn(Optional.of(clientRecord()));
        RegisteredClient restored = repository.findById("pb-client-record");

        assertThat(restored.getId()).isEqualTo("pb-client-record");
        assertThat(restored.getClientId()).isEqualTo("claude-ai");
        assertThat(restored.getClientAuthenticationMethods()).containsExactly(ClientAuthenticationMethod.NONE);
        assertThat(restored.getAuthorizationGrantTypes()).contains(AuthorizationGrantType.AUTHORIZATION_CODE, AuthorizationGrantType.REFRESH_TOKEN);
        assertThat(restored.getClientSettings().isRequireProofKey()).isTrue();
        assertThat(restored.getClientSettings().isRequireAuthorizationConsent()).isTrue();
        assertThat(restored.getTokenSettings().getAccessTokenTimeToLive()).isEqualTo(Duration.ofHours(1));
    }

    @Test
    void authorizationService_savesAuthorizationAndRestoresByAuthorizationCode() {
        RegisteredClientRepository registeredClientRepository = mock(RegisteredClientRepository.class);
        when(registeredClientRepository.findById("pb-client-record")).thenReturn(registeredClient);
        PocketBaseOAuth2AuthorizationService service = new PocketBaseOAuth2AuthorizationService(pocketBaseClient, registeredClientRepository);
        OAuth2Authorization authorization = authorization();

        when(pocketBaseClient.findOAuthAuthorizationByStateId(authorization.getId())).thenReturn(Optional.empty());
        service.save(authorization);

        ArgumentCaptor<PocketBaseClient.OAuthAuthorizationPayload> payloadCaptor = ArgumentCaptor.forClass(PocketBaseClient.OAuthAuthorizationPayload.class);
        verify(pocketBaseClient).createOAuthAuthorization(payloadCaptor.capture());
        assertThat(payloadCaptor.getValue().user()).isEqualTo("pb-user-123");
        assertThat(payloadCaptor.getValue().clientId()).isEqualTo("claude-ai");
        assertThat(payloadCaptor.getValue().rawAuthCode()).isEqualTo("auth-code-value");
        assertThat(payloadCaptor.getValue().rawRefreshToken()).isEqualTo("refresh-token-value");
        assertThat(payloadCaptor.getValue().accessTokenJti()).isEqualTo("access-jti-123");
        assertThat(payloadCaptor.getValue().state()).containsEntry("id", authorization.getId());

        PocketBaseClient.OAuthAuthorizationRecord record = authorizationRecord(payloadCaptor.getValue().state());
        when(pocketBaseClient.findOAuthAuthorizationByAuthCode("auth-code-value")).thenReturn(Optional.of(record));

        OAuth2Authorization restored = service.findByToken(
                "auth-code-value",
                new OAuth2TokenType(OAuth2ParameterNames.CODE)
        );

        assertThat(restored.getId()).isEqualTo(authorization.getId());
        assertThat(restored.getPrincipalName()).isEqualTo("pb-user-123");
        assertThat(restored.getToken(OAuth2AuthorizationCode.class).getToken().getTokenValue()).isEqualTo("auth-code-value");
    }

    @Test
    void authorizationService_rejectsInactiveRefreshGrant() {
        RegisteredClientRepository registeredClientRepository = mock(RegisteredClientRepository.class);
        PocketBaseOAuth2AuthorizationService service = new PocketBaseOAuth2AuthorizationService(pocketBaseClient, registeredClientRepository);

        when(pocketBaseClient.findOAuthAuthorizationByRefreshToken("refresh-token-value"))
                .thenReturn(Optional.of(authorizationRecord(Map.of(), "revoked")));

        OAuth2Authorization restored = service.findByToken("refresh-token-value", OAuth2TokenType.REFRESH_TOKEN);

        assertThat(restored).isNull();
    }

    @Test
    void authorizationConsentService_savesAndLoadsConsentThroughAuthorizationRecord() {
        RegisteredClientRepository registeredClientRepository = mock(RegisteredClientRepository.class);
        when(registeredClientRepository.findById("pb-client-record")).thenReturn(registeredClient);
        PocketBaseOAuth2AuthorizationConsentService service = new PocketBaseOAuth2AuthorizationConsentService(pocketBaseClient, registeredClientRepository);
        OAuth2AuthorizationConsent consent = OAuth2AuthorizationConsent.withId("pb-client-record", "pb-user-123")
                .scope("mcp")
                .build();

        when(pocketBaseClient.findOAuthAuthorizationByClientAndUser("claude-ai", "pb-user-123"))
                .thenReturn(Optional.of(authorizationRecord(Map.of())));

        service.save(consent);

        ArgumentCaptor<PocketBaseClient.OAuthAuthorizationPayload> payloadCaptor = ArgumentCaptor.forClass(PocketBaseClient.OAuthAuthorizationPayload.class);
        verify(pocketBaseClient).updateOAuthAuthorization(org.mockito.ArgumentMatchers.eq("pb-auth-record"), payloadCaptor.capture());
        assertThat(payloadCaptor.getValue().consent()).containsEntry("scopes", List.of("mcp"));

        OAuth2AuthorizationConsent restored = service.findById("pb-client-record", "pb-user-123");
        assertThat(restored.getRegisteredClientId()).isEqualTo("pb-client-record");
        assertThat(restored.getPrincipalName()).isEqualTo("pb-user-123");
        assertThat(restored.getScopes()).containsExactly("mcp");
    }

    private static RegisteredClient registeredClient() {
        return RegisteredClient.withId("pb-client-record")
                .clientId("claude-ai")
                .clientName("claude.ai")
                .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri("https://claude.ai/api/mcp/auth_callback")
                .scope("mcp")
                .clientSettings(ClientSettings.builder().requireProofKey(true).build())
                .tokenSettings(TokenSettings.builder().accessTokenTimeToLive(Duration.ofHours(1)).build())
                .build();
    }

    private static OAuth2Authorization authorization() {
        OAuth2AccessToken accessToken = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "access-token-value",
                ISSUED_AT,
                ISSUED_AT.plusSeconds(3600),
                Set.of("mcp")
        );

        return OAuth2Authorization.withRegisteredClient(registeredClient())
                .id("authorization-id")
                .principalName("pb-user-123")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizedScopes(Set.of("mcp"))
                .token(new OAuth2AuthorizationCode("auth-code-value", ISSUED_AT, ISSUED_AT.plusSeconds(300)))
                .token(accessToken, (metadata) -> metadata.put(
                        OAuth2Authorization.Token.CLAIMS_METADATA_NAME,
                        Map.of("jti", "access-jti-123")
                ))
                .refreshToken(new OAuth2RefreshToken("refresh-token-value", ISSUED_AT, ISSUED_AT.plusSeconds(90 * 24 * 3600)))
                .build();
    }

    private static PocketBaseClient.OAuthClientRecord clientRecord() {
        return new PocketBaseClient.OAuthClientRecord(
                "pb-client-record",
                "claude-ai",
                null,
                "claude.ai",
                List.of("https://claude.ai/api/mcp/auth_callback"),
                List.of("authorization_code", "refresh_token"),
                List.of("mcp"),
                Map.of("settings.token.access-token-time-to-live", "PT1H"),
                null
        );
    }

    private static PocketBaseClient.OAuthAuthorizationRecord authorizationRecord(Map<String, Object> state) {
        return authorizationRecord(state, "active");
    }

    private static PocketBaseClient.OAuthAuthorizationRecord authorizationRecord(Map<String, Object> state, String status) {
        return new PocketBaseClient.OAuthAuthorizationRecord(
                "pb-auth-record",
                "pb-user-123",
                "claude-ai",
                List.of("mcp"),
                "hashed-code",
                "hashed-refresh",
                "access-jti-123",
                ISSUED_AT.plusSeconds(90 * 24 * 3600).toString(),
                status,
                state,
                Map.of("scopes", List.of("mcp"))
        );
    }
}
