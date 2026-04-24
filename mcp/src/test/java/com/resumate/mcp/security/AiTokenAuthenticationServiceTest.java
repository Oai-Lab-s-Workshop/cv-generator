package com.resumate.mcp.security;

import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.service.PocketBaseClient.AiTokenRecord;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiTokenAuthenticationServiceTest {

    private final PocketBaseClient pocketBaseClient = mock(PocketBaseClient.class);
    private final AiTokenAuthenticationService service = new AiTokenAuthenticationService(pocketBaseClient);

    @Test
    void authenticate_returnsPrincipal_whenTokenIsValid() {
        AiTokenRecord record = new AiTokenRecord(
                "tokenId", "userId", "my-label", "active",
                Instant.now().plusSeconds(3600).toString(),
                "hash", "prefix"
        );
        when(pocketBaseClient.findAiTokenByRawToken("valid-token")).thenReturn(Optional.of(record));

        AiTokenPrincipal result = service.authenticate("valid-token");

        assertThat(result.tokenId()).isEqualTo("tokenId");
        assertThat(result.userId()).isEqualTo("userId");
        assertThat(result.label()).isEqualTo("my-label");
        assertThat(result.tokenPrefix()).isEqualTo("prefix");
        verify(pocketBaseClient).markAiTokenUsed("tokenId");
    }

    @Test
    void authenticate_throws_whenTokenNotFound() {
        when(pocketBaseClient.findAiTokenByRawToken("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.authenticate("unknown"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid API key.");
    }

    @Test
    void authenticate_throws_whenTokenIsNotActive() {
        AiTokenRecord record = new AiTokenRecord(
                "tokenId", "userId", "label", "revoked",
                Instant.now().plusSeconds(3600).toString(),
                "hash", "prefix"
        );
        when(pocketBaseClient.findAiTokenByRawToken("revoked-token")).thenReturn(Optional.of(record));

        assertThatThrownBy(() -> service.authenticate("revoked-token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("API key is not active.");
    }

    @Test
    void authenticate_throws_whenTokenIsExpired() {
        AiTokenRecord record = new AiTokenRecord(
                "tokenId", "userId", "label", "active",
                Instant.now().minusSeconds(3600).toString(),
                "hash", "prefix"
        );
        when(pocketBaseClient.findAiTokenByRawToken("expired-token")).thenReturn(Optional.of(record));

        assertThatThrownBy(() -> service.authenticate("expired-token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("API key is expired.");
    }

    @Test
    void authenticate_succeeds_whenExpiresAtIsNull() {
        AiTokenRecord record = new AiTokenRecord(
                "tokenId", "userId", "label", "active",
                null,
                "hash", "prefix"
        );
        when(pocketBaseClient.findAiTokenByRawToken("no-expiry")).thenReturn(Optional.of(record));

        AiTokenPrincipal result = service.authenticate("no-expiry");

        assertThat(result.tokenId()).isEqualTo("tokenId");
        verify(pocketBaseClient).markAiTokenUsed("tokenId");
    }

    @Test
    void authenticate_succeeds_whenExpiresAtIsInFuture() {
        AiTokenRecord record = new AiTokenRecord(
                "tokenId", "userId", "label", "active",
                Instant.now().plusSeconds(3600).toString(),
                "hash", "prefix"
        );
        when(pocketBaseClient.findAiTokenByRawToken("future-token")).thenReturn(Optional.of(record));

        AiTokenPrincipal result = service.authenticate("future-token");

        assertThat(result.tokenId()).isEqualTo("tokenId");
        verify(pocketBaseClient).markAiTokenUsed("tokenId");
    }

    @Test
    void authenticate_throws_whenExpiresAtFormatIsInvalid() {
        AiTokenRecord record = new AiTokenRecord(
                "tokenId", "userId", "label", "active",
                "not-a-date",
                "hash", "prefix"
        );
        when(pocketBaseClient.findAiTokenByRawToken("token")).thenReturn(Optional.of(record));

        assertThatThrownBy(() -> service.authenticate("token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("API key expiry is invalid.");
    }
}
