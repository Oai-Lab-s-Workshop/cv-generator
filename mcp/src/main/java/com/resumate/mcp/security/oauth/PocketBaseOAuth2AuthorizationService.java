package com.resumate.mcp.security.oauth;

import com.resumate.mcp.service.PocketBaseClient;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationCode;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
public class PocketBaseOAuth2AuthorizationService implements OAuth2AuthorizationService {

    private static final OAuth2TokenType STATE_TOKEN_TYPE = new OAuth2TokenType("state");

    private final PocketBaseClient pocketBaseClient;
    private final RegisteredClientRepository registeredClientRepository;
    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    public PocketBaseOAuth2AuthorizationService(
            PocketBaseClient pocketBaseClient,
            RegisteredClientRepository registeredClientRepository
    ) {
        this.pocketBaseClient = pocketBaseClient;
        this.registeredClientRepository = registeredClientRepository;
    }

    @Override
    public void save(OAuth2Authorization authorization) {
        Objects.requireNonNull(authorization, "authorization is required");

        PocketBaseClient.OAuthAuthorizationPayload payload = toPayload(authorization);
        pocketBaseClient.findOAuthAuthorizationByStateId(authorization.getId())
                .ifPresentOrElse(
                        (record) -> pocketBaseClient.updateOAuthAuthorization(record.id(), payload),
                        () -> pocketBaseClient.createOAuthAuthorization(payload)
                );
    }

    @Override
    public void remove(OAuth2Authorization authorization) {
        Objects.requireNonNull(authorization, "authorization is required");

        pocketBaseClient.findOAuthAuthorizationByStateId(authorization.getId())
                .ifPresent((record) -> pocketBaseClient.deleteOAuthAuthorization(record.id()));
    }

    @Override
    public OAuth2Authorization findById(String id) {
        return pocketBaseClient.findOAuthAuthorizationByStateId(id)
                .map((record) -> toAuthorization(record, Map.of()))
                .orElse(null);
    }

    @Override
    public OAuth2Authorization findByToken(String token, OAuth2TokenType tokenType) {
        if (token == null || token.isBlank()) {
            return null;
        }

        Optional<PocketBaseClient.OAuthAuthorizationRecord> record;
        if (tokenType == null || OAuth2ParameterNames.CODE.equals(tokenType.getValue())) {
            record = pocketBaseClient.findOAuthAuthorizationByAuthCode(token);
            if (record.isPresent()) {
                return toAuthorization(record.get(), Map.of("authorizationCode", token));
            }
        }
        if (STATE_TOKEN_TYPE.equals(tokenType)) {
            return pocketBaseClient.findOAuthAuthorizationByConsentState(token)
                    .map((authorizationRecord) -> toAuthorization(authorizationRecord, Map.of()))
                    .orElse(null);
        }
        if (tokenType == null || OAuth2TokenType.REFRESH_TOKEN.equals(tokenType)) {
            record = pocketBaseClient.findOAuthAuthorizationByRefreshToken(token);
            if (record.isPresent()) {
                if (!isActive(record.get())) {
                    return null;
                }
                return toAuthorization(record.get(), Map.of("refreshToken", token));
            }
        }
        if (tokenType == null || OAuth2TokenType.ACCESS_TOKEN.equals(tokenType)) {
            String accessTokenJti = accessTokenJti(token);
            if (accessTokenJti != null) {
                record = pocketBaseClient.findOAuthAuthorizationByAccessTokenJti(accessTokenJti);
                if (record.isPresent()) {
                    return toAuthorization(record.get(), Map.of("accessToken", token));
                }
            }
        }

        return null;
    }

    private PocketBaseClient.OAuthAuthorizationPayload toPayload(OAuth2Authorization authorization) {
        RegisteredClient registeredClient = registeredClientRepository.findById(authorization.getRegisteredClientId());
        String clientId = registeredClient == null ? authorization.getRegisteredClientId() : registeredClient.getClientId();

        OAuth2Authorization.Token<OAuth2AuthorizationCode> authorizationCode = authorization.getToken(OAuth2AuthorizationCode.class);
        OAuth2Authorization.Token<OAuth2AccessToken> accessToken = authorization.getAccessToken();

        return new PocketBaseClient.OAuthAuthorizationPayload(
                authorization.getPrincipalName(),
                clientId,
                List.copyOf(authorization.getAuthorizedScopes()),
                authorizationCode == null ? null : authorizationCode.getToken().getTokenValue(),
                authorization.getRefreshToken() == null ? null : authorization.getRefreshToken().getToken().getTokenValue(),
                accessTokenJti(accessToken),
                expiresAt(authorization),
                "active",
                OAuth2AuthorizationStateCodec.toState(authorization),
                Map.of("scopes", List.copyOf(authorization.getAuthorizedScopes()))
        );
    }

    private OAuth2Authorization toAuthorization(
            PocketBaseClient.OAuthAuthorizationRecord record,
            Map<String, String> tokenValues
    ) {
        Map<String, Object> state = record.state() == null ? Map.of() : record.state();
        RegisteredClient registeredClient = registeredClientRepository.findById(state.get("registeredClientId").toString());
        if (registeredClient == null) {
            throw new IllegalStateException("Registered OAuth client not found for authorization " + record.id() + ".");
        }

        return OAuth2AuthorizationStateCodec.fromState(state, registeredClient, tokenValues);
    }

    private static String expiresAt(OAuth2Authorization authorization) {
        if (authorization.getRefreshToken() != null && authorization.getRefreshToken().getToken().getExpiresAt() != null) {
            return authorization.getRefreshToken().getToken().getExpiresAt().toString();
        }
        if (authorization.getAccessToken() != null && authorization.getAccessToken().getToken().getExpiresAt() != null) {
            return authorization.getAccessToken().getToken().getExpiresAt().toString();
        }
        OAuth2Authorization.Token<OAuth2AuthorizationCode> authorizationCode = authorization.getToken(OAuth2AuthorizationCode.class);
        if (authorizationCode != null && authorizationCode.getToken().getExpiresAt() != null) {
            return authorizationCode.getToken().getExpiresAt().toString();
        }
        return null;
    }

    private static String accessTokenJti(OAuth2Authorization.Token<OAuth2AccessToken> accessToken) {
        if (accessToken == null || accessToken.getClaims() == null) {
            return null;
        }
        Object jti = accessToken.getClaims().get("jti");
        return jti == null ? null : jti.toString();
    }

    private static boolean isActive(PocketBaseClient.OAuthAuthorizationRecord record) {
        return record.status() == null || "active".equalsIgnoreCase(record.status());
    }

    private String accessTokenJti(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) {
                return null;
            }
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            Map<String, Object> payload = objectMapper.readValue(payloadJson, new TypeReference<LinkedHashMap<String, Object>>() {
            });
            Object jti = payload.get("jti");
            return jti == null ? null : jti.toString();
        } catch (RuntimeException ex) {
            return null;
        }
    }
}
