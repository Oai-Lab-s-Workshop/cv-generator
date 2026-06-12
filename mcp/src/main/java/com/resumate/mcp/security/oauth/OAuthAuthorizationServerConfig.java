package com.resumate.mcp.security.oauth;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.resumate.mcp.config.OAuthProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.config.annotation.web.configurers.oauth2.server.authorization.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.core.OAuth2Token;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.oauth2.server.authorization.token.DelegatingOAuth2TokenGenerator;
import org.springframework.security.oauth2.server.authorization.token.JwtGenerator;
import org.springframework.security.oauth2.server.authorization.token.OAuth2AccessTokenGenerator;
import org.springframework.security.oauth2.server.authorization.token.OAuth2RefreshTokenGenerator;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenGenerator;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.text.ParseException;
import java.time.Duration;

@Configuration
public class OAuthAuthorizationServerConfig {

    @Bean
    @Order(2)
    SecurityFilterChain authorizationServerSecurityFilterChain(
            HttpSecurity http,
            RegisteredClientRepository registeredClientRepository,
            OAuth2AuthorizationService authorizationService,
            OAuth2AuthorizationConsentService authorizationConsentService,
            AuthorizationServerSettings authorizationServerSettings,
            OAuth2TokenGenerator<? extends OAuth2Token> tokenGenerator
    ) throws Exception {
        OAuth2AuthorizationServerConfigurer authorizationServerConfigurer = new OAuth2AuthorizationServerConfigurer();
        RequestMatcher endpointsMatcher = authorizationServerConfigurer.getEndpointsMatcher();

        return http
                .securityMatcher(endpointsMatcher)
                .authorizeHttpRequests((requests) -> requests.anyRequest().authenticated())
                .csrf((csrf) -> csrf.ignoringRequestMatchers(endpointsMatcher))
                .with(authorizationServerConfigurer, (authorizationServer) -> authorizationServer
                        .registeredClientRepository(registeredClientRepository)
                        .authorizationService(authorizationService)
                        .authorizationConsentService(authorizationConsentService)
                        .authorizationServerSettings(authorizationServerSettings)
                        .tokenGenerator(tokenGenerator)
                )
                .build();
    }

    @Bean
    AuthorizationServerSettings authorizationServerSettings(OAuthProperties properties) {
        return AuthorizationServerSettings.builder()
                .issuer(normalizedIssuer(properties.publicBaseUrl()))
                .build();
    }

    @Bean
    TokenSettings oauthTokenSettings(OAuthProperties properties) {
        return TokenSettings.builder()
                .accessTokenFormat(OAuth2TokenFormat.SELF_CONTAINED)
                .accessTokenTimeToLive(defaultDuration(properties.accessTokenTtl(), Duration.ofHours(1)))
                .refreshTokenTimeToLive(defaultDuration(properties.refreshTokenTtl(), Duration.ofDays(90)))
                .reuseRefreshTokens(false)
                .build();
    }

    @Bean
    JWKSource<SecurityContext> jwkSource(OAuthProperties properties) {
        RSAKey rsaKey = parsePrivateRsaJwk(properties.jwk());
        return new ImmutableJWKSet<>(new JWKSet(rsaKey));
    }

    @Bean
    JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
        return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
    }

    @Bean
    OAuth2TokenGenerator<? extends OAuth2Token> oauthTokenGenerator(JWKSource<SecurityContext> jwkSource) {
        JwtGenerator jwtGenerator = new JwtGenerator(new NimbusJwtEncoder(jwkSource));
        return new DelegatingOAuth2TokenGenerator(
                jwtGenerator,
                new OAuth2AccessTokenGenerator(),
                new OAuth2RefreshTokenGenerator()
        );
    }

    private static String normalizedIssuer(String publicBaseUrl) {
        if (!StringUtils.hasText(publicBaseUrl)) {
            throw new IllegalStateException("MCP_PUBLIC_BASE_URL is required for OAuth authorization server startup.");
        }

        URI uri = URI.create(publicBaseUrl.trim());
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
            throw new IllegalStateException("MCP_PUBLIC_BASE_URL must be an absolute HTTPS URL.");
        }
        if (StringUtils.hasText(uri.getQuery()) || StringUtils.hasText(uri.getFragment())) {
            throw new IllegalStateException("MCP_PUBLIC_BASE_URL must not include query parameters or fragments.");
        }

        String issuer = uri.toString();
        return issuer.endsWith("/") ? issuer.substring(0, issuer.length() - 1) : issuer;
    }

    private static RSAKey parsePrivateRsaJwk(String jwk) {
        if (!StringUtils.hasText(jwk)) {
            throw new IllegalStateException("MCP_OAUTH_JWK is required for OAuth authorization server startup.");
        }

        try {
            RSAKey rsaKey = parseRsaKey(jwk.trim());
            rsaKey.toRSAPrivateKey();
            return rsaKey;
        } catch (ParseException | JOSEException | IllegalArgumentException ex) {
            throw new IllegalStateException("MCP_OAUTH_JWK must be a private RSA JWK or JWK set.", ex);
        }
    }

    private static RSAKey parseRsaKey(String jwk) throws ParseException {
        try {
            return RSAKey.parse(jwk);
        } catch (ParseException ex) {
            JWKSet jwkSet = JWKSet.parse(jwk);
            return jwkSet.getKeys().stream()
                    .filter(RSAKey.class::isInstance)
                    .map(RSAKey.class::cast)
                    .filter(JWK::isPrivate)
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("No private RSA key found in JWK set."));
        }
    }

    private static Duration defaultDuration(Duration value, Duration defaultValue) {
        return value == null ? defaultValue : value;
    }
}
