package com.resumate.mcp.security;

import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.service.PocketBaseClient.AiTokenRecord;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashSet;

@Service
public class AiTokenAuthenticationService {

    private final PocketBaseClient pocketBaseClient;

    public AiTokenAuthenticationService(PocketBaseClient pocketBaseClient) {
        this.pocketBaseClient = pocketBaseClient;
    }

    public AiTokenPrincipal authenticate(String rawToken) {
        AiTokenRecord token = pocketBaseClient.findAiTokenByRawToken(rawToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid AI token."));

        if (!"active".equals(token.status())) {
            throw new IllegalArgumentException("AI token is not active.");
        }

        if (token.expiresAt() != null && Instant.parse(token.expiresAt()).isBefore(Instant.now())) {
            throw new IllegalArgumentException("AI token is expired.");
        }

        return new AiTokenPrincipal(
                token.id(),
                token.user(),
                Boolean.TRUE.equals(token.canChooseTemplate()),
                new LinkedHashSet<>(token.allowedTemplates()),
                token.maxProfileCreates(),
                token.profileCreatesCount() == null ? 0 : token.profileCreatesCount(),
                token.label()
        );
    }
}
