package com.resumate.mcp.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiTokenAuthenticationFilterTest {

    private final AiTokenAuthenticationService authenticationService = mock(AiTokenAuthenticationService.class);
    private final AiTokenAuthenticationFilter filter = new AiTokenAuthenticationFilter(authenticationService);
    private final FilterChain filterChain = mock(FilterChain.class);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void sendsUnauthorized_whenNoApiKeyHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
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
    void sendsUnauthorized_withCorrectMessage_forMissingApiKey() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getErrorMessage()).isEqualTo("Missing API key.");
    }

    @Test
    void sendsUnauthorized_whenOnlyAuthorizationHeaderIsProvided() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getErrorMessage()).isEqualTo("Missing API key.");
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
}
