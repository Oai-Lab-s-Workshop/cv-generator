package com.resumate.mcp.integration;

import com.resumate.mcp.config.FrontendProperties;
import com.resumate.mcp.config.PocketBaseProperties;
import com.resumate.mcp.security.AiTokenAuthenticationService;
import com.resumate.mcp.service.PocketBaseClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@SpringBootTest
class SecurityIntegrationTest {

    @MockitoBean
    private PocketBaseClient pocketBaseClient;

    @Autowired
    private AiTokenAuthenticationService authenticationService;

    @TestConfiguration
    static class TestConfig {
        @Bean
        @Primary
        public FrontendProperties frontendProperties() {
            return new FrontendProperties("https://resumate.app");
        }

        @Bean
        @Primary
        public PocketBaseProperties pocketBaseProperties() {
            return new PocketBaseProperties("http://localhost:8090", "test@test.com", "testpass");
        }
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticationServiceBean_isWired() {
        assertThat(authenticationService).isNotNull();
    }

    @Test
    void authenticationService_authenticatesValidToken() {
        when(pocketBaseClient.findAiTokenByRawToken("valid")).thenReturn(Optional.of(
                new PocketBaseClient.AiTokenRecord(
                        "tokenId", "userId", "label", "active",
                        Instant.now().plusSeconds(3600).toString(),
                        "hash", "prefix"
                )
        ));

        var principal = authenticationService.authenticate("valid");

        assertThat(principal).isNotNull();
        assertThat(principal.tokenId()).isEqualTo("tokenId");
        assertThat(principal.userId()).isEqualTo("userId");
        assertThat(principal.label()).isEqualTo("label");
    }

    @Test
    void authenticationService_rejectsExpiredToken() {
        when(pocketBaseClient.findAiTokenByRawToken("expired")).thenReturn(Optional.of(
                new PocketBaseClient.AiTokenRecord(
                        "tokenId", "userId", "label", "active",
                        Instant.now().minusSeconds(3600).toString(),
                        "hash", "prefix"
                )
        ));

        assertThatThrownBy(() -> authenticationService.authenticate("expired"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("API key is expired.");
    }

    @Test
    void authenticationService_rejectsInvalidToken() {
        when(pocketBaseClient.findAiTokenByRawToken("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authenticationService.authenticate("bad"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid API key.");
    }

    @Test
    void authenticationService_rejectsRevokedToken() {
        when(pocketBaseClient.findAiTokenByRawToken("revoked")).thenReturn(Optional.of(
                new PocketBaseClient.AiTokenRecord(
                        "tokenId", "userId", "label", "revoked",
                        Instant.now().plusSeconds(3600).toString(),
                        "hash", "prefix"
                )
        ));

        assertThatThrownBy(() -> authenticationService.authenticate("revoked"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("API key is not active.");
    }
}
