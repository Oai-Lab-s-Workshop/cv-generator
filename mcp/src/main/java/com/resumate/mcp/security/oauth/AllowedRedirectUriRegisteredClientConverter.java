package com.resumate.mcp.security.oauth;

import com.resumate.mcp.config.OAuthProperties;
import com.resumate.mcp.service.PocketBaseClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

public class AllowedRedirectUriRegisteredClientConverter implements Converter<OAuth2ClientRegistration, RegisteredClient> {

    private static final Logger LOGGER = LoggerFactory.getLogger(AllowedRedirectUriRegisteredClientConverter.class);

    private final OAuth2ClientRegistrationRegisteredClientConverter delegate = new OAuth2ClientRegistrationRegisteredClientConverter();
    private final PocketBaseClient pocketBaseClient;
    private final List<AllowedRedirectUriPattern> allowedRedirectUriPatterns;
    private final TokenSettings tokenSettings;

    public AllowedRedirectUriRegisteredClientConverter(
            PocketBaseClient pocketBaseClient,
            OAuthProperties oauthProperties,
            TokenSettings tokenSettings
    ) {
        this.pocketBaseClient = pocketBaseClient;
        this.tokenSettings = tokenSettings;

        List<String> configuredPatterns = resolveConfiguredPatterns(oauthProperties.allowedRedirectUriPatterns());
        validatePatterns(configuredPatterns);
        this.allowedRedirectUriPatterns = configuredPatterns.stream()
                .filter(StringUtils::hasText)
                .map(AllowedRedirectUriPattern::parse)
                .toList();
        LOGGER.info("OAuth redirect URI allowed patterns: {}", configuredPatterns);
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
                .clientSettings(ClientSettings.builder().requireProofKey(true).requireAuthorizationConsent(true).build())
                .tokenSettings(tokenSettings);

        pocketBaseClient.findOAuthClientByClientNameAndRedirectUris(clientName(clientRegistration), redirectUris)
                .ifPresent((record) -> builder.id(record.id()).clientId(record.clientId()));

        return builder.build();
    }

    private boolean isAllowedRedirectUri(String redirectUri) {
        return allowedRedirectUriPatterns.stream().anyMatch((pattern) -> pattern.matches(redirectUri));
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

    private static List<String> resolveConfiguredPatterns(List<String> patterns) {
        return patterns == null || patterns.isEmpty() ? List.of("https://claude.ai/*") : patterns;
    }

    private static void validatePatterns(List<String> patterns) {
        for (String pattern : patterns) {
            if (!StringUtils.hasText(pattern)) {
                continue;
            }
            String trimmed = pattern.trim();

            if ("*".equals(trimmed)) {
                throw new IllegalArgumentException(
                        "OAuth redirect URI pattern '*' matches any domain and is not allowed.");
            }

            String withoutScheme = trimmed;
            if (withoutScheme.startsWith("https://")) {
                withoutScheme = withoutScheme.substring("https://".length());
            } else if (withoutScheme.startsWith("http://")) {
                withoutScheme = withoutScheme.substring("http://".length());
            }

            if (withoutScheme.equals("*") || withoutScheme.startsWith("*/")) {
                throw new IllegalArgumentException(
                        "OAuth redirect URI pattern '" + trimmed + "' matches any hostname and is not allowed.");
            }

            AllowedRedirectUriPattern.parse(trimmed);
        }
    }

    private record AllowedRedirectUriPattern(String scheme, String host, int port, boolean subdomainWildcard, String pathPattern) {

        private static AllowedRedirectUriPattern parse(String value) {
            String trimmed = value.trim();
            try {
                URI uri = new URI(trimmed);
                if (!StringUtils.hasText(uri.getScheme()) || !StringUtils.hasText(uri.getRawAuthority())) {
                    throw invalid(trimmed, "must include an absolute scheme and hostname");
                }
                if (!"https".equalsIgnoreCase(uri.getScheme())) {
                    throw invalid(trimmed, "must use https");
                }
                if (StringUtils.hasText(uri.getRawQuery()) || StringUtils.hasText(uri.getRawFragment())) {
                    throw invalid(trimmed, "must not include query parameters or fragments");
                }

                String authority = uri.getRawAuthority();
                boolean wildcard = authority.startsWith("*.");
                String host = wildcard ? authority.substring(2) : uri.getHost();
                if (!StringUtils.hasText(host) || host.contains("*") || host.contains("/") || host.contains(":")) {
                    throw invalid(trimmed, "contains an unsafe hostname wildcard");
                }

                String rawPath = StringUtils.hasText(uri.getRawPath()) ? uri.getRawPath() : "/";
                return new AllowedRedirectUriPattern(uri.getScheme().toLowerCase(), host.toLowerCase(), uri.getPort(), wildcard, rawPath);
            } catch (URISyntaxException ex) {
                throw invalid(trimmed, "is not a valid URI");
            }
        }

        private boolean matches(String redirectUri) {
            try {
                URI uri = new URI(redirectUri.trim());
                if (!scheme.equalsIgnoreCase(uri.getScheme()) || !StringUtils.hasText(uri.getHost())) {
                    return false;
                }
                if (StringUtils.hasText(uri.getRawQuery()) || StringUtils.hasText(uri.getRawFragment())) {
                    return false;
                }
                String actualHost = uri.getHost().toLowerCase();
                if (uri.getPort() != port) {
                    return false;
                }
                if (subdomainWildcard) {
                    if (!actualHost.endsWith("." + host) || actualHost.equals(host)) {
                        return false;
                    }
                } else if (!actualHost.equals(host)) {
                    return false;
                }
                String actualPath = StringUtils.hasText(uri.getRawPath()) ? uri.getRawPath() : "/";
                return matchesPath(actualPath);
            } catch (URISyntaxException ex) {
                return false;
            }
        }

        private boolean matchesPath(String actualPath) {
            if ("*".equals(pathPattern) || "/*".equals(pathPattern)) {
                return actualPath.startsWith("/");
            }
            if (pathPattern.endsWith("*")) {
                return actualPath.startsWith(pathPattern.substring(0, pathPattern.length() - 1));
            }
            return actualPath.equals(pathPattern);
        }

        private static IllegalArgumentException invalid(String value, String reason) {
            return new IllegalArgumentException("OAuth redirect URI pattern '" + value + "' " + reason + ".");
        }
    }
}
