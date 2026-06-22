package com.resumate.mcp.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;
import com.resumate.mcp.config.OAuthProperties;
import com.resumate.mcp.security.oauth.OAuthPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiTokenAuthenticationFilterTest {

    private final AiTokenAuthenticationService authenticationService = mock(AiTokenAuthenticationService.class);
    private final JwtDecoder jwtDecoder = mock(JwtDecoder.class);
    private final AiTokenAuthenticationFilter filter = new AiTokenAuthenticationFilter(
            authenticationService,
            jwtDecoder,
            new OAuthProperties(
                    "https://mcp.example.test",
                    "{}",
                    Duration.ofHours(1),
                    Duration.ofDays(90),
                    List.of("https://claude.ai/*")
            )
    );
    private final FilterChain filterChain = mock(FilterChain.class);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void sendsUnauthorizedWithDiscovery_whenNoAuthenticationHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getErrorMessage()).isEqualTo("Missing authentication.");
        assertThat(response.getHeader("WWW-Authenticate"))
                .isEqualTo("Bearer resource_metadata=\"https://mcp.example.test/.well-known/oauth-protected-resource\"");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void sendsUnauthorized_whenApiKeyHeaderIsEmpty() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("API_KEY", "   ");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void setsOAuthAuthenticationAndContinuesFilterChain_whenOnlyBearerHeaderIsProvided() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(jwtDecoder.decode("valid-token")).thenReturn(jwt("valid-token", "oauth-user", List.of("https://mcp.example.test/mcp")));
        doAnswer((invocation) -> {
            assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
                    .isEqualTo(new OAuthPrincipal("oauth-user", "claude.ai", "client-id"));
            return null;
        }).when(filterChain).doFilter(request, response);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isNotEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void sendsUnauthorized_whenBearerAudienceIsWrong() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(jwtDecoder.decode("valid-token")).thenReturn(jwt("valid-token", "oauth-user", List.of("https://wrong.example.test/mcp")));

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getErrorMessage()).isEqualTo("Invalid bearer token.");
        assertThat(response.getHeader("WWW-Authenticate"))
                .isEqualTo("Bearer error=\"invalid_token\", resource_metadata=\"https://mcp.example.test/.well-known/oauth-protected-resource\"");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void sendsUnauthorized_whenBearerDecodeFails() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer bad-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(jwtDecoder.decode("bad-token")).thenThrow(new JwtException("bad token"));

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getErrorMessage()).isEqualTo("Invalid bearer token.");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void sendsUnauthorized_whenBearerSignatureIsInvalid() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer bad-signature-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(jwtDecoder.decode("bad-signature-token")).thenThrow(new JwtException("Invalid signature"));

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getErrorMessage()).isEqualTo("Invalid bearer token.");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void sendsUnauthorized_whenBearerTokenIsExpired() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer expired-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(jwtDecoder.decode("expired-token")).thenThrow(new JwtException("Jwt expired"));

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getErrorMessage()).isEqualTo("Invalid bearer token.");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void setsAuthenticationAndContinuesFilterChain_onValidApiKey() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("API_KEY", "valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        when(authenticationService.authenticate("valid-token")).thenReturn(principal);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isNotEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void clearsSecurityContext_afterFilterChain() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("API_KEY", "valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        when(authenticationService.authenticate("valid-token")).thenReturn(principal);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void sendsUnauthorized_whenAuthenticationServiceThrows() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("API_KEY", "bad-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(authenticationService.authenticate("bad-token"))
                .thenThrow(new IllegalArgumentException("Invalid API key."));

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void setsAuthentication_whenBearerTokenStartsWithResmPrefix() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer resm_valid-key");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AiTokenPrincipal principal = new AiTokenPrincipal("tokenId", "userId", "label");
        when(authenticationService.authenticate("resm_valid-key")).thenReturn(principal);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isNotEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        verify(authenticationService).authenticate("resm_valid-key");
        verify(jwtDecoder, never()).decode(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void sendsUnauthorizedWithWwwAuthenticate_whenBearerResmTokenIsInvalid() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer resm_bad-key");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(authenticationService.authenticate("resm_bad-key"))
                .thenThrow(new IllegalArgumentException("Invalid API key."));

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getHeader("WWW-Authenticate"))
                .isEqualTo("Bearer error=\"invalid_token\", resource_metadata=\"https://mcp.example.test/.well-known/oauth-protected-resource\"");
        verify(jwtDecoder, never()).decode(any());
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void apiKeyWins_whenBothApiKeyAndBearerAreProvided() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("API_KEY", "valid-token");
        request.addHeader("Authorization", "Bearer bad-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(authenticationService.authenticate("valid-token"))
                .thenReturn(new AiTokenPrincipal("tokenId", "userId", "label"));

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isNotEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        verify(authenticationService).authenticate("valid-token");
        verify(jwtDecoder, never()).decode(any());
        verify(filterChain).doFilter(request, response);
    }

    private static Jwt jwt(String tokenValue, String subject, List<String> audience) {
        return Jwt.withTokenValue(tokenValue)
                .header("alg", "RS256")
                .subject(subject)
                .audience(audience)
                .claim("client_id", "client-id")
                .claim("client_name", "claude.ai")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
    }
}
