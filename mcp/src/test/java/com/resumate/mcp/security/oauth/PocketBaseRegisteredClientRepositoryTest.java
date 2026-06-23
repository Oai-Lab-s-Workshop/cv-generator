package com.resumate.mcp.security.oauth;

import com.resumate.mcp.service.PocketBaseClient;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PocketBaseRegisteredClientRepositoryTest {

    private final PocketBaseClient pocketBaseClient = mock(PocketBaseClient.class);

    private final PocketBaseRegisteredClientRepository repository =
            new PocketBaseRegisteredClientRepository(pocketBaseClient);

    private final PocketBaseClient.OAuthClientRecord record = new PocketBaseClient.OAuthClientRecord(
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

    @Test
    void findById_cachesResults() {
        when(pocketBaseClient.findOAuthClientByRecordId("pb-client-record"))
                .thenReturn(Optional.of(record));

        RegisteredClient first = repository.findById("pb-client-record");
        RegisteredClient second = repository.findById("pb-client-record");

        assertThat(first).isNotNull();
        assertThat(second).isNotNull();
        assertThat(first.getId()).isEqualTo("pb-client-record");
        assertThat(first.getClientId()).isEqualTo("claude-ai");

        verify(pocketBaseClient, times(1)).findOAuthClientByRecordId("pb-client-record");
    }

    @Test
    void findByClientId_cachesResults() {
        when(pocketBaseClient.findOAuthClientByClientId("claude-ai"))
                .thenReturn(Optional.of(record));

        RegisteredClient first = repository.findByClientId("claude-ai");
        RegisteredClient second = repository.findByClientId("claude-ai");

        assertThat(first).isNotNull();
        assertThat(second).isNotNull();
        assertThat(first.getClientId()).isEqualTo("claude-ai");

        verify(pocketBaseClient, times(1)).findOAuthClientByClientId("claude-ai");
    }

    @Test
    void save_invalidatesCacheAfterWrite() {
        RegisteredClient registeredClient = registeredClient();

        when(pocketBaseClient.findOAuthClientByClientId("claude-ai"))
                .thenReturn(Optional.of(record));
        when(pocketBaseClient.findOAuthClientByRecordId("pb-client-record"))
                .thenReturn(Optional.of(record));

        // Populate cache
        repository.findById("pb-client-record");
        repository.findByClientId("claude-ai");

        // Save should invalidate (save itself calls findOAuthClientByClientId internally)
        repository.save(registeredClient);

        // After save, next lookup should hit PocketBase again
        repository.findById("pb-client-record");
        repository.findByClientId("claude-ai");

        // findOAuthClientByClientId: 1 from cache pop + 1 from save internals + 1 post-invalidate = 3
        verify(pocketBaseClient, times(3)).findOAuthClientByClientId("claude-ai");
        verify(pocketBaseClient, times(2)).findOAuthClientByRecordId("pb-client-record");
    }

    @Test
    void cacheReturnsNullWithoutCachingMissingRecords() {
        when(pocketBaseClient.findOAuthClientByRecordId("nonexistent"))
                .thenReturn(Optional.empty());

        RegisteredClient first = repository.findById("nonexistent");
        RegisteredClient second = repository.findById("nonexistent");

        assertThat(first).isNull();
        assertThat(second).isNull();

        // Caffeine does NOT cache null values, so PocketBase is called each time
        verify(pocketBaseClient, times(2)).findOAuthClientByRecordId("nonexistent");
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
}
