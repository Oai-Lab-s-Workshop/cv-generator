package com.resumate.mcp.security.oauth;

import com.resumate.mcp.config.OAuthProperties;
import com.resumate.mcp.service.PocketBaseClient;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.server.authorization.OAuth2ClientRegistration;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.converter.OAuth2ClientRegistrationRegisteredClientConverter;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.util.StringUtils;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;

public class AllowedRedirectUriRegisteredClientConverter implements Converter<OAuth2ClientRegistration, RegisteredClient> {

    private final OAuth2ClientRegistrationRegisteredClientConverter delegate = new OAuth2ClientRegistrationRegisteredClientConverter();
    private final PocketBaseClient pocketBaseClient;
    private final List<Pattern> allowedRedirectUriPatterns;
    private final TokenSettings tokenSettings;

    public AllowedRedirectUriRegisteredClientConverter(
            PocketBaseClient pocketBaseClient,
            OAuthProperties oauthProperties,
            TokenSettings tokenSettings
    ) {
        this.pocketBaseClient = pocketBaseClient;
        this.allowedRedirectUriPatterns = allowedPatterns(oauthProperties.allowedRedirectUriPatterns());
        this.tokenSettings = tokenSettings;
    }

    @Override
    public RegisteredClient convert(OAuth2ClientRegistration clientRegistration) {
        List<String> redirectUris = normalizedRedirectUris(clientRegistration.getRedirectUris());
        if (redirectUris.isEmpty() || redirectUris.stream().anyMatch((redirectUri) -> !isAllowedRedirectUri(redirectUri))) {
            throw new OAuth2AuthenticationException(new OAuth2Error(
                    "invalid_redirect_uri",
                    "OAuth client redirect_uri is not allowed.",
                    null
            ));
        }

        RegisteredClient registeredClient = Objects.requireNonNull(
                delegate.convert(clientRegistration),
                "Registered client conversion is required."
        );

        RegisteredClient.Builder builder = RegisteredClient.from(registeredClient)
                .clientAuthenticationMethods((methods) -> {
                    methods.clear();
                    methods.add(ClientAuthenticationMethod.NONE);
                })
                .authorizationGrantTypes((grantTypes) -> {
                    grantTypes.clear();
                    grantTypes.add(AuthorizationGrantType.AUTHORIZATION_CODE);
                    grantTypes.add(AuthorizationGrantType.REFRESH_TOKEN);
                })
                .redirectUris((uris) -> {
                    uris.clear();
                    uris.addAll(redirectUris);
                })
                .clientSettings(ClientSettings.builder().requireProofKey(true).build())
                .tokenSettings(tokenSettings);

        pocketBaseClient.findOAuthClientByClientNameAndRedirectUris(clientName(clientRegistration), redirectUris)
                .ifPresent((record) -> builder.id(record.id()).clientId(record.clientId()));

        return builder.build();
    }

    private boolean isAllowedRedirectUri(String redirectUri) {
        return allowedRedirectUriPatterns.stream().anyMatch((pattern) -> pattern.matcher(redirectUri).matches());
    }

    private static String clientName(OAuth2ClientRegistration clientRegistration) {
        return StringUtils.hasText(clientRegistration.getClientName()) ? clientRegistration.getClientName() : "OAuth client";
    }

    private static List<String> normalizedRedirectUris(List<String> redirectUris) {
        if (redirectUris == null) {
            return List.of();
        }
        return redirectUris.stream()
                .filter(StringUtils::hasText)
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    private static List<Pattern> allowedPatterns(List<String> patterns) {
        List<String> configuredPatterns = patterns == null || patterns.isEmpty() ? List.of("https://claude.ai/*") : patterns;
        return configuredPatterns.stream()
                .filter(StringUtils::hasText)
                .map(AllowedRedirectUriRegisteredClientConverter::wildcardPattern)
                .toList();
    }

    private static Pattern wildcardPattern(String pattern) {
        String regex = "\\Q" + pattern.trim().replace("*", "\\E.*\\Q") + "\\E";
        return Pattern.compile(regex);
    }
}
