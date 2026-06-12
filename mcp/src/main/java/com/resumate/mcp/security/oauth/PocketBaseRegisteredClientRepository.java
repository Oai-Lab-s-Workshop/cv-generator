package com.resumate.mcp.security.oauth;

import com.resumate.mcp.service.PocketBaseClient;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Repository
public class PocketBaseRegisteredClientRepository implements RegisteredClientRepository {

    private final PocketBaseClient pocketBaseClient;

    public PocketBaseRegisteredClientRepository(PocketBaseClient pocketBaseClient) {
        this.pocketBaseClient = pocketBaseClient;
    }

    @Override
    public void save(RegisteredClient registeredClient) {
        Objects.requireNonNull(registeredClient, "registeredClient is required");

        PocketBaseClient.OAuthClientPayload payload = toPayload(registeredClient);
        pocketBaseClient.findOAuthClientByClientId(registeredClient.getClientId())
                .ifPresentOrElse(
                        (record) -> pocketBaseClient.updateOAuthClient(record.id(), payload),
                        () -> pocketBaseClient.createOAuthClient(payload)
                );
    }

    @Override
    public RegisteredClient findById(String id) {
        return pocketBaseClient.findOAuthClientByRecordId(id)
                .map(this::toRegisteredClient)
                .orElse(null);
    }

    @Override
    public RegisteredClient findByClientId(String clientId) {
        return pocketBaseClient.findOAuthClientByClientId(clientId)
                .map(this::toRegisteredClient)
                .orElse(null);
    }

    private PocketBaseClient.OAuthClientPayload toPayload(RegisteredClient registeredClient) {
        return new PocketBaseClient.OAuthClientPayload(
                registeredClient.getClientId(),
                registeredClient.getClientSecret(),
                registeredClient.getClientName(),
                List.copyOf(registeredClient.getRedirectUris()),
                registeredClient.getAuthorizationGrantTypes().stream()
                        .map(AuthorizationGrantType::getValue)
                        .toList(),
                List.copyOf(registeredClient.getScopes()),
                serializeSettings(registeredClient.getTokenSettings().getSettings()),
                registeredClient.getClientSecretExpiresAt() == null ? null : registeredClient.getClientSecretExpiresAt().toString()
        );
    }

    private RegisteredClient toRegisteredClient(PocketBaseClient.OAuthClientRecord record) {
        RegisteredClient.Builder builder = RegisteredClient.withId(record.id())
                .clientId(record.clientId())
                .clientName(record.clientName())
                .clientSettings(ClientSettings.builder().requireProofKey(true).build())
                .tokenSettings(TokenSettings.withSettings(deserializeSettings(record.tokenSettings())).build());

        if (record.clientSecretHash() != null && !record.clientSecretHash().isBlank()) {
            builder.clientSecret(record.clientSecretHash());
        }
        if (record.expiresAt() != null && !record.expiresAt().isBlank()) {
            builder.clientSecretExpiresAt(java.time.Instant.parse(record.expiresAt()));
        }
        nullSafe(record.redirectUris()).forEach(builder::redirectUri);
        nullSafe(record.grantTypes()).stream()
                .map(AuthorizationGrantType::new)
                .forEach(builder::authorizationGrantType);
        nullSafe(record.scopes()).forEach(builder::scope);

        if (record.clientSecretHash() == null || record.clientSecretHash().isBlank()) {
            builder.clientAuthenticationMethod(ClientAuthenticationMethod.NONE);
        }

        return builder.build();
    }

    private static List<String> nullSafe(List<String> values) {
        return values == null ? List.of() : values;
    }

    private static Map<String, Object> serializeSettings(Map<String, Object> settings) {
        Map<String, Object> serialized = new LinkedHashMap<>();
        settings.forEach((key, value) -> serialized.put(key, value instanceof Duration duration ? duration.toString() : value));
        return serialized;
    }

    private static Map<String, Object> deserializeSettings(Map<String, Object> settings) {
        if (settings == null || settings.isEmpty()) {
            return TokenSettings.builder().build().getSettings();
        }

        Map<String, Object> deserialized = new LinkedHashMap<>();
        settings.forEach((key, value) -> {
            if (value instanceof String stringValue && stringValue.startsWith("PT")) {
                deserialized.put(key, Duration.parse(stringValue));
            } else {
                deserialized.put(key, value);
            }
        });
        return deserialized;
    }
}
