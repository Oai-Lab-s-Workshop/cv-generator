package com.resumate.materialmcp.security;

import com.resumate.materialmcp.service.MaterialPocketBaseClient;
import org.springframework.stereotype.Service;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * Service for authenticating API keys against PocketBase.
 */
@Service
public class AiTokenAuthenticationService {

    private final MaterialPocketBaseClient pocketBaseClient;

    public AiTokenAuthenticationService(MaterialPocketBaseClient pocketBaseClient) {
        this.pocketBaseClient = pocketBaseClient;
    }

    /**
     * Authenticates an API key against PocketBase.
     * @param apiKey The API key to authenticate
     * @return Authenticated principal
     * @throws IllegalArgumentException if authentication fails
     */
    public AiTokenPrincipal authenticate(String apiKey) {
        MaterialPocketBaseClient.AiTokenRecord token = pocketBaseClient.findAiTokenByRawToken(apiKey)
                .orElseThrow(() -> new IllegalArgumentException("Invalid API key."));
        if (!"active".equals(token.status())) {
            throw new IllegalArgumentException("API key is not active.");
        }
        Instant expiresAt = expiresAt(token.expiresAt());
        if (expiresAt != null && expiresAt.isBefore(Instant.now())) {
            throw new IllegalArgumentException("API key is expired.");
        }
        return new AiTokenPrincipal(token.id(), token.user(), token.label(), token.tokenPrefix());
    }

    private static Instant expiresAt(String value) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.trim().replace(" ", "T");
        try {
            if (normalized.endsWith("Z") || normalized.matches(".*[+-]\\d{2}:\\d{2}$")) {
                return OffsetDateTime.parse(normalized).toInstant();
            }
            return LocalDateTime.parse(normalized).toInstant(ZoneOffset.UTC);
        } catch (DateTimeException ex) {
            throw new IllegalArgumentException("API key expiry is invalid.", ex);
        }
    }
}
