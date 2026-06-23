package com.resumate.mcp.security.oauth;

import com.resumate.mcp.service.PocketBaseClient;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsent;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class PocketBaseOAuth2AuthorizationConsentService implements OAuth2AuthorizationConsentService {

    private final PocketBaseClient pocketBaseClient;
    private final RegisteredClientRepository registeredClientRepository;

    public PocketBaseOAuth2AuthorizationConsentService(
            PocketBaseClient pocketBaseClient,
            RegisteredClientRepository registeredClientRepository
    ) {
        this.pocketBaseClient = pocketBaseClient;
        this.registeredClientRepository = registeredClientRepository;
    }

    @Override
    public void save(OAuth2AuthorizationConsent authorizationConsent) {
        Objects.requireNonNull(authorizationConsent, "authorizationConsent is required");

        RegisteredClient registeredClient = requiredClient(authorizationConsent.getRegisteredClientId());
        List<String> scopes = authorizationConsent.getScopes().stream().toList();
        Map<String, Object> consent = Map.of(
                "scopes", scopes,
                "authorities", authorizationConsent.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList()
        );

        OAuthAuthorizationSaveRetry.save(
                "consent for client " + registeredClient.getClientId()
                        + " / user " + authorizationConsent.getPrincipalName(),
                () -> pocketBaseClient.findOAuthConsentByClientAndUser(
                                registeredClient.getClientId(),
                                authorizationConsent.getPrincipalName()
                        )
                        .ifPresentOrElse(
                                (record) -> pocketBaseClient.updateOAuthAuthorization(
                                        record.id(),
                                        new PocketBaseClient.OAuthAuthorizationPayload(
                                                PocketBaseClient.OAUTH_RECORD_TYPE_CONSENT,
                                                record.user(),
                                                record.clientId(),
                                                scopes,
                                                null,
                                                null,
                                                record.accessTokenJti(),
                                                record.expiresAt(),
                                                record.status(),
                                                record.state(),
                                                consent
                                        )
                                ),
                                () -> pocketBaseClient.createOAuthAuthorization(new PocketBaseClient.OAuthAuthorizationPayload(
                                        PocketBaseClient.OAUTH_RECORD_TYPE_CONSENT,
                                        authorizationConsent.getPrincipalName(),
                                        registeredClient.getClientId(),
                                        scopes,
                                        null,
                                        null,
                                        null,
                                        null,
                                        "active",
                                        Map.of(),
                                        consent
                                ))
                        )
        );
    }

    @Override
    public void remove(OAuth2AuthorizationConsent authorizationConsent) {
        Objects.requireNonNull(authorizationConsent, "authorizationConsent is required");

        RegisteredClient registeredClient = requiredClient(authorizationConsent.getRegisteredClientId());
        pocketBaseClient.findOAuthConsentByClientAndUser(
                        registeredClient.getClientId(),
                        authorizationConsent.getPrincipalName()
                )
                .ifPresent((record) -> pocketBaseClient.deleteOAuthAuthorization(record.id()));
    }

    @Override
    public OAuth2AuthorizationConsent findById(String registeredClientId, String principalName) {
        RegisteredClient registeredClient = registeredClientRepository.findById(registeredClientId);
        if (registeredClient == null) {
            return null;
        }

        return pocketBaseClient.findOAuthConsentByClientAndUser(registeredClient.getClientId(), principalName)
                .map((record) -> toConsent(registeredClientId, principalName, record))
                .orElse(null);
    }

    private RegisteredClient requiredClient(String registeredClientId) {
        RegisteredClient registeredClient = registeredClientRepository.findById(registeredClientId);
        if (registeredClient == null) {
            throw new IllegalStateException("Registered OAuth client not found for consent " + registeredClientId + ".");
        }
        return registeredClient;
    }

    private OAuth2AuthorizationConsent toConsent(
            String registeredClientId,
            String principalName,
            PocketBaseClient.OAuthAuthorizationRecord record
    ) {
        List<String> scopes = scopes(record);
        if (scopes.isEmpty()) {
            return null;
        }
        OAuth2AuthorizationConsent.Builder builder = OAuth2AuthorizationConsent.withId(registeredClientId, principalName);
        scopes.forEach(builder::scope);
        return builder.build();
    }

    @SuppressWarnings("unchecked")
    private static List<String> scopes(PocketBaseClient.OAuthAuthorizationRecord record) {
        if (record.consent() != null && record.consent().get("scopes") instanceof List<?> scopes) {
            return scopes.stream().map(Object::toString).toList();
        }
        return record.scopes() == null ? List.of() : record.scopes();
    }
}
