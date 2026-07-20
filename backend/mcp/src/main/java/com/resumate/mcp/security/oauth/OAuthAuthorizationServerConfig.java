package com.resumate.mcp.security.oauth;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.resumate.mcp.config.OAuthProperties;
import com.resumate.mcp.service.PocketBaseClient;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2ClientRegistrationAuthenticationProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.config.annotation.web.configurers.oauth2.server.authorization.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.keygen.Base64StringKeyGenerator;
import org.springframework.security.crypto.keygen.StringKeyGenerator;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2Token;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2ClientAuthenticationToken;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.oauth2.server.authorization.token.DelegatingOAuth2TokenGenerator;
import org.springframework.security.oauth2.server.authorization.token.JwtGenerator;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2AccessTokenGenerator;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenGenerator;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationConverter;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.util.StringUtils;

import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Configuration
public class OAuthAuthorizationServerConfig {

    @Bean
    @Order(2)
    SecurityFilterChain oauthAuthorizeSecurityFilterChain(
            HttpSecurity http,
            RegisteredClientRepository registeredClientRepository,
            OAuth2AuthorizationService authorizationService,
            OAuth2AuthorizationConsentService authorizationConsentService,
            AuthorizationServerSettings authorizationServerSettings,
            OAuth2TokenGenerator<? extends OAuth2Token> tokenGenerator
    ) throws Exception {
        OAuth2AuthorizationServerConfigurer authorizationServerConfigurer = new OAuth2AuthorizationServerConfigurer();

        return http
                .securityMatcher("/oauth/authorize", "/oauth/consent", "/login")
                .authorizeHttpRequests((requests) -> requests
                        .requestMatchers("/login").permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement((sessions) -> sessions.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .formLogin((formLogin) -> formLogin
                        .loginPage("/login")
                        .failureUrl("/login?error")
                        .permitAll()
                )
                .with(authorizationServerConfigurer, (authorizationServer) -> authorizationServer
                        .registeredClientRepository(registeredClientRepository)
                        .authorizationService(authorizationService)
                        .authorizationConsentService(authorizationConsentService)
                        .authorizationServerSettings(authorizationServerSettings)
                        .tokenGenerator(tokenGenerator)
                        .authorizationEndpoint((authorizationEndpoint) -> authorizationEndpoint.consentPage("/oauth/consent"))
                )
                .build();
    }

    @Bean
    @Order(3)
    SecurityFilterChain authorizationServerSecurityFilterChain(
            HttpSecurity http,
            RegisteredClientRepository registeredClientRepository,
            OAuth2AuthorizationService authorizationService,
            OAuth2AuthorizationConsentService authorizationConsentService,
            AuthorizationServerSettings authorizationServerSettings,
            OAuth2TokenGenerator<? extends OAuth2Token> tokenGenerator,
            PocketBaseClient pocketBaseClient,
            OAuthProperties properties,
            TokenSettings tokenSettings,
            ClientRegistrationRateLimitFilter clientRegistrationRateLimitFilter
    ) throws Exception {
        OAuth2AuthorizationServerConfigurer authorizationServerConfigurer = new OAuth2AuthorizationServerConfigurer();
        RequestMatcher endpointsMatcher = authorizationServerConfigurer.getEndpointsMatcher();
        OAuth2ClientRegistrationAuthenticationProvider clientRegistrationAuthenticationProvider = clientRegistrationAuthenticationProvider(
                registeredClientRepository,
                authorizationService,
                pocketBaseClient,
                properties,
                tokenSettings
        );

        return http
                .securityMatcher(endpointsMatcher)
                .authorizeHttpRequests((requests) -> requests
                        .requestMatchers("/.well-known/oauth-authorization-server").permitAll()
                        .requestMatchers("/oauth/register").permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin(AbstractHttpConfigurer::disable)
                .csrf((csrf) -> csrf.ignoringRequestMatchers(endpointsMatcher))
                .addFilterBefore(clientRegistrationRateLimitFilter, CsrfFilter.class)
                .with(authorizationServerConfigurer, (authorizationServer) -> authorizationServer
                        .registeredClientRepository(registeredClientRepository)
                        .authorizationService(authorizationService)
                        .authorizationConsentService(authorizationConsentService)
                        .authorizationServerSettings(authorizationServerSettings)
                        .tokenGenerator(tokenGenerator)
                        .clientAuthentication((clientAuthentication) -> clientAuthentication
                                .authenticationConverters((converters) -> converters.add(0, new PublicRefreshClientAuthenticationConverter()))
                                .authenticationProviders((providers) -> providers.add(0, new PublicRefreshClientAuthenticationProvider(registeredClientRepository)))
                        )
                        .authorizationServerMetadataEndpoint((metadata) -> metadata.authorizationServerMetadataCustomizer(
                                (builder) -> builder.clientRegistrationEndpoint(
                                        authorizationServerSettings.getIssuer() + authorizationServerSettings.getClientRegistrationEndpoint()
                                )
                        ))
                        .clientRegistrationEndpoint((clientRegistration) -> clientRegistration
                                .openRegistrationAllowed(true)
                                .authenticationProviders((providers) -> {
                                    providers.clear();
                                    providers.add(clientRegistrationAuthenticationProvider);
                                })
                        )
                )
                .build();
    }

    private OAuth2ClientRegistrationAuthenticationProvider clientRegistrationAuthenticationProvider(
            RegisteredClientRepository registeredClientRepository,
            OAuth2AuthorizationService authorizationService,
            PocketBaseClient pocketBaseClient,
            OAuthProperties properties,
            TokenSettings tokenSettings
    ) {
        OAuth2ClientRegistrationAuthenticationProvider provider = new OAuth2ClientRegistrationAuthenticationProvider(
                registeredClientRepository,
                authorizationService
        );
        provider.setOpenRegistrationAllowed(true);
        provider.setRegisteredClientConverter(new AllowedRedirectUriRegisteredClientConverter(
                pocketBaseClient,
                properties,
                tokenSettings
        ));
        return provider;
    }

    @Bean
    AuthorizationServerSettings authorizationServerSettings(OAuthProperties properties) {
        return AuthorizationServerSettings.builder()
                .issuer(OAuthEndpointUrls.normalizedIssuer(properties.publicBaseUrl()))
                .authorizationEndpoint("/oauth/authorize")
                .tokenEndpoint("/oauth/token")
                .clientRegistrationEndpoint("/oauth/register")
                .jwkSetEndpoint("/oauth/jwks")
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
    OAuth2TokenGenerator<? extends OAuth2Token> oauthTokenGenerator(
            JWKSource<SecurityContext> jwkSource,
            AuthorizationServerSettings authorizationServerSettings
    ) {
        JwtGenerator jwtGenerator = new JwtGenerator(new NimbusJwtEncoder(jwkSource));
        jwtGenerator.setJwtCustomizer(oauthJwtCustomizer(authorizationServerSettings));
        return new DelegatingOAuth2TokenGenerator(
                jwtGenerator,
                new OAuth2AccessTokenGenerator(),
                new PublicClientRefreshTokenGenerator()
        );
    }

    private static final class PublicClientRefreshTokenGenerator implements OAuth2TokenGenerator<OAuth2RefreshToken> {

        private final StringKeyGenerator refreshTokenGenerator = new Base64StringKeyGenerator(Base64.getUrlEncoder().withoutPadding(), 96);

        @Override
        public OAuth2RefreshToken generate(OAuth2TokenContext context) {
            if (!OAuth2TokenType.REFRESH_TOKEN.equals(context.getTokenType())) {
                return null;
            }
            if (!context.getRegisteredClient().getAuthorizationGrantTypes().contains(AuthorizationGrantType.REFRESH_TOKEN)) {
                return null;
            }
            AuthorizationGrantType grantType = context.getAuthorizationGrantType();
            if (!AuthorizationGrantType.AUTHORIZATION_CODE.equals(grantType) && !AuthorizationGrantType.REFRESH_TOKEN.equals(grantType)) {
                return null;
            }

            Instant issuedAt = Instant.now();
            Instant expiresAt = issuedAt.plus(context.getRegisteredClient().getTokenSettings().getRefreshTokenTimeToLive());
            return new OAuth2RefreshToken(refreshTokenGenerator.generateKey(), issuedAt, expiresAt);
        }
    }

    private static final class PublicRefreshClientAuthenticationProvider implements AuthenticationProvider {

        private final RegisteredClientRepository registeredClientRepository;

        private PublicRefreshClientAuthenticationProvider(RegisteredClientRepository registeredClientRepository) {
            this.registeredClientRepository = registeredClientRepository;
        }

        @Override
        public Authentication authenticate(Authentication authentication) {
            OAuth2ClientAuthenticationToken clientAuthentication = (OAuth2ClientAuthenticationToken) authentication;
            if (!ClientAuthenticationMethod.NONE.equals(clientAuthentication.getClientAuthenticationMethod())) {
                return null;
            }
            if (!AuthorizationGrantType.REFRESH_TOKEN.getValue().equals(clientAuthentication.getAdditionalParameters().get("grant_type"))) {
                return null;
            }

            String clientId = clientAuthentication.getPrincipal().toString();
            var registeredClient = registeredClientRepository.findByClientId(clientId);
            if (registeredClient == null
                    || !registeredClient.getClientAuthenticationMethods().contains(ClientAuthenticationMethod.NONE)
                    || !registeredClient.getAuthorizationGrantTypes().contains(AuthorizationGrantType.REFRESH_TOKEN)) {
                throw new OAuth2AuthenticationException(new OAuth2Error("invalid_client", "Public refresh client is not allowed.", null));
            }

            return new OAuth2ClientAuthenticationToken(registeredClient, ClientAuthenticationMethod.NONE, null);
        }

        @Override
        public boolean supports(Class<?> authentication) {
            return OAuth2ClientAuthenticationToken.class.isAssignableFrom(authentication);
        }
    }

    private static final class PublicRefreshClientAuthenticationConverter implements AuthenticationConverter {

        @Override
        public Authentication convert(HttpServletRequest request) {
            if (!AuthorizationGrantType.REFRESH_TOKEN.getValue().equals(request.getParameter("grant_type"))) {
                return null;
            }
            String clientId = request.getParameter("client_id");
            if (!StringUtils.hasText(clientId)) {
                return null;
            }

            Map<String, Object> additionalParameters = new LinkedHashMap<>();
            additionalParameters.put("grant_type", request.getParameter("grant_type"));
            additionalParameters.put("refresh_token", request.getParameter("refresh_token"));
            return new OAuth2ClientAuthenticationToken(clientId, ClientAuthenticationMethod.NONE, null, additionalParameters);
        }
    }

    private static OAuth2TokenCustomizer<JwtEncodingContext> oauthJwtCustomizer(AuthorizationServerSettings authorizationServerSettings) {
        return (context) -> {
            if (!"access_token".equals(context.getTokenType().getValue())) {
                return;
            }
            String issuer = authorizationServerSettings.getIssuer();
            context.getClaims()
                    .audience(List.of(issuer + "/mcp"))
                    .claim("client_id", context.getRegisteredClient().getClientId())
                    .claim("client_name", context.getRegisteredClient().getClientName());
        };
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
