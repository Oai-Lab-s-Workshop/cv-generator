package com.resumate.mcp.security;

import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.service.PocketBaseClient.AiTokenRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
public class AiTokenAuthenticationService {

    private static final Logger logger = LoggerFactory.getLogger(AiTokenAuthenticationService.class);

    private final PocketBaseClient pocketBaseClient;
    private final AiTokenUsageRecorder usageRecorder;

    public AiTokenAuthenticationService(PocketBaseClient pocketBaseClient, AiTokenUsageRecorder usageRecorder) {
        this.pocketBaseClient = pocketBaseClient;
        this.usageRecorder = usageRecorder;
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

        usageRecorder.recordUsed(token.id());

        logger.info(
                "Authenticated MCP API key tokenId={} userRef={}",
                token.id(),
                pseudonym(token.user())
        );

        return new AiTokenPrincipal(
                token.id(),
                token.user(),
                token.label(),
                token.tokenPrefix()
        );
    }

    /**
     * Returns a stable pseudonymous reference (truncated SHA-256 hex) for the
     * given value, or {@code "none"} when the input is null or blank.
     */
    private static String pseudonym(String value) {
        if (value == null || value.isBlank()) {
            return "none";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.substring(0, 12);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available.", ex);
        }
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
