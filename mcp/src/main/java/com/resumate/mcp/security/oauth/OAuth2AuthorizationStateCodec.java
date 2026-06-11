package com.resumate.mcp.security.oauth;

import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationCode;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;

import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public final class OAuth2AuthorizationStateCodec {

    private OAuth2AuthorizationStateCodec() {
    }

    public static Map<String, Object> toState(OAuth2Authorization authorization) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("id", authorization.getId());
        state.put("registeredClientId", authorization.getRegisteredClientId());
        state.put("principalName", authorization.getPrincipalName());
        state.put("authorizationGrantType", authorization.getAuthorizationGrantType().getValue());
        state.put("authorizedScopes", List.copyOf(authorization.getAuthorizedScopes()));
        state.put("attributes", new LinkedHashMap<>(authorization.getAttributes()));
        putToken(state, "authorizationCode", authorization.getToken(OAuth2AuthorizationCode.class));
        putToken(state, "accessToken", authorization.getAccessToken());
        putToken(state, "refreshToken", authorization.getRefreshToken());
        return state;
    }

    public static OAuth2Authorization fromState(Map<String, Object> state, RegisteredClient registeredClient) {
        OAuth2Authorization.Builder builder = OAuth2Authorization.withRegisteredClient(registeredClient)
                .id(requiredString(state, "id"))
                .principalName(requiredString(state, "principalName"))
                .authorizationGrantType(new AuthorizationGrantType(requiredString(state, "authorizationGrantType")))
                .authorizedScopes(stringSet(state.get("authorizedScopes")))
                .attributes((attributes) -> attributes.putAll(objectMap(state.get("attributes"))));

        Map<String, Object> authorizationCode = objectMap(state.get("authorizationCode"));
        if (!authorizationCode.isEmpty()) {
            builder.token(new OAuth2AuthorizationCode(
                    requiredString(authorizationCode, "value"),
                    instant(authorizationCode.get("issuedAt")),
                    instant(authorizationCode.get("expiresAt"))
            ), (metadata) -> metadata.putAll(objectMap(authorizationCode.get("metadata"))));
        }

        Map<String, Object> accessToken = objectMap(state.get("accessToken"));
        if (!accessToken.isEmpty()) {
            builder.token(new OAuth2AccessToken(
                    OAuth2AccessToken.TokenType.BEARER,
                    requiredString(accessToken, "value"),
                    instant(accessToken.get("issuedAt")),
                    instant(accessToken.get("expiresAt")),
                    stringSet(accessToken.get("scopes"))
            ), (metadata) -> metadata.putAll(objectMap(accessToken.get("metadata"))));
        }

        Map<String, Object> refreshToken = objectMap(state.get("refreshToken"));
        if (!refreshToken.isEmpty()) {
            builder.token(new OAuth2RefreshToken(
                    requiredString(refreshToken, "value"),
                    instant(refreshToken.get("issuedAt")),
                    instant(refreshToken.get("expiresAt"))
            ), (metadata) -> metadata.putAll(objectMap(refreshToken.get("metadata"))));
        }

        return builder.build();
    }

    private static void putToken(Map<String, Object> state, String key, OAuth2Authorization.Token<?> token) {
        if (token == null) {
            return;
        }
        Map<String, Object> tokenState = new LinkedHashMap<>();
        tokenState.put("value", token.getToken().getTokenValue());
        tokenState.put("issuedAt", string(token.getToken().getIssuedAt()));
        tokenState.put("expiresAt", string(token.getToken().getExpiresAt()));
        if (token.getToken() instanceof OAuth2AccessToken accessToken) {
            tokenState.put("scopes", List.copyOf(accessToken.getScopes()));
        }
        tokenState.put("metadata", new LinkedHashMap<>(token.getMetadata()));
        state.put(key, tokenState);
    }

    private static String string(Instant instant) {
        return instant == null ? null : instant.toString();
    }

    private static Instant instant(Object value) {
        return value == null ? null : Instant.parse(value.toString());
    }

    private static String requiredString(Map<String, Object> source, String key) {
        Object value = source.get(key);
        if (value == null) {
            throw new IllegalArgumentException("OAuth authorization state is missing " + key + ".");
        }
        return value.toString();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> objectMap(Object value) {
        if (value == null) {
            return Map.of();
        }
        if (!(value instanceof Map<?, ?> map)) {
            throw new IllegalArgumentException("OAuth authorization state contains an invalid object map.");
        }
        return (Map<String, Object>) map;
    }

    private static Set<String> stringSet(Object value) {
        if (!(value instanceof Collection<?> collection)) {
            return Set.of();
        }
        return collection.stream()
                .map(Object::toString)
                .collect(Collectors.toUnmodifiableSet());
    }
}
