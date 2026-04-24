package com.resumate.mcp.security;

import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.service.PocketBaseClient.AiTokenRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
public class AiTokenAuthenticationService {

    private static final Logger logger = LoggerFactory.getLogger(AiTokenAuthenticationService.class);

    private final PocketBaseClient pocketBaseClient;

    public AiTokenAuthenticationService(PocketBaseClient pocketBaseClient) {
        this.pocketBaseClient = pocketBaseClient;
    }

    public AiTokenPrincipal authenticate(String rawToken) {
        AiTokenRecord token = pocketBaseClient.findAiTokenByRawToken(rawToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid API key."));

        if (!"active".equals(token.status())) {
            throw new IllegalArgumentException("API key is not active.");
        }

        Instant expiresAt = expiresAt(token.expiresAt());
        if (expiresAt != null && expiresAt.isBefore(Instant.now())) {
            throw new IllegalArgumentException("API key is expired.");
        }

        pocketBaseClient.markAiTokenUsed(token.id());

        logger.info(
                "Authenticated MCP API key tokenId={} userId={} label={} tokenPrefix={}",
                token.id(),
                token.user(),
                token.label(),
                token.tokenPrefix()
        );

        return new AiTokenPrincipal(
                token.id(),
                token.user(),
                token.label(),
                token.tokenPrefix()
        );
    }

    private static Instant expiresAt(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

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
