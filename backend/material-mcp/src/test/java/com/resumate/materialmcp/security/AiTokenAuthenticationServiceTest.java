package com.resumate.materialmcp.security;

import com.resumate.materialmcp.service.MaterialPocketBaseClient;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiTokenAuthenticationServiceTest {

    private final MaterialPocketBaseClient pocketBaseClient = mock(MaterialPocketBaseClient.class);
    private final AiTokenAuthenticationService service = new AiTokenAuthenticationService(pocketBaseClient);

    @Test
    void authenticatesAnActiveUnexpiredToken() {
        when(pocketBaseClient.findAiTokenByRawToken("resm_valid")).thenReturn(Optional.of(
                new MaterialPocketBaseClient.AiTokenRecord("token-id", "user-id", "My key", "active", null, "resm_")
        ));

        AiTokenPrincipal principal = service.authenticate("resm_valid");

        assertEquals("token-id", principal.tokenId());
        assertEquals("user-id", principal.userId());
    }

    @Test
    void rejectsMissingInactiveAndExpiredTokens() {
        when(pocketBaseClient.findAiTokenByRawToken("missing")).thenReturn(Optional.empty());
        when(pocketBaseClient.findAiTokenByRawToken("inactive")).thenReturn(Optional.of(
                new MaterialPocketBaseClient.AiTokenRecord("token-id", "user-id", "My key", "revoked", null, "resm_")
        ));
        when(pocketBaseClient.findAiTokenByRawToken("expired")).thenReturn(Optional.of(
                new MaterialPocketBaseClient.AiTokenRecord("token-id", "user-id", "My key", "active", Instant.EPOCH.toString(), "resm_")
        ));

        assertThrows(IllegalArgumentException.class, () -> service.authenticate("missing"));
        assertThrows(IllegalArgumentException.class, () -> service.authenticate("inactive"));
        assertThrows(IllegalArgumentException.class, () -> service.authenticate("expired"));
    }
}
